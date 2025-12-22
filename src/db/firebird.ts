import Firebird from 'node-firebird';
import { env as config } from '../config/env.js';
import iconv from 'iconv-lite';

/**
 * CONFIGURACIÓN DE CHARSET PARA FIREBIRD
 * 
 * Estrategia de encoding/decoding:
 * - La base de datos Firebird está en WIN1252 (Windows-1252)
 * - Configurar FIREBIRD_CHARSET=WIN1252 en .env para que node-firebird intente usar WIN1252
 * - Sin embargo, node-firebird puede devolver Buffers sin decodificar correctamente
 * - Por lo tanto, SIEMPRE decodificamos manualmente los Buffers usando iconv.decode(value, 'win1252')
 * 
 * Flujo de decodificación:
 * 1. Si node-firebird devuelve un Buffer: decodificar con iconv.decode(buffer, 'win1252') -> UTF-8
 * 2. Si node-firebird devuelve un string: puede tener mojibake residual, aplicar corrección conservadora
 * 3. NO hacer reemplazos heurísticos agresivos (ej: convertir '?' a 'ñ' basándose en contexto)
 * 
 * Charsets soportados:
 * - WIN1252: Recomendado para BD en español (Windows-1252)
 * - ISO8859_1: Alternativa (ISO Latin-1)
 * - UTF8: Si la BD está en UTF-8
 * - NONE: Sin conversión automática, decodificar manualmente desde WIN1252
 */
const firebirdConfig: Firebird.Options & { charset?: string } = {
  host: config.firebird.host,
  port: config.firebird.port,
  database: config.firebird.database,
  user: config.firebird.user,
  password: config.firebird.password,
  lowercase_keys: false,
  role: undefined,
  pageSize: 4096,
  retryConnectionInterval: 1000,
  charset: config.firebird.charset // Configurable desde .env: NONE, UTF8, WIN1252, ISO8859_1
};

let database: Firebird.Database | null = null;
let connectionQueue: Array<{ resolve: (db: Firebird.Database) => void; reject: (err: Error) => void }> = [];
let isConnecting = false;

// Mutex para serializar consultas a Firebird (node-firebird no es thread-safe)
let queryMutex: Promise<any> = Promise.resolve();

const MOJIBAKE_SEQUENCE_REGEX = /(?:Ã[\x80-\xBF]|Â[\x80-\xBF]|´┐¢|�)/g;

const hasMojibakeSequences = (text: string): boolean => {
  MOJIBAKE_SEQUENCE_REGEX.lastIndex = 0;
  return MOJIBAKE_SEQUENCE_REGEX.test(text);
};


/**
 * Función conservadora para corregir mojibake común de caracteres españoles
 * Solo corrige patrones de mojibake conocidos (UTF-8 mal interpretado como Latin1)
 * NO hace reemplazos heurísticos agresivos que puedan convertir caracteres incorrectamente
 * 
 * Estrategia: La BD está en WIN1252, y con charset=WIN1252 en la conexión + iconv.decode,
 * los caracteres deberían llegar correctamente. Esta función solo corrige mojibake residual.
 */
