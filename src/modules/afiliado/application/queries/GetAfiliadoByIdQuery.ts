import { IAfiliadoRepository } from '../../domain/repositories/IAfiliadoRepository.js';
import { Afiliado } from '../../domain/entities/Afiliado.js';
import pino from 'pino';
import {
  AfiliadoNotFoundError,
  InvalidAfiliadoDataError,
  AfiliadoQueryError
} from '../../domain/errors.js';

const logger = pino({
  name: 'getAfiliadoByIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAfiliadoByIdQuery {
  constructor(private afiliadoRepo: IAfiliadoRepository) {}

  async execute(id: number): Promise<Afiliado> {
    const logContext = {
      operation: 'getAfiliadoById',
      afiliadoId: id
    };

    logger.info(logContext, 'Consultando afiliado por ID');

    // Validar que el ID sea válido
    if (!id || id <= 0) {
      logger.warn(logContext, 'ID de afiliado inválido para consulta');
      throw new InvalidAfiliadoDataError('id', 'ID de afiliado inválido');
    }

    try {
      const afiliado = await this.afiliadoRepo.findById(id);
      if (!afiliado) {
        logger.warn(logContext, 'Afiliado no encontrado');
        throw new AfiliadoNotFoundError({ id });
      }

      logger.info({ ...logContext, found: true }, 'Afiliado encontrado exitosamente');
      return afiliado;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al consultar afiliado por ID');

      if (error instanceof AfiliadoNotFoundError || error instanceof InvalidAfiliadoDataError) {
        throw error;
      }

      throw new AfiliadoQueryError('Error al consultar afiliado por ID', {
        originalError: errorMessage,
        afiliadoId: id
      });
    }
  }
}
