import { IQuincenaRepository, QuincenaFilters } from '../../domain/repositories/IQuincenaRepository.js';
import { QuincenaInfo } from '../../domain/entities/QuincenaInfo.js';
import {
  InvalidAfectacionDataError,
  AfectacionQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getQuincenaAltaAfectacionQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetQuincenaAltaAfectacionQuery {
  constructor(private quincenaRepo: IQuincenaRepository) {}

  async execute(filters?: QuincenaFilters): Promise<QuincenaInfo> {
    // Validaciones de entrada
    this.validateFilters(filters);

    const logContext = {
      operation: 'getQuincenaAltaAfectacion',
      filters: filters ? {
        entidad: filters.entidad,
        org0: filters.org0,
        org1: filters.org1,
        org2: filters.org2,
        org3: filters.org3
      } : undefined
    };

    logger.info(logContext, 'Consultando quincena de alta de afectación');

    try {
      const result = await this.quincenaRepo.getQuincenaAltaAfectacion(filters);

      logger.info({
        ...logContext,
        quincena: result.quincena,
        anio: result.anio
      }, 'Consulta de quincena completada exitosamente');

      return result;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar quincena de alta de afectación');

      throw new AfectacionQueryError('getQuincenaAltaAfectacion', {
        originalError: error.message,
        filters
      });
    }
  }

  private validateFilters(filters?: QuincenaFilters): void {
    if (!filters) return;

    // Validar que si se especifican códigos organizacionales, sean válidos
    if (filters.org0 && filters.org0.length !== 2) {
      throw new InvalidAfectacionDataError('org0', 'El código org0 debe tener exactamente 2 caracteres');
    }

    if (filters.org1 && filters.org1.length !== 2) {
      throw new InvalidAfectacionDataError('org1', 'El código org1 debe tener exactamente 2 caracteres');
    }

    if (filters.org2 && filters.org2.length !== 2) {
      throw new InvalidAfectacionDataError('org2', 'El código org2 debe tener exactamente 2 caracteres');
    }

    if (filters.org3 && filters.org3.length !== 2) {
      throw new InvalidAfectacionDataError('org3', 'El código org3 debe tener exactamente 2 caracteres');
    }
  }
}
