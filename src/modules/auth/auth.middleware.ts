import { FastifyReply, FastifyRequest } from 'fastify';
import { isAccessDenylisted, verifyAccess } from './auth.service.js';
import { findUserById } from './auth.repo.js';

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  let token = (req.cookies?.access_token as string | undefined);
  if (!token) {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      token = header.substring(7);
    }
  }
  if (!token) return reply.code(401).send({ ok:false, error:{code:'UNAUTHORIZED', message:'Missing token'}});
  try {
    const payload = verifyAccess(token) as any;
    if (await isAccessDenylisted(payload.jti)) {
      return reply.code(401).send({ ok:false, error:{code:'UNAUTHORIZED', message:'Token revoked'}});
    }

    // Obtener información adicional del usuario desde la base de datos
    const userInfo = await findUserById(payload.sub);
    
    // Usar valores del token si están disponibles, sino usar los de la BD
    req.user = {
      sub: payload.sub,
      roles: payload.roles,
      entidades: payload.entidades,
      idOrganica0: payload.idOrganica0 ?? userInfo?.idOrganica0,
      idOrganica1: payload.idOrganica1 ?? userInfo?.idOrganica1,
      idOrganica2: payload.idOrganica2 ?? userInfo?.idOrganica2,
      idOrganica3: payload.idOrganica3 ?? userInfo?.idOrganica3,
      jti: payload.jti,
      iat: payload.iat,
      exp: payload.exp
    };
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