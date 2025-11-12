import { ICodigoPostalRepository } from '../../domain/repositories/ICodigoPostalRepository.js';
import { CodigoPostal } from '../../domain/entities/CodigoPostal.js';
import {
  CodigoPostalQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getAllCodigosPostalesQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAllCodigosPostalesQuery {
  constructor(private codigoPostalRepo: ICodigoPostalRepository) {}

  async execute(): Promise<CodigoPostal[]> {
    const logContext = {
      operation: 'getAllCodigosPostales'
    };

    logger.info(logContext, 'Consultando todos los códigos postales');

    try {
      const results = await this.codigoPostalRepo.findAll();

      logger.info({
        ...logContext,
        resultsCount: results.length,
        results: results.map(r => ({
          codigoPostalId: r.codigoPostalId,
          codigoPostal: r.codigoPostal,
          esValido: r.esValido
        }))
      }, 'Consulta de todos los códigos postales completada exitosamente');

      return results;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar todos los códigos postales');

      throw new CodigoPostalQueryError('consulta de todos los códigos postales', {
        originalError: error.message
      });
    }
  }
}
