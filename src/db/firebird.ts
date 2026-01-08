// src/db/firebird.ts
import Firebird from 'node-firebird';
import iconv from 'iconv-lite';
import { env as config } from '../config/env.js';

/**
 * Firebird:
 * - DB_CHARSET = NONE (confirmado)
 * - Datos legacy en WIN1252
 *
 * Estrategia:
 * 1) Forzar charset/encoding en conexión: WIN1252
 * 2) Decodificar Buffers como WIN1252 (sin romper el Buffer tratándolo como objeto)
 * 3) No “re-encodear” strings sanos; solo quitar BOM y corregir mojibake típico
 *
 * Nota: En node-firebird algunas versiones usan `encoding` y otras `charset`,
 * enviamos ambas por compatibilidad.
 */

type FbOptions = Firebird.Options & {
  charset?: string;
  encoding?: string;
};

const FIREBIRD_CHARSET = String(config.firebird.charset || 'WIN1252').toUpperCase();
const POOL_SIZE = Number((config.firebird as any).poolSize || 5);
const SERIALIZE_ALL = Boolean((config.firebird as any).serialize) || false;

// Mapeo inverso de caracteres problemáticos de CP850 vistos a través de ISO-8859-1
// Byte | CP850 (Real) | ISO-8859-1 (Como se ve)
// ---------------------------------------------
// 0xA0 | á            | NBSP (\u00A0)
// 0x82 | é            | Control (\u0082) - Ojo con este
// 0xA1 | í            | ¡
// 0xA2 | ó            | ¢
// 0xA3 | ú            | £
// 0xA4 | ñ            | ¤
// 0xA5 | Ñ            | ¥
// 0xD6 | Í            | Ö
// 0xE0 | Ó            | à
// 0xE9 | Ú            | é (OJO: Conflicto con é real de win1252)
// 0x81 | ü            | Control (\u0081)

const firebirdConfig: FbOptions = {
  host: config.firebird.host,
  port: config.firebird.port,
  database: config.firebird.database,
  user: config.firebird.user,
  password: config.firebird.password,
  lowercase_keys: false,
  role: undefined,
  pageSize: 4096,
  retryConnectionInterval: 1000,
  // Usamos ISO8859_1 (ID 21) para recibir los bytes uno-a-uno sin validaciones estrictas
  charset: 'ISO8859_1',
  encoding: 'ISO8859_1' as any
};

const pool = Firebird.pool(POOL_SIZE, firebirdConfig);

let queryMutex: Promise<void> = Promise.resolve();
const runSerialized = async <T>(fn: () => Promise<T>): Promise<T> => {
  if (!SERIALIZE_ALL) return fn();
  const prev = queryMutex;
  let release!: () => void;
  queryMutex = new Promise<void>((r) => (release = r));
  await prev;
  try { return await fn(); } finally { release(); }
};

/**
 * Función Maestra de Decodificación Híbrida
 */
