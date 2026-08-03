import pino from 'pino';
import { getPool, sql } from '../../../../db/mssql.js';
import { executeSelectableProcedure } from '../../../../db/firebird.js';

const logger = pino({
  name: 'afiliado-bdisspea-service',
  level: process.env.LOG_LEVEL || 'info'
});

export async function marcarAfiliadosCompletosParaOrganica(
  org0: string,
  org1: string,
  usuarioId: string
): Promise<{ afectados: number }> {
  const p = await getPool();
  const r = await p.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .input('usuarioId', sql.NVarChar(50), usuarioId)
    .query(`
      UPDATE a
      SET a.afiliadosComplete = 1,
          a.updatedAt = SYSUTCDATETIME()
      OUTPUT INSERTED.id
      FROM afi.Afiliado a
      INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
      WHERE ao.claveOrganica0 = @org0
        AND ao.claveOrganica1 = @org1
        AND a.afiliadosComplete = 0
        AND a.estatus = 1
    `);

  const afectados = r.rowsAffected[0] || 0;
  console.log(`Marcados como completos ${afectados} afiliados para orgánica ${org0}/${org1}`);

  return { afectados };
}

export async function actualizarBitacoraAfectacionOrg(
  org0: string,
  org1: string,
  usuarioId: string
): Promise<{ actualizado: boolean; registrosAfectados: number }> {
  const p = await getPool();

  const r = await p.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .query(`
      SELECT TOP 1 AfectacionId AS Id, Entidad, Anio, Quincena, Accion, Org0, Org1
      FROM afec.BitacoraAfectacionOrg
      WHERE Org0 = @org0
        AND Org1 = @org1
        AND Accion = 'Aplicar'
        AND Entidad = 'AFILIADOS'
      ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC
    `);

  if (r.recordset.length === 0) {
    console.log(`No se encontró registro "Aplicar" en BitacoraAfectacionOrg para orgánica ${org0}/${org1}`);
    return { actualizado: false, registrosAfectados: 0 };
  }

  const registro = r.recordset[0];
  const updateResult = await p.request()
    .input('id', sql.BigInt, registro.Id)
    .input('usuarioId', sql.NVarChar(50), usuarioId)
    .query(`
      UPDATE afec.BitacoraAfectacionOrg
      SET Accion = 'APLICAR',
          ModifiedAt = SYSUTCDATETIME(),
          Usuario = @usuarioId,
          Resultado = 'OK',
          Mensaje = 'Proceso de afiliación completado - Estado aplicado a Movimientos BDIsspea'
      OUTPUT INSERTED.*
      WHERE AfectacionId = @id
    `);

  const registrosAfectados = updateResult.rowsAffected[0] || 0;
  console.log(`Actualizado BitacoraAfectacionOrg: ${registrosAfectados} registros cambiados de "APLICAR" a "APLICAR"`);

  return {
    actualizado: registrosAfectados > 0,
    registrosAfectados
  };
}

export async function actualizarBitacoraAfectacionOrgTerminado(
  org0: string,
  org1: string,
  usuarioId: string,
  mensaje?: string
): Promise<{ actualizado: boolean; registrosAfectados: number }> {
  const logContext = {
    operation: 'actualizarBitacoraAfectacionOrgTerminado',
    org0,
    org1,
    usuarioId
  };

  logger.info(logContext, 'Buscando registro más reciente con Accion=APLICAR para actualizar a TERMINADO');
  console.log(`[BITACORA] Buscando registro más reciente con Accion='APLICAR' para orgánica ${org0}/${org1}`);

  const p = await getPool();
  const r = await p.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .query(`
      SELECT TOP 1 AfectacionId AS Id, Entidad, Anio, Quincena, Accion, Org0, Org1, CreatedAt
      FROM afec.BitacoraAfectacionOrg
      WHERE Org0 = @org0
        AND Org1 = @org1
        AND Accion = 'APLICAR'
        AND Entidad = 'AFILIADOS'
      ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC
    `);

  if (r.recordset.length === 0) {
    logger.warn(logContext, 'No se encontró registro "APLICAR" en BitacoraAfectacionOrg');
    console.log(`[BITACORA] ⚠️  No se encontró registro "APLICAR" en BitacoraAfectacionOrg para orgánica ${org0}/${org1}`);
    return { actualizado: false, registrosAfectados: 0 };
  }

  const registro = r.recordset[0];
  logger.info({
    ...logContext,
    registroId: registro.Id,
    anio: registro.Anio,
    quincena: registro.Quincena,
    createdAt: registro.CreatedAt
  }, 'Registro encontrado, procediendo a actualizar a TERMINADO');
  console.log(`[BITACORA] ✅ Registro encontrado - ID: ${registro.Id}, Anio: ${registro.Anio}, Quincena: ${registro.Quincena}`);

  const updateResult = await p.request()
    .input('id', sql.BigInt, registro.Id)
    .input('usuarioId', sql.NVarChar(50), usuarioId)
    .input('mensaje', sql.NVarChar(4000), mensaje || 'Proceso de aplicación QNA completado - Stored procedures ejecutados exitosamente')
    .query(`
      UPDATE afec.BitacoraAfectacionOrg
      SET Accion = 'TERMINADO',
          ModifiedAt = SYSUTCDATETIME(),
          Usuario = @usuarioId,
          Resultado = 'OK',
          Mensaje = @mensaje
      OUTPUT INSERTED.*
      WHERE AfectacionId = @id
    `);

  const registrosAfectados = updateResult.rowsAffected[0] || 0;
  logger.info({
    ...logContext,
    registrosAfectados,
    registroId: registro.Id
  }, 'BitacoraAfectacionOrg actualizada exitosamente a TERMINADO');
  console.log(`[BITACORA] ✅ Actualizado BitacoraAfectacionOrg: ${registrosAfectados} registro(s) cambiados de "APLICAR" a "TERMINADO"`);

  return {
    actualizado: registrosAfectados > 0,
    registrosAfectados
  };
}

