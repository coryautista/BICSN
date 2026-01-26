// src/db/firebird.ts
//
// Driver nativo de Firebird vía fbclient (node-firebird-driver-native).
// Optimizado para:
// - Transacciones consistentes (executeInTransaction usa el mismo tx)
// - SET NAMES una sola vez por attachment (al conectar/reconectar)
// - Reconexión robusta si el attachment queda inválido
//
import { env as config } from "../config/env.js";
import iconv from "iconv-lite";
import { createNativeClient, getDefaultLibraryFilename } from "node-firebird-driver-native";
import type { Attachment, Transaction } from "node-firebird-driver";

const POOL_SIZE = Number((config.firebird as any).poolSize || 5);
const SERIALIZE_ALL = Boolean((config.firebird as any).serialize) || false;
const FIREBIRD_CHARSET = config.firebird.charset || "WIN1252";
/** Default query timeout in ms (configurable via FIREBIRD_TIMEOUT_MS env var) */
const DEFAULT_TIMEOUT_MS = Number(config.firebird.timeoutMs) || 30000;

const FIREBIRD_CLIENT_LIB = process.env.FIREBIRD_CLIENT_LIB || getDefaultLibraryFilename();
const client = createNativeClient(FIREBIRD_CLIENT_LIB);

// Estado global del attachment
let attachment: Attachment | null = null;
let charsetApplied = false; // Indica si ya aplicamos SET NAMES al attachment actual

function buildUri(): string {
  const host = config.firebird.host || "localhost";
  const port = config.firebird.port || 3050;
  const db = config.firebird.database;
  return `${host}/${port}:${db}`;
}

/**
 * Obtener attachment válido, reconectando si es necesario.
 * Aplica SET NAMES una sola vez por conexión.
 */
async function getAttachment(): Promise<Attachment> {
  // Si el attachment no es válido, reconectar
  if (!attachment || !attachment.isValid) {
    attachment = await client.connect(buildUri(), {
      username: config.firebird.user,
      password: config.firebird.password,
    });
    charsetApplied = false;
  }

  // Aplicar SET NAMES una vez por attachment
  if (!charsetApplied && attachment.isValid) {
    try {
      // SET NAMES requiere una transacción; usamos una temporal breve
      const tempTx = await attachment.startTransaction();
      try {
        await attachment.execute(tempTx, `SET NAMES ${FIREBIRD_CHARSET}`);
        await tempTx.commit();
        charsetApplied = true;
      } catch {
        // Si falla, intentamos rollback y marcamos como no aplicado
        try { if (tempTx.isValid) await tempTx.rollback(); } catch { /* ignore */ }
        charsetApplied = false;
      }
    } catch {
      charsetApplied = false;
    }
  }

  return attachment;
}

/**
 * Invalida el attachment actual (fuerza reconexión en próxima operación)
 */
function invalidateAttachment(): void {
  if (attachment) {
    try {
      if (attachment.isValid) attachment.disconnect().catch(() => undefined);
    } catch { /* ignore */ }
  }
  attachment = null;
  charsetApplied = false;
}

/**
 * Wrapper de transacción que maneja reconexión en caso de error de conexión
 */
async function withTransaction<T>(fn: (att: Attachment, tx: Transaction) => Promise<T>): Promise<T> {
  let att: Attachment;
  let tx: Transaction;

  try {
    att = await getAttachment();
    tx = await att.startTransaction();
  } catch (connectError: any) {
    // Error al conectar/iniciar tx: invalidar y reintentar una vez
    invalidateAttachment();
    att = await getAttachment();
    tx = await att.startTransaction();
  }

  try {
    const res = await fn(att, tx);
    await tx.commit();
    return res;
  } catch (e: any) {
    // Rollback si la tx sigue válida
    try {
      if (tx.isValid) await tx.rollback();
    } catch { /* ignore */ }

    // Si el error indica conexión perdida, invalidar para reconexión futura
    const errMsg = String(e?.message || e || "").toLowerCase();
    if (errMsg.includes("connection") || errMsg.includes("invalid") || errMsg.includes("closed")) {
      invalidateAttachment();
    }
    throw e;
  }
}

// Mutex para serialización opcional
let queryMutex: Promise<void> = Promise.resolve();
const runSerialized = async <T>(fn: () => Promise<T>): Promise<T> => {
  if (!SERIALIZE_ALL) return fn();
  const prev = queryMutex;
  let release!: () => void;
  queryMutex = new Promise<void>((r) => (release = r));
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
};

// Compat: API estilo node-firebird (callback) usada por código legacy
type FirebirdDbCompat = {
  query: (
    sql: string,
    params: any[] | ((err: any, rows?: any[]) => void),
    cb?: (err: any, rows?: any[]) => void
  ) => void;
};

let database: FirebirdDbCompat | null = null;

