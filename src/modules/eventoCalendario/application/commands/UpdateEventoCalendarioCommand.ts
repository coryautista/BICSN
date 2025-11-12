import { IEventoCalendarioRepository } from '../../domain/repositories/IEventoCalendarioRepository.js';
import { EventoCalendario, UpdateEventoCalendarioData } from '../../domain/entities/EventoCalendario.js';
import {
  EventoCalendarioNotFoundError,
  InvalidEventoCalendarioDataError,
  InvalidEventoCalendarioTipoError,
  InvalidEventoCalendarioFechaError,
  InvalidEventoCalendarioAnioError,
  DuplicateEventoCalendarioError,
  EventoCalendarioCommandError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'updateEventoCalendarioCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class UpdateEventoCalendarioCommand {
  constructor(private eventoCalendarioRepo: IEventoCalendarioRepository) {}

  async execute(data: UpdateEventoCalendarioData): Promise<EventoCalendario> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'updateEventoCalendario',
      id: data.id,
      fecha: data.fecha,
      tipo: data.tipo,
      anio: data.anio
    };

    logger.info(logContext, 'Actualizando evento de calendario');

    try {
      const result = await this.eventoCalendarioRepo.update(data);

      logger.info({
        ...logContext,
        updated: true
      }, 'Evento de calendario actualizado exitosamente');

      return result;

    } catch (error: any) {
      // Manejo específico de errores de base de datos
      if (error.code === '23505') { // Unique constraint violation
        logger.warn({ ...logContext }, 'Conflicto de unicidad al actualizar evento de calendario');
        throw new DuplicateEventoCalendarioError(data.fecha || 'desconocida', data.tipo || 'desconocido');
      }

      if (error instanceof EventoCalendarioNotFoundError ||
          error instanceof InvalidEventoCalendarioDataError ||
          error instanceof InvalidEventoCalendarioTipoError ||
          error instanceof InvalidEventoCalendarioFechaError ||
          error instanceof InvalidEventoCalendarioAnioError ||
          error instanceof DuplicateEventoCalendarioError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al actualizar evento de calendario');

      throw new EventoCalendarioCommandError('actualización', {
        originalError: error.message,
        data: logContext
      });
    }
  }

  private validateInput(data: UpdateEventoCalendarioData): void {
    // Validar id
    if (!data.id || typeof data.id !== 'number' || data.id <= 0) {
      throw new InvalidEventoCalendarioDataError('id', 'Es requerido y debe ser un número positivo');
    }

    // Validar fecha (opcional)
    if (data.fecha !== undefined) {
      if (typeof data.fecha !== 'string') {
        throw new InvalidEventoCalendarioDataError('fecha', 'Debe ser una cadena');
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
    }

    // Validar tipo (opcional)
    if (data.tipo !== undefined) {
      if (typeof data.tipo !== 'string') {
        throw new InvalidEventoCalendarioDataError('tipo', 'Debe ser una cadena');
      }

      const validTipos = ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'PAGO', 'HIPOTECARIO'];
      if (!validTipos.includes(data.tipo)) {
        throw new InvalidEventoCalendarioTipoError(data.tipo);
      }
    }

    // Validar anio (opcional)
    if (data.anio !== undefined) {
      if (typeof data.anio !== 'number') {
        throw new InvalidEventoCalendarioDataError('anio', 'Debe ser un número');
      }

      if (data.anio < 1900 || data.anio > 2100) {
        throw new InvalidEventoCalendarioAnioError(data.anio);
      }
    }

    // Si se proporciona fecha y anio, validar que coincidan
    if (data.fecha && data.anio !== undefined) {
      const fechaDate = new Date(data.fecha);
      const fechaAnio = fechaDate.getFullYear();
      if (fechaAnio !== data.anio) {
        throw new InvalidEventoCalendarioDataError('anio', `Debe coincidir con el año de la fecha (${fechaAnio})`);
      }
    }
  }
}
