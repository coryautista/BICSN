import { IEstadoRepository } from '../../domain/repositories/IEstadoRepository.js';
import { Estado } from '../../domain/entities/Estado.js';
import {
  EstadoNotFoundError,
  InvalidEstadoDataError,
  EstadoQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getEstadoByIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetEstadoByIdQuery {
  constructor(private estadoRepo: IEstadoRepository) {}

  async execute(estadoId: string): Promise<Estado> {
    // Validaciones de entrada
    this.validateInput(estadoId);

    const logContext = {
      operation: 'getEstadoById',
      estadoId: estadoId
    };

    logger.info(logContext, 'Consultando estado por ID');

    try {
      const result = await this.estadoRepo.findById(estadoId);

      if (!result) {
        logger.warn({ ...logContext }, 'Estado no encontrado por ID');
        throw new EstadoNotFoundError(estadoId);
      }

      logger.info({
        ...logContext,
        nombreEstado: result.nombreEstado,
        esValido: result.esValido
      }, 'Consulta de estado por ID completada exitosamente');

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
      }, 'Error al consultar estado por ID');

      throw new EstadoQueryError('consulta por ID', {
        originalError: error.message,
        estadoId: estadoId
      });
    }
  }

  private validateInput(estadoId: string): void {
    // Validar estadoId
    if (!estadoId || typeof estadoId !== 'string' || estadoId.trim().length === 0) {
      throw new InvalidEstadoDataError('estadoId', 'Es requerido y debe ser una cadena no vacía');
    }
  }
}
