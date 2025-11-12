import { IBitacoraAfectacionRepository, BitacoraAfectacionFilters } from '../../domain/repositories/IBitacoraAfectacionRepository.js';
import { BitacoraAfectacion } from '../../domain/entities/BitacoraAfectacion.js';
import {
  InvalidAnioError,
  InvalidQuincenaError,
  InvalidOrgNivelError,
  InvalidAfectacionDataError,
  AfectacionQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getBitacoraAfectacionQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetBitacoraAfectacionQuery {
  constructor(private bitacoraAfectacionRepo: IBitacoraAfectacionRepository) {}

  async execute(filters: BitacoraAfectacionFilters): Promise<BitacoraAfectacion[]> {
    // Validaciones de entrada
    this.validateFilters(filters);

    const logContext = {
      operation: 'getBitacoraAfectacion',
      filters: {
        entidad: filters.entidad,
        anio: filters.anio,
        quincena: filters.quincena,
        orgNivel: filters.orgNivel,
        org0: filters.org0,
        org1: filters.org1,
        org2: filters.org2,
        org3: filters.org3,
        usuario: filters.usuario,
        accion: filters.accion,
        resultado: filters.resultado,
        limit: filters.limit,
        offset: filters.offset
      }
    };

    logger.info(logContext, 'Consultando bitácora de afectaciones');

    try {
      const result = await this.bitacoraAfectacionRepo.findAll(filters);

      logger.info({
        ...logContext,
        resultCount: result.length
      }, 'Consulta de bitácora completada exitosamente');

      return result;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar bitácora de afectaciones');

      throw new AfectacionQueryError('getBitacoraAfectacion', {
        originalError: error.message,
        filters
      });
    }
  }

  private validateFilters(filters: BitacoraAfectacionFilters): void {
    // Validar año si está presente
    if (filters.anio !== undefined && (filters.anio < 2000 || filters.anio > 2100)) {
      throw new InvalidAnioError(filters.anio);
    }

    // Validar quincena si está presente
    if (filters.quincena !== undefined && (filters.quincena < 1 || filters.quincena > 24)) {
      throw new InvalidQuincenaError(filters.quincena);
    }

    // Validar nivel organizacional si está presente
    if (filters.orgNivel !== undefined && (filters.orgNivel < 0 || filters.orgNivel > 3)) {
      throw new InvalidOrgNivelError(filters.orgNivel);
    }

    // Validar límites de paginación
    if (filters.limit !== undefined && filters.limit < 1) {
      throw new InvalidAfectacionDataError('limit', 'El límite debe ser mayor a 0');
    }

    if (filters.offset !== undefined && filters.offset < 0) {
      throw new InvalidAfectacionDataError('offset', 'El offset no puede ser negativo');
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
