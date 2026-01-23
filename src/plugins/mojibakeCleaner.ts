import fp from 'fastify-plugin';
import { FastifyPluginCallback } from 'fastify';
import { normalizeText } from '../utils/encoding.js';

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
      return normalizeText(payload);
    }

    if (Buffer.isBuffer(payload)) {
      const s = payload.toString('utf8');
      const cleaned = normalizeText(s);
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

