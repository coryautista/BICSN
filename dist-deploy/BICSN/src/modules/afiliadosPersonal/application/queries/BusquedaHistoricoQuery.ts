import { AfiliadoPersonal } from '../../domain/entities/AfiliadoPersonal.js';
import { IAfiliadoPersonalRepository } from '../../domain/repositories/IAfiliadoPersonalRepository.js';
import {
  AfiliadosPersonalInvalidSearchTermError,
  AfiliadosPersonalQueryFailedError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'busquedaHistoricoQuery',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Query to search employees in historical data
 */
export class BusquedaHistoricoQuery {
  constructor(private afiliadoPersonalRepo: IAfiliadoPersonalRepository) {}

  async execute(searchTerm?: string): Promise<AfiliadoPersonal[]> {
    // Validaciones de entrada
    this.validateInput(searchTerm);

    const logContext = {
      operation: 'busquedaHistorico',
      searchTerm: searchTerm
    };

    logger.info(logContext, 'Iniciando búsqueda histórica de personal');

    try {
      const results = await this.afiliadoPersonalRepo.busquedaHistorico(searchTerm);

      logger.info({
        ...logContext,
        resultsCount: results.length,
        results: results.map(r => ({
          INTERNO: r.INTERNO,
          NOMBRE: r.NOMBRE,
          APELLIDO_PATERNO: r.APELLIDO_PATERNO,
          CLAVE_ORGANICA_0: r.CLAVE_ORGANICA_0
        }))
      }, 'Búsqueda histórica de personal completada exitosamente');

      return results;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error en búsqueda histórica de personal');

      throw new AfiliadosPersonalQueryFailedError('búsqueda histórica', {
        originalError: error.message,
        searchTerm: searchTerm
      });
    }
  }

  private validateInput(searchTerm?: string): void {
    // Validar término de búsqueda si se proporciona
    if (searchTerm !== undefined && searchTerm !== null) {
      if (typeof searchTerm !== 'string') {
        throw new AfiliadosPersonalInvalidSearchTermError('El término de búsqueda debe ser una cadena de texto');
      }

      if (searchTerm.trim().length === 0) {
        throw new AfiliadosPersonalInvalidSearchTermError('El término de búsqueda no puede estar vacío');
      }

      if (searchTerm.length > 100) {
        throw new AfiliadosPersonalInvalidSearchTermError('El término de búsqueda es demasiado largo (máximo 100 caracteres)');
      }

      // Validar caracteres permitidos (solo letras, números, espacios y algunos símbolos comunes)
      const validPattern = /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑüÜ.,-]+$/;
      if (!validPattern.test(searchTerm)) {
        throw new AfiliadosPersonalInvalidSearchTermError('El término de búsqueda contiene caracteres no válidos');
      }
    }
  }
}
