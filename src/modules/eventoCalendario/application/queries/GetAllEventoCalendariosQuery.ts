import { IEventoCalendarioRepository } from '../../domain/repositories/IEventoCalendarioRepository.js';
import { EventoCalendario } from '../../domain/entities/EventoCalendario.js';
import { EventoCalendarioQueryError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getAllEventoCalendariosQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAllEventoCalendariosQuery {
  constructor(private eventoCalendarioRepo: IEventoCalendarioRepository) {}

  async execute(): Promise<EventoCalendario[]> {
    const logContext = {
      operation: 'getAllEventoCalendarios'
    };

    logger.info(logContext, 'Consultando todos los eventos de calendario');

    try {
      const eventos = await this.eventoCalendarioRepo.findAll();

      logger.info({
        ...logContext,
        count: eventos.length
      }, 'Eventos de calendario consultados exitosamente');

      return eventos;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar todos los eventos de calendario');

      throw new EventoCalendarioQueryError('consulta general', {
        originalError: error.message
      });
    }
  }
}
