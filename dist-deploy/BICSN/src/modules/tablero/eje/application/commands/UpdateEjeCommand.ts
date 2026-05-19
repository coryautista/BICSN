import { IEjeRepository } from '../../domain/repositories/IEjeRepository.js';
import { Eje } from '../../domain/entities/Eje.js';
import { EjeNotFoundError, InvalidEjeNombreError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'updateEjeCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface UpdateEjeInput {
  ejeId: number;
  nombre: string;
  userId?: string;
}

export class UpdateEjeCommand {
  constructor(private ejeRepo: IEjeRepository) {}

  async execute(input: UpdateEjeInput, tx?: sql.Transaction): Promise<Eje> {
    const logContext = {
      operation: 'updateEje',
      ejeId: input.ejeId,
      nombre: input.nombre,
      userId: input.userId
    };

    logger.info(logContext, 'Iniciando actualización de eje');

    // Validación de entrada
    if (!input.ejeId || typeof input.ejeId !== 'number' || input.ejeId <= 0) {
      throw new EjeNotFoundError(input.ejeId);
    }

    if (!input.nombre || typeof input.nombre !== 'string') {
      throw new InvalidEjeNombreError('', 'El nombre es requerido y debe ser una cadena de texto');
    }

    const nombreTrimmed = input.nombre.trim();
    if (nombreTrimmed.length === 0) {
      throw new InvalidEjeNombreError('', 'El nombre no puede estar vacío');
    }

    if (nombreTrimmed.length > 500) {
      throw new InvalidEjeNombreError(nombreTrimmed, 'El nombre no puede tener más de 500 caracteres');
    }

    // Verificar que el eje existe
    const existingEje = await this.ejeRepo.findById(input.ejeId);
    if (!existingEje) {
      throw new EjeNotFoundError(input.ejeId);
    }

    try {
      const result = await this.ejeRepo.update(input.ejeId, nombreTrimmed, input.userId, tx);
      if (!result) {
        throw new EjeNotFoundError(input.ejeId);
      }
      logger.info({ ...logContext, ejeId: result.id }, 'Eje actualizado exitosamente');
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al actualizar eje');

      if (error instanceof EjeNotFoundError) {
        throw error;
      }
      throw error;
    }
  }
}