function fixSpanishCharacters(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let corrected = text;
  
  // Reemplazar mojibake común usando regex para capturar los patrones completos
  // UTF-8 mal interpretado como Latin1: 'Ã' seguido de un byte específico
  
  // Mojibake específico de tres caracteres '´┐¢' -> 'Ñ'
  corrected = corrected.replace(/´┐¢/g, 'Ñ');
  
  // CORRECCIÓN ESPECIAL: "ý" (U+00FD) a menudo aparece cuando "ó" (U+00F3) está mal decodificado
  // Esto ocurre cuando WIN1252 se lee incorrectamente
  // Reemplazar "ý" por "ó" en contextos donde tiene sentido (palabras españolas comunes)
  corrected = corrected.replace(/ciýn/gi, 'ción');  // "Prescripciýn" -> "Prescripción"
  corrected = corrected.replace(/siýn/gi, 'sión'); // "Pensiýn" -> "Pensión"
  corrected = corrected.replace(/unciýn/gi, 'unción'); // "Defunciýn" -> "Defunción"
  
  // CORRECCIÓN ESPECIAL: Carácter de reemplazo Unicode () - reemplazar solo cuando está presente
  // Este carácter aparece cuando hay un error de decodificación
  // IMPORTANTE: Solo reemplazar si el carácter de reemplazo está presente, no si ya está corregido
  if (corrected.includes('\uFFFD') || corrected.includes('')) {
    // Reemplazar el carácter de reemplazo por "ó" solo en contextos específicos
    corrected = corrected.replace(/ci\uFFFDn/gi, 'ción');  // "Prescripci" -> "Prescripción"
    corrected = corrected.replace(/si\uFFFDn/gi, 'sión'); // "Pensi" -> "Pensión"
    corrected = corrected.replace(/unci\uFFFDn/gi, 'unción'); // "Defunci" -> "Defunción"
    
    // Si aún hay caracteres de reemplazo sin contexto, eliminarlos
    corrected = corrected.replace(/\uFFFD/g, '');
  }
  
  // Patrones de dos caracteres: 'Ã' + byte específico
  // Minúsculas
  corrected = corrected.replace(/Ã±/g, 'ñ');   // 0xC3 0xB1
  corrected = corrected.replace(/Ã¡/g, 'á');   // 0xC3 0xA1
  corrected = corrected.replace(/Ã©/g, 'é');   // 0xC3 0xA9
  corrected = corrected.replace(/Ã­/g, 'í');   // 0xC3 0xAD
  corrected = corrected.replace(/Ã³/g, 'ó');   // 0xC3 0xB3
  corrected = corrected.replace(/Ãº/g, 'ú');   // 0xC3 0xBA
  corrected = corrected.replace(/Ã¼/g, 'ü');   // 0xC3 0xBC
  corrected = corrected.replace(/Ã§/g, 'ç');   // 0xC3 0xA7
  
  // Mayúsculas - usar regex para capturar 'Ã' seguido del byte correcto
  corrected = corrected.replace(/Ã[\x91\u0091]/g, 'Ñ');  // 0xC3 0x91 -> Ñ
  corrected = corrected.replace(/Ã[\x81\u0081]/g, 'Á');  // 0xC3 0x81 -> Á
  corrected = corrected.replace(/Ã‰/g, 'É');             // 0xC3 0x89 -> É
  corrected = corrected.replace(/Ã[\x8D\u008D]/g, 'Í');  // 0xC3 0x8D -> Í
  corrected = corrected.replace(/Ã"/g, 'Ó');             // 0xC3 0x93 -> Ó
  corrected = corrected.replace(/Ãš/g, 'Ú');             // 0xC3 0x9A -> Ú
  corrected = corrected.replace(/Ãœ/g, 'Ü');             // 0xC3 0x9C -> Ü
  corrected = corrected.replace(/Ã[\x87\u0087]/g, 'Ç'); // 0xC3 0x87 -> Ç

  return corrected;
}

/**
 * Función para decodificar correctamente strings de Firebird
 * Estrategia: La BD está en WIN1252. 
 * 
 * IMPORTANTE: node-firebird puede devolver datos de dos formas:
 * 1. Como Buffer (datos crudos) - necesitamos decodificar manualmente con iconv
 * 2. Como string (ya decodificado por node-firebird) - puede estar mal decodificado y necesitar corrección
 * 
 * Esta función:
 * 1. Si es Buffer: SIEMPRE decodificar manualmente desde WIN1252 usando iconv (ignorar charset de node-firebird)
 * 2. Si es string: verificar si tiene mojibake y corregirlo, o si parece estar bien decodificado, dejarlo tal cual
 * 3. NO hace reemplazos heurísticos agresivos
 */
function decodeFirebirdString(value: any, fieldName?: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  
  // Si es un Buffer, SIEMPRE decodificar manualmente desde WIN1252
  // No confiar en el charset configurado en node-firebird porque puede fallar
  if (Buffer.isBuffer(value)) {
    let decoded = '';
    
    try {
      // SIEMPRE decodificar desde WIN1252 (la BD está en WIN1252)
      decoded = iconv.decode(value, 'win1252');
      
      // Verificar que no haya caracteres de reemplazo (U+FFFD)
      if (decoded.includes('\uFFFD')) {
        // Si hay caracteres de reemplazo, intentar como latin1
        decoded = value.toString('latin1');
      }
    } catch (e) {
      // Si falla iconv con WIN1252, intentar como latin1 (similar a WIN1252)
      try {
        decoded = value.toString('latin1');
      } catch (e2) {
        // Último recurso: UTF-8
        decoded = value.toString('utf8');
      }
    }
    
    // Aplicar corrección conservadora de mojibake residual (por si acaso)
    return fixSpanishCharacters(decoded);
  }
  
  // Si ya es un string, puede que node-firebird ya lo haya decodificado
  // Pero puede estar mal decodificado (mojibake o caracteres incorrectos como "ý" en lugar de "ó")
  if (typeof value === 'string') {
    // Si tiene el carácter de reemplazo Unicode (), NO intentar recodificar
    // Solo aplicar correcciones específicas
    if (value.includes('\uFFFD') || value.includes('')) {
      // El carácter indica que hubo un error de decodificación
      // No intentar recodificar, solo aplicar correcciones específicas
      return fixSpanishCharacters(value);
    }
    
    // Detectar si tiene caracteres que sugieren decodificación incorrecta
    // "ý" (U+00FD) a menudo aparece cuando "ó" (U+00F3) está mal decodificado
    const hasIncorrectChars = /ý/.test(value) || hasMojibakeSequences(value) || value.includes('´┐¢') || /[├┐¢]/.test(value);
    
    if (hasIncorrectChars) {
      // Intentar recodificar solo si NO tiene caracteres de reemplazo
      try {
        // Convertir el string a Buffer desde latin1 (asumiendo que está mal interpretado)
        const latin1Buffer = Buffer.from(value, 'latin1');
        // Decodificar desde WIN1252
        const recoded = iconv.decode(latin1Buffer, 'win1252');
        
        // Verificar que no haya introducido caracteres de reemplazo
        if (!recoded.includes('\uFFFD') && !recoded.includes('')) {
          // Si la recodificación eliminó "ý" y no introdujo caracteres de reemplazo, usarla
          if (!/ý/.test(recoded)) {
            return fixSpanishCharacters(recoded);
          }
        }
        
        // Si la recodificación introdujo caracteres de reemplazo o aún tiene "ý",
        // aplicar solo correcciones específicas al string original
        return fixSpanishCharacters(value);
      } catch (e) {
        // Si falla, aplicar correcciones al string original
        return fixSpanishCharacters(value);
      }
    }
    
    // Si no tiene problemas obvios, puede que ya esté bien decodificado
    return value;
  }
  
  // Para otros tipos, convertir a string
  return String(value);
}

/**
 * Convierte recursivamente un objeto de Firebird asegurando la correcta decodificación
 * Recorre recursivamente objetos y arrays, aplicando decodeFirebirdString a strings y Buffers
 */
function decodeFirebirdObject(obj: any, parentKey?: string): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Si es un array, procesar cada elemento
  if (Array.isArray(obj)) {
    return obj.map((item, index) => decodeFirebirdObject(item, `${parentKey}[${index}]`));
  }
  
  // Si es una fecha, retornarla tal cual
  if (obj instanceof Date) {
    return obj;
  }
  
  // Si es un objeto, procesar cada propiedad
  if (typeof obj === 'object' && obj.constructor === Object) {
    const decoded: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        decoded[key] = decodeFirebirdObject(value, key);
      }
    }
    return decoded;
  }
  
  // Si es un string o Buffer, decodificarlo
  if (typeof obj === 'string' || Buffer.isBuffer(obj)) {
    return decodeFirebirdString(obj, parentKey);
  }
  
  // Para otros tipos (números, booleanos, etc.), retornarlos tal cual
  return obj;
}

