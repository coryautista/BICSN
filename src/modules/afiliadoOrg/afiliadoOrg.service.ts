import {
  getAllAfiliadoOrg,
  getAfiliadoOrgById,
  getAfiliadoOrgByAfiliadoId,
  createAfiliadoOrg,
  updateAfiliadoOrg,
  deleteAfiliadoOrg,
  type AfiliadoOrg
} from './afiliadoOrg.repo.js';
import pino from 'pino';
import {
  AfiliadoOrgNotFoundError,
  InvalidOrgLevelError,
  InvalidSueldoError,
  AfiliadoNotFoundForOrgError,
  AfiliadoOrgRegistrationError,
  AfiliadoOrgUpdateError,
  AfiliadoOrgDeletionError,
  AfiliadoOrgQueryError
} from './domain/errors.js';

const logger = pino({
  name: 'afiliadoOrg-service',
  level: process.env.LOG_LEVEL || 'info'
});

export async function getAllAfiliadoOrgService(): Promise<AfiliadoOrg[]> {
  const logContext = {
    operation: 'getAllAfiliadoOrg',
    timestamp: new Date().toISOString()
  };

  logger.info(logContext, 'Obteniendo todas las relaciones afiliado-org');

  try {
    const result = await getAllAfiliadoOrg();
    logger.info({ ...logContext, count: result.length }, 'Relaciones afiliado-org obtenidas exitosamente');
    return result;
  } catch (error: any) {
    logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error al obtener todas las relaciones afiliado-org');
    throw new AfiliadoOrgQueryError('Error al obtener la lista de relaciones afiliado-org', { originalError: error.message });
  }
}

export async function getAfiliadoOrgByIdService(id: number): Promise<AfiliadoOrg> {
  const logContext = {
    operation: 'getAfiliadoOrgById',
    afiliadoOrgId: id,
    timestamp: new Date().toISOString()
  };

  logger.info(logContext, 'Obteniendo relación afiliado-org por ID');

  try {
    const record = await getAfiliadoOrgById(id);
    if (!record) {
      logger.warn(logContext, 'Relación afiliado-org no encontrada');
      throw new AfiliadoOrgNotFoundError({ id });
    }

    logger.info(logContext, 'Relación afiliado-org obtenida exitosamente');
    return record;
  } catch (error: any) {
    if (error instanceof AfiliadoOrgNotFoundError) {
      throw error; // Re-throw domain errors as-is
    }

    logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error al obtener relación afiliado-org por ID');
    throw new AfiliadoOrgQueryError(`Error al obtener relación afiliado-org con ID ${id}`, { originalError: error.message });
  }
}

export async function getAfiliadoOrgByAfiliadoIdService(afiliadoId: number): Promise<AfiliadoOrg[]> {
  const logContext = {
    operation: 'getAfiliadoOrgByAfiliadoId',
    afiliadoId,
    timestamp: new Date().toISOString()
  };

  logger.info(logContext, 'Obteniendo relaciones afiliado-org por afiliado ID');

  try {
    const result = await getAfiliadoOrgByAfiliadoId(afiliadoId);
    logger.info({ ...logContext, count: result.length }, 'Relaciones afiliado-org obtenidas exitosamente');
    return result;
  } catch (error: any) {
    logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error al obtener relaciones afiliado-org por afiliado ID');
    throw new AfiliadoOrgQueryError(`Error al obtener relaciones afiliado-org para afiliado ${afiliadoId}`, { originalError: error.message });
  }
}

