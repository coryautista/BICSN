import { IEstadoAfectacionRepository, EstadoAfectacionFilters } from '../../domain/repositories/IEstadoAfectacionRepository.js';
import { EstadoAfectacion } from '../../domain/entities/EstadoAfectacion.js';
import {
  InvalidAnioError,
  InvalidOrgNivelError,
  InvalidAfectacionDataError,
  AfectacionQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getEstadosAfectacionQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetEstadosAfectacionQuery {
  constructor(private estadoAfectacionRepo: IEstadoAfectacionRepository) {}

  async execute(filters: EstadoAfectacionFilters): Promise<EstadoAfectacion[]> {
    // Validaciones de entrada
    this.validateFilters(filters);

    const logContext = {
      operation: 'getEstadosAfectacion',
      filters: {
        entidad: filters.entidad,
        anio: filters.anio,
        orgNivel: filters.orgNivel,
        org0: filters.org0,
        org1: filters.org1,
        org2: filters.org2,
        org3: filters.org3
      }
    };

    logger.info(logContext, 'Consultando estados de afectaciones');

    try {
      const result = await this.estadoAfectacionRepo.findAll(filters);

      logger.info({
        ...logContext,
        resultCount: result.length
      }, 'Consulta de estados completada exitosamente');

      return result;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar estados de afectaciones');

      throw new AfectacionQueryError('getEstadosAfectacion', {
        originalError: error.message,
        filters
      });
    }
  }

  private validateFilters(filters: EstadoAfectacionFilters): void {
    // Validar año si está presente
    if (filters.anio !== undefined && (filters.anio < 2000 || filters.anio > 2100)) {
      throw new InvalidAnioError(filters.anio);
    }

    // Validar nivel organizacional si está presente
    if (filters.orgNivel !== undefined && (filters.orgNivel < 0 || filters.orgNivel > 3)) {
      throw new InvalidOrgNivelError(filters.orgNivel);
    }

    // Validar que si se especifica orgNivel, se requieran los códigos correspondientes
    if (filters.orgNivel !== undefined) {
      if (filters.orgNivel >= 1 && !filters.org1?.trim()) {
        throw new InvalidAfectacionDataError('org1', 'El código org1 es requerido cuando orgNivel >= 1');
      }

      if (filters.orgNivel >= 2 && !filters.org2?.trim()) {
        throw new InvalidAfectacionDataError('org2', 'El código org2 es requerido cuando orgNivel >= 2');
      }

      if (filters.orgNivel >= 3 && !filters.org3?.trim()) {
        throw new InvalidAfectacionDataError('org3', 'El código org3 es requerido cuando orgNivel >= 3');
      }
    }
  }
}
