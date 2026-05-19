import { ICodigoPostalRepository } from '../../domain/repositories/ICodigoPostalRepository.js';
import { CodigoPostal } from '../../domain/entities/CodigoPostal.js';
import {
  CodigoPostalByCodeNotFoundError,
  InvalidCodigoPostalDataError,
  InvalidCodigoPostalFormatError,
  CodigoPostalQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getCodigoPostalByCodeQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetCodigoPostalByCodeQuery {
  constructor(private codigoPostalRepo: ICodigoPostalRepository) {}

  async execute(codigoPostal: string): Promise<CodigoPostal> {
    // Validaciones de entrada
    this.validateInput(codigoPostal);

    const logContext = {
      operation: 'getCodigoPostalByCode',
      codigoPostal: codigoPostal
    };

    logger.info(logContext, 'Consultando código postal por código');

    try {
      const result = await this.codigoPostalRepo.findByCode(codigoPostal);

      if (!result) {
        logger.warn({ ...logContext }, 'Código postal no encontrado por código');
        throw new CodigoPostalByCodeNotFoundError(codigoPostal);
      }

      logger.info({
        ...logContext,
        codigoPostalId: result.codigoPostalId,
        esValido: result.esValido
      }, 'Consulta de código postal por código completada exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof CodigoPostalByCodeNotFoundError ||
          error instanceof InvalidCodigoPostalDataError ||
          error instanceof InvalidCodigoPostalFormatError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar código postal por código');

      throw new CodigoPostalQueryError('consulta por código', {
        originalError: error.message,
        codigoPostal: codigoPostal
      });
    }
  }

  private validateInput(codigoPostal: string): void {
    // Validar codigoPostal
    if (!codigoPostal || typeof codigoPostal !== 'string') {
      throw new InvalidCodigoPostalDataError('codigoPostal', 'Es requerido y debe ser una cadena');
    }

    // Validar formato del código postal (exactamente 5 dígitos)
    if (!/^\d{5}$/.test(codigoPostal)) {
      throw new InvalidCodigoPostalFormatError(codigoPostal);
    }
  }
}
