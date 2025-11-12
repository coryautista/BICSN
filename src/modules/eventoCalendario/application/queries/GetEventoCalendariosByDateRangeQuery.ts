import { IEventoCalendarioRepository } from '../../domain/repositories/IEventoCalendarioRepository.js';
import { EventoCalendario } from '../../domain/entities/EventoCalendario.js';
import {
  InvalidEventoCalendarioDataError,
  InvalidEventoCalendarioTipoError,
  EventoCalendarioQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getEventoCalendariosByDateRangeQuery',
  level: process.env.LOG_LEVEL || 'info'
});

const TIPOS_VALIDOS = ['FERIADO', 'VACACIONES', 'EVENTO_ESPECIAL', 'DIA_NO_LABORABLE'];

export class GetEventoCalendariosByDateRangeQuery {
  constructor(private eventoCalendarioRepo: IEventoCalendarioRepository) {}

  async execute(fechaInicio: string, fechaFin: string, tipo?: string): Promise<EventoCalendario[]> {
    // Validaciones de entrada
    this.validateInput(fechaInicio, fechaFin, tipo);

    const logContext = {
      operation: 'getEventoCalendariosByDateRange',
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
      tipo: tipo
    };

    logger.info(logContext, 'Consultando eventos de calendario por rango de fechas');

    try {
      const eventos = await this.eventoCalendarioRepo.findByDateRange(fechaInicio, fechaFin, tipo);

      logger.info({
        ...logContext,
        count: eventos.length
      }, 'Eventos de calendario por rango de fechas consultados exitosamente');

      return eventos;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar eventos de calendario por rango de fechas');

      throw new EventoCalendarioQueryError('consulta por rango de fechas', {
        originalError: error.message,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        tipo: tipo
      });
    }
  }

  private validateInput(fechaInicio: string, fechaFin: string, tipo?: string): void {
    // Validar fechas
    if (!fechaInicio || typeof fechaInicio !== 'string') {
      throw new InvalidEventoCalendarioDataError('fechaInicio', 'Es requerida y debe ser una cadena de texto');
    }

    if (!fechaFin || typeof fechaFin !== 'string') {
      throw new InvalidEventoCalendarioDataError('fechaFin', 'Es requerida y debe ser una cadena de texto');
    }

    // Validar formato de fecha YYYY-MM-DD
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fechaInicio)) {
      throw new InvalidEventoCalendarioDataError('fechaInicio', 'Debe tener formato YYYY-MM-DD');
    }

    if (!fechaRegex.test(fechaFin)) {
      throw new InvalidEventoCalendarioDataError('fechaFin', 'Debe tener formato YYYY-MM-DD');
    }

    // Validar que fechaInicio sea anterior o igual a fechaFin
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (inicio > fin) {
      throw new InvalidEventoCalendarioDataError('fechaInicio', 'Debe ser anterior o igual a fechaFin');
    }

    // Validar tipo si se proporciona
    if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
      throw new InvalidEventoCalendarioTipoError(tipo);
    }
  }
}
