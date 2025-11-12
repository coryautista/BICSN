import { obtenerPlantilla, busquedaHistorico } from './afiliadosPersonal.repo.js';
import { ObtenerPlantillaResponse } from './afiliadosPersonal.schemas.js';
import pino from 'pino';
import {
  AfiliadosPersonalInvalidClaveOrganicaError,
  AfiliadosPersonalInvalidSearchTermError,
  AfiliadosPersonalQueryFailedError,
  AfiliadosPersonalConnectionError,
  AfiliadosPersonalDataNotFoundError
} from './domain/errors.js';

const logger = pino({
  name: 'afiliadosPersonal-service',
  level: process.env.LOG_LEVEL || 'info'
});

export async function getObtenerPlantillaService(claveOrganica0: string, claveOrganica1: string, userId?: string): Promise<ObtenerPlantillaResponse[]> {
  const logContext = {
    operation: 'getObtenerPlantilla',
    claveOrganica0,
    claveOrganica1,
    userId,
    timestamp: new Date().toISOString()
  };

  logger.info(logContext, 'Obteniendo plantilla de personal');

  try {
    // Validar claves orgánicas
    if (!claveOrganica0 || claveOrganica0.trim() === '') {
      logger.warn(logContext, 'Clave orgánica 0 inválida o vacía');
      throw new AfiliadosPersonalInvalidClaveOrganicaError(claveOrganica0 || 'null', 0);
    }

    if (!claveOrganica1 || claveOrganica1.trim() === '') {
      logger.warn(logContext, 'Clave orgánica 1 inválida o vacía');
      throw new AfiliadosPersonalInvalidClaveOrganicaError(claveOrganica1 || 'null', 1);
    }

    const records = await obtenerPlantilla(claveOrganica0, claveOrganica1);

    if (!records || records.length === 0) {
      logger.info(logContext, 'No se encontraron registros de plantilla para las claves orgánicas especificadas');
      throw new AfiliadosPersonalDataNotFoundError({ claveOrganica0, claveOrganica1 });
    }

    logger.info({ ...logContext, recordCount: records.length }, 'Plantilla de personal obtenida exitosamente');
    return records;

  } catch (error: any) {
    if (error instanceof AfiliadosPersonalInvalidClaveOrganicaError ||
        error instanceof AfiliadosPersonalDataNotFoundError) {
      throw error; // Re-throw domain errors as-is
    }

    // Handle database connection errors
    if (error.code === 'ECONNREFUSED' || error.message?.includes('connection')) {
      logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error de conexión con base de datos de personal');
      throw new AfiliadosPersonalConnectionError('Error de conexión con base de datos de personal', { originalError: error.message });
    }

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Timeout en consulta de plantilla');
      throw new AfiliadosPersonalQueryFailedError('obtenerPlantilla', { originalError: error.message, timeout: true });
    }

    logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error al obtener plantilla de personal');
    throw new AfiliadosPersonalQueryFailedError('obtenerPlantilla', { originalError: error.message });
  }
}

export async function getBusquedaHistoricoService(searchTerm?: string, userId?: string): Promise<ObtenerPlantillaResponse[]> {
  const logContext = {
    operation: 'getBusquedaHistorico',
    searchTerm: searchTerm || 'null',
    userId,
    timestamp: new Date().toISOString()
  };

  logger.info(logContext, 'Realizando búsqueda histórica de personal');

  try {
    // Validar término de búsqueda si se proporciona
    if (searchTerm && searchTerm.trim().length < 2) {
      logger.warn(logContext, 'Término de búsqueda demasiado corto');
      throw new AfiliadosPersonalInvalidSearchTermError(searchTerm, { minLength: 2 });
    }

    const records = await busquedaHistorico(searchTerm);

    logger.info({ ...logContext, recordCount: records.length }, 'Búsqueda histórica completada exitosamente');
    return records;

  } catch (error: any) {
    if (error instanceof AfiliadosPersonalInvalidSearchTermError) {
      throw error; // Re-throw domain errors as-is
    }

    // Handle database connection errors
    if (error.code === 'ECONNREFUSED' || error.message?.includes('connection')) {
      logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error de conexión en búsqueda histórica');
      throw new AfiliadosPersonalConnectionError('Error de conexión con base de datos de personal', { originalError: error.message });
    }

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Timeout en búsqueda histórica');
      throw new AfiliadosPersonalQueryFailedError('busquedaHistorico', { originalError: error.message, timeout: true });
    }

    logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error en búsqueda histórica de personal');
    throw new AfiliadosPersonalQueryFailedError('busquedaHistorico', { originalError: error.message });
  }
}