/**
 * Compatibilidad: devuelve un objeto con `query(sql, params, cb)`.
 * Internamente usa executeSafeQuery (driver nativo).
 */
export async function connectFirebirdDatabase(): Promise<FirebirdDbCompat> {
  await testFirebirdConnection();
  if (database) return database;

  database = {
    query: (sqlText: string, paramsOrCb: any[] | ((err: any, rows?: any[]) => void), cb?: (err: any, rows?: any[]) => void) => {
      const params = typeof paramsOrCb === "function" ? [] : (paramsOrCb ?? []);
      const callback = typeof paramsOrCb === "function" ? paramsOrCb : cb;

      executeSafeQuery(sqlText, params)
        .then((rows) => callback?.(null, rows))
        .catch((err) => callback?.(err));
    },
  };

  return database;
}

export function getFirebirdDb(): FirebirdDbCompat {
  if (!database) {
    throw new Error("Base de datos Firebird no conectada. Llame a connectFirebirdDatabase() primero.");
  }
  return database;
}

/**
 * Compatibilidad: ejecuta una función que recibe `db` (con `query` estilo node-firebird),
 * serializando si está habilitado.
 */
export async function executeSerializedQuery<T>(queryFn: (db: FirebirdDbCompat) => Promise<T>): Promise<T> {
  return runSerialized(async () => {
    const db = await connectFirebirdDatabase();
    return queryFn(db);
  });
}

/**
 * Compatibilidad: expone el decoder (por si algún módulo lo importa).
 */
export function decodeFirebirdObject(obj: any): any {
  return decodeValue(obj);
}

function decodeValue(v: any): any {
  if (v == null) return v;
  if (v instanceof Date) return v;
  // Con CAST(... CHARACTER SET OCTETS) algunos drivers devuelven bytes como Buffer/Uint8Array/ArrayBuffer
  const isArrayBuffer = typeof ArrayBuffer !== "undefined" && v instanceof ArrayBuffer;
  const isUint8Array = typeof Uint8Array !== "undefined" && v instanceof Uint8Array;
  const isArrayBufferView = typeof ArrayBuffer !== "undefined" && typeof ArrayBuffer.isView === "function" && ArrayBuffer.isView(v);

  if (Buffer.isBuffer(v) || isUint8Array || isArrayBuffer || isArrayBufferView) {
    // Con CAST(... CHARACTER SET OCTETS) llegan bytes crudos; decodificamos sin "replace".
    const buf = Buffer.isBuffer(v)
      ? v
      : isArrayBuffer
        ? Buffer.from(new Uint8Array(v))
        : isUint8Array
          ? Buffer.from(v)
          : Buffer.from(new Uint8Array((v as any).buffer));

    const candidates = ["win1252", "cp850", "latin1"] as const;
    for (const enc of candidates) {
      try {
        const s = iconv.decode(buf, enc);
        if (!s.includes("\uFFFD")) return s;
      } catch { }
    }
    return iconv.decode(buf, "win1252");
  }
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(decodeValue);
  if (typeof v === "object") {
    const out: any = {};
    for (const k of Object.keys(v)) out[k] = decodeValue(v[k]);
    return out;
  }
  return v;
}

export async function testFirebirdConnection(): Promise<boolean> {
  try {
    await runSerialized(async () => {
      await withTransaction(async (att, tx) => {
        await att.executeSingletonAsObject(tx, "SELECT 1 AS OK FROM RDB$DATABASE");
      });
    });
    return true;
  } catch (e) {
    console.error("[FIREBIRD/NATIVE] test failed:", e);
    return false;
  }
}

/**
 * Helper interno: ejecutar query dentro de un (att, tx) existente.
 * Usado por executeInTransaction para NO crear nueva transacción.
 */
async function executeQueryOn(att: Attachment, tx: Transaction, sql: string, params: any[] = []): Promise<any[]> {
  try {
    const rs = await att.executeQuery(tx, sql, params);
    try {
      const rows = await rs.fetchAsObject<any>({ fetchSize: 1000 });
      return rows.map((row: any) => decodeValue(row));
    } finally {
      await rs.close().catch(() => undefined);
    }
  } catch (_e) {
    // Fallback: sentencia sin resultset (INSERT/UPDATE/DDL)
    await att.execute(tx, sql, params);
    return [];
  }
}

/**
 * Query segura con timeout y decodificación (crea su propia transacción)
 * @param sql - SQL query string
 * @param params - Query parameters
 * @param timeoutMs - Optional timeout in ms (default: FIREBIRD_TIMEOUT_MS env or 30000)
 */