function decodeFirebirdString(value: any, fieldName?: string): string | null {
  if (value == null) return null;

  // 1. Si llega Buffer, asumimos que Node no lo tocó.
  // Intentamos detectar si es CP850 o WIN1252 basado en la presencia de bytes característicos.
  if (Buffer.isBuffer(value)) {
    // Heurística simple: Si tiene bytes que en CP850 son vocales comunes pero en WIN1252 son símbolos raros/moneda
    const hasCP850Ghosts = [...value].some(b =>
      b === 0xA4 || // ñ (cp850) vs ¤ (win1252/iso)
      b === 0xA5 || // Ñ (cp850) vs ¥ (win1252/iso)
      b === 0xA0 || // á (cp850) vs NBSP (win1252/iso)
      b === 0xA1 || // í (cp850) vs ¡ (win1252/iso)
      b === 0xA2 || // ó (cp850) vs ¢ (win1252/iso)
      b === 0xA3    // ú (cp850) vs £ (win1252/iso)
    );

    if (hasCP850Ghosts) {
      return iconv.decode(value, 'cp850');
    }
    return iconv.decode(value, 'win1252');
  }

  // 2. Si llega String (ya interpretado como ISO-8859-1 por el driver debido a nuestra config)
  if (typeof value === 'string') {
    let s = value;

    // Detectar "Fantasmas DOS850" en el string (Yenes, Libras, Euro, etc)
    // Buscamos: ¥ (Ñ), ¤ (ñ), £ (ú), ¢ (ó), ¡ (í), Ö (Í)
    if (/[¥¤£¢¡Ö\u00A0]/.test(s)) {
      // Es casi seguro un string DOS850 interpretado como Latin1
      try {
        const rawBuf = Buffer.from(s, 'latin1'); // Recuperar bytes originales
        return iconv.decode(rawBuf, 'cp850');    // Re-interpretar como CP850
      } catch (e) {
        // Si falla, seguir
      }
    }

    // Check UTF-8 mojibake (Ã±, etc)
    if (/Ã[\x80-\xBF]/.test(s)) {
      try {
        return Buffer.from(s, 'latin1').toString('utf8');
      } catch (e) { }
    }

    // 3. Fallback Final: Reparación por Contexto (Regex)
    // Si después de todo lo anterior seguimos teniendo basura (\uFFFD, ´┐¢, ², ý), 
    // aplicamos las reglas de corrección manual.
    if (/[²ý\uFFFD]/.test(s) || s.includes('´┐¢')) {
      const TOKEN = '\u0000';
      // Unificar basura a un token seguro
      let corrected = s.replace(/[²ý\uFFFD]|´┐¢/g, TOKEN);

      // Reglas de contexto (TN -> TÍN, etc.)
      const rules = [
        { regex: new RegExp(`T${TOKEN}N`, 'g'), replace: 'TÍN' },    // AGUSTÍN, MARTÍN
        { regex: new RegExp(`C${TOKEN}A`, 'g'), replace: 'CÍA' },    // GARCÍA
        { regex: new RegExp(`R${TOKEN}A`, 'g'), replace: 'RÍA' },    // MARÍA
        { regex: new RegExp(`N${TOKEN}A`, 'g'), replace: 'NÍA' },    // ESTEFANÍA
        { regex: new RegExp(`NU${TOKEN}EZ`, 'g'), replace: 'NUÑEZ' }, // NUÑEZ
        { regex: new RegExp(`VI${TOKEN}A`, 'g'), replace: 'VIÑA' },   // AVIÑA
        { regex: new RegExp(`O${TOKEN}O`, 'g'), replace: 'OÑO' },     // TOÑO
      ];

      for (const rule of rules) {
        corrected = corrected.replace(rule.regex, rule.replace);
      }

      // Fallback universal: Todo lo que sobre es Ñ
      corrected = corrected.replace(new RegExp(TOKEN, 'g'), 'Ñ');

      // Log de reparación
      if (corrected !== s) {
        console.log(`[REPAIR] "${s}" -> "${corrected}"`);
      }
      return corrected;
    }

    return s;
  }

  return String(value);
}

// Compatibilidad de tipos para la función exportada
export function decodeFirebirdObject(obj: any, parentKey?: string): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;

  if (Buffer.isBuffer(obj)) {
    // Pasar por la lógica de detección de Buffer
    return decodeFirebirdString(obj, parentKey);
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => decodeFirebirdObject(item, `${parentKey}[${index}]`));
  }

  if (typeof obj === 'string') {
    return decodeFirebirdString(obj, parentKey);
  }

  if (typeof obj === 'object') {
    const out: any = {};
    for (const k of Object.keys(obj)) {
      out[k] = decodeFirebirdObject(obj[k], k);
    }
    return out;
  }

  return obj;
}

function withDb<T>(fn: (db: Firebird.Database) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    pool.get((err, db) => {
      if (err) return reject(err);
      if (!db) return reject(new Error('No se pudo obtener conexión del pool'));

      fn(db)
        .then((res) => {
          db.detach(); // regresar al pool
          resolve(res);
        })
        .catch((e) => {
          db.detach(); // regresar al pool incluso con error
          reject(e);
        });
    });
  });
}

/**
 * Compatibilidad:
 * Si tu código antiguo necesita "una conexión", la puedes pedir,
 * PERO debes llamar db.detach() cuando termines.
 */
let database: Firebird.Database | null = null;

export async function connectFirebirdDatabase(): Promise<Firebird.Database> {
  return new Promise((resolve, reject) => {
    pool.get((err, db) => {
      if (err) return reject(err);
      if (!db) return reject(new Error('No se pudo obtener conexión del pool'));

      db.query('SELECT 1 FROM RDB$DATABASE', [], (qerr: any) => {
        if (qerr) {
          db.detach();
          return reject(qerr);
        }
        database = db;
        resolve(db);
      });
    });
  });
}

export function getFirebirdDb(): Firebird.Database {
  if (!database) {
    throw new Error('Base de datos Firebird no conectada. Llame a connectFirebirdDatabase() primero.');
  }
  return database;
}

/**
 * Ejecuta una query (opcionalmente serializada)
 */
export function executeSerializedQuery<T>(queryFn: (db: Firebird.Database) => Promise<T>): Promise<T> {
  return runSerialized(() => withDb(queryFn));
}

export async function testFirebirdConnection(): Promise<boolean> {
  try {
    await runSerialized(() =>
      withDb(
        (db) =>
          new Promise<void>((resolve, reject) => {
            db.query('SELECT 1 FROM RDB$DATABASE', [], (err: any) => {
              if (err) return reject(err);
              resolve();
            });
          })
      )
    );
    return true;
  } catch (e) {
    console.error('[FIREBIRD] test connection failed:', e);
    return false;
  }
}

