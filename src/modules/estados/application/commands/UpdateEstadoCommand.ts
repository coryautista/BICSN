import { IEstadoRepository } from '../../domain/repositories/IEstadoRepository.js';
import { Estado, UpdateEstadoData } from '../../domain/entities/Estado.js';
import {
  EstadoNotFoundError,
  InvalidEstadoDataError,
  EstadoCommandError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'updateEstadoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class UpdateEstadoCommand {
  constructor(private estadoRepo: IEstadoRepository) {}

  async execute(data: UpdateEstadoData): Promise<Estado> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'updateEstado',
      estadoId: data.estadoId,
      nombreEstado: data.nombreEstado,
      esValido: data.esValido,
      userId: data.userId
    };

    logger.info(logContext, 'Actualizando estado');

    try {
      const result = await this.estadoRepo.update(
        data.estadoId,
        data.nombreEstado,
        data.esValido,
        data.userId
      );

      if (!result) {
        logger.warn({ ...logContext }, 'Estado no encontrado para actualización');
        throw new EstadoNotFoundError(data.estadoId);
      }

      logger.info({
        ...logContext,
        updatedAt: result.updatedAt
      }, 'Estado actualizado exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof EstadoNotFoundError ||
          error instanceof InvalidEstadoDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al actualizar estado');

      throw new EstadoCommandError('actualización', {
        originalError: error.message,
        data: logContext
      });
    }
  }

  private validateInput(data: UpdateEstadoData): void {
    // Validar estadoId
    if (!data.estadoId || typeof data.estadoId !== 'string' || data.estadoId.trim().length === 0) {
      throw new InvalidEstadoDataError('estadoId', 'Es requerido y debe ser una cadena no vacía');
    }

    // Validar nombreEstado (opcional)
    if (data.nombreEstado !== undefined) {
      if (typeof data.nombreEstado !== 'string' || data.nombreEstado.trim().length === 0) {
        throw new InvalidEstadoDataError('nombreEstado', 'Debe ser una cadena no vacía');
      }
      if (data.nombreEstado.length > 100) {
        throw new InvalidEstadoDataError('nombreEstado', 'No puede exceder 100 caracteres');
      }
    }

    // Validar esValido (opcional)
    if (data.esValido !== undefined && typeof data.esValido !== 'boolean') {
      throw new InvalidEstadoDataError('esValido', 'Debe ser un valor booleano');
    }
  }
}