// Exportar la función para uso en otros módulos
export { decodeFirebirdObject };

// Función helper para ejecutar consultas de forma serializada
export const executeSerializedQuery = <T>(
  queryFn: (db: Firebird.Database) => Promise<T>
): Promise<T> => {
  // Agregar la consulta a la cola del mutex
  const previousMutex = queryMutex;
  
  // Crear una nueva promesa que se ejecutará después de que la anterior termine
  const currentQuery = previousMutex.then(async () => {
    try {
      let db: Firebird.Database;
      
      // Intentar obtener la conexión existente
      try {
        db = getFirebirdDb();
      } catch (error: any) {
        // Si la conexión no existe, intentar reconectar
        console.warn('Conexión a Firebird no disponible, intentando reconectar...');
        try {
          db = await connectFirebirdDatabase();
        } catch (reconnectError: any) {
          const errorMessage = reconnectError.message || String(reconnectError);
          const errorCode = reconnectError.code || 'FIREBIRD_CONNECTION_ERROR';
          
          // Detectar errores de conexión específicos
          if (errorCode === 'ECONNREFUSED' || errorMessage.includes('ECONNREFUSED') || 
              errorMessage.includes('connection refused') || errorMessage.includes('connect')) {
            throw new Error(`No se pudo conectar al servidor Firebird. Verifique que el servidor esté ejecutándose en ${firebirdConfig.host}:${firebirdConfig.port}. Error: ${errorMessage}`);
          }
          
          throw new Error(`Error al reconectar a Firebird: ${errorMessage}`);
        }
      }
      
      if (!db || typeof db.query !== 'function') {
        throw new Error('Conexión a Firebird no disponible o inválida');
      }
      
      // Ejecutar la consulta y retornar su resultado
      return await queryFn(db);
    } catch (error: any) {
      // Mejorar mensajes de error de conexión
      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED') || 
          error.message?.includes('connection refused') || error.message?.includes('connect')) {
        const connectionError = new Error(
          `Error de conexión con Firebird: No se pudo establecer conexión con el servidor en ${firebirdConfig.host}:${firebirdConfig.port}. ` +
          `Verifique que el servidor Firebird esté ejecutándose y que la configuración sea correcta. ` +
          `Error original: ${error.message || String(error)}`
        );
        (connectionError as any).code = 'ECONNREFUSED';
        throw connectionError;
      }
      
      // Re-lanzar el error para que sea manejado por el caller
      throw error;
    }
  });
  
  // Actualizar el mutex para que la siguiente consulta espere a esta
  queryMutex = currentQuery.catch(() => {
    // Si hay un error, continuar con la siguiente consulta
    return Promise.resolve();
  });

  // Retornar el resultado de la consulta actual
  return currentQuery;
};

