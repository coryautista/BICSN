import { IAfiliadoOrgRepository } from '../../domain/repositories/IAfiliadoOrgRepository.js';
import {
  AfiliadoOrgNotFoundError,
  InvalidAfiliadoOrgDataError,
  AfiliadoOrgDeletionError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteAfiliadoOrgCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class DeleteAfiliadoOrgCommand {
  constructor(private afiliadoOrgRepo: IAfiliadoOrgRepository) {}

  async execute(id: number): Promise<void> {
    // Validaciones de entrada
    this.validateInput(id);

    const logContext = {
      operation: 'deleteAfiliadoOrg',
      id: id
    };

    logger.info(logContext, 'Iniciando eliminación de relación afiliado-org');

    try {
      // Verificar que el registro existe
      const existing = await this.afiliadoOrgRepo.findById(id);
      if (!existing) {
        logger.warn({ ...logContext, afiliadoOrgId: id }, 'Relación afiliado-org no encontrada para eliminación');
        throw new AfiliadoOrgNotFoundError({ id });
      }

      // Log detalles del registro que se va a eliminar
      logger.info({
        ...logContext,
        afiliadoId: existing.afiliadoId,
        claveOrganica0: existing.claveOrganica0,
        activo: existing.activo
      }, 'Eliminando relación afiliado-org');

      await this.afiliadoOrgRepo.delete(id);

      logger.info({
        ...logContext,
        afiliadoOrgId: id
      }, 'Relación afiliado-org eliminada exitosamente');

    } catch (error: any) {
      if (error instanceof AfiliadoOrgNotFoundError ||
          error instanceof InvalidAfiliadoOrgDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al eliminar relación afiliado-org');

      throw new AfiliadoOrgDeletionError('Error interno al eliminar relación afiliado-org', {
        originalError: error.message,
        id: id
      });
    }
  }

  private validateInput(id: number): void {
    // Validar ID
    if (!id || id <= 0) {
      throw new InvalidAfiliadoOrgDataError('id', 'El ID es requerido y debe ser positivo');
    }
  }
}
