import { IAuthRepository } from '../../domain/repositories/IAuthRepository.js';
import { LogoutFailedError } from '../../domain/errors.js';

// Logger básico para comandos
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '')
};

export interface LogoutAllInput {
  userId: string;
}

export class LogoutAllCommand {
  constructor(private authRepo: IAuthRepository) {}

  async execute(input: LogoutAllInput): Promise<void> {
    try {
      logger.info('Iniciando proceso de logout completo', {
        userId: input.userId
      });

      // Validar entrada básica
      if (!input.userId || input.userId.trim().length === 0) {
        throw new Error('ID de usuario es requerido para logout completo');
      }

      // Ejecutar logout completo
      logger.debug('Revocando todos los tokens de refresh del usuario');
      await this.authRepo.revokeAllRefreshTokensForUser(input.userId);

      logger.info('Logout completo exitoso', {
        userId: input.userId
      });

    } catch (error) {
      logger.error('Error durante el logout completo', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        userId: input.userId,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new LogoutFailedError('Error al cerrar todas las sesiones');
    }
  }
}