export async function verificarAplicacionMovimientosFinalizada(
  org0: string,
  org1: string,
  quincena: number,
  anio: number
): Promise<{ finalizada: boolean; afectacionId: number | null; resultado: string | null }> {
  const p = await getPool();
  const result = await p.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .input('quincena', sql.Int, quincena)
    .input('anio', sql.Int, anio)
    .query(`
      SELECT TOP 1 AfectacionId, AplicacionMovimientosFinalizada, Resultado
      FROM afec.BitacoraAfectacionOrg
      WHERE Org0 = @org0
        AND Org1 = @org1
        AND Entidad = 'AFILIADOS'
        AND Quincena = @quincena
        AND Anio = @anio
      ORDER BY ModifiedAt DESC, CreatedAt DESC
    `);

  const row = result.recordset[0];
  if (!row) {
    return { finalizada: false, afectacionId: null, resultado: null };
  }

  return {
    finalizada: row.AplicacionMovimientosFinalizada === true || row.AplicacionMovimientosFinalizada === 1,
    afectacionId: Number(row.AfectacionId),
    resultado: row.Resultado ? String(row.Resultado) : null
  };
}

export async function marcarBitacoraPendienteLineaPago(
  afectacionId: number,
  usuarioId: string,
  error: string
): Promise<void> {
  const p = await getPool();
  const result = await p.request()
    .input('afectacionId', sql.BigInt, afectacionId)
    .input('usuarioId', sql.NVarChar(50), usuarioId)
    .input('mensaje', sql.NVarChar(4000), `Firebird confirmado; Línea de Pago pendiente: ${error}`)
    .query(`
      UPDATE afec.BitacoraAfectacionOrg
      SET Resultado = 'PENDIENTE',
          Mensaje = @mensaje,
          Usuario = @usuarioId,
          ModifiedAt = SYSUTCDATETIME()
      WHERE AfectacionId = @afectacionId
        AND Accion = 'APLICAR'
    `);
  if ((result.rowsAffected[0] || 0) !== 1) {
    throw new Error('BITACORA_PENDIENTE_LINEA_NO_ACTUALIZADA');
  }
}

