// src/db/firebird-odbc.ts
import odbc from "odbc";
import { env as config } from "../config/env.js";
import iconv from "iconv-lite";

/**
 * ODBC + Firebird
 * En ODBC normalmente NO necesitas iconv si configuras bien CHARSET en la conexión.
 *
 * Recomendación:
 * - Si tu DB_CHARSET = NONE pero los bytes reales son WIN1252: usa CHARSET=WIN1252 en el connection string.
 * - Si aún ves mojibake (MU´┐¢OZ, ¥, etc.), entonces el problema es legacy CP850/DOS en datos antiguos.
 *   Eso ya es “calidad de datos” y conviene corregir en BD o aplicar una corrección puntual por campo.
 */

const POOL_SIZE = Number((config.firebird as any).poolSize || 5);
const SERIALIZE_ALL = Boolean((config.firebird as any).serialize) || false;

// Ajusta según tu caso real:
const FIREBIRD_CHARSET = config.firebird.charset; // <- ajustado por config

// Puedes usar DSN o DSN-less
const USE_DSN = Boolean((config.firebird as any).dsn);

// Si usas DSN (recomendado en Windows):
// config.firebird.dsn = "FB3_MiBase"
function buildConnectionString(): string {
  if (USE_DSN) {
    const dsn = (config.firebird as any).dsn;
    if (!dsn) throw new Error("Falta config.firebird.dsn");
    // UID/PWD pueden ir en DSN o aquí
    return `DSN=${dsn};UID=${config.firebird.user};PWD=${config.firebird.password};CHARSET=${FIREBIRD_CHARSET};`;
  }

  // DSN-less (sin crear DSN)
  // OdbcFb suele aceptar: Driver / Dbname / UID / PWD / CHARSET
  // Dbname en formato host:filepath
  const host = config.firebird.host || "localhost";
  const port = config.firebird.port || 3050;
  const db = config.firebird.database; // ej C:\data\mi.fdb

  // Algunos drivers aceptan "Dbname=host/port:db" o "host:db" + "Port="
  // OdbcFb comúnmente trabaja con host:db y port separado o embebido.
  return (
    `Driver={Firebird ODBC Driver};` +
    `Dbname=${host}:${db};` +
    `Port=${port};` +
    `Uid=${config.firebird.user};` +
    `Pwd=${config.firebird.password};` +
    `Charset=${FIREBIRD_CHARSET};` +
    `CHARSET=${FIREBIRD_CHARSET};` +
    `CharacterSet=${FIREBIRD_CHARSET};` +
    `LC_CTYPE=${FIREBIRD_CHARSET};`
  );
}

const CONNECTION_STRING = buildConnectionString();

// Pool nativo del paquete odbc
// Nota: las typings de `odbc` varían por versión; usamos `any` para mantener compatibilidad.
const pool: any = await (odbc as any).pool(CONNECTION_STRING, {
  initialSize: Math.min(POOL_SIZE, 2),
  maxSize: POOL_SIZE,
});

async function prepareConnection(cn: any): Promise<void> {
  // Fuerza el charset de la sesión. Esto es importante porque en algunos setups el driver ODBC
  // ignora el charset en el connection string y el attachment queda en ISO8859_13, causando "�".
  try {
    await cn.query(`SET NAMES ${FIREBIRD_CHARSET}`);
  } catch {
    // best-effort
  }
}

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
 * Internamente usa executeSafeQuery (ODBC).
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
  // Con CAST(... CHARACTER SET OCTETS) algunos drivers/odbc devuelven bytes como Buffer/Uint8Array/ArrayBuffer
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
      const cn = await pool.connect();
      try {
        await prepareConnection(cn);
        await cn.query("SELECT 1 AS OK FROM RDB$DATABASE");
      } finally {
        await cn.close();
      }
    });
    return true;
  } catch (e) {
    console.error("[FIREBIRD/ODBC] test failed:", e);
    return false;
  }
}

/**
 * Query segura con timeout y decodificación
 */
export async function executeSafeQuery(sql: string, params: any[] = []): Promise<any[]> {
  return runSerialized(async () => {
    const cn = await pool.connect();
    const timeoutMs = 30000;

    try {
      await prepareConnection(cn);
      const p: Promise<any> = (cn as any).query(sql, params);
      const r: any = await Promise.race([
        p as any,
        new Promise<any>((_, rej) => setTimeout(() => rej(new Error("Tiempo de espera agotado en consulta Firebird")), timeoutMs)),
      ]);

      const rows = Array.isArray(r) ? r : (typeof r?.toArray === 'function' ? r.toArray() : []);
      return rows.map((row: any) => decodeValue(row));
    } finally {
      await cn.close();
    }
  });
}

/**
 * Transacciones ODBC
 */
export async function executeInTransaction<T>(fn: (tx: odbc.Connection) => Promise<T>): Promise<T> {
  return runSerialized(async () => {
    const cn = await pool.connect();
    try {
      await cn.beginTransaction();
      const res = await fn(cn);
      await cn.commit();
      return res;
    } catch (e) {
      try {
        await cn.rollback();
      } catch { }
      throw e;
    } finally {
      await cn.close();
    }
  });
}

/**
 * Ejecutar query dentro de una transacción (recibes cn en executeInTransaction)
 */
export async function executeQueryInTransaction(
  cn: odbc.Connection,
  sql: string,
  params: any[] = []
): Promise<any[]> {
  const r: any = await (cn as any).query(sql, params);
  const rows = Array.isArray(r) ? r : (typeof r?.toArray === 'function' ? r.toArray() : []);
  return rows.map((row: any) => decodeValue(row));
}

/**
 * Ejecutar procedimiento (ODBC usa CALL)
 * Ejemplo: CALL MI_PROC(?, ?, ?)
 */
export async function executeProcedureInTransaction(
  cn: odbc.Connection,
  procedureName: string,
  params: any[] = []
): Promise<any[]> {
  const placeholders = params.map(() => "?").join(", ");
  const sql = `CALL ${procedureName}(${placeholders})`;
  const r: any = await (cn as any).query(sql, params);
  const rows = Array.isArray(r) ? r : (typeof r?.toArray === 'function' ? r.toArray() : []);
  return rows.map((row: any) => decodeValue(row));
}

export async function closeFirebirdPool(): Promise<void> {
  await pool.close();
  database = null;
}

/**
 * Retorna el charset ID de la base de datos Firebird (RDB$CHARACTER_SET_ID).
 * Esto se usa en el endpoint de debug `/debug/firebird-charset`.
 */
export async function checkFirebirdCharset(): Promise<number> {
  try {
    // Intentar obtener el charset de la conexión actual (más confiable con ODBC)
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

export const firebirdRuntimeInfo = {
  poolSize: POOL_SIZE,
  serializeAll: SERIALIZE_ALL,
  charset: FIREBIRD_CHARSET,
  host: config.firebird.host,
  port: config.firebird.port,
  database: config.firebird.database,
  usingDsn: USE_DSN,
};
