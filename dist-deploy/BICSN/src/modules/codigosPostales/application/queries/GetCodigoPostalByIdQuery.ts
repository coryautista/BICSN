import { ICodigoPostalRepository } from '../../domain/repositories/ICodigoPostalRepository.js';
import { CodigoPostal } from '../../domain/entities/CodigoPostal.js';
import {
  CodigoPostalNotFoundError,
  InvalidCodigoPostalDataError,
  CodigoPostalQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getCodigoPostalByIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetCodigoPostalByIdQuery {
  constructor(private codigoPostalRepo: ICodigoPostalRepository) {}

  async execute(codigoPostalId: number): Promise<CodigoPostal> {
    // Validaciones de entrada
    this.validateInput(codigoPostalId);

    const logContext = {
      operation: 'getCodigoPostalById',
      codigoPostalId: codigoPostalId
    };

    logger.info(logContext, 'Consultando código postal por ID');

    try {
      const result = await this.codigoPostalRepo.findById(codigoPostalId);

      if (!result) {
        logger.warn({ ...logContext }, 'Código postal no encontrado por ID');
        throw new CodigoPostalNotFoundError(codigoPostalId);
      }

      logger.info({
        ...logContext,
        codigoPostal: result.codigoPostal,
        esValido: result.esValido
      }, 'Consulta de código postal por ID completada exitosamente');

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
      }, 'Error al consultar código postal por ID');

      throw new CodigoPostalQueryError('consulta por ID', {
        originalError: error.message,
        codigoPostalId: codigoPostalId
      });
    }
  }

  private validateInput(codigoPostalId: number): void {
    // Validar codigoPostalId
    if (!codigoPostalId || typeof codigoPostalId !== 'number' || codigoPostalId <= 0) {
      throw new InvalidCodigoPostalDataError('codigoPostalId', 'Es requerido y debe ser un número positivo');
    }
  }
}