/**
 * Query segura con timeout y decodificación
 */
export async function executeSafeQuery(sql: string, params: any[] = []): Promise<any[]> {
  return runSerialized(() =>
    withDb(
      (db) =>
        new Promise<any[]>((resolve, reject) => {
          if (!db || typeof (db as any).query !== 'function') {
            return reject(new Error('Conexión a Firebird no disponible'));
          }

          const timeoutMs = 30000;
          const timeoutId = setTimeout(() => {
            reject(new Error('Tiempo de espera agotado en consulta Firebird'));
          }, timeoutMs);

          db.query(sql, params, (err: any, result: any) => {
            clearTimeout(timeoutId);

            if (err) return reject(err);

            const records = Array.isArray(result) ? result : result ? [result] : [];
            resolve(records.map((row: any) => decodeFirebirdObject(row)));
          });
        })
    )
  );
}

/**
 * Transacciones:
 * - Obtiene conexión del pool
 * - Inicia transacción
 * - Commit/Rollback
 * - Siempre regresa la conexión al pool
 */
export async function executeInTransaction<T>(
  transactionFn: (transaction: Firebird.Transaction) => Promise<T>
): Promise<T> {
  return runSerialized(
    () =>
      new Promise<T>((resolve, reject) => {
        pool.get((err, db) => {
          if (err) return reject(err);
          if (!db) return reject(new Error('No se pudo obtener conexión del pool'));

          db.transaction(Firebird.ISOLATION_READ_COMMITTED, async (txErr, transaction) => {
            if (txErr) {
              db.detach();
              return reject(new Error(`Error al iniciar transacción en Firebird: ${txErr.message}`));
            }

            try {
              const result = await transactionFn(transaction);

              transaction.commit((commitErr) => {
                db.detach();
                if (commitErr) {
                  return reject(new Error(`Error al hacer commit en Firebird: ${commitErr.message}`));
                }
                resolve(result);
              });
            } catch (e: any) {
              transaction.rollback(() => {
                db.detach();
                reject(e);
              });
            }
          });
        });
      })
  );
}

export function executeQueryInTransaction(
  transaction: Firebird.Transaction,
  sql: string,
  params: any[] = []
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      transaction.query(sql, params, (err: any, result: any) => {
        if (err) return reject(new Error(`Error en query Firebird: ${err.message || String(err)}`));

        const records = Array.isArray(result) ? result : result ? [result] : [];
        resolve(records.map((row: any) => decodeFirebirdObject(row)));
      });
    } catch (e: any) {
      reject(e);
    }
  });
}

export function executeProcedureInTransaction(
  transaction: Firebird.Transaction,
  procedureName: string,
  params: any[] = []
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      transaction.execute(procedureName, params, (err: any, result: any) => {
        if (err) {
          return reject(
            new Error(`Error en procedimiento Firebird ${procedureName}: ${err.message || String(err)}`)
          );
        }

        const records = Array.isArray(result) ? result : result ? [result] : [];
        resolve(records.map((row: any) => decodeFirebirdObject(row)));
      });
    } catch (e: any) {
      reject(e);
    }
  });
}

export async function closeFirebirdPool(): Promise<void> {
  return new Promise((resolve) => {
    pool.destroy();
    database = null;
    resolve();
  });
}

// Alias para compatibilidad con código existente
export const closeFirebirdConnection = closeFirebirdPool;

/**
 * Devuelve el charset actual de la conexión (id + nombre real desde Firebird)
 */
export async function checkFirebirdCharset(): Promise<{ id: number; name: string } | null> {
  return runSerialized(() =>
    withDb(
      (db) =>
        new Promise((resolve, reject) => {
          const sql = `
            SELECT
              a.mon$character_set_id AS charset_id,
              TRIM(cs.rdb$character_set_name) AS charset_name
            FROM mon$attachments a
            JOIN rdb$character_sets cs
              ON cs.rdb$character_set_id = a.mon$character_set_id
            WHERE a.mon$attachment_id = CURRENT_CONNECTION
          `;

          db.query(sql, [], (err: any, result: any) => {
            if (err) return reject(err);
            if (!result || result.length === 0) return resolve(null);

            const row = result[0];
            resolve({
              id: row.CHARSET_ID ?? row.charset_id,
              name: row.CHARSET_NAME ?? row.charset_name
            });
          });
        })
    )
  );
}

/**
 * Info runtime
 */
export const firebirdRuntimeInfo = {
  poolSize: POOL_SIZE,
  serializeAll: SERIALIZE_ALL,
  charset: FIREBIRD_CHARSET,
  host: firebirdConfig.host,
  port: firebirdConfig.port,
  database: firebirdConfig.database
};
