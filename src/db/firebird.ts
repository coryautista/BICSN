import Firebird from 'node-firebird';
import { env as config } from '../config/env.js';
import iconv from 'iconv-lite';

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

const countMojibakeSequences = (text: string): number => {
  MOJIBAKE_SEQUENCE_REGEX.lastIndex = 0;
  return (text.match(MOJIBAKE_SEQUENCE_REGEX) ?? []).length;
};

const tryDecodeFromLatin1 = (text: string): string => {
  try {
    return Buffer.from(text, 'latin1').toString('utf8');
  } catch (_error) {
    return text;
  }
};

/**
 * Función para corregir todos los caracteres especiales del español
 * Corrige mojibake común: ´┐¢ -> Ñ, Ã± -> ñ, Ã¡ -> á, etc.
 */
function fixSpanishCharacters(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let corrected = text;
  
  // SOLUCIÓN ULTRA SIMPLE: Reemplazar '´┐¢' por 'Ñ' directamente
  // Buscar por códigos de caracteres: ' (180/0xB4) + ┐ (9488/0x2510) + ¢ (162/0xA2)
  while (true) {
    let found = false;
    const chars = Array.from(corrected);
    
    for (let i = 0; i < chars.length - 2; i++) {
      const c1 = chars[i].charCodeAt(0);
      const c2 = chars[i + 1].charCodeAt(0);
      const c3 = chars[i + 2].charCodeAt(0);
      
      // Detectar el mojibake '´┐¢' por códigos
      if ((c1 === 180 || c1 === 0xB4) && (c2 === 9488 || c2 === 0x2510) && (c3 === 162 || c3 === 0xA2)) {
        // Determinar mayúscula/minúscula por contexto
        const before = i > 0 ? chars[i - 1] : '';
        const after = i + 3 < chars.length ? chars[i + 3] : '';
        const isUpper = (before && /[A-Z]/.test(before)) || (after && /[A-Z]/.test(after));
        
        corrected = corrected.substring(0, i) + (isUpper ? 'Ñ' : 'ñ') + corrected.substring(i + 3);
        found = true;
        break;
      }
    }
    
    if (!found) break; // Salir cuando no se encuentre más
  }
  
  // También reemplazo directo por string (por si acaso)
  corrected = corrected.replace(/´┐¢/g, 'Ñ');
  
  // Otros reemplazos comunes de mojibake
  if (hasMojibakeSequences(corrected)) {
    const recoded = tryDecodeFromLatin1(corrected);
    if (countMojibakeSequences(recoded) < countMojibakeSequences(corrected)) {
      corrected = recoded;
    }
  }

  const replacements: Record<string, string> = {
    'Ã±': 'ñ',
    'Ã‘': 'Ñ',
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ã': 'Á',  // Ã (0xC3 0x81) -> Á
    'Ã‰': 'É',  // Ã‰ (0xC3 0x89) -> É
    'Ã': 'Í',  // Ã (0xC3 0x8D) -> Í
    'Ã“': 'Ó',  // Ã“ (0xC3 0x93) -> Ó
    'Ãš': 'Ú'   // Ãš (0xC3 0x9A) -> Ú
  };

  for (const [wrong, right] of Object.entries(replacements)) {
    // Usar replaceAll para asegurar que se reemplacen todas las ocurrencias
    corrected = corrected.split(wrong).join(right);
  }
  
  // Patrones específicos para apellidos comunes con Ñ usando el mojibake '´┐¢'
  // Aplicar estos patrones incluso si ya se reemplazó '´┐¢' por 'Ñ' (por si acaso)
  const mojibakePatterns = [
    { pattern: /NU´┐¢EZ/gi, replacement: 'NUÑEZ' },
    { pattern: /MU´┐¢OZ/gi, replacement: 'MUÑOZ' },
    { pattern: /MU´┐¢IZ/gi, replacement: 'MUÑIZ' },
    { pattern: /TISCARE´┐¢O/gi, replacement: 'TISCAREÑO' },
    { pattern: /PI´┐¢A/gi, replacement: 'PIÑA' },
    { pattern: /CASTA´┐¢EDA/gi, replacement: 'CASTAÑEDA' },
    { pattern: /PE´┐¢ALOZA/gi, replacement: 'PEÑALOZA' },
    { pattern: /([A-Z])U´┐¢([A-Z])/g, replacement: '$1UÑ$2' }, // Patrón genérico para XU´┐¢Y -> XUÑY
    { pattern: /([A-Z])I´┐¢([A-Z])/g, replacement: '$1IÑ$2' }, // Patrón genérico para XI´┐¢Y -> XIÑY
    { pattern: /([A-Z])A´┐¢([A-Z])/g, replacement: '$1AÑ$2' }  // Patrón genérico para XA´┐¢Y -> XAÑY
  ];
  
  for (const { pattern, replacement } of mojibakePatterns) {
    const beforePattern = corrected;
    corrected = corrected.replace(pattern, replacement);
    if (beforePattern !== corrected) {
      // Log cuando se aplica un patrón
      console.log(`   🔧 [fixSpanishCharacters] Patrón aplicado: "${beforePattern}" -> "${corrected}"`);
    }
  }

  // Corrección heurística para '?' (U+003F) y carácter de reemplazo Unicode (U+FFFD, código 65533)
  // que aparecen en medio de palabras (suelen representar Ñ/ñ)
  const replacementChar = String.fromCharCode(0xFFFD); // U+FFFD
  
  // Primero intentar patrones específicos conocidos usando regex para capturar tanto '?' como U+FFFD
  // Usar una clase de caracteres que capture ambos
  const patterns = [
    { pattern: /NU([?\uFFFD])EZ/gi, replacement: 'NUÑEZ' },
    { pattern: /MU([?\uFFFD])OZ/gi, replacement: 'MUÑOZ' },
    { pattern: /MU([?\uFFFD])IZ/gi, replacement: 'MUÑIZ' },
    { pattern: /TISCARE([?\uFFFD])O/gi, replacement: 'TISCAREÑO' },
    { pattern: /PI([?\uFFFD])A/gi, replacement: 'PIÑA' },
    { pattern: /CASTA([?\uFFFD])EDA/gi, replacement: 'CASTAÑEDA' }
  ];
  
  for (const { pattern, replacement } of patterns) {
    corrected = corrected.replace(pattern, replacement);
  }
  
  // También intentar reemplazos directos con el carácter U+FFFD (sin espacios)
  corrected = corrected.replace(/NU\uFFFDEZ/g, 'NUÑEZ');
  corrected = corrected.replace(/MU\uFFFDOZ/g, 'MUÑOZ');
  corrected = corrected.replace(/MU\uFFFDIZ/g, 'MUÑIZ');
  corrected = corrected.replace(/TISCARE\uFFFDO/g, 'TISCAREÑO');
  corrected = corrected.replace(/PI\uFFFDA/g, 'PIÑA');
  corrected = corrected.replace(/CASTA\uFFFDEDA/g, 'CASTAÑEDA');
  
  // Reemplazos directos sin espacios
  corrected = corrected.replace('NU' + replacementChar + 'EZ', 'NUÑEZ');
  corrected = corrected.replace('MU' + replacementChar + 'OZ', 'MUÑOZ');
  corrected = corrected.replace('MU' + replacementChar + 'IZ', 'MUÑIZ');
  corrected = corrected.replace('TISCARE' + replacementChar + 'O', 'TISCAREÑO');
  corrected = corrected.replace('PI' + replacementChar + 'A', 'PIÑA');
  corrected = corrected.replace('CASTA' + replacementChar + 'EDA', 'CASTAÑEDA');
  
  // Luego aplicar corrección genérica para cualquier '?' o U+FFFD entre letras
  // Iterar sobre el string y reemplazar directamente
  // Primero convertir a array para poder modificar mientras iteramos
  const chars = Array.from(corrected);
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const charCode = char.charCodeAt(0);
    const isProblemChar = char === '?' || charCode === 0xFFFD;
    
    if (isProblemChar && i > 0 && i < chars.length - 1) {
      const before = chars[i - 1];
      const after = chars[i + 1];
      const beforeIsLetter = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(before);
      const afterIsLetter = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(after);
      
      if (beforeIsLetter && afterIsLetter) {
        const isUpperCase = before === before.toUpperCase() && after === after.toUpperCase();
        chars[i] = isUpperCase ? 'Ñ' : 'ñ';
      }
    }
  }
  corrected = chars.join('');

  return corrected;
}