export async function executeSafeQuery(sql: string, params: any[] = [], timeoutMs?: number): Promise<any[]> {
  const timeout = timeoutMs ?? DEFAULT_TIMEOUT_MS;
  return runSerialized(async () => {
    return await Promise.race([
      withTransaction(async (att, tx) => {
        return await executeQueryOn(att, tx, sql, params);
      }),
      new Promise<any[]>((_, rej) => setTimeout(() => rej(new Error(`Tiempo de espera agotado en consulta Firebird (${timeout}ms)`)), timeout)),
    ]);
  });
}

/**
 * Transacciones nativas: ejecuta fn con un (att, tx) compartido.
 * Las queries dentro de fn deben usar executeQueryInTransaction para reutilizar el mismo tx.
 */
export async function executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
  return runSerialized(async () => {
    return await withTransaction(async (att, tx) => {
      // Exponemos un "tx" compatible que ejecuta queries en el mismo (att, tx)
      const compatTx = {
        attachment: att,
        transaction: tx,
        // Ejecutar query dentro de esta transacción (NO crea nueva tx)
        query: async (sqlText: string, params: any[] = []) => {
          return await executeQueryOn(att, tx, sqlText, params);
        },
        execute: async (sqlText: string, params: any[] = []) => {
          return await executeQueryOn(att, tx, sqlText, params);
        },
      };
      return await fn(compatTx);
    });
  });
}

/**
 * Ejecutar query dentro de una transacción (recibes cn de executeInTransaction).
 * Si cn tiene query (compatTx), usa el mismo tx; de lo contrario, crea tx nueva vía executeSafeQuery.
 */
export async function executeQueryInTransaction(
  cn: any,
  sql: string,
  params: any[] = []
): Promise<any[]> {
  // Si nos pasaron el compatTx, usamos su método query (mismo tx)
  if (cn?.query && typeof cn.query === "function") {
    const rows = await cn.query(sql, params);
    return Array.isArray(rows) ? rows : [];
  }
  // Fallback: si no hay compatTx válido, crear transacción nueva
  return await executeSafeQuery(sql, params);
}

/**
 * Ejecutar procedimiento
 * Ejemplo: EXECUTE PROCEDURE MI_PROC(?, ?, ?)
 */
export async function executeProcedureInTransaction(
  cn: any,
  procedureName: string,
  params: any[] = []
): Promise<any[]> {
  const placeholders = params.map(() => "?").join(", ");
  const sql = `EXECUTE PROCEDURE ${procedureName} ${placeholders ? "(" + placeholders + ")" : ""}`;
  return await executeQueryInTransaction(cn, sql, params);
}

export async function closeFirebirdPool(): Promise<void> {
  invalidateAttachment();
  database = null;
}

/**
 * Retorna el charset ID de la base de datos Firebird (RDB$CHARACTER_SET_ID).
 * Esto se usa en el endpoint de debug `/debug/firebird-charset`.
 */
export async function checkFirebirdCharset(): Promise<number> {
  try {
    // Intentar obtener el charset de la conexión actual
    const rows = await executeSafeQuery(
      `SELECT
         a.mon$character_set_id AS charset_id
       FROM mon$attachments a
       WHERE a.mon$attachment_id = CURRENT_CONNECTION`,
      []
    );
    if (rows && rows.length > 0) {
      const row: any = rows[0];
      const v = row.CHARSET_ID ?? row.charset_id ?? row.CHARSET_id;
      const n = typeof v === 'number' ? v : Number(v);
      if (Number.isFinite(n)) return n;
    }
  } catch {
    // Si falla, intentar query alternativa
  }

  try {
    // Fallback: intentar obtener desde RDB$DATABASE
    const rows = await executeSafeQuery('SELECT RDB$CHARACTER_SET_ID AS CHARSET_ID FROM RDB$DATABASE', []);
    const row = rows?.[0] ?? {};
    const v = (row as any).CHARSET_ID ?? (row as any).charset_id ?? (row as any)['RDB$CHARACTER_SET_ID'];
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n)) return n;
  } catch {
    // Si ambas fallan, retornar 0
  }

  return 0;
}

// Alias compat
export const closeFirebirdConnection = closeFirebirdPool;

/**
 * Ejecuta una consulta creando una conexión NUEVA (sin usar el attachment global).
 * Útil para casos donde se necesita aislamiento total.
 * @param sql - SQL query string
 * @param params - Query parameters
 * @param timeoutMs - Optional timeout in ms (default: FIREBIRD_TIMEOUT_MS env or 30000)
 */
