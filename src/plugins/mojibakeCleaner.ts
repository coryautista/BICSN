import fp from 'fastify-plugin';
import { FastifyPluginCallback } from 'fastify';

/**
 * Limpia mojibake '´┐¢' y caracteres de reemplazo (U+FFFD) de todos los strings en un objeto
 * Reemplaza cualquier carácter problemático entre letras por Ñ/ñ según el contexto
 */
function cleanMojibakeString(value: string): string {
  // Usar puntos de código para que sea estable aunque el editor/terminal cambie encoding.
  // ´  = U+00B4
  // ┐  = U+2510
  // ¢  = U+00A2
  // ¤  = U+00A4
  let v = value;

  v = v.replace(/\u00B4\u2510\u00A2/g, 'Ñ'); // ´┐¢ -> Ñ (ej: MU´┐¢OZ -> MUÑOZ)
  v = v.replace(/\u00B4\u2510\u00A4/g, 'ñ'); // ´┐¤ -> ñ

  // Reemplazo genérico para caracteres problemáticos (U+FFFD o '?') entre letras
  v = v.replace(/([A-Za-zÁÉÍÓÚÑáéíóúñ])([\uFFFD?])([A-Za-zÁÉÍÓÚÑáéíóúñ])/g, (_m, before, _problem, after) => {
    const isUpper = /[A-ZÁÉÍÓÚÑ]/.test(before) && /[A-ZÁÉÍÓÚÑ]/.test(after);
    return before + (isUpper ? 'Ñ' : 'ñ') + after;
  });

  return v;
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

    const contentType = reply.getHeader('content-type')?.toString() ?? '';
    const isJson = contentType.includes('application/json');
    if (!isJson) return payload;

    if (typeof payload === 'string') {
      return cleanMojibakeString(payload);
    }

    if (Buffer.isBuffer(payload)) {
      const s = payload.toString('utf8');
      const cleaned = cleanMojibakeString(s);
      return Buffer.from(cleaned, 'utf8');
    }

    // Si Fastify nos entrega objeto, no lo tocamos para no interferir con serialización.
    return payload;
  });

  done();
};

export default fp(mojibakeCleanerPlugin, {
  name: 'mojibake-cleaner',
  fastify: '5.x'
});