export const connectFirebirdDatabase = async (): Promise<Firebird.Database> => {
  if (database) {
    return database;
  }

  // Si ya hay una conexión en progreso, esperar en la cola
  if (isConnecting) {
    return new Promise((resolve, reject) => {
      connectionQueue.push({ resolve, reject });
    });
  }

  isConnecting = true;

  console.log('Intentando conectar a la base de datos Firebird con configuración:', {
    host: firebirdConfig.host,
    port: firebirdConfig.port,
    database: firebirdConfig.database,
    user: firebirdConfig.user,
    // password: firebirdConfig.password, // No registrar contraseña
  });

  return new Promise((resolve, reject) => {
    Firebird.attach(firebirdConfig, (err, db) => {
      if (err) {
        console.error('Error al conectar a la base de datos Firebird:', err);
        reject(err);
        return;
      }

      // Test the connection with a Firebird-compatible query
      // El charset UTF-8 está configurado en firebirdConfig para soporte de español
      try {
        db.query('SELECT 1 FROM RDB$DATABASE', [], (err: any) => {
          if (err) {
            console.error('Error al probar la conexión a Firebird:', err);
            db.detach();
            reject(err);
            return;
          }
          console.log(`Prueba de conexión a Firebird exitosa (charset: ${firebirdConfig.charset} con corrección de mojibake)`);
          database = db;
          isConnecting = false;
          
          // Resolver todas las promesas en cola
          connectionQueue.forEach(({ resolve }) => resolve(db));
          connectionQueue = [];
          
          resolve(db);
        });
      } catch (testError) {
        console.error('Error al probar la conexión a Firebird:', testError);
        db.detach();
        isConnecting = false;
        
        const error = testError instanceof Error ? testError : new Error(String(testError));
        
        // Rechazar todas las promesas en cola
        connectionQueue.forEach(({ reject }) => reject(error));
        connectionQueue = [];
        
        reject(error);
      }
    });
  });
};

