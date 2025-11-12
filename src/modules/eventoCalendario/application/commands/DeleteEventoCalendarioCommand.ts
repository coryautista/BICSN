import { IEventoCalendarioRepository } from '../../domain/repositories/IEventoCalendarioRepository.js';
import { DeleteEventoCalendarioData } from '../../domain/entities/EventoCalendario.js';
import {
  EventoCalendarioNotFoundError,
  InvalidEventoCalendarioDataError,
  EventoCalendarioCommandError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteEventoCalendarioCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class DeleteEventoCalendarioCommand {
  constructor(private eventoCalendarioRepo: IEventoCalendarioRepository) {}

  async execute(data: DeleteEventoCalendarioData): Promise<number> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'deleteEventoCalendario',
      id: data.id
    };

    logger.info(logContext, 'Eliminando evento de calendario');

    try {
      const deletedId = await this.eventoCalendarioRepo.delete(data.id);

      logger.info({
        ...logContext,
        deletedId: deletedId
      }, 'Evento de calendario eliminado exitosamente');

      return deletedId;

    } catch (error: any) {
      if (error instanceof EventoCalendarioNotFoundError ||
          error instanceof InvalidEventoCalendarioDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al eliminar evento de calendario');

      throw new EventoCalendarioCommandError('eliminación', {
        originalError: error.message,
        id: data.id
      });
    }
  }

  private validateInput(data: DeleteEventoCalendarioData): void {
    // Validar id
    if (!data.id || typeof data.id !== 'number' || data.id <= 0) {
      throw new InvalidEventoCalendarioDataError('id', 'Es requerido y debe ser un número positivo');
    }
  }
}
