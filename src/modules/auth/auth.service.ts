import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.js';
import { getPool } from '../../db/mssql.js';
import { AuthRepository } from './infrastructure/persistence/AuthRepository.js';
import { DenylistJwtCommand } from './application/commands/DenylistJwtCommand.js';
import { IsJtiDenylistedQuery } from './application/queries/IsJtiDenylistedQuery.js';
import { InvalidTokenError, AuthSystemError } from './domain/errors.js';

type AccessClaims = {
  sub: string;
  roles: string[];
  entidades: boolean[];
  jti: string;
  iss: string;
  aud: string;
};

// Logger básico para utilidades
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '')
};

// Utility functions that don't depend on DI container

// Sign access token - utility function
export function signAccessToken(userId: string, roles: string[], entidades: boolean[]) {
  try {
    logger.debug('Generando token de acceso', { userId, rolesCount: roles.length });

    const jti = uuidv4();
    const payload: AccessClaims = { sub: userId, roles, entidades, jti, iss: env.jwt.iss, aud: env.jwt.aud };
    const token = (jwt.sign as any)(payload, env.jwt.accessSecret, {
      expiresIn: env.jwt.accessTtl
    });
    const decoded = jwt.decode(token) as AccessClaims & { iat: number, exp: number };
    const { exp } = decoded;

    logger.debug('Token de acceso generado exitosamente', { userId, jti, exp });

    return { token, jti, exp };
  } catch (error) {
    logger.error('Error al generar token de acceso', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      userId,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new AuthSystemError('Error al generar token de acceso');
  }
}

// Denylist JWT - utility function using DI manually
export async function denylistAccessToken(jti: string, userId: string | null, exp: number) {
  try {
    logger.info('Invalidando token de acceso', { jti, userId });

    const expiresAt = new Date(exp * 1000);
    const pool = await getPool();
    const authRepo = new AuthRepository(pool);
    const denylistCommand = new DenylistJwtCommand(authRepo);

    await denylistCommand.execute({
      jti,
      userId,
      expiresAt,
      reason: 'logout'
    });

    logger.info('Token de acceso invalidado exitosamente', { jti, userId });

  } catch (error) {
    logger.error('Error al invalidar token de acceso', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      jti,
      userId,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new AuthSystemError('Error al invalidar token de acceso');
  }
}

// Check if JWT is denylisted - utility function using DI manually
export async function isAccessDenylisted(jti: string) {
  try {
    logger.debug('Verificando si token está en lista negra', { jti });

    const pool = await getPool();
    const authRepo = new AuthRepository(pool);
    const isJtiDenylistedQuery = new IsJtiDenylistedQuery(authRepo);

    const isDenylisted = await isJtiDenylistedQuery.execute(jti);

    logger.debug('Verificación de token completada', { jti, isDenylisted });

    return isDenylisted;

  } catch (error) {
    logger.error('Error al verificar token en lista negra', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      jti,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new AuthSystemError('Error al verificar estado del token');
  }
}

// Verify access token - keeping as utility
export function verifyAccess(token: string) {
  try {
    logger.debug('Verificando token de acceso');

    if (!token || token.trim().length === 0) {
      throw new InvalidTokenError('access_token', { reason: 'token_missing' });
    }

    const decoded = jwt.verify(token, env.jwt.accessSecret, { issuer: env.jwt.iss, audience: env.jwt.aud }) as AccessClaims & { iat: number, exp: number };

    logger.debug('Token de acceso verificado exitosamente', { sub: decoded.sub, jti: decoded.jti });

    return decoded;

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token de acceso expirado', { expiredAt: error.expiredAt });
      throw new InvalidTokenError('access_token', { reason: 'expired', expiredAt: error.expiredAt });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Token de acceso inválido', { message: error.message });
      throw new InvalidTokenError('access_token', { reason: 'malformed', details: error.message });
    } else if (error instanceof InvalidTokenError) {
      throw error;
    } else {
      logger.error('Error desconocido al verificar token', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new AuthSystemError('Error al verificar token de acceso');
    }
  }
}
// Auth service