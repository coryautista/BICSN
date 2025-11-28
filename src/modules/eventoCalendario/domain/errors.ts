import { DomainError } from '../../../utils/errors.js';

export class EventoCalendarioError extends DomainError {
  constructor(message: string, operation: string, details?: Record<string, any>) {
    super(message, `EVENTO_CALENDARIO_${operation.toUpperCase()}_ERROR`, 500, details);
  }
}

export class EventoCalendarioNotFoundError extends EventoCalendarioError {
  constructor(id: number) {
    super(
      `Evento de calendario con ID ${id} no encontrado`,
      'findById',
      { id }
    );
  }
}

export class EventoCalendarioByAnioNotFoundError extends EventoCalendarioError {
  constructor(anio: number) {
    super(
      `No se encontraron eventos de calendario para el año ${anio}`,
      'findByAnio',
      { anio }
    );
  }
}

export class EventoCalendarioByDateRangeNotFoundError extends EventoCalendarioError {
  constructor(fechaInicio: string, fechaFin: string) {
    super(
      `No se encontraron eventos de calendario en el rango ${fechaInicio} - ${fechaFin}`,
      'findByDateRange',
      { fechaInicio, fechaFin }
    );
  }
}

export class DuplicateEventoCalendarioError extends EventoCalendarioError {
  constructor(fecha: string, tipo: string) {
    super(
      `Ya existe un evento de calendario para la fecha '${fecha}' con tipo '${tipo}'`,
      'create',
      { fecha, tipo }
    );
  }
}

export class InvalidEventoCalendarioDataError extends EventoCalendarioError {
  constructor(field: string, reason: string) {
    super(
      `Campo '${field}' inválido: ${reason}`,
      'validation',
      { field, reason }
    );
  }
}

export class InvalidEventoCalendarioTipoError extends EventoCalendarioError {
  constructor(tipo: string) {
    super(
      `Tipo de evento '${tipo}' no válido. Los tipos válidos son: FERIADO, VACACIONES, EVENTO_ESPECIAL, DIA_NO_LABORABLE, ALTA_BAJA_CAMBIO`,
      'tipoValidation',
      { tipo }
    );
  }
}

export class InvalidEventoCalendarioFechaError extends EventoCalendarioError {
  constructor(fecha: string) {
    super(
      `Fecha '${fecha}' inválida. Debe estar en formato YYYY-MM-DD`,
      'fechaValidation',
      { fecha }
    );
  }
}

export class InvalidEventoCalendarioAnioError extends EventoCalendarioError {
  constructor(anio: number) {
    super(
      `Año ${anio} inválido. Debe estar entre 1900 y 2100`,
      'anioValidation',
      { anio }
    );
  }
}

export class EventoCalendarioQueryError extends EventoCalendarioError {
  constructor(operation: string, details?: Record<string, any>) {
    super(
      `Error en consulta de eventos de calendario: ${operation}`,
      'query',
      details
    );
  }
}

export class EventoCalendarioCommandError extends EventoCalendarioError {
  constructor(operation: string, details?: Record<string, any>) {
    super(
      `Error en comando de eventos de calendario: ${operation}`,
      'command',
      details
    );
  }
}

export class EventoCalendariosNotFoundError extends EventoCalendarioError {
  constructor() {
    super(
      'No se encontraron eventos de calendario en el sistema',
      'findAll',
      {}
    );
  }
}