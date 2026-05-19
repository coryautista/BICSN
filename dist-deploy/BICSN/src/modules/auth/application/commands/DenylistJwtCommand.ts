import { IAuthRepository } from '../../domain/repositories/IAuthRepository.js';
import { LogoutFailedError } from '../../domain/errors.js';

// Logger básico para comandos
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '')
};

export interface DenylistJwtInput {
  jti: string;
  userId: string | null;
  expiresAt: Date;
  reason?: string;
}

export class DenylistJwtCommand {
  constructor(private authRepo: IAuthRepository) {}

  async execute(input: DenylistJwtInput): Promise<void> {
    try {
      logger.info('Iniciando proceso de denylist de JWT', {
        jti: input.jti,
        userId: input.userId,
        reason: input.reason,
        expiresAt: input.expiresAt.toISOString()
      });

      // Validar entrada básica
      if (!input.jti || input.jti.trim().length === 0) {
        throw new Error('JTI es requerido para denylist');
      }

      if (!input.expiresAt || input.expiresAt <= new Date()) {
        logger.warn('Intento de denylist con fecha de expiración inválida', {
          jti: input.jti,
          expiresAt: input.expiresAt?.toISOString()
        });
        throw new Error('Fecha de expiración inválida');
      }

      // Ejecutar denylist
      logger.debug('Agregando JWT a lista negra');
      await this.authRepo.denylistJwt(
        input.jti,
        input.userId,
        input.expiresAt,
        input.reason
      );

      logger.info('JWT agregado a lista negra exitosamente', {
        jti: input.jti,
        userId: input.userId,
        reason: input.reason
      });

    } catch (error) {
      logger.error('Error durante el denylist de JWT', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        jti: input.jti,
        userId: input.userId,
        reason: input.reason,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new LogoutFailedError('Error al invalidar el token de acceso');
    }
  }
}
