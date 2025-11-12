import { IAuditLogRepository } from '../../domain/repositories/IAuditLogRepository.js';
import { AuditLog, GetAuditLogsByDateRangeData } from '../../domain/entities/AuditLog.js';
import {
  AuditLogInvalidDateRangeError,
  AuditLogInvalidDateFormatError,
  AuditLogDateRangeTooLargeError,
  AuditLogFutureDateError,
  AuditLogQueryFailedError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getAuditLogsByDateRangeQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAuditLogsByDateRangeQuery {
  constructor(private auditLogRepo: IAuditLogRepository) {}

  async execute(data: GetAuditLogsByDateRangeData): Promise<AuditLog[]> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'getAuditLogsByDateRange',
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin
    };

    logger.info(logContext, 'Consultando logs de auditoría por rango de fechas');

    try {
      const results = await this.auditLogRepo.findByDateRange(data.fechaInicio, data.fechaFin);

      logger.info({
        ...logContext,
        resultsCount: results.length,
        results: results.map(r => ({
          id: r.id,
          entidad: r.entidad,
          entidadId: r.entidadId,
          accion: r.accion,
          fecha: r.fecha,
          userId: r.userId,
          appName: r.appName
        }))
      }, 'Consulta de logs de auditoría por rango de fechas completada exitosamente');

      return results;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar logs de auditoría por rango de fechas');

      throw new AuditLogQueryFailedError('consulta por rango de fechas', {
        originalError: error.message,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin
      });
    }
  }

  private validateInput(data: GetAuditLogsByDateRangeData): void {
    // Validar que las fechas estén presentes
    if (!data.fechaInicio || !data.fechaFin) {
      throw new AuditLogInvalidDateRangeError(
        data.fechaInicio || 'null',
        data.fechaFin || 'null'
      );
    }

    // Validar formato de fechas (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.fechaInicio)) {
      throw new AuditLogInvalidDateFormatError(data.fechaInicio);
    }
    if (!dateRegex.test(data.fechaFin)) {
      throw new AuditLogInvalidDateFormatError(data.fechaFin);
    }

    // Validar que las fechas sean válidas
    const fechaInicio = new Date(data.fechaInicio + 'T00:00:00.000Z');
    const fechaFin = new Date(data.fechaFin + 'T23:59:59.999Z');

    if (isNaN(fechaInicio.getTime())) {
      throw new AuditLogInvalidDateFormatError(data.fechaInicio);
    }
    if (isNaN(fechaFin.getTime())) {
      throw new AuditLogInvalidDateFormatError(data.fechaFin);
    }

    // Validar que fechaInicio no sea posterior a fechaFin
    if (fechaInicio > fechaFin) {
      throw new AuditLogInvalidDateRangeError(data.fechaInicio, data.fechaFin);
    }

    // Validar que no se consulten fechas futuras
    const now = new Date();
    if (fechaFin > now) {
      throw new AuditLogFutureDateError(data.fechaFin);
    }

    // Validar rango máximo de 90 días
    const maxDays = 90;
    const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > maxDays) {
      throw new AuditLogDateRangeTooLargeError(data.fechaInicio, data.fechaFin, maxDays, diffDays);
    }
  }
}
