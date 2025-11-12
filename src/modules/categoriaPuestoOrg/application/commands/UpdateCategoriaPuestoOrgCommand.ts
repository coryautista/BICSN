import { ICategoriaPuestoOrgRepository } from '../../domain/repositories/ICategoriaPuestoOrgRepository.js';
import { CategoriaPuestoOrg, UpdateCategoriaPuestoOrgData } from '../../domain/entities/CategoriaPuestoOrg.js';
import {
  CategoriaPuestoOrgNotFoundError,
  InvalidCategoriaPuestoOrgDataError,
  InvalidIngresoBrutoError,
  CategoriaPuestoOrgUpdateError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'updateCategoriaPuestoOrgCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class UpdateCategoriaPuestoOrgCommand {
  constructor(private categoriaPuestoOrgRepo: ICategoriaPuestoOrgRepository) {}

  async execute(data: UpdateCategoriaPuestoOrgData): Promise<CategoriaPuestoOrg> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'updateCategoriaPuestoOrg',
      categoriaPuestoOrgId: data.categoriaPuestoOrgId,
      userId: data.userId
    };

    logger.info(logContext, 'Actualizando categoría de puesto orgánico');

    try {
      // Verificar existencia
      const existing = await this.categoriaPuestoOrgRepo.findById(data.categoriaPuestoOrgId);
      if (!existing) {
        logger.warn({ ...logContext }, 'Categoría de puesto orgánico no encontrada para actualización');
        throw new CategoriaPuestoOrgNotFoundError(data.categoriaPuestoOrgId);
      }

      const result = await this.categoriaPuestoOrgRepo.update(data);

      logger.info({
        ...logContext,
        nombreCategoria: result.nombreCategoria,
        ingresoBrutoMensual: result.ingresoBrutoMensual,
        vigenciaFin: result.vigenciaFin
      }, 'Categoría de puesto orgánico actualizada exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof CategoriaPuestoOrgNotFoundError ||
          error instanceof InvalidCategoriaPuestoOrgDataError ||
          error instanceof InvalidIngresoBrutoError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al actualizar categoría de puesto orgánico');

      throw new CategoriaPuestoOrgUpdateError(data.categoriaPuestoOrgId, {
        originalError: error.message,
        data: data
      });
    }
  }

  private validateInput(data: UpdateCategoriaPuestoOrgData): void {
    // Validar categoriaPuestoOrgId
    if (!data.categoriaPuestoOrgId || typeof data.categoriaPuestoOrgId !== 'number' || data.categoriaPuestoOrgId <= 0) {
      throw new InvalidCategoriaPuestoOrgDataError('categoriaPuestoOrgId', 'Debe ser un número positivo');
    }

    // Validar nombreCategoria si está presente
    if (data.nombreCategoria !== undefined) {
      if (data.nombreCategoria === null) {
        // Permitir null para limpiar el campo
        return;
      }
      if (typeof data.nombreCategoria !== 'string') {
        throw new InvalidCategoriaPuestoOrgDataError('nombreCategoria', 'Debe ser una cadena de texto');
      }
      if (data.nombreCategoria.trim().length === 0) {
        throw new InvalidCategoriaPuestoOrgDataError('nombreCategoria', 'No puede estar vacío');
      }
      if (data.nombreCategoria.length > 80) {
        throw new InvalidCategoriaPuestoOrgDataError('nombreCategoria', 'No debe exceder 80 caracteres');
      }
    }

    // Validar ingresoBrutoMensual si está presente
    if (data.ingresoBrutoMensual !== undefined) {
      if (data.ingresoBrutoMensual === null) {
        // Permitir null para limpiar el campo
        return;
      }
      if (typeof data.ingresoBrutoMensual !== 'number' || data.ingresoBrutoMensual <= 0) {
        throw new InvalidIngresoBrutoError(data.ingresoBrutoMensual || 0);
      }
    }

    // Validar vigenciaFin si está presente
    if (data.vigenciaFin !== undefined) {
      if (data.vigenciaFin === null) {
        // Permitir null para quitar la fecha de fin
        return;
      }
      if (typeof data.vigenciaFin !== 'string') {
        throw new InvalidCategoriaPuestoOrgDataError('vigenciaFin', 'Debe ser una cadena de texto');
      }
      // Validar formato de fecha (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.vigenciaFin)) {
        throw new InvalidCategoriaPuestoOrgDataError('vigenciaFin', 'Debe tener formato YYYY-MM-DD');
      }
      // Validar que la fecha sea válida
      const vigenciaFinDate = new Date(data.vigenciaFin + 'T23:59:59.999Z');
      if (isNaN(vigenciaFinDate.getTime())) {
        throw new InvalidCategoriaPuestoOrgDataError('vigenciaFin', 'Fecha inválida');
      }
    }
  }
}
