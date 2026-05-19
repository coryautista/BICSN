import { ConnectionPool } from 'mssql';
import { IAuditLogRepository } from '../../domain/repositories/IAuditLogRepository.js';
import { AuditLog } from '../../domain/entities/AuditLog.js';
import sql from 'mssql';

export class AuditLogRepository implements IAuditLogRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  private mapRowToAuditLog(row: any): AuditLog {
    return {
      id: row.id,
      entidad: row.entidad,
      entidadId: row.entidadId,
      accion: row.accion,
      datosAntes: row.datosAntes,
      datosDespues: row.datosDespues,
      fecha: row.fecha instanceof Date ? row.fecha.toISOString() : row.fecha,
      userId: row.userId,
      userName: row.userName,
      appName: row.appName,
      ip: row.ip,
      userAgent: row.userAgent,
      requestId: row.requestId
    };
  }

  async findByDateRange(fechaInicio: string, fechaFin: string): Promise<AuditLog[]> {
    const result = await this.mssqlPool.request()
      .input('fechaInicio', sql.DateTime2, fechaInicio)
      .input('fechaFin', sql.DateTime2, fechaFin)
      .query(`
        SELECT
          id,
          entidad,
          entidadId,
          accion,
          datosAntes,
          datosDespues,
          createdAt as fecha,
          userId,
          userName,
          appName,
          ip,
          userAgent,
          requestId
        FROM dbo.LogMovimiento
        WHERE createdAt BETWEEN @fechaInicio AND @fechaFin
        ORDER BY createdAt DESC
      `);

    return result.recordset.map(this.mapRowToAuditLog);
  }
}