export async function createAfiliadoOrgService(data: Omit<AfiliadoOrg, 'id' | 'createdAt' | 'updatedAt'>): Promise<AfiliadoOrg> {
  const logContext = {
    operation: 'createAfiliadoOrg',
    afiliadoId: data.afiliadoId,
    claveOrganica0: data.claveOrganica0,
    timestamp: new Date().toISOString()
  };

  logger.info(logContext, 'Creando nueva relación afiliado-org');

  try {
    // Validar datos de entrada
    if (!data.afiliadoId || data.afiliadoId <= 0) {
      logger.warn({ ...logContext, afiliadoId: data.afiliadoId }, 'ID de afiliado inválido');
      throw new AfiliadoNotFoundForOrgError(data.afiliadoId);
    }

    // Validar jerarquía organizacional
    if (data.nivel0Id !== null && data.nivel0Id !== undefined && (data.nivel0Id < 0 || data.nivel0Id > 3)) {
      logger.warn({ ...logContext, nivel0Id: data.nivel0Id }, 'Nivel organizacional inválido');
      throw new InvalidOrgLevelError(data.nivel0Id);
    }

    // Validar sueldo si está presente
    if (data.sueldo !== null && data.sueldo !== undefined && data.sueldo < 0) {
      logger.warn({ ...logContext, sueldo: data.sueldo }, 'Sueldo inválido');
      throw new InvalidSueldoError(data.sueldo);
    }

    const result = await createAfiliadoOrg(data);
    logger.info({ ...logContext, newId: result.id }, 'Relación afiliado-org creada exitosamente');
    return result;
  } catch (error: any) {
    if (error instanceof AfiliadoNotFoundForOrgError ||
        error instanceof InvalidOrgLevelError ||
        error instanceof InvalidSueldoError) {
      throw error; // Re-throw domain errors as-is
    }

    logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error al crear relación afiliado-org');
    throw new AfiliadoOrgRegistrationError('Error al crear la relación afiliado-org', { originalError: error.message });
  }
}

export async function updateAfiliadoOrgService(id: number, data: Partial<Omit<AfiliadoOrg, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AfiliadoOrg> {
  const logContext = {
    operation: 'updateAfiliadoOrg',
    afiliadoOrgId: id,
    timestamp: new Date().toISOString()
  };

  logger.info(logContext, 'Actualizando relación afiliado-org');

  try {
    // Check if record exists
    const existing = await getAfiliadoOrgById(id);
    if (!existing) {
      logger.warn(logContext, 'Relación afiliado-org no encontrada para actualizar');
      throw new AfiliadoOrgNotFoundError({ id });
    }

    // Validar sueldo si está siendo actualizado
    if (data.sueldo !== null && data.sueldo !== undefined && data.sueldo < 0) {
      logger.warn({ ...logContext, sueldo: data.sueldo }, 'Sueldo inválido en actualización');
      throw new InvalidSueldoError(data.sueldo);
    }

    const result = await updateAfiliadoOrg(id, data);
    logger.info(logContext, 'Relación afiliado-org actualizada exitosamente');
    return result;
  } catch (error: any) {
    if (error instanceof AfiliadoOrgNotFoundError || error instanceof InvalidSueldoError) {
      throw error; // Re-throw domain errors as-is
    }

    logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error al actualizar relación afiliado-org');
    throw new AfiliadoOrgUpdateError(`Error al actualizar relación afiliado-org con ID ${id}`, { originalError: error.message });
  }
}

export async function deleteAfiliadoOrgService(id: number): Promise<void> {
  const logContext = {
    operation: 'deleteAfiliadoOrg',
    afiliadoOrgId: id,
    timestamp: new Date().toISOString()
  };

  logger.info(logContext, 'Eliminando relación afiliado-org');

  try {
    // Check if record exists
    const existing = await getAfiliadoOrgById(id);
    if (!existing) {
      logger.warn(logContext, 'Relación afiliado-org no encontrada para eliminar');
      throw new AfiliadoOrgNotFoundError({ id });
    }

    await deleteAfiliadoOrg(id);
    logger.info(logContext, 'Relación afiliado-org eliminada exitosamente');
  } catch (error: any) {
    if (error instanceof AfiliadoOrgNotFoundError) {
      throw error; // Re-throw domain errors as-is
    }

    logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error al eliminar relación afiliado-org');
    throw new AfiliadoOrgDeletionError(`Error al eliminar relación afiliado-org con ID ${id}`, { originalError: error.message });
  }
}