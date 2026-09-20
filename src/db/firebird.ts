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
import type { Attachment, Transaction, TransactionOptions } from "node-firebird-driver";
import { getFirebirdScopeCredentialLease, invalidateFirebirdScopeCredential, normalizeFirebirdOrg, type RolContexto } from "./firebirdCatalog.js";
import { firebirdRolContextoActual } from "./firebirdRolContexto.js";

const POOL_SIZE = Number((config.firebird as any).poolSize || 5);
const SERIALIZE_ALL = Boolean((config.firebird as any).serialize) || false;
const FIREBIRD_CHARSET = config.firebird.charset || "WIN1252";
const DEFAULT_TIMEOUT_MS = Number(config.firebird.timeoutMs) || 30000;

const FIREBIRD_CLIENT_LIB = process.env.FIREBIRD_CLIENT_LIB || getDefaultLibraryFilename();
const client = createNativeClient(FIREBIRD_CLIENT_LIB);

function buildUri(): string {
  const host = config.firebird.host || "localhost";
  const port = config.firebird.port || 3050;
  const db = config.firebird.database;
  return `${host}/${port}:${db}`;
}

export interface FirebirdScope {
  org0: string;
  org1: string;
  rolContexto?: RolContexto;
}

interface AttachmentEntry {
  attachment: Attachment;
  charsetApplied: boolean;
  credentialExpiresAt: number;
}

const attachments = new Map<string, AttachmentEntry>();
const attachmentOpenings = new Map<string, Promise<AttachmentEntry>>();
const DEFAULT_SCOPE_KEY = "__default__";

function effectiveRolContexto(scope?: FirebirdScope): RolContexto {
  return scope?.rolContexto ?? firebirdRolContextoActual() ?? 'OPERATIVO';
}

function scopeKey(scope?: FirebirdScope): string {
  return scope
    ? `${normalizeFirebirdOrg(scope.org0)}|${normalizeFirebirdOrg(scope.org1)}|${effectiveRolContexto(scope)}`
    : DEFAULT_SCOPE_KEY;
}

function credentialRejected(message: string): boolean {
  const normalized = String(message).toLowerCase();
  return normalized.includes("user name and password")
    || normalized.includes("no match on the target security database")
    || normalized.includes("non-existent role");
}

async function connectOptionsFor(scope?: FirebirdScope): Promise<{
  options: Record<string, unknown>;
  credentialExpiresAt: number;
}> {
  if (scope) {
    const { credential, expiresAt } = await getFirebirdScopeCredentialLease(scope.org0, scope.org1, effectiveRolContexto(scope));
    const options: any = { username: credential.user, password: credential.password };
    if (credential.role) options.role = credential.role;
    return { options, credentialExpiresAt: expiresAt };
  }
  const options: any = { username: config.firebird.user, password: config.firebird.password };
  if (config.firebird.role) options.role = config.firebird.role;
  return { options, credentialExpiresAt: Number.POSITIVE_INFINITY };
}

async function openEntry(scope: FirebirdScope | undefined): Promise<AttachmentEntry> {
  try {
    const { options, credentialExpiresAt } = await connectOptionsFor(scope);
    const attachment = await client.connect(buildUri(), options);
    return { attachment, charsetApplied: false, credentialExpiresAt };
  } catch (error) {
    if (scope && credentialRejected(String((error as any)?.message ?? error))) {
      invalidateFirebirdScopeCredential(scope.org0, scope.org1);
    }
    throw error;
  }
}

function disposeEntry(key: string, entry?: AttachmentEntry): void {
  attachments.delete(key);
  if (entry) {
    try {
      if (entry.attachment.isValid) entry.attachment.disconnect().catch(() => undefined);
    } catch { /* ignore */ }
  }
}

async function getAttachment(scope?: FirebirdScope): Promise<Attachment> {
  const key = scopeKey(scope);
  let entry = attachments.get(key);
  if (scope && entry && entry.credentialExpiresAt <= Date.now()) {
    disposeEntry(key, entry);
    entry = undefined;
  }
  if (!entry || !entry.attachment.isValid) {
    if (entry) disposeEntry(key, entry);
    let opening = attachmentOpenings.get(key);
    if (!opening) {
      opening = openEntry(scope);
      attachmentOpenings.set(key, opening);
    }
    try {
      entry = await opening;
      attachments.set(key, entry);
    } finally {
      if (attachmentOpenings.get(key) === opening) attachmentOpenings.delete(key);
    }
  }

  if (!entry.charsetApplied && entry.attachment.isValid) {
    try {
      const tempTx = await entry.attachment.startTransaction();
      try {
        await entry.attachment.execute(tempTx, `SET NAMES ${FIREBIRD_CHARSET}`);
        await tempTx.commit();
        entry.charsetApplied = true;
      } catch {
        try { if (tempTx.isValid) await tempTx.rollback(); } catch { /* ignore */ }
        entry.charsetApplied = false;
      }
    } catch {
      entry.charsetApplied = false;
    }
  }

  return entry.attachment;
}

