import fp from 'fastify-plugin';
import { FastifyPluginCallback } from 'fastify';

/**
 * Limpia mojibake '´┐¢' y caracteres de reemplazo (U+FFFD) de todos los strings en un objeto
 * Reemplaza cualquier carácter problemático entre letras por Ñ/ñ según el contexto
 */
function cleanMojibake(data: any): any {
  // Manejo de null y undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Si es un array, retornar tal cual SIN procesar recursivamente
  if (Array.isArray(data)) {
    return data;
  }

  // Si es un string, aplicar limpieza de mojibake
  if (typeof data === 'string') {
    let value = data;

    // 1. Reemplazo directo de '´┐¢' por 'Ñ'
    value = value.replace(/´┐¢/g, 'Ñ');

    // 2. Reemplazo genérico para caracteres problemáticos (U+FFFD o '?') entre letras
    value = value.replace(/([A-Za-z])([\uFFFD?])([A-Za-z])/g, (match, before, problem, after) => {
      const isUpper = /[A-Z]/.test(before) && /[A-Z]/.test(after);
      return before + (isUpper ? 'Ñ' : 'ñ') + after;
    });

    return value;
  }

  // Si es un objeto, retornar tal cual SIN procesar recursivamente
  // Solo limpiar strings individuales cuando se accedan directamente
  if (data && typeof data === 'object' && !(data instanceof Date) && !Buffer.isBuffer(data)) {
    return data;
  }

  // Para números, booleanos, fechas, etc., retornar tal cual
  return data;
}

/**
 * Plugin de Fastify que limpia automáticamente el mojibake de todas las respuestas
 * Se ejecuta antes de enviar cualquier respuesta JSON
 */
const mojibakeCleanerPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.addHook('onSend', async (request, reply, payload) => {
    // Ignorar peticiones OPTIONS (preflight) - Fastify CORS las maneja automáticamente
    if (request.method === 'OPTIONS') {
      return payload;
    }

    // TEMPORAL: DESHABILITAR COMPLETAMENTE EL PLUGIN PARA DIAGNÓSTICO
    // El plugin mojibakeCleaner está interfiriendo con la serialización JSON
    // Retornar payload original sin procesamiento

    // Log más detallado para diagnóstico
    if (request.url?.includes('/pcp')) {
      // Mostrar payload como string para ver exactamente qué se envía
      let payloadStr: string;
      if (typeof payload === 'string') {
        payloadStr = payload;
      } else if (Buffer.isBuffer(payload)) {
        payloadStr = payload.toString('utf8');
      } else {
        payloadStr = JSON.stringify(payload);
      }

      // Buscar apellidos con caracteres especiales
      const apellidoMatch = payloadStr.match(/"APELLIDO_PATERNO":"[^"]*[^\x00-\x7F][^"]*"/g);
      if (apellidoMatch) {
        console.log('[MOJIBAKECLEANER] Apellidos en payload:', apellidoMatch.slice(0, 5));
        // Mostrar char codes del primer apellido problemático
        const firstMatch = apellidoMatch[0];
        const codes = [...firstMatch].map(c => c.charCodeAt(0) > 127 ? `[0x${c.charCodeAt(0).toString(16)}]` : c).join('');
        console.log('[MOJIBAKECLEANER] Char codes:', codes);
      }
    }

    return payload;
  });

  done();
};

export default fp(mojibakeCleanerPlugin, {
  name: 'mojibake-cleaner',
  fastify: '5.x'
});

