import { ICodigoPostalRepository } from '../../domain/repositories/ICodigoPostalRepository.js';
import { DeleteCodigoPostalData } from '../../domain/entities/CodigoPostal.js';
import {
  CodigoPostalNotFoundError,
  InvalidCodigoPostalDataError,
  CodigoPostalInUseError,
  CodigoPostalDeletionError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteCodigoPostalCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class DeleteCodigoPostalCommand {
  constructor(private codigoPostalRepo: ICodigoPostalRepository) {}

  async execute(data: DeleteCodigoPostalData): Promise<number> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'deleteCodigoPostal',
      codigoPostalId: data.codigoPostalId
    };

    logger.info(logContext, 'Eliminando código postal');

    try {
      // Verificar existencia antes de eliminar
      const existing = await this.codigoPostalRepo.findById(data.codigoPostalId);
      if (!existing) {
        logger.warn({ ...logContext }, 'Código postal no encontrado para eliminación');
        throw new CodigoPostalNotFoundError(data.codigoPostalId);
      }

      // Verificar si está siendo utilizado (esto dependería de las reglas de negocio)
      // Por ahora, asumimos que se puede eliminar si existe

      const deletedId = await this.codigoPostalRepo.delete(data.codigoPostalId);

      if (!deletedId) {
        logger.warn({ ...logContext }, 'Código postal no encontrado durante eliminación');
        throw new CodigoPostalNotFoundError(data.codigoPostalId);
      }

      logger.info({
        ...logContext,
        codigoPostal: existing.codigoPostal
      }, 'Código postal eliminado exitosamente');

      return deletedId;

    } catch (error: any) {
      if (error instanceof CodigoPostalNotFoundError ||
          error instanceof InvalidCodigoPostalDataError ||
          error instanceof CodigoPostalInUseError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al eliminar código postal');

      throw new CodigoPostalDeletionError(data.codigoPostalId, {
        originalError: error.message,
        data: data
      });
    }
  }

  private validateInput(data: DeleteCodigoPostalData): void {
    // Validar codigoPostalId
    if (!data.codigoPostalId || typeof data.codigoPostalId !== 'number' || data.codigoPostalId <= 0) {
      throw new InvalidCodigoPostalDataError('codigoPostalId', 'Debe ser un número positivo');
    }
  }
}