/**
 * Función para decodificar correctamente strings de Firebird
 * Maneja todos los caracteres especiales del español (Ñ, ñ, acentos, etc.)
 */
function decodeFirebirdString(value: any, fieldName?: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  
  const isTextField = fieldName && (
    fieldName.includes('NOMBRE') || 
    fieldName.includes('APELLIDO') || 
    fieldName.includes('FULLNAME') ||
    fieldName.includes('LOCALIDAD') ||
    fieldName.includes('MUNICIPIO') ||
    fieldName.includes('ESTADO') ||
    fieldName.includes('CALLE') ||
    fieldName.includes('FRACCIONAMIENTO') ||
    fieldName.includes('PAIS') ||
    fieldName.includes('NACIONALIDAD')
  );
  
  // Si es un Buffer, intentar diferentes estrategias de decodificación
  if (Buffer.isBuffer(value)) {
    if (isTextField) {
      const hex = value.toString('hex').substring(0, 40);
      console.log(`🔍 [DEBUG] Buffer en ${fieldName}`);
      console.log(`   Hex (primeros 20 bytes): ${hex}`);
    }
    
    // Estrategia 1: Decodificar según el charset configurado
    // PROBLEMA: node-firebird puede no estar respetando el charset correctamente
    // SOLUCIÓN: Usar NONE por defecto y hacer la conversión manual para evitar U+FFFD
    let decoded = '';
    const charset = firebirdConfig.charset || 'NONE';
    
    if (charset === 'NONE') {
      // Con NONE, los datos vienen sin conversión - usar iconv-lite para convertir desde WIN1252
      // Asumimos que la BD está en WIN1252 según el usuario
      try {
        decoded = iconv.decode(value, 'win1252');
        if (isTextField) {
          console.log(`   🔄 [NONE→WIN1252→UTF8] ${fieldName}: "${decoded}"`);
        }
      } catch (e) {
        // Fallback: intentar como latin1 (similar a WIN1252)
        try {
          decoded = value.toString('latin1');
          if (isTextField) {
            console.log(`   📝 [NONE→latin1] ${fieldName}: "${decoded}"`);
          }
        } catch (e2) {
          decoded = value.toString('utf8');
        }
      }
    } else if (charset === 'WIN1252') {
      // PROBLEMA: node-firebird puede no estar respetando WIN1252 correctamente
      // SOLUCIÓN: Siempre hacer la conversión manual desde WIN1252 cuando vienen como Buffer
      // Esto asegura que la conversión sea correcta independientemente de lo que haga node-firebird
      try {
        decoded = iconv.decode(value, 'win1252');
        if (isTextField) {
          console.log(`   🔄 [WIN1252→UTF8] ${fieldName}: "${decoded}"`);
          console.log(`   ℹ️  Conversión manual desde WIN1252 (node-firebird puede no estar respetando el charset)`);
        }
      } catch (e) {
        // Fallback: intentar como latin1 (similar a WIN1252)
        try {
          decoded = value.toString('latin1');
          if (isTextField) {
            console.log(`   📝 [WIN1252→latin1] ${fieldName}: "${decoded}"`);
          }
        } catch (e2) {
          const fallback = value.toString('utf8');
          console.warn(`   ⚠️  Error al convertir WIN1252 en ${fieldName}, usando UTF-8: ${e}`);
          if (isTextField) {
            console.log(`      Fallback UTF-8: "${fallback}"`);
          }
          decoded = fallback;
        }
      }
    } else if (charset === 'ISO8859_1') {
      // Usar iconv-lite para conversión precisa de ISO8859_1 a UTF-8
      try {
        const beforeConversion = value.toString('latin1'); // ISO8859_1 es similar a latin1
        decoded = iconv.decode(value, 'iso8859-1');
        if (isTextField) {
          console.log(`   🔄 [ISO8859_1→UTF8] ${fieldName}:`);
          console.log(`      Antes (raw): "${beforeConversion}"`);
          console.log(`      Después (UTF-8): "${decoded}"`);
        }
      } catch (e) {
        // Fallback a UTF-8 si falla la conversión
        const fallback = value.toString('utf8');
        console.warn(`   ⚠️  Error al convertir ISO8859_1 en ${fieldName}, usando UTF-8: ${e}`);
        if (isTextField) {
          console.log(`      Fallback UTF-8: "${fallback}"`);
        }
        decoded = fallback;
      }
    } else if (charset === 'UTF8') {
      // Con UTF8, los datos ya deberían estar en UTF-8
      decoded = value.toString('utf8');
    } else {
      // Para otros charsets, intentar UTF-8 como fallback
      decoded = value.toString('utf8');
    }
    
    // Si tiene '?' entre letras, intentar recodificar desde latin1
    if (decoded.includes('?') && /[A-Za-z]\?[A-Za-z]/.test(decoded)) {
      if (isTextField) {
        console.log(`   ⚠️  Detectado '?' en contexto de letras, intentando recodificar...`);
      }
      
      try {
        // Intentar recodificar: puede que el buffer esté en latin1/win1252
        const latin1Decoded = value.toString('latin1');
        const utf8FromLatin1 = Buffer.from(latin1Decoded, 'latin1').toString('utf8');
        
        // Si la recodificación eliminó los '?', usarla
        if (!utf8FromLatin1.includes('?') || !/[A-Za-z]\?[A-Za-z]/.test(utf8FromLatin1)) {
          decoded = utf8FromLatin1;
          if (isTextField) {
            console.log(`   ✅ Recodificación exitosa: ${utf8FromLatin1}`);
          }
        }
      } catch (e) {
        // Continuar con la decodificación original
      }
    }
    
    // Aplicar correcciones de caracteres españoles
    const corrected = fixSpanishCharacters(decoded);
    
    if (isTextField && decoded !== corrected) {
      console.log(`   ✅ [Corrección] ${fieldName}: "${decoded}" -> "${corrected}"`);
    } else if (isTextField && charset === 'WIN1252') {
      // Mostrar que la conversión fue exitosa sin necesidad de corrección adicional
      console.log(`   ✅ [WIN1252] Conversión exitosa sin correcciones adicionales`);
    }
    
    return corrected;
  }
  
  // Si ya es un string, puede que node-firebird ya lo haya convertido
  // PROBLEMA: Si node-firebird convierte incorrectamente desde WIN1252, genera mojibake como '´┐¢'
  // SOLUCIÓN: SIEMPRE aplicar fixSpanishCharacters a campos de texto para corregir mojibake
  if (typeof value === 'string') {
    const charset = firebirdConfig.charset || 'NONE';
    
    // Si es un campo de texto, SIEMPRE aplicar correcciones
    if (isTextField) {
      // Verificar si tiene mojibake común (´┐¢, U+FFFD, '?' entre letras)
      const hasMojibake = value.includes('´') || value.includes('┐') || value.includes('¢') || 
                         value.includes('´┐¢') || hasMojibakeSequences(value);
      const hasReplacementChar = value.includes(String.fromCharCode(0xFFFD));
      const hasQuestionMark = value.includes('?') && /[A-Za-z]\?[A-Za-z]/.test(value);
      
      // REEMPLAZO DIRECTO: Reemplazar '´┐¢' por 'Ñ' ANTES de llamar a fixSpanishCharacters
      let corrected = value;
      
      // Reemplazo directo y simple del mojibake
      if (corrected.includes('´┐¢')) {
        corrected = corrected.replace(/´┐¢/g, 'Ñ');
        console.log(`🔧 [REEMPLAZO DIRECTO] ${fieldName}: "${value}" -> "${corrected}"`);
      }
      
      // También buscar por códigos de caracteres
      const chars = Array.from(corrected);
      for (let i = 0; i < chars.length - 2; i++) {
        const c1 = chars[i].charCodeAt(0);
        const c2 = chars[i + 1].charCodeAt(0);
        const c3 = chars[i + 2].charCodeAt(0);
        if ((c1 === 180 || c1 === 0xB4) && (c2 === 9488 || c2 === 0x2510) && (c3 === 162 || c3 === 0xA2)) {
          const before = i > 0 ? chars[i - 1] : '';
          const after = i + 3 < chars.length ? chars[i + 3] : '';
          const isUpper = (before && /[A-Z]/.test(before)) || (after && /[A-Z]/.test(after));
          corrected = corrected.substring(0, i) + (isUpper ? 'Ñ' : 'ñ') + corrected.substring(i + 3);
          console.log(`🔧 [REEMPLAZO POR CÓDIGOS] ${fieldName}: "${value}" -> "${corrected}"`);
          break;
        }
      }
      
      // Aplicar fixSpanishCharacters para otros casos
      corrected = fixSpanishCharacters(corrected);
      
      return corrected;
    }
    
    // Para campos que no son de texto, solo aplicar si hay mojibake obvio
    const hasMojibake = hasMojibakeSequences(value) || value.includes('┐') ||
            (value.includes('?') && /[A-Za-z]\?[A-Za-z]/.test(value));
    
    if (hasMojibake) {
      const corrected = fixSpanishCharacters(value);
      return corrected;
    }
    
    // Si no tiene mojibake obvio, retornar tal cual
    return value;
  }
  
  // Para otros tipos, convertir a string
  return String(value);
}

