import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Plugin para habilitar versionado de rutas por header Accept-Version
 * Ejemplo de uso:
 * 
 * // En el handler de ruta
 * app.route({
 *   method: 'GET',
 *   url: '/api/users',
 *   constraints: { version: '1.0.0' },
 *   handler: async (request, reply) => {
 *     return { version: '1.0.0', users: [...] }
 *   }
 * })
 * 
 * Cliente puede enviar header: Accept-Version: 1.0.0
 * Si no se envía el header, usa la versión sin constraint (backward compatibility)
 */
const versioningPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  // Agregar hook para loggear la versión solicitada
  fastify.addHook('onRequest', async (request) => {
    const version = request.headers['accept-version'];
    if (version) {
      request.log.debug({ version }, 'API version requested');
    }
  });

  // Agregar decorador para obtener la versión fácilmente
  fastify.decorateRequest('apiVersion', null);
  
  fastify.addHook('onRequest', async (request) => {
    (request as any).apiVersion = request.headers['accept-version'] || 'default';
  });

  done();
};

export default fp(versioningPlugin, {
  name: 'versioning-plugin',
  fastify: '5.x'
});
