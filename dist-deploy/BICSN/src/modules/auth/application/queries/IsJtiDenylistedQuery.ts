import { IAuthRepository } from '../../domain/repositories/IAuthRepository.js';
import { AuthSystemError } from '../../domain/errors.js';

// Logger básico para queries
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '')
};

export class IsJtiDenylistedQuery {
  constructor(private authRepo: IAuthRepository) {}

  async execute(jti: string): Promise<boolean> {
    try {
      logger.debug('Verificando si JTI está en lista negra', { jti });

      // Validar entrada básica
      if (!jti || jti.trim().length === 0) {
        logger.warn('JTI vacío o inválido en verificación de lista negra');
        return false; // Un JTI inválido no está en lista negra
      }

      const isDenylisted = await this.authRepo.isJtiDenylisted(jti);

      logger.debug('Verificación de JTI completada', {
        jti,
        isDenylisted
      });

      return isDenylisted;

    } catch (error) {
      logger.error('Error al verificar JTI en lista negra', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        jti,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new AuthSystemError('Error al verificar el estado del token');
    }
  }
}
