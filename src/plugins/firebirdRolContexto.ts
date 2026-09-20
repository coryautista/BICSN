import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { verifyAccess } from '../modules/auth/infrastructure/security/AuthTokenService.js';
import { resolveRolContextoUsuario, runWithFirebirdRolContexto } from '../db/firebirdRolContexto.js';

function extractToken(req: FastifyRequest): string | null {
  const cookieToken = req.cookies?.access_token as string | undefined;
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.substring(7) : null;
}

function resolverRolContexto(req: FastifyRequest): ReturnType<typeof resolveRolContextoUsuario> {
  try {
    const token = extractToken(req);
    if (!token) return 'OPERATIVO';
    const payload = verifyAccess(token) as { entidades?: boolean[] } | null;
    if (!payload) return 'OPERATIVO';
    return resolveRolContextoUsuario(payload);
  } catch {
    return 'OPERATIVO';
  }
}

/**
 * Fija el contexto de rol Firebird (ENTIDAD/OPERATIVO) para toda la peticion,
 * derivado del tipo de usuario del token. El hook onRoute (sin encapsulacion,
 * via fastify-plugin) envuelve el handler de cada ruta para que toda la
 * ejecucion de negocio corra dentro del almacen asincrono; las llamadas
 * Firebird resuelven el rol automaticamente desde ese contexto. Token invalido
 * o ausente queda OPERATIVO y requireAuth rechazara la peticion.
 */
export default fp(async function firebirdRolContextoPlugin(app: FastifyInstance) {
  app.addHook('onRoute', (routeOptions: any) => {
    const handler = routeOptions.handler;
    if (typeof handler !== 'function') return;
    routeOptions.handler = async (req: FastifyRequest, reply: FastifyReply) => {
      return runWithFirebirdRolContexto(resolverRolContexto(req), () => handler(req, reply));
    };
  });
}, { name: 'firebird-rol-contexto' });
