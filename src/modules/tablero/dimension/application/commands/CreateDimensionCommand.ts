import { IDimensionRepository } from '../../domain/repositories/IDimensionRepository.js';
import { Dimension, TipoDimension } from '../../domain/entities/Dimension.js';
import { DimensionAlreadyExistsError, InvalidDimensionNombreError, InvalidDimensionDescripcionError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'createDimensionCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface CreateDimensionInput {
  nombre: string;
  descripcion: string;
  tipoDimension: TipoDimension;
  esActiva?: boolean;
  userId?: string;
}

export class CreateDimensionCommand {
  constructor(private dimensionRepo: IDimensionRepository) {}

  async execute(input: CreateDimensionInput, tx?: sql.Transaction): Promise<Dimension> {
    const logContext = {
      operation: 'createDimension',
      nombre: input.nombre,
      tipoDimension: input.tipoDimension,
      userId: input.userId
    };

    logger.info(logContext, 'Iniciando creación de dimensión');

    // Validación de entrada
    if (!input.nombre || typeof input.nombre !== 'string') {
      throw new InvalidDimensionNombreError('', 'El nombre es requerido y debe ser una cadena de texto');
    }

    const nombreTrimmed = input.nombre.trim();
    if (nombreTrimmed.length === 0) {
      throw new InvalidDimensionNombreError('', 'El nombre no puede estar vacío');
    }

    if (nombreTrimmed.length > 200) {
      throw new InvalidDimensionNombreError(nombreTrimmed, 'El nombre no puede tener más de 200 caracteres');
    }

    if (!input.descripcion || typeof input.descripcion !== 'string') {
      throw new InvalidDimensionDescripcionError('', 'La descripción es requerida y debe ser una cadena de texto');
    }

    const descripcionTrimmed = input.descripcion.trim();
    if (descripcionTrimmed.length === 0) {
      throw new InvalidDimensionDescripcionError('', 'La descripción no puede estar vacía');
    }

    if (descripcionTrimmed.length > 1000) {
      throw new InvalidDimensionDescripcionError(descripcionTrimmed, 'La descripción no puede tener más de 1000 caracteres');
    }

    if (!input.tipoDimension || !['GEOGRAFICA', 'TEMPORAL', 'DEMOGRAFICA', 'ECONOMICA', 'SOCIAL', 'AMBIENTAL', 'INSTITUCIONAL'].includes(input.tipoDimension)) {
      throw new Error('Tipo de dimensión inválido');
    }

    try {
      const result = await this.dimensionRepo.create(
        nombreTrimmed,
        descripcionTrimmed,
        input.tipoDimension,
        input.esActiva ?? true,
        input.userId,
        tx
      );
      logger.info({ ...logContext, dimensionId: result.id }, 'Dimensión creada exitosamente');
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al crear dimensión');

      if (errorMessage.includes('Violation of PRIMARY KEY constraint') || 
          errorMessage.includes('duplicate key')) {
        throw new DimensionAlreadyExistsError(nombreTrimmed);
      }
      throw error;
    }
  }
}

