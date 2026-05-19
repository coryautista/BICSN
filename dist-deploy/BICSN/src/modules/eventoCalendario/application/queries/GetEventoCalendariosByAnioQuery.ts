import { IEventoCalendarioRepository } from '../../domain/repositories/IEventoCalendarioRepository.js';
import { EventoCalendario } from '../../domain/entities/EventoCalendario.js';
import { InvalidEventoCalendarioDataError, EventoCalendarioQueryError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getEventoCalendariosByAnioQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetEventoCalendariosByAnioQuery {
  constructor(private eventoCalendarioRepo: IEventoCalendarioRepository) {}

  async execute(anio: number): Promise<EventoCalendario[]> {
    // Validaciones de entrada
    this.validateInput(anio);

    const logContext = {
      operation: 'getEventoCalendariosByAnio',
      anio: anio
    };

    logger.info(logContext, 'Consultando eventos de calendario por año');

    try {
      const eventos = await this.eventoCalendarioRepo.findByAnio(anio);

      logger.info({
        ...logContext,
        count: eventos.length
      }, 'Eventos de calendario por año consultados exitosamente');

      return eventos;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar eventos de calendario por año');

      throw new EventoCalendarioQueryError('consulta por año', {
        originalError: error.message,
        anio: anio
      });
    }
  }

  private validateInput(anio: number): void {
    // Validar anio
    if (!anio || typeof anio !== 'number' || anio < 1900 || anio > 2100) {
      throw new InvalidEventoCalendarioDataError('anio', 'Es requerido y debe estar entre 1900 y 2100');
    }
  }
}
