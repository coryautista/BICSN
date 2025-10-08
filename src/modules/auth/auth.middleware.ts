import { FastifyReply, FastifyRequest } from 'fastify';
import { isAccessDenylisted, verifyAccess } from './auth.service.js';

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return reply.code(401).send({ ok:false, error:{code:'UNAUTHORIZED', message:'Missing token'}});
  const token = header.substring(7);
  try {
    const payload = verifyAccess(token);
    if (await isAccessDenylisted(payload.jti)) {
      return reply.code(401).send({ ok:false, error:{code:'UNAUTHORIZED', message:'Token revoked'}});
    }
    req.user = { sub: payload.sub, roles: payload.roles, jti: payload.jti, iat: payload.iat, exp: payload.exp };
  } catch {
    return reply.code(401).send({ ok:false, error:{code:'UNAUTHORIZED', message:'Invalid token'}});
  }
}

export function requireRole(role: string) {
  return async (req: any, reply: FastifyReply) => {
    if (!req.user?.roles?.includes(role)) {
      return reply.code(403).send({ ok:false, error:{code:'FORBIDDEN', message:'Insufficient role'}});
    }
  };
}
// Auth middleware