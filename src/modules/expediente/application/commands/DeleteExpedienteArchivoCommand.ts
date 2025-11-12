import { IExpedienteArchivoRepository } from '../../domain/repositories/IExpedienteRepository.js';
import {
  ExpedienteArchivoNotFoundError,
  InvalidExpedienteArchivoDataError,
  ExpedienteArchivoCommandError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteExpedienteArchivoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class DeleteExpedienteArchivoCommand {
  constructor(private expedienteArchivoRepo: IExpedienteArchivoRepository) {}

  async execute(archivoId: number): Promise<void> {
    // Validaciones de entrada
    this.validateInput(archivoId);

    const logContext = {
      operation: 'deleteExpedienteArchivo',
      archivoId: archivoId
    };

    logger.info(logContext, 'Eliminando archivo de expediente');

    try {
      await this.expedienteArchivoRepo.delete(archivoId);

      logger.info({
        ...logContext,
        deleted: true
      }, 'Archivo de expediente eliminado exitosamente');

    } catch (error: any) {
      if (error instanceof ExpedienteArchivoNotFoundError ||
          error instanceof InvalidExpedienteArchivoDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al eliminar archivo de expediente');

      throw new ExpedienteArchivoCommandError('eliminación', {
        originalError: error.message,
        archivoId: archivoId
      });
    }
  }

  private validateInput(archivoId: number): void {
    // Validar archivoId
    if (!archivoId || typeof archivoId !== 'number' || archivoId <= 0) {
      throw new InvalidExpedienteArchivoDataError('archivoId', 'Es requerido y debe ser un número positivo');
    }
  }
}
