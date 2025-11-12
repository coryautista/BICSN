import { ICodigoPostalRepository } from '../../domain/repositories/ICodigoPostalRepository.js';
import { CodigoPostal, UpdateCodigoPostalData } from '../../domain/entities/CodigoPostal.js';
import {
  CodigoPostalNotFoundError,
  InvalidCodigoPostalDataError,
  CodigoPostalUpdateError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'updateCodigoPostalCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class UpdateCodigoPostalCommand {
  constructor(private codigoPostalRepo: ICodigoPostalRepository) {}

  async execute(data: UpdateCodigoPostalData): Promise<CodigoPostal> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'updateCodigoPostal',
      codigoPostalId: data.codigoPostalId,
      userId: data.userId
    };

    logger.info(logContext, 'Actualizando código postal');

    try {
      // Verificar existencia
      const existing = await this.codigoPostalRepo.findById(data.codigoPostalId);
      if (!existing) {
        logger.warn({ ...logContext }, 'Código postal no encontrado para actualización');
        throw new CodigoPostalNotFoundError(data.codigoPostalId);
      }

      const result = await this.codigoPostalRepo.update(data.codigoPostalId, data.esValido, data.userId);

      if (!result) {
        logger.warn({ ...logContext }, 'Código postal no encontrado después de actualización');
        throw new CodigoPostalNotFoundError(data.codigoPostalId);
      }

      logger.info({
        ...logContext,
        codigoPostal: result.codigoPostal,
        esValido: result.esValido
      }, 'Código postal actualizado exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof CodigoPostalNotFoundError ||
          error instanceof InvalidCodigoPostalDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al actualizar código postal');

      throw new CodigoPostalUpdateError(data.codigoPostalId, {
        originalError: error.message,
        data: data
      });
    }
  }

  private validateInput(data: UpdateCodigoPostalData): void {
    // Validar codigoPostalId
    if (!data.codigoPostalId || typeof data.codigoPostalId !== 'number' || data.codigoPostalId <= 0) {
      throw new InvalidCodigoPostalDataError('codigoPostalId', 'Debe ser un número positivo');
    }

    // Validar esValido si está presente
    if (data.esValido !== undefined && typeof data.esValido !== 'boolean') {
      throw new InvalidCodigoPostalDataError('esValido', 'Debe ser un valor booleano');
    }
  }
}
