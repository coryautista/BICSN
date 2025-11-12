import { ICategoriaPuestoOrgRepository } from '../../domain/repositories/ICategoriaPuestoOrgRepository.js';
import { CategoriaPuestoOrg, ListCategoriaPuestoOrgFilters } from '../../domain/entities/CategoriaPuestoOrg.js';
import {
  InvalidCategoriaPuestoOrgDataError,
  CategoriaPuestoOrgQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getAllCategoriaPuestoOrgQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAllCategoriaPuestoOrgQuery {
  constructor(private categoriaPuestoOrgRepo: ICategoriaPuestoOrgRepository) {}

  async execute(filters?: ListCategoriaPuestoOrgFilters): Promise<CategoriaPuestoOrg[]> {
    // Validaciones de entrada
    this.validateInput(filters);

    const logContext = {
      operation: 'getAllCategoriaPuestoOrg',
      filters: filters
    };

    logger.info(logContext, 'Consultando todas las categorías de puesto orgánico');

    try {
      const results = await this.categoriaPuestoOrgRepo.findAll(filters);

      logger.info({
        ...logContext,
        resultsCount: results.length,
        results: results.map(r => ({
          categoriaPuestoOrgId: r.categoriaPuestoOrgId,
          nivel: r.nivel,
          org0: r.org0,
          org1: r.org1,
          categoria: r.categoria
        }))
      }, 'Consulta de todas las categorías de puesto orgánico completada exitosamente');

      return results;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar todas las categorías de puesto orgánico');

      throw new CategoriaPuestoOrgQueryError('consulta de todas las categorías', {
        originalError: error.message,
        filters: filters
      });
    }
  }

  private validateInput(filters?: ListCategoriaPuestoOrgFilters): void {
    if (!filters) {
      return; // Filtros opcionales
    }

    // Validar nivel si está presente
    if (filters.nivel !== undefined && filters.nivel !== null) {
      if (typeof filters.nivel !== 'number' || filters.nivel < 0 || filters.nivel > 3) {
        throw new InvalidCategoriaPuestoOrgDataError('nivel', 'Debe estar entre 0 y 3');
      }
    }

    // Validar org0 si está presente
    if (filters.org0 !== undefined && filters.org0 !== null) {
      if (typeof filters.org0 !== 'string' || filters.org0.trim().length !== 2) {
        throw new InvalidCategoriaPuestoOrgDataError('org0', 'Debe ser una cadena de exactamente 2 caracteres');
      }
      if (!/^[A-Z0-9]{2}$/.test(filters.org0)) {
        throw new InvalidCategoriaPuestoOrgDataError('org0', 'Debe contener solo letras mayúsculas y números');
      }
    }

    // Validar org1 si está presente
    if (filters.org1 !== undefined && filters.org1 !== null) {
      if (typeof filters.org1 !== 'string' || filters.org1.trim().length !== 2) {
        throw new InvalidCategoriaPuestoOrgDataError('org1', 'Debe ser una cadena de exactamente 2 caracteres');
      }
      if (!/^[A-Z0-9]{2}$/.test(filters.org1)) {
        throw new InvalidCategoriaPuestoOrgDataError('org1', 'Debe contener solo letras mayúsculas y números');
      }
    }

    // Validar org2 si está presente
    if (filters.org2 !== undefined && filters.org2 !== null) {
      if (typeof filters.org2 !== 'string' || filters.org2.trim().length !== 2) {
        throw new InvalidCategoriaPuestoOrgDataError('org2', 'Debe ser una cadena de exactamente 2 caracteres');
      }
      if (!/^[A-Z0-9]{2}$/.test(filters.org2)) {
        throw new InvalidCategoriaPuestoOrgDataError('org2', 'Debe contener solo letras mayúsculas y números');
      }
    }

    // Validar org3 si está presente
    if (filters.org3 !== undefined && filters.org3 !== null) {
      if (typeof filters.org3 !== 'string' || filters.org3.trim().length !== 2) {
        throw new InvalidCategoriaPuestoOrgDataError('org3', 'Debe ser una cadena de exactamente 2 caracteres');
      }
      if (!/^[A-Z0-9]{2}$/.test(filters.org3)) {
        throw new InvalidCategoriaPuestoOrgDataError('org3', 'Debe contener solo letras mayúsculas y números');
      }
    }
  }
}
