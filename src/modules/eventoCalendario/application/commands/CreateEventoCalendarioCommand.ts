import { IEventoCalendarioRepository } from '../../domain/repositories/IEventoCalendarioRepository.js';
import { EventoCalendario, CreateEventoCalendarioData } from '../../domain/entities/EventoCalendario.js';
import {
  DuplicateEventoCalendarioError,
  InvalidEventoCalendarioDataError,
  InvalidEventoCalendarioTipoError,
  InvalidEventoCalendarioFechaError,
  InvalidEventoCalendarioAnioError,
  EventoCalendarioCommandError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'createEventoCalendarioCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class CreateEventoCalendarioCommand {
  constructor(private eventoCalendarioRepo: IEventoCalendarioRepository) {}

  async execute(data: CreateEventoCalendarioData): Promise<EventoCalendario> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'createEventoCalendario',
      fecha: data.fecha,
      tipo: data.tipo,
      anio: data.anio
    };

    logger.info(logContext, 'Creando nuevo evento de calendario');

    try {
      const result = await this.eventoCalendarioRepo.create(data);

      logger.info({
        ...logContext,
        id: result.id,
        createdAt: result.createdAt
      }, 'Evento de calendario creado exitosamente');

      return result;

    } catch (error: any) {
      // Manejo específico de errores de base de datos
      if (error.code === '23505') { // Unique constraint violation
        logger.warn({ ...logContext }, 'Intento de crear evento de calendario duplicado');
        throw new DuplicateEventoCalendarioError(data.fecha, data.tipo);
      }

      if (error instanceof DuplicateEventoCalendarioError ||
          error instanceof InvalidEventoCalendarioDataError ||
          error instanceof InvalidEventoCalendarioTipoError ||
          error instanceof InvalidEventoCalendarioFechaError ||
          error instanceof InvalidEventoCalendarioAnioError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al crear evento de calendario');

      throw new EventoCalendarioCommandError('creación', {
        originalError: error.message,
        data: logContext
      });
    }
  }

  private validateInput(data: CreateEventoCalendarioData): void {
    // Validar fecha
    if (!data.fecha || typeof data.fecha !== 'string') {
      throw new InvalidEventoCalendarioDataError('fecha', 'Es requerida y debe ser una cadena');
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(data.fecha)) {
      throw new InvalidEventoCalendarioFechaError(data.fecha);
    }

    // Validar que la fecha sea válida
    const fechaDate = new Date(data.fecha);
    if (isNaN(fechaDate.getTime())) {
      throw new InvalidEventoCalendarioFechaError(data.fecha);
    }

    // Validar tipo
    if (!data.tipo || typeof data.tipo !== 'string') {
      throw new InvalidEventoCalendarioDataError('tipo', 'Es requerido y debe ser una cadena');
    }

    const validTipos = ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'PAGO', 'HIPOTECARIO'];
    if (!validTipos.includes(data.tipo)) {
      throw new InvalidEventoCalendarioTipoError(data.tipo);
    }

    // Validar anio
    if (data.anio === undefined || data.anio === null || typeof data.anio !== 'number') {
      throw new InvalidEventoCalendarioDataError('anio', 'Es requerido y debe ser un número');
    }

    if (data.anio < 1900 || data.anio > 2100) {
      throw new InvalidEventoCalendarioAnioError(data.anio);
    }

    // Validar que el año de la fecha coincida con el campo anio
    const fechaAnio = fechaDate.getFullYear();
    if (fechaAnio !== data.anio) {
      throw new InvalidEventoCalendarioDataError('anio', `Debe coincidir con el año de la fecha (${fechaAnio})`);
    }
  }
}