/**
 * Convierte recursivamente un objeto de Firebird asegurando la correcta decodificación
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
        // Pasar el nombre del campo para logging
        decoded[key] = decodeFirebirdObject(value, key);
      }
    }
    return decoded;
  }
  
  // Si es un string o Buffer, decodificarlo
  if (typeof obj === 'string' || Buffer.isBuffer(obj)) {
    let decoded = decodeFirebirdString(obj, parentKey);
    
    // REEMPLAZO FINAL: Asegurar que '´┐¢' se reemplace por 'Ñ' antes de retornar
    if (typeof decoded === 'string' && decoded.includes('´┐¢')) {
      decoded = decoded.replace(/´┐¢/g, 'Ñ');
    }
    
    return decoded;
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
      const db = getFirebirdDb();
      if (!db || typeof db.query !== 'function') {
        throw new Error('Conexión a Firebird no disponible');
      }
      // Ejecutar la consulta y retornar su resultado
      return await queryFn(db);
    } catch (error) {
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
            
            const mappedRecords = records.map((row: any, index: number) => {
              if (!row || typeof row !== 'object') {
                console.warn('Datos de fila inválidos recibidos de Firebird:', row);
                return null;
              }
              // Decodificar el objeto completo para asegurar caracteres especiales (Ñ, acentos, etc.)
              const decoded = decodeFirebirdObject(row);
              
              // Log del primer registro después de decodificar
              if (index === 0) {
                console.log('✅ [DEBUG] Primer registro DESPUÉS de decodificar:');
                sampleFields.forEach((field: string) => {
                  if (decoded[field] !== undefined) {
                    console.log(`   ${field}: ${decoded[field]}`);
                  }
                });
              }
              
              return decoded;
            }).filter(Boolean);
            
            // REEMPLAZO FINAL: Buscar y reemplazar cualquier variante del mojibake '´┐¢' o '' en contexto de Ñ
            const finalRecords = mappedRecords.map((record: any, recordIndex: number) => {
              const cleaned: any = {};
              for (const key in record) {
                if (typeof record[key] === 'string') {
                  let value = record[key];
                  
                  // Log para diagnóstico: mostrar caracteres problemáticos
                  if (value.includes(String.fromCharCode(0xFFFD)) || value.includes('?') || value.includes('´┐¢')) {
                    const charCodes = Array.from(value).map(c => {
                      const code = c.charCodeAt(0);
                      return `${c} (U+${code.toString(16).toUpperCase().padStart(4, '0')})`;
                    }).join(' ');
                    console.log(`🔍 [REEMPLAZO FINAL] ${key} en registro ${recordIndex}: "${value}"`);
                    console.log(`   Códigos: ${charCodes}`);
                  }
                  
                  // Reemplazar '´┐¢' directamente
                  value = value.replace(/´┐¢/g, 'Ñ');
                  
                  // Reemplazar '' (U+FFFD) o '?' cuando está en contexto de Ñ (entre letras)
                  // Patrones específicos conocidos
                  value = value.replace(/NU[\uFFFD?]EZ/gi, 'NUÑEZ');
                  value = value.replace(/MU[\uFFFD?]OZ/gi, 'MUÑOZ');
                  value = value.replace(/MU[\uFFFD?]IZ/gi, 'MUÑIZ');
                  value = value.replace(/TISCARE[\uFFFD?]O/gi, 'TISCAREÑO');
                  value = value.replace(/PI[\uFFFD?]A/gi, 'PIÑA');
                  value = value.replace(/PE[\uFFFD?]ALOZA/gi, 'PEÑALOZA');
                  value = value.replace(/CASTA[\uFFFD?]EDA/gi, 'CASTAÑEDA');
                  
                  // Patrón genérico: XU?Y -> XUÑY, XI?Y -> XIÑY, XA?Y -> XAÑY (donde ? es U+FFFD o '?')
                  value = value.replace(/([A-Z])U[\uFFFD?]([A-Z])/g, '$1UÑ$2');
                  value = value.replace(/([A-Z])I[\uFFFD?]([A-Z])/g, '$1IÑ$2');
                  value = value.replace(/([A-Z])A[\uFFFD?]([A-Z])/g, '$1AÑ$2');
                  
                  value = fixSpanishCharacters(value);
                  // También buscar por códigos de caracteres directamente
                  const chars = Array.from(value);
                  for (let i = 0; i < chars.length - 1; i++) {
                    const char = chars[i];
                    const charCode = char.charCodeAt(0);
                    // Si encontramos U+FFFD (65533) entre letras, reemplazar por Ñ
                    if (charCode === 0xFFFD || charCode === 65533) {
                      const before = i > 0 ? chars[i - 1] : '';
                      const after = i + 1 < chars.length ? chars[i + 1] : '';
                      if (/[A-Za-z]/.test(before) && /[A-Za-z]/.test(after)) {
                        const isUpper = /[A-Z]/.test(before) && /[A-Z]/.test(after);
                        chars[i] = isUpper ? 'Ñ' : 'ñ';
                        value = chars.join('');
                        break;
                      }
                    }
                  }
                  
                  cleaned[key] = value;
                } else {
                  cleaned[key] = record[key];
                }
              }
              return cleaned;
            });
            
            resolve(finalRecords);
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
        
        // Procesar resultado para corregir caracteres especiales
        const processedResult = result?.map((row: any) => {
          const processedRow: any = {};
          for (const [key, value] of Object.entries(row)) {
            if (typeof value === 'string') {
              processedRow[key] = fixSpanishCharacters(value);
            } else {
              processedRow[key] = value;
            }
          }
          return processedRow;
        }) || [];
        
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
        
        // Procesar resultado para corregir caracteres especiales
        const processedResult = resultArray.map((row: any) => {
          const processedRow: any = {};
          for (const [key, value] of Object.entries(row)) {
            if (typeof value === 'string') {
              processedRow[key] = fixSpanishCharacters(value);
            } else {
              processedRow[key] = value;
            }
          }
          return processedRow;
        });
        
        resolve(processedResult);
      });
    } catch (error: any) {
      console.error('[FIREBIRD_TRANSACTION] Error inesperado:', error);
      reject(error);
    }
  });
};
