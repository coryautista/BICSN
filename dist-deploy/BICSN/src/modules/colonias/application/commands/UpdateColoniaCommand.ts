import { IColoniaRepository } from '../../domain/repositories/IColoniaRepository.js';
import { ColoniaDetailed, UpdateColoniaData } from '../../domain/entities/Colonia.js';
import {
  ColoniaNotFoundError,
  InvalidColoniaDataError,
  DuplicateColoniaError,
  ColoniaCommandError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'updateColoniaCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class UpdateColoniaCommand {
  constructor(private coloniaRepo: IColoniaRepository) {}

  async execute(data: UpdateColoniaData): Promise<ColoniaDetailed> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'updateColonia',
      coloniaId: data.coloniaId,
      nombreColonia: data.nombreColonia,
      tipoAsentamiento: data.tipoAsentamiento,
      esValido: data.esValido,
      userId: data.userId
    };

    logger.info(logContext, 'Actualizando colonia');

    try {
      const result = await this.coloniaRepo.update(
        data.coloniaId,
        data.nombreColonia,
        data.tipoAsentamiento,
        data.esValido,
        data.userId
      );

      if (!result) {
        logger.warn({ ...logContext }, 'Colonia no encontrada para actualización');
        throw new ColoniaNotFoundError(data.coloniaId);
      }

      logger.info({
        ...logContext,
        updatedAt: result.updatedAt
      }, 'Colonia actualizada exitosamente');

      return result;

    } catch (error: any) {
      // Manejo específico de errores de base de datos
      if (error.code === '23505') { // Unique constraint violation
        logger.warn({ ...logContext }, 'Conflicto de unicidad al actualizar colonia');
        throw new DuplicateColoniaError(data.nombreColonia || 'desconocido', data.coloniaId);
      }

      if (error instanceof ColoniaNotFoundError ||
          error instanceof InvalidColoniaDataError ||
          error instanceof DuplicateColoniaError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al actualizar colonia');

      throw new ColoniaCommandError('actualización', {
        originalError: error.message,
        data: logContext
      });
    }
  }

  private validateInput(data: UpdateColoniaData): void {
    // Validar coloniaId
    if (!data.coloniaId || typeof data.coloniaId !== 'number' || data.coloniaId <= 0) {
      throw new InvalidColoniaDataError('coloniaId', 'Es requerido y debe ser un número positivo');
    }

    // Validar nombreColonia (opcional)
    if (data.nombreColonia !== undefined) {
      if (typeof data.nombreColonia !== 'string' || data.nombreColonia.trim().length === 0) {
        throw new InvalidColoniaDataError('nombreColonia', 'Debe ser una cadena no vacía');
      }
      if (data.nombreColonia.length > 100) {
        throw new InvalidColoniaDataError('nombreColonia', 'No puede exceder 100 caracteres');
      }
    }

    // Validar tipoAsentamiento (opcional)
    if (data.tipoAsentamiento !== undefined) {
      if (typeof data.tipoAsentamiento !== 'string') {
        throw new InvalidColoniaDataError('tipoAsentamiento', 'Debe ser una cadena de texto');
      }
      if (data.tipoAsentamiento.length > 50) {
        throw new InvalidColoniaDataError('tipoAsentamiento', 'No puede exceder 50 caracteres');
      }
    }

    // Validar esValido (opcional)
    if (data.esValido !== undefined && typeof data.esValido !== 'boolean') {
      throw new InvalidColoniaDataError('esValido', 'Debe ser un valor booleano');
    }
  }
}
