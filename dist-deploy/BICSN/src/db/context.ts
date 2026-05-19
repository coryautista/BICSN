import { FastifyRequest } from 'fastify';
import { getPool, sql } from './mssql.js';

export { sql };

export async function withDbContext<T>(
  req: FastifyRequest,
  fn: (tx: sql.Transaction) => Promise<T>
): Promise<T> {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    const r = new sql.Request(tx);
    // Increase request timeout for session context setup and commit
    // Note: timeout is set via the connection pool configuration, not directly on Request
    // The requestTimeout in sqlConfig.options applies to all requests

    // Set session context values
    const sessionValues = [
      { key: 'userId', value: req.user?.sub || null, type: sql.NVarChar(200) },
      { key: 'userName', value: req.headers['x-user-name'] || null, type: sql.NVarChar(200) },
      { key: 'appName', value: process.env.APP_NAME || 'api', type: sql.NVarChar(200) },
      { key: 'ip', value: req.ip, type: sql.NVarChar(50) },
      { key: 'userAgent', value: req.headers['user-agent'] || '', type: sql.NVarChar(500) },
      { key: 'requestId', value: req.id, type: sql.NVarChar(200) }
    ];

    // Set each session context value
    for (const { key, value, type } of sessionValues) {
      const paramName = `p_${key}`;
      r.input(paramName, type, value);
      await r.batch(`EXEC sp_set_session_context @key=N'${key}', @value=@${paramName};`);
    }

    // Execute the function within the transaction
    const result = await fn(tx);

    // Commit the transaction
    // Note: commit() uses the connection timeout, which should be sufficient
    console.log('[withDbContext] Starting commit...');
    const commitStart = Date.now();
    await tx.commit();
    const commitDuration = Date.now() - commitStart;
    console.log(`[withDbContext] Commit completed in ${commitDuration}ms`);

    return result;
  } catch (error) {
    // Rollback on error
    try {
      await tx.rollback();
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    throw error;
  }
}
export async function logAppEvent(
  _req: FastifyRequest,
  entidad: string,
  entidadId: string,
  accion: 'INSERT' | 'UPDATE' | 'DELETE',
  antes?: any,
  despues?: any,
  tx?: sql.Transaction
) {
  const datosAntes = antes ? JSON.stringify(antes) : null;
  const datosDespues = despues ? JSON.stringify(despues) : null;

  const pool = await getPool();
  const request = tx ? new sql.Request(tx) : new sql.Request(pool);

  request.input('entidad', sql.NVarChar, entidad);
  request.input('entidadId', sql.NVarChar, entidadId);
  request.input('accion', sql.NVarChar, accion);
  request.input('datosAntes', sql.NVarChar(sql.MAX), datosAntes);
  request.input('datosDespues', sql.NVarChar(sql.MAX), datosDespues);

  await request.execute('dbo.usp_LogMovimiento');
}