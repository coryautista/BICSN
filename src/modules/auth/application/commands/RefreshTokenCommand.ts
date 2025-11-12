import { IAuthRepository } from '../../domain/repositories/IAuthRepository.js';
import { sha256 } from '../../infrastructure/security/crypto.js';
import { generateRefreshToken } from '../../infrastructure/security/jwt.js';
import {
  InvalidTokenError,
  TokenRefreshFailedError,
  RevokedTokenError
} from '../../domain/errors.js';

// Logger básico para comandos
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '')
};

export interface RefreshTokenInput {
  currentRefreshToken: string;
  ip?: string;
  userAgent?: string;
}

export interface RefreshTokenOutput {
  newRefreshToken: string;
}

export class RefreshTokenCommand {
  constructor(private authRepo: IAuthRepository) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    try {
      logger.info('Iniciando proceso de refresco de token', {
        hasIp: !!input.ip,
        hasUserAgent: !!input.userAgent
      });

      // Validar entrada básica
      if (!input.currentRefreshToken || input.currentRefreshToken.trim().length === 0) {
        throw new InvalidTokenError('refresh_token', { reason: 'token_missing' });
      }

      // 1. Hash current token
      logger.debug('Generando hash del token actual');
      const currentHash = sha256(input.currentRefreshToken);

      // 2. Generate new token
      logger.debug('Generando nuevo token de refresh');
      const { token: newToken, hash: newHash, ttlMinutes } = generateRefreshToken();

      // 3. Rotate token in database
      logger.debug('Rotando token en base de datos');
      try {
        await this.authRepo.rotateRefreshToken(
          currentHash,
          newHash,
          ttlMinutes,
          input.ip,
          input.userAgent
        );
      } catch (error) {
        logger.warn('Token de refresh inválido o expirado', {
          error: error instanceof Error ? error.message : 'Error desconocido',
          ip: input.ip,
          userAgent: input.userAgent
        });
        throw new RevokedTokenError('refresh_token', undefined, { reason: 'token_not_found_or_expired' });
      }

      logger.info('Token de refresh renovado exitosamente', {
        ip: input.ip,
        userAgent: input.userAgent
      });

      return {
        newRefreshToken: newToken
      };

    } catch (error) {
      if (error instanceof InvalidTokenError || error instanceof RevokedTokenError) {
        throw error;
      }

      logger.error('Error durante el refresco de token', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        ip: input.ip,
        userAgent: input.userAgent,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new TokenRefreshFailedError('Error interno durante el refresco de token');
    }
  }
}
