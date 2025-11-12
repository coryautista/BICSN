import { IAfiliadoRepository } from '../../domain/repositories/IAfiliadoRepository.js';
import { Afiliado, UpdateAfiliadoData } from '../../domain/entities/Afiliado.js';
import pino from 'pino';
import {
  AfiliadoNotFoundError,
  AfiliadoUpdateError,
  InvalidAfiliadoDataError
} from '../../domain/errors.js';

const logger = pino({
  name: 'updateAfiliadoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class UpdateAfiliadoCommand {
  constructor(private afiliadoRepo: IAfiliadoRepository) {}

  async execute(data: UpdateAfiliadoData): Promise<Afiliado> {
    const logContext = {
      operation: 'updateAfiliado',
      afiliadoId: data.id
    };

    logger.info(logContext, 'Iniciando actualización de afiliado');

    // Validar que el ID sea válido
    if (!data.id || data.id <= 0) {
      logger.warn(logContext, 'ID de afiliado inválido para actualización');
      throw new InvalidAfiliadoDataError('id', 'ID de afiliado inválido');
    }

    try {
      const exists = await this.afiliadoRepo.findById(data.id);
      if (!exists) {
        logger.warn(logContext, 'Afiliado no encontrado para actualización');
        throw new AfiliadoNotFoundError({ id: data.id });
      }

      const result = await this.afiliadoRepo.update(data);
      logger.info({ ...logContext, success: true }, 'Afiliado actualizado exitosamente');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al actualizar afiliado');

      if (error instanceof AfiliadoNotFoundError) {
        throw error;
      }

      throw new AfiliadoUpdateError('Error al actualizar afiliado', {
        originalError: errorMessage,
        afiliadoId: data.id
      });
    }
  }
}
