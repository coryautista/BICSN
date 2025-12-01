import { ILineaEstrategicaRepository } from '../../domain/repositories/ILineaEstrategicaRepository.js';
import { LineaEstrategica } from '../../domain/entities/LineaEstrategica.js';
import { LineaEstrategicaNotFoundError, InvalidLineaEstrategicaNombreError, InvalidLineaEstrategicaDescripcionError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'updateLineaEstrategicaCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface UpdateLineaEstrategicaInput {
  lineaEstrategicaId: number;
  nombre?: string;
  descripcion?: string;
  userId?: string;
}

export class UpdateLineaEstrategicaCommand {
  constructor(private lineaEstrategicaRepo: ILineaEstrategicaRepository) {}

  async execute(input: UpdateLineaEstrategicaInput, tx?: sql.Transaction): Promise<LineaEstrategica> {
    const logContext = {
      operation: 'updateLineaEstrategica',
      lineaEstrategicaId: input.lineaEstrategicaId,
      userId: input.userId
    };

    logger.info(logContext, 'Iniciando actualización de línea estratégica');

    // Validación de entrada
    if (!input.lineaEstrategicaId || typeof input.lineaEstrategicaId !== 'number' || input.lineaEstrategicaId <= 0) {
      throw new LineaEstrategicaNotFoundError(input.lineaEstrategicaId);
    }

    if (input.nombre !== undefined) {
      if (typeof input.nombre !== 'string') {
        throw new InvalidLineaEstrategicaNombreError('', 'El nombre debe ser una cadena de texto');
      }
      const nombreTrimmed = input.nombre.trim();
      if (nombreTrimmed.length === 0) {
        throw new InvalidLineaEstrategicaNombreError('', 'El nombre no puede estar vacío');
      }
      if (nombreTrimmed.length > 500) {
        throw new InvalidLineaEstrategicaNombreError(nombreTrimmed, 'El nombre no puede tener más de 500 caracteres');
      }
    }

    if (input.descripcion !== undefined) {
      if (typeof input.descripcion !== 'string') {
        throw new InvalidLineaEstrategicaDescripcionError('', 'La descripción debe ser una cadena de texto');
      }
      const descripcionTrimmed = input.descripcion.trim();
      if (descripcionTrimmed.length === 0) {
        throw new InvalidLineaEstrategicaDescripcionError('', 'La descripción no puede estar vacía');
      }
      if (descripcionTrimmed.length > 5000) {
        throw new InvalidLineaEstrategicaDescripcionError(descripcionTrimmed, 'La descripción no puede tener más de 5000 caracteres');
      }
    }

    // Verificar que la línea estratégica existe
    const existingLineaEstrategica = await this.lineaEstrategicaRepo.findById(input.lineaEstrategicaId);
    if (!existingLineaEstrategica) {
      throw new LineaEstrategicaNotFoundError(input.lineaEstrategicaId);
    }

    try {
      const result = await this.lineaEstrategicaRepo.update(
        input.lineaEstrategicaId,
        input.nombre,
        input.descripcion,
        input.userId,
        tx
      );
      if (!result) {
        throw new LineaEstrategicaNotFoundError(input.lineaEstrategicaId);
      }
      logger.info({ ...logContext, lineaEstrategicaId: result.id }, 'Línea estratégica actualizada exitosamente');
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al actualizar línea estratégica');

      if (error instanceof LineaEstrategicaNotFoundError) {
        throw error;
      }
      throw error;
    }
  }
}

