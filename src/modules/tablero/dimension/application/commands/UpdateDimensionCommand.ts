import { IDimensionRepository } from '../../domain/repositories/IDimensionRepository.js';
import { Dimension, TipoDimension } from '../../domain/entities/Dimension.js';
import { DimensionNotFoundError, InvalidDimensionNombreError, InvalidDimensionDescripcionError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'updateDimensionCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface UpdateDimensionInput {
  dimensionId: number;
  nombre?: string;
  descripcion?: string;
  tipoDimension?: TipoDimension;
  esActiva?: boolean;
  userId?: string;
}

export class UpdateDimensionCommand {
  constructor(private dimensionRepo: IDimensionRepository) {}

  async execute(input: UpdateDimensionInput, tx?: sql.Transaction): Promise<Dimension> {
    const logContext = {
      operation: 'updateDimension',
      dimensionId: input.dimensionId,
      userId: input.userId
    };

    logger.info(logContext, 'Iniciando actualización de dimensión');

    // Validación de entrada
    if (!input.dimensionId || typeof input.dimensionId !== 'number' || input.dimensionId <= 0) {
      throw new DimensionNotFoundError(input.dimensionId);
    }

    if (input.nombre !== undefined) {
      if (typeof input.nombre !== 'string') {
        throw new InvalidDimensionNombreError('', 'El nombre debe ser una cadena de texto');
      }
      const nombreTrimmed = input.nombre.trim();
      if (nombreTrimmed.length === 0) {
        throw new InvalidDimensionNombreError('', 'El nombre no puede estar vacío');
      }
      if (nombreTrimmed.length > 200) {
        throw new InvalidDimensionNombreError(nombreTrimmed, 'El nombre no puede tener más de 200 caracteres');
      }
    }

    if (input.descripcion !== undefined) {
      if (typeof input.descripcion !== 'string') {
        throw new InvalidDimensionDescripcionError('', 'La descripción debe ser una cadena de texto');
      }
      const descripcionTrimmed = input.descripcion.trim();
      if (descripcionTrimmed.length === 0) {
        throw new InvalidDimensionDescripcionError('', 'La descripción no puede estar vacía');
      }
      if (descripcionTrimmed.length > 1000) {
        throw new InvalidDimensionDescripcionError(descripcionTrimmed, 'La descripción no puede tener más de 1000 caracteres');
      }
    }

    if (input.tipoDimension !== undefined && !['GEOGRAFICA', 'TEMPORAL', 'DEMOGRAFICA', 'ECONOMICA', 'SOCIAL', 'AMBIENTAL', 'INSTITUCIONAL'].includes(input.tipoDimension)) {
      throw new Error('Tipo de dimensión inválido');
    }

    // Verificar que la dimensión existe
    const existingDimension = await this.dimensionRepo.findById(input.dimensionId);
    if (!existingDimension) {
      throw new DimensionNotFoundError(input.dimensionId);
    }

    try {
      const result = await this.dimensionRepo.update(
        input.dimensionId,
        input.nombre,
        input.descripcion,
        input.tipoDimension,
        input.esActiva,
        input.userId,
        tx
      );
      if (!result) {
        throw new DimensionNotFoundError(input.dimensionId);
      }
      logger.info({ ...logContext, dimensionId: result.id }, 'Dimensión actualizada exitosamente');
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al actualizar dimensión');

      if (error instanceof DimensionNotFoundError) {
        throw error;
      }
      throw error;
    }
  }
}

