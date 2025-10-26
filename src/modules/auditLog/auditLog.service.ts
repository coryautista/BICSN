import { getAuditLogsByDateRange } from './auditLog.repo.js';

export async function getAuditLogs(fechaInicio: string, fechaFin: string) {
  return getAuditLogsByDateRange(fechaInicio, fechaFin);
}