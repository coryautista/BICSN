import { DomainError } from '../../../utils/errors.js';

/**
 * Errores específicos del dominio Reportes
 */

// Error base para el dominio Reportes
export class ReportError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message, code, statusCode, details);
  }
}

// Error cuando los filtros del reporte son inválidos
export class InvalidReportFiltersError extends ReportError {
  constructor(details?: any) {
    super(
      'Los filtros del reporte proporcionados son inválidos',
      'INVALID_FILTERS',
      400,
      details
    );
  }
}

// Error cuando un reporte no se encuentra
export class ReportNotFoundError extends ReportError {
  constructor(id?: string | number) {
    super(
      id ? `Reporte con ID ${id} no encontrado` : 'Reporte no encontrado',
      'REPORT_NOT_FOUND',
      404,
      { id }
    );
  }
}

// Error cuando el rango de fechas es inválido
export class InvalidDateRangeError extends ReportError {
  constructor(reason?: string) {
    super(
      reason ? `Rango de fechas inválido: ${reason}` : 'Rango de fechas inválido proporcionado',
      'INVALID_DATE_RANGE',
      400,
      { reason }
    );
  }
}

// Error cuando falta el mes o año en los filtros
export class MissingMonthOrYearError extends ReportError {
  constructor() {
    super(
      'El mes y el año son requeridos en los filtros',
      'MISSING_MONTH_OR_YEAR',
      400
    );
  }
}

// Error cuando el mes es inválido
export class InvalidMonthError extends ReportError {
  constructor(month: number) {
    super(
      `El mes debe estar entre 1 y 12, se proporcionó: ${month}`,
      'INVALID_MONTH',
      400,
      { month }
    );
  }
}

// Error cuando el año es inválido
export class InvalidYearError extends ReportError {
  constructor(year: number) {
    super(
      `Año inválido proporcionado: ${year}`,
      'INVALID_YEAR',
      400,
      { year }
    );
  }
}

// Error de base de datos
export class ReportDatabaseError extends ReportError {
  constructor(message: string, details?: any) {
    super(
      `Error de base de datos en reportes: ${message}`,
      'DATABASE_ERROR',
      500,
      details
    );
  }
}