export async function executeQueryWithNewConnection(sql: string, params: any[] = [], timeoutMs?: number): Promise<any[]> {
  const timeout = timeoutMs ?? DEFAULT_TIMEOUT_MS;
  return await Promise.race([
    (async () => {
      const att = await client.connect(buildUri(), {
        username: config.firebird.user,
        password: config.firebird.password,
      });
      try {
        // Aplicar SET NAMES en la nueva conexión
        const initTx = await att.startTransaction();
        try {
          await att.execute(initTx, `SET NAMES ${FIREBIRD_CHARSET}`);
          await initTx.commit();
        } catch {
          try { if (initTx.isValid) await initTx.rollback(); } catch { /* ignore */ }
        }

        const tx = await att.startTransaction();
        try {
          const rs = await att.executeQuery(tx, sql, params);
          try {
            const rows = await rs.fetchAsObject<any>({ fetchSize: 1000 });
            await tx.commit();
            return rows.map((row: any) => decodeValue(row));
          } finally {
            await rs.close().catch(() => undefined);
          }
        } catch (e) {
          try {
            if (tx.isValid) await tx.rollback();
          } catch { /* ignore */ }
          throw e;
        }
      } finally {
        await att.disconnect().catch(() => undefined);
      }
    })(),
    new Promise<any[]>((_, rej) => setTimeout(() => rej(new Error(`Tiempo de espera agotado en consulta Firebird (${timeout}ms)`)), timeout)),
  ]);
}

export const firebirdRuntimeInfo = {
  poolSize: POOL_SIZE,
  serializeAll: SERIALIZE_ALL,
  charset: FIREBIRD_CHARSET,
  defaultTimeoutMs: DEFAULT_TIMEOUT_MS,
  host: config.firebird.host,
  port: config.firebird.port,
  database: config.firebird.database,
  usingNativeDriver: true,
  uri: buildUri(),
};

// Timeout constants for heavy operations (can be passed to executeSafeQuery)
export const FIREBIRD_TIMEOUTS = {
  DEFAULT: DEFAULT_TIMEOUT_MS,
  /** For heavy SPs like DP_EDITA_PERSONAL, DP_EDITA_ENTIDAD */
  HEAVY_SP: 60000,
  /** For batch operations and large reports (HIP, Concentrado, etc.) */
  BATCH_OPERATION: 120000,
};

// ============================================================================
// SP Helpers - Estandarización de ejecución de Stored Procedures
// ============================================================================

/**
 * Opciones para ejecutar un SP selectable
 */
export interface SelectableProcedureOptions {
  /** Timeout en ms (default: DEFAULT_TIMEOUT_MS) */
  timeoutMs?: number;
  /** Alias para el SP en la query (ej: 'p' genera 'SELECT ... FROM SP(...) p') */
  alias?: string;
  /** Columnas específicas a seleccionar (default: '*') */
  columns?: string[];
}

/**
 * Ejecuta un SP "selectable" (que retorna filas).
 * Genera: SELECT [columns] FROM procedureName(?, ?, ...) [alias]
 * 
 * @example
 * // SELECT * FROM DP_EDITA_PERSONAL(?, ?, ...) p
 * const rows = await executeSelectableProcedure('DP_EDITA_PERSONAL', params, { alias: 'p', timeoutMs: FIREBIRD_TIMEOUTS.HEAVY_SP });
 * 
 * @example
 * // SELECT p.INTERNO, p.CURP FROM MI_SP(?, ?) p
 * const rows = await executeSelectableProcedure('MI_SP', [a, b], { alias: 'p', columns: ['p.INTERNO', 'p.CURP'] });
 */
export async function executeSelectableProcedure(
  procedureName: string,
  params: any[] = [],
  options: SelectableProcedureOptions = {}
): Promise<any[]> {
  const { timeoutMs, alias, columns } = options;
  const placeholders = params.map(() => "?").join(", ");
  const selectColumns = columns && columns.length > 0 ? columns.join(", ") : "*";
  const aliasClause = alias ? ` ${alias}` : "";
  
  const sql = `SELECT ${selectColumns} FROM ${procedureName}(${placeholders})${aliasClause}`;
  
  return await executeSafeQuery(sql, params, timeoutMs);
}

/**
 * Opciones para ejecutar un SP executable
 */
export interface ExecutableProcedureOptions {
  /** Timeout en ms (default: DEFAULT_TIMEOUT_MS) */
  timeoutMs?: number;
}

/**
 * Ejecuta un SP "executable" (que ejecuta una acción, retorna singleton o nada).
 * Genera: EXECUTE PROCEDURE procedureName(?, ?, ...)
 * 
 * @example
 * // EXECUTE PROCEDURE AP_P_APLICAR(?, ?, ?, ?)
 * await executeExecutableProcedure('AP_P_APLICAR', params, { timeoutMs: FIREBIRD_TIMEOUTS.HEAVY_SP });
 */
export async function executeExecutableProcedure(
  procedureName: string,
  params: any[] = [],
  options: ExecutableProcedureOptions = {}
): Promise<any[]> {
  const { timeoutMs } = options;
  const placeholders = params.map(() => "?").join(", ");
  const sql = `EXECUTE PROCEDURE ${procedureName}${placeholders ? "(" + placeholders + ")" : ""}`;
  
  return await executeSafeQuery(sql, params, timeoutMs);
}
