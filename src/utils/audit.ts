import { getPool, sql } from '../db/mssql.js';

export interface AuditLogData {
  entidad: string;
  entidadId: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  datosAntes?: any;
  datosDespues?: any;
  userId?: string;
  userName?: string;
  appName?: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const p = await getPool();
    await p.request()
      .input('entidad', sql.VarChar, data.entidad)
      .input('entidadId', sql.VarChar, data.entidadId)
      .input('accion', sql.VarChar, data.accion)
      .input('datosAntes', sql.Text, data.datosAntes ? JSON.stringify(data.datosAntes) : null)
      .input('datosDespues', sql.Text, data.datosDespues ? JSON.stringify(data.datosDespues) : null)
      .input('userId', sql.VarChar, data.userId || null)
      .input('userName', sql.VarChar, data.userName || null)
      .input('appName', sql.VarChar, data.appName || 'BICSN_API')
      .input('ip', sql.VarChar, data.ip || null)
      .input('userAgent', sql.VarChar, data.userAgent || null)
      .input('requestId', sql.VarChar, data.requestId || null)
      .query(`
        INSERT INTO dbo.LogMovimiento (
          entidad, entidadId, accion, datosAntes, datosDespues,
          fecha, userId, userName, appName, ip, userAgent, requestId
        ) VALUES (
          @entidad, @entidadId, @accion, @datosAntes, @datosDespues,
          GETDATE(), @userId, @userName, @appName, @ip, @userAgent, @requestId
        )
      `);
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break the main operation
    console.error('Audit logging failed:', error);
  }
}

export function extractUserInfo(req: any): { userId?: string; userName?: string } {
  const user = req.user;
  if (user) {
    return {
      userId: user.id?.toString(),
      userName: user.username || user.name
    };
  }
  return {};
}

export function extractRequestInfo(req: any): { ip?: string; userAgent?: string; requestId?: string } {
  return {
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    requestId: req.id
  };
}