function invalidateAttachment(scope?: FirebirdScope): void {
  const key = scopeKey(scope);
  disposeEntry(key, attachments.get(key));
}

/**
 * Wrapper de transacción que maneja reconexión en caso de error de conexión
 */
async function withTransaction<T>(
  fn: (att: Attachment, tx: Transaction) => Promise<T>,
  options?: TransactionOptions,
  scope?: FirebirdScope
): Promise<T> {
  let att: Attachment;
  let tx: Transaction;
  const transactionOptions = options ?? (
    process.env.FIREBIRD_READ_ONLY === 'true' ? { accessMode: 'READ_ONLY' as const } : undefined
  );

  try {
    att = await getAttachment(scope);
    tx = await att.startTransaction(transactionOptions);
  } catch {
    invalidateAttachment(scope);
    att = await getAttachment(scope);
    tx = await att.startTransaction(transactionOptions);
  }

  try {
    const res = await fn(att, tx);
    await tx.commit();
    return res;
  } catch (e: any) {
    try {
      if (tx.isValid) await tx.rollback();
    } catch { /* ignore */ }

    const errMsg = String(e?.message || e || "").toLowerCase();
    if (errMsg.includes("connection") || errMsg.includes("invalid") || errMsg.includes("closed")) {
      invalidateAttachment(scope);
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

const databases = new Map<string, FirebirdDbCompat>();

/**
 * Compatibilidad: devuelve un objeto con `query(sql, params, cb)`.
 * Internamente usa executeSafeQuery (driver nativo).
 */
export async function connectFirebirdDatabase(scope?: FirebirdScope): Promise<FirebirdDbCompat> {
  await getAttachment(scope);
  const key = scopeKey(scope);
  const current = databases.get(key);
  if (current) return current;

  const database: FirebirdDbCompat = {
    query: (sqlText: string, paramsOrCb: any[] | ((err: any, rows?: any[]) => void), cb?: (err: any, rows?: any[]) => void) => {
      const params = typeof paramsOrCb === "function" ? [] : (paramsOrCb ?? []);
      const callback = typeof paramsOrCb === "function" ? paramsOrCb : cb;

      executeSafeQueryInternal(sqlText, params, undefined, scope)
        .then((rows) => callback?.(null, rows))
        .catch((err) => callback?.(err));
    },
  };

  databases.set(key, database);
  return database;
}

export function getFirebirdDb(scope?: FirebirdScope): FirebirdDbCompat {
  const database = databases.get(scopeKey(scope));
  if (!database) {
    throw new Error("Base de datos Firebird no conectada. Llame a connectFirebirdDatabase() primero.");
  }
  return database;
}

/**
 * Compatibilidad: ejecuta una función que recibe `db` (con `query` estilo node-firebird),
 * serializando si está habilitado.
 */
export async function executeSerializedQuery<T>(
  queryFn: (db: FirebirdDbCompat) => Promise<T>,
  scope: FirebirdScope
): Promise<T> {
  const db = await connectFirebirdDatabase(scope);
  return queryFn(db);
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

export async function testFirebirdConnection(scope?: FirebirdScope): Promise<boolean> {
  try {
    await runSerialized(async () => {
      await withTransaction(async (att, tx) => {
        await att.executeSingletonAsObject(tx, "SELECT 1 AS OK FROM RDB$DATABASE");
      }, undefined, scope);
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
  // Detectar si es una sentencia que NO devuelve resultset (INSERT/UPDATE/DELETE/EXECUTE/MERGE/CREATE/ALTER/DROP)
  const trimmed = sql.trimStart().toUpperCase();
  const isNonQuery = /^(INSERT|UPDATE|DELETE|EXECUTE|MERGE|CREATE|ALTER|DROP|SET)\b/.test(trimmed);

  if (isNonQuery) {
    // Usar att.execute directamente; NO usar executeQuery que ejecuta y luego falla al abrir cursor,
    // causando doble ejecución al caer en el catch
    await att.execute(tx, sql, params);
    return [];
  }

  // SELECT u otras sentencias que devuelven resultset
  const rs = await att.executeQuery(tx, sql, params);
  try {
    const rows = await rs.fetchAsObject<any>({ fetchSize: 1000 });
    return rows.map((row: any) => decodeValue(row));
  } finally {
    await rs.close().catch(() => undefined);
  }
}

/**
 * Query segura con timeout y decodificación (crea su propia transacción)
 * @param sql - SQL query string
 * @param params - Query parameters
 * @param timeoutMs - Optional timeout in ms (default: FIREBIRD_TIMEOUT_MS env or 30000)
 */
async function executeSafeQueryInternal(
  sql: string,
  params: any[],
  timeoutMs?: number,
  scope?: FirebirdScope
): Promise<any[]> {
  const timeout = timeoutMs ?? DEFAULT_TIMEOUT_MS;
  return runSerialized(async () => {
    let timeoutHandle: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        withTransaction(async (att, tx) => {
          return await executeQueryOn(att, tx, sql, params);
        }, undefined, scope),
        new Promise<any[]>((_, reject) => {
          timeoutHandle = setTimeout(
            () => reject(new Error(`Tiempo de espera agotado en consulta Firebird (${timeout}ms)`)),
            timeout
          );
        }),
      ]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  });
}

export async function executeSafeQuery(
  sql: string,
  params: any[],
  timeoutMs: number | undefined,
  scope: FirebirdScope
): Promise<any[]> {
  return executeSafeQueryInternal(sql, params, timeoutMs, scope);
}

export async function executeTechnicalQuery(
  sql: string,
  params: any[] = [],
  timeoutMs?: number
): Promise<any[]> {
  return executeSafeQueryInternal(sql, params, timeoutMs);
}

/**
 * Transacciones nativas: ejecuta fn con un (att, tx) compartido.
 * Las queries dentro de fn deben usar executeQueryInTransaction para reutilizar el mismo tx.
 */
export async function executeInTransaction<T>(fn: (tx: any) => Promise<T>, scope: FirebirdScope): Promise<T> {
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
        executeSingleton: async (sqlText: string, params: any[] = []) => {
          return decodeValue(await att.executeSingletonAsObject<any>(tx, sqlText, params));
        },
      };
      return await fn(compatTx);
    }, undefined, scope);
  });
}

/**
 * Ejecutar query dentro de una transacción (recibes cn de executeInTransaction).
 * Si cn tiene query (compatTx), usa el mismo tx; de lo contrario, crea tx nueva vía executeSafeQuery.
 */
export async function executeQueryInTransaction(
  cn: any,
  sql: string,
  params: any[],
  scope: FirebirdScope
): Promise<any[]> {
  // Si nos pasaron el compatTx, usamos su método query (mismo tx)
  if (cn?.query && typeof cn.query === "function") {
    const rows = await cn.query(sql, params);
    return Array.isArray(rows) ? rows : [];
  }
  // Fallback: si no hay compatTx válido, crear transacción nueva
  return await executeSafeQuery(sql, params, undefined, scope);
}

/**
 * Ejecutar procedimiento
 * Ejemplo: EXECUTE PROCEDURE MI_PROC(?, ?, ?)
 */
export async function executeProcedureInTransaction(
  cn: any,
  procedureName: string,
  params: any[],
  scope: FirebirdScope
): Promise<any[]> {
  const placeholders = params.map(() => "?").join(", ");
  const sql = `EXECUTE PROCEDURE ${procedureName} ${placeholders ? "(" + placeholders + ")" : ""}`;
  if (cn?.attachment && cn?.transaction) {
    await cn.attachment.execute(cn.transaction, sql, params);
    return [];
  }
  return await executeQueryInTransaction(cn, sql, params, scope);
}

export type FirebirdTransactionOutcome = 'COMMIT_CONFIRMADO' | 'ROLLBACK_CONFIRMADO' | 'RESULTADO_INCIERTO' | 'NO_INICIADA';

export interface FirebirdTransactionExecution<T> {
  outcome: FirebirdTransactionOutcome;
  value?: T;
  error?: unknown;
}

export interface FirebirdTransactionHandle<TContext> {
  context: TContext;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isValid(): boolean;
}

/** Purely injectable transaction boundary used by phase 11 and fake-only tests. */
export async function executeTypedTransaction<TContext, T>(
  start: () => Promise<FirebirdTransactionHandle<TContext>>,
  fn: (context: TContext) => Promise<T>
): Promise<FirebirdTransactionExecution<T>> {
  let handle: FirebirdTransactionHandle<TContext>;
  try {
    handle = await start();
  } catch (error) {
    return { outcome: 'NO_INICIADA', error };
  }
  let value: T;
  try {
    value = await fn(handle.context);
  } catch (error) {
    if (!handle.isValid()) return { outcome: 'RESULTADO_INCIERTO', error };
    try {
      await handle.rollback();
      return { outcome: 'ROLLBACK_CONFIRMADO', error };
    } catch (rollbackError) {
      return { outcome: 'RESULTADO_INCIERTO', error: rollbackError };
    }
  }
  try {
    await handle.commit();
    return { outcome: 'COMMIT_CONFIRMADO', value };
  } catch (error) {
    // Un error de COMMIT nunca prueba que Firebird haya revertido.
    return { outcome: 'RESULTADO_INCIERTO', error };
  }
}

export async function executeInTransactionWithOutcome<T>(
  fn: (tx: any) => Promise<T>,
  scope: FirebirdScope
): Promise<FirebirdTransactionExecution<T>> {
  return runSerialized(async () => executeTypedTransaction(async () => {
    let att: Attachment;
    try {
      att = await getAttachment(scope);
    } catch (error) {
      invalidateAttachment(scope);
      att = await getAttachment(scope);
    }
    let tx: Transaction;
    try {
      tx = await att.startTransaction();
    } catch (error) {
      invalidateAttachment(scope);
      att = await getAttachment(scope);
      tx = await att.startTransaction();
    }
    const compatTx = {
      attachment: att,
      transaction: tx,
      query: (sqlText: string, params: any[] = []) => executeQueryOn(att, tx, sqlText, params),
      execute: (sqlText: string, params: any[] = []) => executeQueryOn(att, tx, sqlText, params),
      executeSingleton: async (sqlText: string, params: any[] = []) => decodeValue(await att.executeSingletonAsObject<any>(tx, sqlText, params)),
    };
    return {
      context: compatTx,
      commit: () => tx.commit(),
      rollback: () => tx.rollback(),
      isValid: () => tx.isValid,
    };
  }, fn));
}

export async function closeFirebirdPool(): Promise<void> {
  const current = [...attachments.values()];
  attachments.clear();
  attachmentOpenings.clear();
  databases.clear();
  await Promise.all(current.map(async ({ attachment }) => {
    if (!attachment.isValid) return;
    try { await attachment.disconnect(); } catch { /* ignore during shutdown */ }
  }));
}

/**
 * Retorna el charset ID de la base de datos Firebird (RDB$CHARACTER_SET_ID).
 * Esto se usa en el endpoint de debug `/debug/firebird-charset`.
 */
export async function checkFirebirdCharset(): Promise<number> {
  try {
    // Intentar obtener el charset de la conexión actual
    const rows = await executeSafeQueryInternal(
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
    const rows = await executeSafeQueryInternal('SELECT RDB$CHARACTER_SET_ID AS CHARSET_ID FROM RDB$DATABASE', []);
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
export async function executeQueryWithNewConnection(
  sql: string,
  params: any[],
  timeoutMs: number | undefined,
  scope: FirebirdScope
): Promise<any[]> {
  const timeout = timeoutMs ?? DEFAULT_TIMEOUT_MS;
  return await Promise.race([
    (async () => {
      let att: Attachment;
      try {
        att = await client.connect(buildUri(), (await connectOptionsFor(scope)).options);
      } catch (error) {
        if (!scope || !credentialRejected(String((error as any)?.message ?? error))) throw error;
        invalidateFirebirdScopeCredential(scope.org0, scope.org1);
        att = await client.connect(buildUri(), (await connectOptionsFor(scope)).options);
      }
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
          const trimmed = sql.trimStart().toUpperCase();
          const isNonQuery = /^(INSERT|UPDATE|DELETE|EXECUTE|MERGE|CREATE|ALTER|DROP|SET)\b/.test(trimmed);

          if (isNonQuery) {
            await att.execute(tx, sql, params);
            await tx.commit();
            return [];
          }

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

export function getFirebirdRegistryStatus(): { scopesActivos: number } {
  return {
    scopesActivos: [...attachments.keys()].filter((key) => key !== DEFAULT_SCOPE_KEY).length,
  };
}

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
  scope: FirebirdScope;
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
  options: SelectableProcedureOptions
): Promise<any[]> {
  const { timeoutMs, alias, columns, scope } = options;
  const placeholders = params.map(() => "?").join(", ");
  const selectColumns = columns && columns.length > 0 ? columns.join(", ") : "*";
  const aliasClause = alias ? ` ${alias}` : "";
  
  const sql = `SELECT ${selectColumns} FROM ${procedureName}(${placeholders})${aliasClause}`;
  
  return await executeSafeQuery(sql, params, timeoutMs, scope);
}

/**
 * Opciones para ejecutar un SP executable
 */
export interface ExecutableProcedureOptions {
  /** Timeout en ms (default: DEFAULT_TIMEOUT_MS) */
  timeoutMs?: number;
  scope: FirebirdScope;
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
  options: ExecutableProcedureOptions
): Promise<any[]> {
  const { timeoutMs, scope } = options;
  const placeholders = params.map(() => "?").join(", ");
  const sql = `EXECUTE PROCEDURE ${procedureName}${placeholders ? "(" + placeholders + ")" : ""}`;
  
  return await executeSafeQuery(sql, params, timeoutMs, scope);
}