export async function registrarSiguienteQnaSiDisponible(
  org0: string,
  org1: string,
  periodoTerminado: string,
  usuarioId: string,
  ip = '127.0.0.1'
): Promise<{ creada: boolean; periodo: string | null; afectacionId: number | null }> {
  const rows = await executeSelectableProcedure('AP_G_APLICADO_TIPO', [org0, org1, '01', '01'], {
    alias: 'p',
    columns: ['p.QUINCENA']
  });
  const periodo = String(rows[0]?.QUINCENA ?? '').padStart(4, '0');
  const ordenarPeriodo = (value: string) => (2000 + Number(value.slice(2, 4))) * 100 + Number(value.slice(0, 2));
  if (!/^\d{4}$/.test(periodo) || ordenarPeriodo(periodo) <= ordenarPeriodo(periodoTerminado)) {
    return { creada: false, periodo: periodo || null, afectacionId: null };
  }

  const quincena = Number(periodo.slice(0, 2));
  const anio = 2000 + Number(periodo.slice(2, 4));
  const p = await getPool();
  const transaction = new sql.Transaction(p);
  await transaction.begin();
  try {
    const existing = await new sql.Request(transaction)
      .input('org0', sql.Char(2), org0)
      .input('org1', sql.Char(2), org1)
      .input('quincena', sql.TinyInt, quincena)
      .input('anio', sql.SmallInt, anio)
      .query(`
        SELECT TOP 1 AfectacionId
        FROM afec.BitacoraAfectacionOrg WITH (UPDLOCK, HOLDLOCK)
        WHERE Entidad = 'AFILIADOS'
          AND Org0 = @org0 AND Org1 = @org1
          AND Quincena = @quincena AND Anio = @anio
      `);
    if (existing.recordset.length > 0) {
      await transaction.commit();
      return { creada: false, periodo, afectacionId: Number(existing.recordset[0].AfectacionId) };
    }

    const result = await new sql.Request(transaction)
      .input('Entidad', sql.NVarChar(128), 'AFILIADOS')
      .input('Anio', sql.SmallInt, anio)
      .input('Quincena', sql.TinyInt, quincena)
      .input('OrgNivel', sql.TinyInt, 3)
      .input('Org0', sql.Char(2), org0)
      .input('Org1', sql.Char(2), org1)
      .input('Org2', sql.Char(2), '01')
      .input('Org3', sql.Char(2), '01')
      .input('Accion', sql.VarChar(20), 'APLICAR')
      .input('Resultado', sql.VarChar(10), 'OK')
      .input('Mensaje', sql.NVarChar(4000), `QNA ${periodo} creada después de finalizar ${periodoTerminado}`)
      .input('Usuario', sql.NVarChar(100), usuarioId)
      .input('AppName', sql.NVarChar(100), 'BICSN-API')
      .input('Ip', sql.NVarChar(64), ip)
      .execute('afec.usp_RegistrarAfectacionOrg');
    await transaction.commit();
    const afectacionId = Number(result.recordset?.[0]?.AfectacionId ?? result.recordset?.[0]?.Id ?? 0) || null;
    return { creada: true, periodo, afectacionId };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function actualizarBitacoraAfectacionOrgTerminadoPorAfectacionId(
  afectacionId: number,
  usuarioId?: string,
  mensaje?: string
): Promise<{ actualizado: boolean; registrosAfectados: number }> {
  const logContext = {
    operation: 'actualizarBitacoraAfectacionOrgTerminadoPorAfectacionId',
    afectacionId
  };

  logger.info(logContext, 'Actualizando BitacoraAfectacionOrg a TERMINADO por AfectacionId');
  console.log(`[BITACORA] Actualizando BitacoraAfectacionOrg AfectacionId=${afectacionId} a TERMINADO`);

  const p = await getPool();
  const checkResult = await p.request()
    .input('afectacionId', sql.BigInt, afectacionId)
    .query(`
      SELECT AfectacionId, Accion
      FROM afec.BitacoraAfectacionOrg
      WHERE AfectacionId = @afectacionId
    `);

  if (checkResult.recordset.length === 0) {
    logger.warn(logContext, 'No se encontró registro con el AfectacionId proporcionado');
    console.log(`[BITACORA] ⚠️  No se encontró registro con AfectacionId=${afectacionId}`);
    return { actualizado: false, registrosAfectados: 0 };
  }

  const updateResult = await p.request()
    .input('afectacionId', sql.BigInt, afectacionId)
    .input('usuarioId', sql.NVarChar(50), usuarioId || null)
    .input('mensaje', sql.NVarChar(4000), mensaje || null)
    .query(`
      UPDATE afec.BitacoraAfectacionOrg
      SET Accion = 'TERMINADO',
          ModifiedAt = SYSUTCDATETIME(),
          Usuario = COALESCE(@usuarioId, Usuario),
          Resultado = 'OK',
          Mensaje = COALESCE(@mensaje, Mensaje)
      WHERE AfectacionId = @afectacionId
        AND Accion = 'APLICAR'
    `);

  const registrosAfectados = updateResult.rowsAffected[0] || 0;
  logger.info({
    ...logContext,
    registrosAfectados
  }, 'BitacoraAfectacionOrg actualizada exitosamente a TERMINADO');
  console.log(`[BITACORA] ✅ Actualizado BitacoraAfectacionOrg AfectacionId=${afectacionId}: ${registrosAfectados} registro(s) actualizado(s) a TERMINADO`);

  return {
    actualizado: registrosAfectados > 0,
    registrosAfectados
  };
}

export async function getUltimaBitacoraAfectacionOrgPorOrganica(
  org0: string,
  org1: string
): Promise<any | null> {
  const logContext = {
    operation: 'getUltimaBitacoraAfectacionOrgPorOrganica',
    org0,
    org1
  };

  const startTime = Date.now();
  logger.info(logContext, 'Buscando último registro de BitacoraAfectacionOrg');
  console.log(`[BITACORA] Buscando último registro de BitacoraAfectacionOrg para orgánica ${org0}/${org1}`);

  const p = await getPool();

  try {
    const queryStart = Date.now();
    const r = await p.request()
      .input('org0', sql.VarChar(30), org0)
      .input('org1', sql.VarChar(30), org1)
      .query(`
        SELECT TOP 1
          AfectacionId as Id,
          OrgNivel,
          Org0,
          Org1,
          Org2,
          Org3,
          Entidad,
          EntidadId,
          Anio,
          Quincena,
          Accion,
          Resultado,
          Mensaje,
          Usuario,
          UserId,
          AppName,
          Ip,
          UserAgent,
          RequestId,
          CreatedAt,
          ModifiedAt,
          AplicacionMovimientosFinalizada,
          AplicacionMovimientosFinalizadaEn,
          AplicacionMovimientosFinalizadaPor,
          AplicacionMovimientosTotal,
          AplicacionMovimientosAplicados,
          AplicacionMovimientosCancelados,
          AplicacionMovimientosObservaciones
        FROM afec.BitacoraAfectacionOrg
        WHERE Org0 = @org0
          AND Org1 = @org1
          AND Entidad = 'AFILIADOS'
        ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC
      `);

    const queryTime = Date.now() - queryStart;

    if (r.recordset.length === 0) {
      logger.warn({
        ...logContext,
        queryTimeMs: queryTime,
        elapsedMs: Date.now() - startTime
      }, 'No se encontró registro en BitacoraAfectacionOrg');
      console.log(`[BITACORA] ⚠️  No se encontró registro en BitacoraAfectacionOrg para orgánica ${org0}/${org1} (${queryTime}ms)`);
      return null;
    }

    const registro = r.recordset[0];
    logger.info({
      ...logContext,
      registroId: registro.Id,
      accion: registro.Accion,
      anio: registro.Anio,
      quincena: registro.Quincena,
      resultado: registro.Resultado,
      queryTimeMs: queryTime,
      elapsedMs: Date.now() - startTime
    }, 'Registro encontrado en BitacoraAfectacionOrg');
    console.log(`[BITACORA] ✅ Registro encontrado - ID: ${registro.Id}, Accion: ${registro.Accion}, Anio: ${registro.Anio}, Quincena: ${registro.Quincena} (${queryTime}ms)`);

    return {
      id: registro.Id,
      orgNivel: registro.OrgNivel,
      org0: registro.Org0,
      org1: registro.Org1,
      org2: registro.Org2,
      org3: registro.Org3,
      entidad: registro.Entidad,
      entidadId: registro.EntidadId,
      anio: registro.Anio,
      quincena: registro.Quincena,
      accion: registro.Accion,
      resultado: registro.Resultado,
      mensaje: registro.Mensaje,
      usuario: registro.Usuario,
      userId: registro.UserId,
      appName: registro.AppName,
      ip: registro.Ip,
      userAgent: registro.UserAgent,
      requestId: registro.RequestId,
      createdAt: registro.CreatedAt?.toISOString() || null,
      modifiedAt: registro.ModifiedAt?.toISOString() || null,
      aplicacionMovimientosFinalizada: registro.AplicacionMovimientosFinalizada === true || registro.AplicacionMovimientosFinalizada === 1,
      aplicacionMovimientosFinalizadaEn: registro.AplicacionMovimientosFinalizadaEn?.toISOString() || null,
      aplicacionMovimientosFinalizadaPor: registro.AplicacionMovimientosFinalizadaPor || null,
      aplicacionMovimientosTotal: registro.AplicacionMovimientosTotal ?? null,
      aplicacionMovimientosAplicados: registro.AplicacionMovimientosAplicados ?? null,
      aplicacionMovimientosCancelados: registro.AplicacionMovimientosCancelados ?? null,
      aplicacionMovimientosObservaciones: registro.AplicacionMovimientosObservaciones || null
    };
  } catch (error: any) {
    const queryTime = Date.now() - startTime;
    logger.error({
      ...logContext,
      error: {
        message: error.message || String(error),
        stack: error.stack,
        name: error.name,
        code: error.code
      },
      queryTimeMs: queryTime,
      elapsedMs: Date.now() - startTime
    }, 'Error consultando BitacoraAfectacionOrg');
    console.error(`[BITACORA] ❌ Error consultando BitacoraAfectacionOrg: ${error.message || String(error)} (${queryTime}ms)`);
    throw error;
  }
}

export async function getBitacoraAfectacionOrgPorOrganicaYPeriodo(
  org0: string,
  org1: string,
  periodo: string
): Promise<any | null> {
  const periodoStr = String(periodo).trim();

  if (!/^\d{4}$/.test(periodoStr)) {
    throw new Error('PERIODO_INVALIDO');
  }

  const quincena = Number(periodoStr.slice(0, 2));
  const anio = 2000 + Number(periodoStr.slice(2, 4));

  if (quincena < 1 || quincena > 24) {
    throw new Error('PERIODO_INVALIDO');
  }

  const logContext = {
    operation: 'getBitacoraAfectacionOrgPorOrganicaYPeriodo',
    org0,
    org1,
    periodo: periodoStr,
    quincena,
    anio
  };

  const startTime = Date.now();
  logger.info(logContext, 'Buscando registro de BitacoraAfectacionOrg por periodo');
  console.log(`[BITACORA] Buscando registro de BitacoraAfectacionOrg para orgánica ${org0}/${org1}, periodo ${periodoStr}`);

  const p = await getPool();

  try {
    const queryStart = Date.now();
    const r = await p.request()
      .input('org0', sql.VarChar(30), org0)
      .input('org1', sql.VarChar(30), org1)
      .input('quincena', sql.Int, quincena)
      .input('anio', sql.Int, anio)
      .query(`
        SELECT TOP 1
          AfectacionId as Id,
          OrgNivel,
          Org0,
          Org1,
          Org2,
          Org3,
          Entidad,
          EntidadId,
          Anio,
          Quincena,
          Accion,
          Resultado,
          Mensaje,
          Usuario,
          UserId,
          AppName,
          Ip,
          UserAgent,
          RequestId,
          CreatedAt,
          ModifiedAt,
          AplicacionMovimientosFinalizada,
          AplicacionMovimientosFinalizadaEn,
          AplicacionMovimientosFinalizadaPor,
          AplicacionMovimientosTotal,
          AplicacionMovimientosAplicados,
          AplicacionMovimientosCancelados,
          AplicacionMovimientosObservaciones
        FROM afec.BitacoraAfectacionOrg
        WHERE Org0 = @org0
          AND Org1 = @org1
          AND Entidad = 'AFILIADOS'
          AND Quincena = @quincena
          AND Anio = @anio
        ORDER BY ModifiedAt DESC, CreatedAt DESC
      `);

    const queryTime = Date.now() - queryStart;

    if (r.recordset.length === 0) {
      logger.warn({
        ...logContext,
        queryTimeMs: queryTime,
        elapsedMs: Date.now() - startTime
      }, 'No se encontró registro en BitacoraAfectacionOrg para el periodo');
      console.log(`[BITACORA] ⚠️  No se encontró registro en BitacoraAfectacionOrg para orgánica ${org0}/${org1}, periodo ${periodoStr} (${queryTime}ms)`);
      return null;
    }

    const registro = r.recordset[0];
    logger.info({
      ...logContext,
      registroId: registro.Id,
      accion: registro.Accion,
      resultado: registro.Resultado,
      queryTimeMs: queryTime,
      elapsedMs: Date.now() - startTime
    }, 'Registro encontrado en BitacoraAfectacionOrg para el periodo');
    console.log(`[BITACORA] ✅ Registro encontrado - ID: ${registro.Id}, Accion: ${registro.Accion}, Periodo: ${periodoStr} (${queryTime}ms)`);

    return {
      id: registro.Id,
      orgNivel: registro.OrgNivel,
      org0: registro.Org0,
      org1: registro.Org1,
      org2: registro.Org2,
      org3: registro.Org3,
      entidad: registro.Entidad,
      entidadId: registro.EntidadId,
      anio: registro.Anio,
      quincena: registro.Quincena,
      accion: registro.Accion,
      resultado: registro.Resultado,
      mensaje: registro.Mensaje,
      usuario: registro.Usuario,
      userId: registro.UserId,
      appName: registro.AppName,
      ip: registro.Ip,
      userAgent: registro.UserAgent,
      requestId: registro.RequestId,
      createdAt: registro.CreatedAt?.toISOString() || null,
      modifiedAt: registro.ModifiedAt?.toISOString() || null,
      aplicacionMovimientosFinalizada: registro.AplicacionMovimientosFinalizada === true || registro.AplicacionMovimientosFinalizada === 1,
      aplicacionMovimientosFinalizadaEn: registro.AplicacionMovimientosFinalizadaEn?.toISOString() || null,
      aplicacionMovimientosFinalizadaPor: registro.AplicacionMovimientosFinalizadaPor || null,
      aplicacionMovimientosTotal: registro.AplicacionMovimientosTotal ?? null,
      aplicacionMovimientosAplicados: registro.AplicacionMovimientosAplicados ?? null,
      aplicacionMovimientosCancelados: registro.AplicacionMovimientosCancelados ?? null,
      aplicacionMovimientosObservaciones: registro.AplicacionMovimientosObservaciones || null
    };
  } catch (error: any) {
    const queryTime = Date.now() - startTime;
    logger.error({
      ...logContext,
      error: {
        message: error.message || String(error),
        stack: error.stack,
        name: error.name,
        code: error.code
      },
      queryTimeMs: queryTime,
      elapsedMs: Date.now() - startTime
    }, 'Error consultando BitacoraAfectacionOrg por periodo');
    console.error(`[BITACORA] ❌ Error consultando BitacoraAfectacionOrg por periodo: ${error.message || String(error)} (${queryTime}ms)`);
    throw error;
  }
}

export async function aplicarBDIsspea(
  afiliadoId: number,
  org0: string,
  org1: string,
  usuarioId: string,
  motivo?: string,
  observaciones?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<any> {
  const p = await getPool();
  const transaction = p.transaction();

  try {
    await transaction.begin();

    const statusResult = await transaction.request()
      .input('afiliadoId', sql.Int, afiliadoId)
      .input('numValidacionNuevo', sql.Int, 7)
      .input('usuarioId', sql.NVarChar(50), usuarioId)
      .input('motivo', sql.NVarChar(500), motivo || 'Aplicación a BDIsspea')
      .input('observaciones', sql.NVarChar(1000), observaciones)
      .input('ipAddress', sql.NVarChar(45), ipAddress)
      .input('userAgent', sql.NVarChar(500), userAgent)
      .execute('dbo.spCambiarStatusAfiliado');

    const completosResult = await transaction.request()
      .input('org0', sql.VarChar(30), org0)
      .input('org1', sql.VarChar(30), org1)
      .input('usuarioId', sql.NVarChar(50), usuarioId)
      .query(`
        UPDATE a
        SET a.afiliadosComplete = 1,
            a.updatedAt = SYSUTCDATETIME()
        FROM afi.Afiliado a
        INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
        WHERE ao.claveOrganica0 = @org0
          AND ao.claveOrganica1 = @org1
          AND a.afiliadosComplete = 0
          AND a.estatus = 1
      `);

    const bitacoraResult = await transaction.request()
      .input('org0', sql.VarChar(30), org0)
      .input('org1', sql.VarChar(30), org1)
      .input('usuarioId', sql.NVarChar(50), usuarioId)
      .query(`
        UPDATE TOP (1) bao
        SET bao.Accion = 'APLICAR',
            bao.ModifiedAt = SYSUTCDATETIME(),
            bao.Usuario = @usuarioId,
            bao.Resultado = 'OK',
            bao.Mensaje = 'Proceso de afiliación completado - Estado aplicado a Movimientos BDIsspea'
        FROM afec.BitacoraAfectacionOrg bao
        WHERE bao.Org0 = @org0
          AND bao.Org1 = @org1
          AND bao.Accion = 'Aplicar'
          AND bao.Entidad = 'AFILIADOS'
      `);

    await transaction.commit();

    const resultado = {
      afiliadoStatus: statusResult.recordset[0],
      afiliadosCompletos: completosResult.rowsAffected[0] || 0,
      bitacoraActualizada: bitacoraResult.rowsAffected[0] || 0,
      mensaje: 'Proceso de aplicación a BDIsspea completado exitosamente'
    };

    console.log('Proceso BDIsspea completado:', resultado);
    return resultado;
  } catch (error) {
    await transaction.rollback();
    console.error('Error en proceso aplicarBDIsspea:', error);
    throw error;
  }
}
