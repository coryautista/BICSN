import { getPool, sql } from '../../db/mssql.js';

export interface AuditLogEntry {
  id: number;
  entidad: string;
  entidadId: string;
  accion: string;
  datosAntes: string | null;
  datosDespues: string | null;
  fecha: string;
  userId: string | null;
  userName: string | null;
  appName: string;
  ip: string;
  userAgent: string;
  requestId: string;
}

export async function getAuditLogsByDateRange(fechaInicio: string, fechaFin: string): Promise<AuditLogEntry[]> {
  const p = await getPool();
  const r = await p.request()
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
        fecha,
        userId,
        userName,
        appName,
        ip,
        userAgent,
        requestId
      FROM dbo.LogMovimiento
      WHERE fecha BETWEEN @fechaInicio AND @fechaFin
      ORDER BY fecha DESC
    `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    entidad: row.entidad,
    entidadId: row.entidadId,
    accion: row.accion,
    datosAntes: row.datosAntes,
    datosDespues: row.datosDespues,
    fecha: row.fecha.toISOString(),
    userId: row.userId,
    userName: row.userName,
    appName: row.appName,
    ip: row.ip,
    userAgent: row.userAgent,
    requestId: row.requestId
  }));
}