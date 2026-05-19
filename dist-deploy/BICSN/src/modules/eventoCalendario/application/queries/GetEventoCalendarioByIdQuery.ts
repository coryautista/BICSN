import { IEventoCalendarioRepository } from '../../domain/repositories/IEventoCalendarioRepository.js';
import { EventoCalendario } from '../../domain/entities/EventoCalendario.js';
import {
  EventoCalendarioNotFoundError,
  InvalidEventoCalendarioDataError,
  EventoCalendarioQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getEventoCalendarioByIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetEventoCalendarioByIdQuery {
  constructor(private eventoCalendarioRepo: IEventoCalendarioRepository) {}

  async execute(id: number): Promise<EventoCalendario> {
    // Validaciones de entrada
    this.validateInput(id);

    const logContext = {
      operation: 'getEventoCalendarioById',
      id: id
    };

    logger.info(logContext, 'Consultando evento de calendario por ID');

    try {
      const eventoCalendario = await this.eventoCalendarioRepo.findById(id);

      if (!eventoCalendario) {
        logger.warn(logContext, 'Evento de calendario no encontrado');
        throw new EventoCalendarioNotFoundError(id);
      }

      logger.info({
        ...logContext,
        found: true,
        tipo: eventoCalendario.tipo,
        anio: eventoCalendario.anio
      }, 'Evento de calendario encontrado exitosamente');

      return eventoCalendario;

    } catch (error: any) {
      if (error instanceof EventoCalendarioNotFoundError ||
          error instanceof InvalidEventoCalendarioDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar evento de calendario por ID');

      throw new EventoCalendarioQueryError('consulta por ID', {
        originalError: error.message,
        id: id
      });
    }
  }

  private validateInput(id: number): void {
    // Validar id
    if (!id || typeof id !== 'number' || id <= 0) {
      throw new InvalidEventoCalendarioDataError('id', 'Es requerido y debe ser un número positivo');
    }
  }
}
