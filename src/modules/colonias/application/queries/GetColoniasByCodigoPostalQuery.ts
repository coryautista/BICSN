import { IColoniaRepository } from '../../domain/repositories/IColoniaRepository.js';
import { Colonia } from '../../domain/entities/Colonia.js';
import {
  InvalidColoniaDataError,
  ColoniaByCodigoPostalNotFoundError,
  ColoniaQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getColoniasByCodigoPostalQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetColoniasByCodigoPostalQuery {
  constructor(private coloniaRepo: IColoniaRepository) {}

  async execute(codigoPostalId: number): Promise<Colonia[]> {
    // Validaciones de entrada
    this.validateInput(codigoPostalId);

    const logContext = {
      operation: 'getColoniasByCodigoPostal',
      codigoPostalId: codigoPostalId
    };

    logger.info(logContext, 'Consultando colonias por código postal');

    try {
      const result = await this.coloniaRepo.findByCodigoPostal(codigoPostalId);

      if (!result || result.length === 0) {
        logger.warn({ ...logContext }, 'No se encontraron colonias para el código postal');
        throw new ColoniaByCodigoPostalNotFoundError(codigoPostalId);
      }

      logger.info({
        ...logContext,
        coloniasCount: result.length,
        coloniasIds: result.map(c => c.coloniaId)
      }, 'Consulta de colonias por código postal completada exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof ColoniaByCodigoPostalNotFoundError ||
          error instanceof InvalidColoniaDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar colonias por código postal');

      throw new ColoniaQueryError('consulta por código postal', {
        originalError: error.message,
        codigoPostalId: codigoPostalId
      });
    }
  }

  private validateInput(codigoPostalId: number): void {
    // Validar codigoPostalId
    if (!codigoPostalId || typeof codigoPostalId !== 'number' || codigoPostalId <= 0) {
      throw new InvalidColoniaDataError('codigoPostalId', 'Es requerido y debe ser un número positivo');
    }
  }
}
