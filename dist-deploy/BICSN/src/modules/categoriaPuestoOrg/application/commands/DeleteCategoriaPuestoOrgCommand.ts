import { ICategoriaPuestoOrgRepository } from '../../domain/repositories/ICategoriaPuestoOrgRepository.js';
import { DeleteCategoriaPuestoOrgData } from '../../domain/entities/CategoriaPuestoOrg.js';
import {
  CategoriaPuestoOrgNotFoundError,
  InvalidCategoriaPuestoOrgDataError,
  CategoriaPuestoOrgInUseError,
  CategoriaPuestoOrgDeletionError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteCategoriaPuestoOrgCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class DeleteCategoriaPuestoOrgCommand {
  constructor(private categoriaPuestoOrgRepo: ICategoriaPuestoOrgRepository) {}

  async execute(data: DeleteCategoriaPuestoOrgData): Promise<number> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'deleteCategoriaPuestoOrg',
      categoriaPuestoOrgId: data.categoriaPuestoOrgId
    };

    logger.info(logContext, 'Eliminando categoría de puesto orgánico');

    try {
      // Verificar existencia
      const existing = await this.categoriaPuestoOrgRepo.findById(data.categoriaPuestoOrgId);
      if (!existing) {
        logger.warn({ ...logContext }, 'Categoría de puesto orgánico no encontrada para eliminación');
        throw new CategoriaPuestoOrgNotFoundError(data.categoriaPuestoOrgId);
      }

      // Verificar si está siendo utilizada (esto dependería de las reglas de negocio)
      // Por ahora, asumimos que se puede eliminar si existe

      const result = await this.categoriaPuestoOrgRepo.delete(data.categoriaPuestoOrgId);

      logger.info({
        ...logContext,
        deletedRecords: result,
        categoria: existing.categoria,
        nombreCategoria: existing.nombreCategoria
      }, 'Categoría de puesto orgánico eliminada exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof CategoriaPuestoOrgNotFoundError ||
          error instanceof InvalidCategoriaPuestoOrgDataError ||
          error instanceof CategoriaPuestoOrgInUseError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al eliminar categoría de puesto orgánico');

      throw new CategoriaPuestoOrgDeletionError(data.categoriaPuestoOrgId, {
        originalError: error.message
      });
    }
  }

  private validateInput(data: DeleteCategoriaPuestoOrgData): void {
    // Validar categoriaPuestoOrgId
    if (!data.categoriaPuestoOrgId || typeof data.categoriaPuestoOrgId !== 'number' || data.categoriaPuestoOrgId <= 0) {
      throw new InvalidCategoriaPuestoOrgDataError('categoriaPuestoOrgId', 'Debe ser un número positivo');
    }
  }
}
