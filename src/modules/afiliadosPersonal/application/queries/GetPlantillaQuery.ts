import { AfiliadoPersonal } from '../../domain/entities/AfiliadoPersonal.js';
import { IAfiliadoPersonalRepository } from '../../domain/repositories/IAfiliadoPersonalRepository.js';
import {
  AfiliadosPersonalInvalidClaveOrganicaError,
  AfiliadosPersonalQueryFailedError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getPlantillaQuery',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Query to get employee roster by organic keys
 */
export class GetPlantillaQuery {
  constructor(private afiliadoPersonalRepo: IAfiliadoPersonalRepository) {}

  async execute(claveOrganica0: string, claveOrganica1: string): Promise<AfiliadoPersonal[]> {
    // Validaciones de entrada
    this.validateInput(claveOrganica0, claveOrganica1);

    const logContext = {
      operation: 'obtenerPlantilla',
      claveOrganica0: claveOrganica0,
      claveOrganica1: claveOrganica1
    };

    logger.info(logContext, 'Consultando plantilla de personal por claves orgánicas');

    try {
      const results = await this.afiliadoPersonalRepo.obtenerPlantilla(claveOrganica0, claveOrganica1);

      logger.info({
        ...logContext,
        resultsCount: results.length,
        results: results.map(r => ({
          INTERNO: r.INTERNO,
          NOMBRE: r.NOMBRE,
          APELLIDO_PATERNO: r.APELLIDO_PATERNO,
          SUELDO: r.SUELDO
        }))
      }, 'Consulta de plantilla de personal completada exitosamente');

      return results;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar plantilla de personal');

      throw new AfiliadosPersonalQueryFailedError('consulta de plantilla', {
        originalError: error.message,
        claveOrganica0: claveOrganica0,
        claveOrganica1: claveOrganica1
      });
    }
  }

  private validateInput(claveOrganica0: string, claveOrganica1: string): void {
    // Validar clave orgánica 0
    if (!claveOrganica0 || typeof claveOrganica0 !== 'string') {
      throw new AfiliadosPersonalInvalidClaveOrganicaError('Clave orgánica 0 es requerida y debe ser una cadena', 0);
    }

    if (claveOrganica0.trim().length === 0) {
      throw new AfiliadosPersonalInvalidClaveOrganicaError('Clave orgánica 0 no puede estar vacía', 0);
    }

    if (claveOrganica0.length > 20) {
      throw new AfiliadosPersonalInvalidClaveOrganicaError('Clave orgánica 0 demasiado larga (máximo 20 caracteres)', 0);
    }

    // Validar clave orgánica 1
    if (!claveOrganica1 || typeof claveOrganica1 !== 'string') {
      throw new AfiliadosPersonalInvalidClaveOrganicaError('Clave orgánica 1 es requerida y debe ser una cadena', 1);
    }

    if (claveOrganica1.trim().length === 0) {
      throw new AfiliadosPersonalInvalidClaveOrganicaError('Clave orgánica 1 no puede estar vacía', 1);
    }

    if (claveOrganica1.length > 20) {
      throw new AfiliadosPersonalInvalidClaveOrganicaError('Clave orgánica 1 demasiado larga (máximo 20 caracteres)', 1);
    }

    // Validar formato de claves orgánicas (solo letras, números y guiones)
    const clavePattern = /^[A-Z0-9-]+$/;
    if (!clavePattern.test(claveOrganica0)) {
      throw new AfiliadosPersonalInvalidClaveOrganicaError('Clave orgánica 0 contiene caracteres no válidos (solo letras mayúsculas, números y guiones)', 0);
    }

    if (!clavePattern.test(claveOrganica1)) {
      throw new AfiliadosPersonalInvalidClaveOrganicaError('Clave orgánica 1 contiene caracteres no válidos (solo letras mayúsculas, números y guiones)', 1);
    }
  }
}
