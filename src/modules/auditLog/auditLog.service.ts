import { getAuditLogsByDateRange } from './auditLog.repo.js';
import pino from 'pino';
import {
  AuditLogInvalidDateRangeError,
  AuditLogInvalidDateFormatError,
  AuditLogDateRangeTooLargeError,
  AuditLogFutureDateError,
  AuditLogQueryFailedError,
  AuditLogConnectionError,
  AuditLogDataNotFoundError
} from './domain/errors.js';

const logger = pino({
  name: 'auditLog-service',
  level: process.env.LOG_LEVEL || 'info'
});

export async function getAuditLogsService(fechaInicio: string, fechaFin: string, userId?: string): Promise<any[]> {
  const logContext = {
    operation: 'getAuditLogs',
    fechaInicio,
    fechaFin,
    userId,
    timestamp: new Date().toISOString()
  };

  logger.info(logContext, 'Consultando logs de auditoría por rango de fechas');

  try {
    // Validar formato de fechas
    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);

    if (isNaN(startDate.getTime())) {
      logger.warn({ ...logContext, invalidDate: fechaInicio }, 'Fecha de inicio inválida');
      throw new AuditLogInvalidDateFormatError(fechaInicio);
    }

    if (isNaN(endDate.getTime())) {
      logger.warn({ ...logContext, invalidDate: fechaFin }, 'Fecha de fin inválida');
      throw new AuditLogInvalidDateFormatError(fechaFin);
    }

    // Validar que fecha de inicio sea anterior a fecha de fin
    if (startDate >= endDate) {
      logger.warn(logContext, 'Fecha de inicio debe ser anterior a fecha de fin');
      throw new AuditLogInvalidDateRangeError(fechaInicio, fechaFin);
    }

    // Validar que no se consulten fechas futuras
    const now = new Date();
    if (endDate > now) {
      logger.warn({ ...logContext, futureDate: fechaFin }, 'No se pueden consultar logs de fechas futuras');
      throw new AuditLogFutureDateError(fechaFin);
    }

    // Validar rango máximo (ejemplo: máximo 90 días)
    const maxDays = 90;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > maxDays) {
      logger.warn({ ...logContext, diffDays, maxDays }, 'Rango de fechas demasiado grande');
      throw new AuditLogDateRangeTooLargeError(fechaInicio, fechaFin, maxDays, diffDays);
    }

    const records = await getAuditLogsByDateRange(fechaInicio, fechaFin);

    if (!records || records.length === 0) {
      logger.info(logContext, 'No se encontraron logs de auditoría en el rango especificado');
      throw new AuditLogDataNotFoundError({ fechaInicio, fechaFin, diffDays });
    }

    logger.info({ ...logContext, recordCount: records.length, diffDays }, 'Logs de auditoría obtenidos exitosamente');
    return records;

  } catch (error: any) {
    if (error instanceof AuditLogInvalidDateFormatError ||
        error instanceof AuditLogInvalidDateRangeError ||
        error instanceof AuditLogDateRangeTooLargeError ||
        error instanceof AuditLogFutureDateError ||
        error instanceof AuditLogDataNotFoundError) {
      throw error; // Re-throw domain errors as-is
    }

    // Handle database connection errors
    if (error.code === 'ECONNREFUSED' || error.message?.includes('connection')) {
      logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error de conexión con base de datos de auditoría');
      throw new AuditLogConnectionError('Error de conexión con base de datos de auditoría', { originalError: error.message });
    }

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Timeout en consulta de logs de auditoría');
      throw new AuditLogQueryFailedError('getAuditLogsByDateRange', { originalError: error.message, timeout: true });
    }

    logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error al consultar logs de auditoría');
    throw new AuditLogQueryFailedError('getAuditLogsByDateRange', { originalError: error.message });
  }
}