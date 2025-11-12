import { AuditLog } from '../entities/AuditLog.js';

export interface IAuditLogRepository {
  findByDateRange(fechaInicio: string, fechaFin: string): Promise<AuditLog[]>;
}
