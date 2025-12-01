import { IProgramaRepository } from '../../domain/repositories/IProgramaRepository.js';
import { Programa } from '../../domain/entities/Programa.js';
import { ProgramaNotFoundError, InvalidProgramaNombreError, InvalidProgramaDescripcionError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'updateProgramaCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface UpdateProgramaInput {
  programaId: number;
  nombre?: string;
  descripcion?: string;
  userId?: string;
}

export class UpdateProgramaCommand {
  constructor(private programaRepo: IProgramaRepository) {}

  async execute(input: UpdateProgramaInput, tx?: sql.Transaction): Promise<Programa> {
    const logContext = {
      operation: 'updatePrograma',
      programaId: input.programaId,
      userId: input.userId
    };

    logger.info(logContext, 'Iniciando actualización de programa');

    // Validación de entrada
    if (!input.programaId || typeof input.programaId !== 'number' || input.programaId <= 0) {
      throw new ProgramaNotFoundError(input.programaId);
    }

    if (input.nombre !== undefined) {
      if (typeof input.nombre !== 'string') {
        throw new InvalidProgramaNombreError('', 'El nombre debe ser una cadena de texto');
      }
      const nombreTrimmed = input.nombre.trim();
      if (nombreTrimmed.length === 0) {
        throw new InvalidProgramaNombreError('', 'El nombre no puede estar vacío');
      }
      if (nombreTrimmed.length > 500) {
        throw new InvalidProgramaNombreError(nombreTrimmed, 'El nombre no puede tener más de 500 caracteres');
      }
    }

    if (input.descripcion !== undefined) {
      if (typeof input.descripcion !== 'string') {
        throw new InvalidProgramaDescripcionError('', 'La descripción debe ser una cadena de texto');
      }
      const descripcionTrimmed = input.descripcion.trim();
      if (descripcionTrimmed.length === 0) {
        throw new InvalidProgramaDescripcionError('', 'La descripción no puede estar vacía');
      }
      if (descripcionTrimmed.length > 5000) {
        throw new InvalidProgramaDescripcionError(descripcionTrimmed, 'La descripción no puede tener más de 5000 caracteres');
      }
    }

    // Verificar que el programa existe
    const existingPrograma = await this.programaRepo.findById(input.programaId);
    if (!existingPrograma) {
      throw new ProgramaNotFoundError(input.programaId);
    }

    try {
      const result = await this.programaRepo.update(
        input.programaId,
        input.nombre,
        input.descripcion,
        input.userId,
        tx
      );
      if (!result) {
        throw new ProgramaNotFoundError(input.programaId);
      }
      logger.info({ ...logContext, programaId: result.id }, 'Programa actualizado exitosamente');
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al actualizar programa');

      if (error instanceof ProgramaNotFoundError) {
        throw error;
      }
      throw error;
    }
  }
}