export const testFirebirdConnection = async (): Promise<boolean> => {
  try {
    await connectFirebirdDatabase();
    return executeSerializedQuery((db) => {
      return new Promise<boolean>((resolve) => {
        db.query('SELECT 1 FROM RDB$DATABASE', [], (err: any) => {
          if (err) {
            console.error('Prueba de conexión a Firebird falló:', err);
            resolve(false);
            return;
          }
          console.log('Prueba de conexión a Firebird exitosa');
          resolve(true);
        });
      });
    });
  } catch (error) {
    console.error('Error en la prueba de conexión a Firebird:', error);
    return false;
  }
};

export const getFirebirdDb = (): Firebird.Database => {
  if (!database) {
    throw new Error('Base de datos Firebird no conectada. Llame a connectFirebirdDatabase() primero.');
  }
  return database;
};

export const closeFirebirdConnection = async (): Promise<void> => {
  if (database) {
    return new Promise((resolve) => {
      database!.detach(() => {
        console.log('Conexión a la base de datos Firebird cerrada');
        database = null;
        resolve();
      });
    });
  }
};

// Safe query execution with enhanced error handling and serialization
export const executeSafeQuery = (sql: string, params: any[] = []): Promise<any[]> => {
  // Usar executeSerializedQuery para evitar problemas de concurrencia
  return executeSerializedQuery((db) => {
    return new Promise<any[]>((resolve, reject) => {
      try {
        // Validar que la conexión esté disponible
        if (!db || typeof db.query !== 'function') {
          reject(new Error('Conexión a Firebird no disponible'));
          return;
        }
        
        // Add timeout to prevent hanging queries
        const timeoutId = setTimeout(() => {
          reject(new Error('Tiempo de espera agotado en consulta Firebird'));
        }, 30000); // 30 second timeout

        db.query(sql, params, (err: any, result: any) => {
          clearTimeout(timeoutId);
          
          if (err) {
            console.error('Error en consulta Firebird:', {
              sql,
              params,
              error: err.message || err,
              errorName: err.name,
              stack: err.stack
            });
            reject(err);
            return;
          }

          if (!result) {
            console.warn('La consulta Firebird retornó un resultado vacío');
            resolve([]);
            return;
          }

          try {
            // Safely map results, handling potential malformed responses
            const records = Array.isArray(result) ? result : [result];
            const sampleFields = ['NOMBRE', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO', 'FULLNAME', 'LOCALIDAD', 'MUNICIPIO'];
            
            // Log solo para el primer registro para diagnóstico
            if (records.length > 0) {
              console.log('📦 [DEBUG] Primer registro RAW de Firebird (primeros campos):');
              const firstRow = records[0];
              sampleFields.forEach((field: string) => {
                if (firstRow[field] !== undefined) {
                  const val = firstRow[field];
                  console.log(`   ${field}: ${val} (tipo: ${typeof val}, isBuffer: ${Buffer.isBuffer(val)})`);
                }
              });
            }
            
            // Decodificar todos los registros usando decodeFirebirdObject
            // Esta función ya maneja correctamente la decodificación desde WIN1252
            const decodedRecords = records.map((row: any, index: number) => {
              if (!row || typeof row !== 'object') {
                console.warn('Datos de fila inválidos recibidos de Firebird:', row);
                return null;
              }
              
              // Decodificar el objeto completo (maneja Buffers y strings correctamente)
              const decoded = decodeFirebirdObject(row);
              
              // Log del primer registro después de decodificar (solo en desarrollo)
              if (index === 0 && process.env.NODE_ENV === 'development') {
                console.log('✅ [DEBUG] Primer registro DESPUÉS de decodificar:');
                sampleFields.forEach((field: string) => {
                  if (decoded[field] !== undefined) {
                    console.log(`   ${field}: ${decoded[field]}`);
                  }
                });
              }
              
              return decoded;
            }).filter(Boolean);
            
            resolve(decodedRecords);
          } catch (mapError) {
            console.error('Error al mapear resultados de Firebird:', mapError);
            reject(new Error('Error al procesar resultados de la base de datos'));
          }
        });
      } catch (dbError) {
        console.error('Error al ejecutar consulta Firebird:', dbError);
        reject(dbError);
      }
    });
  });
};

/**
 * Ejecuta una función dentro de una transacción de Firebird
 * Si la función tiene éxito, hace commit automáticamente
 * Si hay un error, hace rollback automáticamente
 */
export const executeInTransaction = async <T>(
  transactionFn: (transaction: Firebird.Transaction) => Promise<T>
): Promise<T> => {
  return executeSerializedQuery(async (db) => {
    return new Promise<T>((resolve, reject) => {
      // Iniciar transacción en Firebird
      db.transaction(Firebird.ISOLATION_READ_COMMITTED, async (err, transaction) => {
        if (err) {
          console.error('[FIREBIRD_TRANSACTION] Error al iniciar transacción:', err);
          reject(new Error(`Error al iniciar transacción en Firebird: ${err.message}`));
          return;
        }

        try {
          // Ejecutar la función con la transacción
          const result = await transactionFn(transaction);
          
          // Si todo salió bien, hacer commit
          transaction.commit((commitErr) => {
            if (commitErr) {
              console.error('[FIREBIRD_TRANSACTION] Error al hacer commit:', commitErr);
              reject(new Error(`Error al hacer commit en Firebird: ${commitErr.message}`));
              return;
            }
            console.log('[FIREBIRD_TRANSACTION] Commit exitoso');
            resolve(result);
          });
        } catch (error: any) {
          // Si hubo un error, hacer rollback
          console.error('[FIREBIRD_TRANSACTION] Error en función de transacción:', error);
          transaction.rollback((rollbackErr) => {
            if (rollbackErr) {
              console.error('[FIREBIRD_TRANSACTION] Error al hacer rollback:', rollbackErr);
            } else {
              console.log('[FIREBIRD_TRANSACTION] Rollback exitoso');
            }
            reject(error);
          });
        }
      });
    });
  });
};

/**
 * Ejecuta una query dentro de una transacción existente
 */
export const executeQueryInTransaction = (
  transaction: Firebird.Transaction,
  sql: string,
  params: any[] = []
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('[FIREBIRD_TRANSACTION] Ejecutando query:', sql);
      console.log('[FIREBIRD_TRANSACTION] Parámetros:', params);
      
      transaction.query(sql, params, (err: any, result: any[]) => {
        if (err) {
          console.error('[FIREBIRD_TRANSACTION] Error en query:', err);
          reject(new Error(`Error en query Firebird: ${err.message || JSON.stringify(err)}`));
          return;
        }
        
        // Procesar resultado usando decodeFirebirdObject para manejar correctamente Buffers y strings
        const processedResult = result?.map((row: any) => decodeFirebirdObject(row)) || [];
        
        resolve(processedResult);
      });
    } catch (error: any) {
      console.error('[FIREBIRD_TRANSACTION] Error inesperado:', error);
      reject(error);
    }
  });
};

/**
 * Ejecuta un procedimiento almacenado dentro de una transacción
 */
export const executeProcedureInTransaction = (
  transaction: Firebird.Transaction,
  procedureName: string,
  params: any[] = []
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('[FIREBIRD_TRANSACTION] Ejecutando procedimiento:', procedureName);
      console.log('[FIREBIRD_TRANSACTION] Parámetros:', params);
      
      transaction.execute(procedureName, params, (err: any, result: any) => {
        if (err) {
          console.error('[FIREBIRD_TRANSACTION] Error en procedimiento:', err);
          reject(new Error(`Error en procedimiento Firebird ${procedureName}: ${err.message || JSON.stringify(err)}`));
          return;
        }
        
        // Normalizar el resultado
        const resultArray = Array.isArray(result) ? result : (result ? [result] : []);
        
        // Procesar resultado usando decodeFirebirdObject para manejar correctamente Buffers y strings
        const processedResult = resultArray.map((row: any) => decodeFirebirdObject(row));
        
        resolve(processedResult);
      });
    } catch (error: any) {
      console.error('[FIREBIRD_TRANSACTION] Error inesperado:', error);
      reject(error);
    }
  });
};

