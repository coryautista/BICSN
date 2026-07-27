import { getPool, sql } from '../../../../db/mssql.js';
import { getMovimientosByAfiliadoId } from '../../../movimiento/movimiento.repo.js';
import { migrarMovimientoAFirebird } from '../firebird/FirebirdMovimientoService.js';
import { getAfiliadoById } from './AfiliadoPersistenceService.js';

interface BitacoraAplicarQna {
  afectacionId: number;
  quincena: number;
  anio: number;
  periodo: string;
  quincenaId: string;
  aplicacionMovimientosFinalizada: boolean;
}

interface ResumenFinalizacionMovimientos {
  total: number;
  aprobados: number;
  cancelados: number;
  aplicados: number;
  noPermitidos: number;
}

async function getBitacoraAplicarQna(org0: string, org1: string): Promise<BitacoraAplicarQna> {
  const p = await getPool();
  const result = await p.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .query(`
      SELECT TOP 1 AfectacionId, Quincena, Anio, AplicacionMovimientosFinalizada
      FROM afec.BitacoraAfectacionOrg
      WHERE Org0 = @org0
        AND Org1 = @org1
        AND Entidad = 'AFILIADOS'
        AND Accion IN ('Aplicar', 'APLICAR')
      ORDER BY CreatedAt DESC
    `);

  const row = result.recordset[0];
  if (!row) {
    throw new Error('BITACORA_APLICAR_NOT_FOUND');
  }

  const quincena = Number(row.Quincena);
  const anio = Number(row.Anio);
  if (!quincena || !anio) {
    throw new Error('BITACORA_APLICAR_QNA_INVALIDA');
  }

  const quincena2 = String(quincena).padStart(2, '0');
  return {
    afectacionId: Number(row.AfectacionId),
    quincena,
    anio,
    periodo: `${quincena2}${String(anio).slice(-2)}`,
    quincenaId: `${anio}-${quincena2}`,
    aplicacionMovimientosFinalizada: row.AplicacionMovimientosFinalizada === true || row.AplicacionMovimientosFinalizada === 1
  };
}

async function obtenerResumenFinalizacionMovimientos(org0: string, org1: string, qna: BitacoraAplicarQna): Promise<ResumenFinalizacionMovimientos> {
  const p = await getPool();
  const result = await p.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .input('quincena', sql.TinyInt, qna.quincena)
    .input('anio', sql.SmallInt, qna.anio)
    .input('quincenaId', sql.VarChar(30), qna.quincenaId)
    .query(`
      SELECT
        COUNT(DISTINCT a.id) AS Total,
        SUM(CASE WHEN a.numValidacion = 2 THEN 1 ELSE 0 END) AS Aprobados,
        SUM(CASE WHEN a.numValidacion = 6 THEN 1 ELSE 0 END) AS Cancelados,
        SUM(CASE WHEN a.numValidacion = 7 THEN 1 ELSE 0 END) AS Aplicados,
        SUM(CASE WHEN a.numValidacion NOT IN (2, 6, 7) THEN 1 ELSE 0 END) AS NoPermitidos
      FROM afi.Afiliado a
      INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
      WHERE ao.claveOrganica0 = @org0
        AND ao.claveOrganica1 = @org1
        AND a.estatus = 1
        AND a.quincenaAplicacion = @quincena
        AND a.anioAplicacion = @anio
        AND EXISTS (
          SELECT 1
          FROM afi.Movimiento m
          WHERE m.afiliadoId = a.id
            AND m.estatus = 'A'
            AND m.quincenaId = @quincenaId
        )
    `);

  const row = result.recordset[0] || {};
  return {
    total: Number(row.Total || 0),
    aprobados: Number(row.Aprobados || 0),
    cancelados: Number(row.Cancelados || 0),
    aplicados: Number(row.Aplicados || 0),
    noPermitidos: Number(row.NoPermitidos || 0)
  };
}

export async function getAfiliadosElegiblesParaBdiSspea(org0: string, org1: string, qna?: BitacoraAplicarQna): Promise<any[]> {
  const qnaAplicar = qna ?? await getBitacoraAplicarQna(org0, org1);
  const p = await getPool();
  const result = await p.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .input('quincena', sql.TinyInt, qnaAplicar.quincena)
    .input('anio', sql.SmallInt, qnaAplicar.anio)
    .input('quincenaId', sql.VarChar(30), qnaAplicar.quincenaId)
    .query(`
      SELECT DISTINCT a.id, a.folio, a.nombre, a.apellidoPaterno, a.apellidoMaterno,
             a.numValidacion, s.nombreStatus as statusActual
      FROM afi.Afiliado a
      INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
      INNER JOIN afi.AfiliadoStatusControl s ON a.numValidacion = s.numValidacion
      WHERE ao.claveOrganica0 = @org0
        AND ao.claveOrganica1 = @org1
        AND a.numValidacion = 2
        AND a.estatus = 1
        AND a.quincenaAplicacion = @quincena
        AND a.anioAplicacion = @anio
        AND s.activo = 1
        AND EXISTS (
          SELECT 1
          FROM afi.Movimiento m
          WHERE m.afiliadoId = a.id
            AND m.estatus = 'A'
            AND m.quincenaId = @quincenaId
        )
      ORDER BY a.id
    `);

  return result.recordset;
}

export async function actualizarAfiliadoAplicadoBdiSspea(params: {
  afiliadoId: number;
  usuarioId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{
  updateTimeMs: number;
  sqlCambioEstado: string;
  sqlMarcarCompleto: string;
}> {
  const p = await getPool();
  const transaction = p.transaction();
  const updateStart = Date.now();

  const sqlCambioEstado = `
    EXEC dbo.spCambiarStatusAfiliado 
      @afiliadoId = ${params.afiliadoId}, 
      @numValidacionNuevo = 7,
      @usuarioId = '${params.usuarioId}',
      @motivo = 'Aplicación masiva a BDIsspea',
      @observaciones = 'Cambio automático después de migración exitosa a Firebird',
      @ipAddress = '${params.ipAddress || 'N/A'}',
      @userAgent = '${params.userAgent || 'N/A'}'
  `;

  const sqlMarcarCompleto = `
    UPDATE afi.Afiliado 
    SET afiliadosComplete = 1, 
        updatedAt = SYSUTCDATETIME()
    WHERE id = ${params.afiliadoId}
  `;

  try {
    await transaction.begin();

    await transaction.request()
      .input('afiliadoId', sql.Int, params.afiliadoId)
      .input('numValidacionNuevo', sql.Int, 7)
      .input('usuarioId', sql.NVarChar(50), params.usuarioId)
      .input('motivo', sql.NVarChar(500), 'Aplicación masiva a BDIsspea')
      .input('observaciones', sql.NVarChar(1000), 'Cambio automático después de migración exitosa a Firebird')
      .input('ipAddress', sql.NVarChar(45), params.ipAddress)
      .input('userAgent', sql.NVarChar(500), params.userAgent)
      .execute('dbo.spCambiarStatusAfiliado');

    await transaction.request()
      .input('afiliadoId', sql.Int, params.afiliadoId)
      .query(`
        UPDATE afi.Afiliado 
        SET afiliadosComplete = 1, 
            updatedAt = SYSUTCDATETIME()
        WHERE id = @afiliadoId
      `);

    await transaction.commit();

    return {
      updateTimeMs: Date.now() - updateStart,
      sqlCambioEstado,
      sqlMarcarCompleto
    };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {
      // The caller logs the primary SQL error; rollback can fail if the transaction never opened.
    }

    throw error;
  }
}

export async function actualizarBitacoraAplicacionLote(params: {
  afectacionId?: number;
  org0: string;
  org1: string;
  usuarioId: string;
  afiliadosExitosos: number;
  resumenFinalizacion: ResumenFinalizacionMovimientos;
  internosNuevos: number[];
}): Promise<{
  registrosActualizados: number;
  bitacoraTimeMs: number;
  commitTimeMs: number;
  sqlBitacora: string;
  mensajeBitacora: string;
}> {
  const p = await getPool();
  const transaction = p.transaction();

  let mensajeBitacora = `Aplicacion de movimientos finalizada - ${params.afiliadosExitosos} afiliados aplicados a Movimientos BDIsspea`;
  if (params.internosNuevos.length > 0) {
    mensajeBitacora += `. INTERNOs nuevos registrados: [${params.internosNuevos.join(', ')}]`;
  }

  const sqlBitacora = `
    UPDATE TOP (1) bao
    SET bao.Accion = 'APLICAR',
        bao.AplicacionMovimientosFinalizada = 1,
        bao.AplicacionMovimientosFinalizadaEn = SYSUTCDATETIME(),
        bao.AplicacionMovimientosFinalizadaPor = '${params.usuarioId}',
        bao.AplicacionMovimientosTotal = ${params.resumenFinalizacion.total},
        bao.AplicacionMovimientosAplicados = ${params.resumenFinalizacion.aplicados + params.afiliadosExitosos},
        bao.AplicacionMovimientosCancelados = ${params.resumenFinalizacion.cancelados},
        bao.AplicacionMovimientosObservaciones = '${mensajeBitacora.replace(/'/g, "''")}',
        bao.ModifiedAt = SYSUTCDATETIME(),
        bao.Usuario = '${params.usuarioId}',
        bao.Resultado = 'OK',
        bao.Mensaje = '${mensajeBitacora.replace(/'/g, "''")}'
    FROM afec.BitacoraAfectacionOrg bao
    WHERE ${params.afectacionId ? `bao.AfectacionId = ${params.afectacionId}` : `bao.Org0 = '${params.org0}' AND bao.Org1 = '${params.org1}' AND bao.Accion = 'Aplicar' AND bao.Entidad = 'AFILIADOS'`}
  `;

  try {
    await transaction.begin();

    const bitacoraStart = Date.now();
    const bitacoraResult = await transaction.request()
      .input('org0', sql.VarChar(30), params.org0)
      .input('org1', sql.VarChar(30), params.org1)
      .input('afectacionId', sql.Int, params.afectacionId ?? null)
      .input('usuarioId', sql.NVarChar(50), params.usuarioId)
      .input('mensaje', sql.NVarChar(4000), mensajeBitacora)
      .input('total', sql.Int, params.resumenFinalizacion.total)
      .input('aplicados', sql.Int, params.resumenFinalizacion.aplicados + params.afiliadosExitosos)
      .input('cancelados', sql.Int, params.resumenFinalizacion.cancelados)
      .query(`
        UPDATE TOP (1) bao
        SET bao.Accion = 'APLICAR',
            bao.AplicacionMovimientosFinalizada = 1,
            bao.AplicacionMovimientosFinalizadaEn = SYSUTCDATETIME(),
            bao.AplicacionMovimientosFinalizadaPor = @usuarioId,
            bao.AplicacionMovimientosTotal = @total,
            bao.AplicacionMovimientosAplicados = @aplicados,
            bao.AplicacionMovimientosCancelados = @cancelados,
            bao.AplicacionMovimientosObservaciones = @mensaje,
            bao.ModifiedAt = SYSUTCDATETIME(),
            bao.Usuario = @usuarioId,
            bao.Resultado = 'OK',
            bao.Mensaje = @mensaje
        FROM afec.BitacoraAfectacionOrg bao
        WHERE (@afectacionId IS NULL OR bao.AfectacionId = @afectacionId)
          AND bao.Org0 = @org0
          AND bao.Org1 = @org1
          AND bao.Accion = 'Aplicar'
          AND bao.Entidad = 'AFILIADOS'
      `);

    const bitacoraTimeMs = Date.now() - bitacoraStart;
    const commitStart = Date.now();
    await transaction.commit();

    return {
      registrosActualizados: bitacoraResult.rowsAffected[0] || 0,
      bitacoraTimeMs,
      commitTimeMs: Date.now() - commitStart,
      sqlBitacora,
      mensajeBitacora
    };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {
      // The caller logs the primary SQL error; rollback can fail if the transaction never opened.
    }

    throw error;
  }
}

async function finalizarBitacoraAplicacionMovimientosSinProcesar(params: {
  qna: BitacoraAplicarQna;
  org0: string;
  org1: string;
  usuarioId: string;
  resumenFinalizacion: ResumenFinalizacionMovimientos;
}): Promise<number> {
  const mensaje = `Aplicacion de movimientos finalizada sin afiliados pendientes por aplicar. Total: ${params.resumenFinalizacion.total}, aplicados: ${params.resumenFinalizacion.aplicados}, cancelados: ${params.resumenFinalizacion.cancelados}.`;
  const p = await getPool();
  const result = await p.request()
    .input('afectacionId', sql.Int, params.qna.afectacionId)
    .input('org0', sql.VarChar(30), params.org0)
    .input('org1', sql.VarChar(30), params.org1)
    .input('usuarioId', sql.NVarChar(50), params.usuarioId)
    .input('mensaje', sql.NVarChar(4000), mensaje)
    .input('total', sql.Int, params.resumenFinalizacion.total)
    .input('aplicados', sql.Int, params.resumenFinalizacion.aplicados)
    .input('cancelados', sql.Int, params.resumenFinalizacion.cancelados)
    .query(`
      UPDATE TOP (1) bao
      SET bao.Accion = 'APLICAR',
          bao.AplicacionMovimientosFinalizada = 1,
          bao.AplicacionMovimientosFinalizadaEn = SYSUTCDATETIME(),
          bao.AplicacionMovimientosFinalizadaPor = @usuarioId,
          bao.AplicacionMovimientosTotal = @total,
          bao.AplicacionMovimientosAplicados = @aplicados,
          bao.AplicacionMovimientosCancelados = @cancelados,
          bao.AplicacionMovimientosObservaciones = @mensaje,
          bao.ModifiedAt = SYSUTCDATETIME(),
          bao.Usuario = @usuarioId,
          bao.Resultado = 'OK',
          bao.Mensaje = @mensaje
      FROM afec.BitacoraAfectacionOrg bao
      WHERE bao.AfectacionId = @afectacionId
        AND bao.Org0 = @org0
        AND bao.Org1 = @org1
        AND bao.Entidad = 'AFILIADOS'
    `);

  return result.rowsAffected[0] || 0;
}

export async function aplicarBDIsspeaLote(
  org0: string,
  org1: string,
  usuarioId: string,
  _motivo?: string,
  _observaciones?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<any> {
  const qna = await getBitacoraAplicarQna(org0, org1);
  const resumenFinalizacion = await obtenerResumenFinalizacionMovimientos(org0, org1, qna);

  if (qna.aplicacionMovimientosFinalizada) {
    return {
      afiliadosProcesados: [],
      afiliadosCambiadosEstado: 0,
      afiliadosFallidos: 0,
      afiliadosCompletos: 0,
      bitacoraActualizada: 0,
      movimientosMigrados: [],
      afiliadosConMigracionExitosa: 0,
      afiliadosConMigracionFallida: 0,
      detallesMigracion: [],
      resumen: {
        totalEncontrados: 0,
        procesadosExitosamente: 0,
        procesadosConError: 0,
        movimientosMigradosExitosos: 0,
        movimientosMigradosFallidos: 0,
        organica: `${org0}/${org1}`,
        periodo: qna.periodo,
        quincena: qna.quincena,
        anio: qna.anio,
        quincenaId: qna.quincenaId,
        afectacionId: qna.afectacionId,
        aplicacionMovimientosFinalizada: true,
        mensaje: 'La aplicacion de movimientos ya estaba finalizada para esta quincena.'
      },
      periodo: qna.periodo,
      quincena: qna.quincena,
      anio: qna.anio,
      quincenaId: qna.quincenaId,
      afectacionId: qna.afectacionId
    };
  }

  if (resumenFinalizacion.noPermitidos > 0) {
    throw new Error(`MOVIMIENTOS_ESTADO_NO_PERMITIDO:${resumenFinalizacion.noPermitidos}`);
  }

  const afiliadosParaProcesar = await getAfiliadosElegiblesParaBdiSspea(org0, org1, qna);
  const resultadosProcesamiento: any[] = [];
  const movimientosMigrados: any[] = [];
  const detallesMigracion: any[] = [];
  const internosNuevos: number[] = [];

  if (afiliadosParaProcesar.length === 0) {
    const bitacoraActualizada = await finalizarBitacoraAplicacionMovimientosSinProcesar({
      qna,
      org0,
      org1,
      usuarioId,
      resumenFinalizacion
    });

    return {
      afiliadosProcesados: [],
      afiliadosCambiadosEstado: 0,
      afiliadosFallidos: 0,
      afiliadosCompletos: 0,
      bitacoraActualizada,
      movimientosMigrados: [],
      afiliadosConMigracionExitosa: 0,
      afiliadosConMigracionFallida: 0,
      detallesMigracion: [],
      resumen: {
        totalEncontrados: 0,
        procesadosExitosamente: 0,
        procesadosConError: 0,
        movimientosMigradosExitosos: 0,
        movimientosMigradosFallidos: 0,
        organica: `${org0}/${org1}`,
        periodo: qna.periodo,
        quincena: qna.quincena,
        anio: qna.anio,
        quincenaId: qna.quincenaId,
        afectacionId: qna.afectacionId,
        aplicacionMovimientosFinalizada: bitacoraActualizada > 0
      },
      periodo: qna.periodo,
      quincena: qna.quincena,
      anio: qna.anio,
      quincenaId: qna.quincenaId,
      afectacionId: qna.afectacionId
    };
  }

  for (const afiliado of afiliadosParaProcesar) {
    const nombreCompleto = `${afiliado.nombre || ''} ${afiliado.apellidoPaterno || ''} ${afiliado.apellidoMaterno || ''}`.trim();
    let internoAnterior: number | null = null;

    try {
      const afiliadoCompletoAntes = await getAfiliadoById(afiliado.id);
      internoAnterior = afiliadoCompletoAntes?.interno || null;

      const movimientos = await getMovimientosByAfiliadoId(afiliado.id);
      const movimientosActivos = movimientos.filter(m => m.estatus === 'A' && m.quincenaId === qna.quincenaId);

      if (movimientosActivos.length === 0) {
        resultadosProcesamiento.push({
          afiliadoId: afiliado.id,
          folio: afiliado.folio,
          nombreCompleto,
          estadoAnterior: afiliado.statusActual,
          estadoNuevo: null,
          exito: false,
          mensaje: 'No tiene movimientos activos para migrar',
          movimientos: []
        });
        continue;
      }

      const resultadosMovimientos = [];
      let todosLosMovimientosExitosos = true;

      for (const movimiento of movimientosActivos) {
        let resultadoMigracion;
        try {
          resultadoMigracion = await migrarMovimientoAFirebird(movimiento, org0, org1);
        } catch (error: any) {
          resultadoMigracion = {
            exito: false,
            cveError: -1,
            nomError: `Error inesperado: ${error.message}`,
            movimientoId: movimiento.id,
            tipoMovimientoId: movimiento.tipoMovimientoId,
            codigoMovimiento: null
          };
        }

        resultadosMovimientos.push(resultadoMigracion);
        detallesMigracion.push({
          afiliadoId: afiliado.id,
          movimientoId: movimiento.id,
          tipoMovimientoId: movimiento.tipoMovimientoId,
          codigoMovimiento: resultadoMigracion.codigoMovimiento,
          exito: resultadoMigracion.exito,
          cveError: resultadoMigracion.cveError,
          nomError: resultadoMigracion.nomError
        });

        if (!resultadoMigracion.exito) {
          todosLosMovimientosExitosos = false;
        }
      }

      if (!todosLosMovimientosExitosos) {
        const erroresDetallados = resultadosMovimientos
          .filter(r => !r.exito)
          .map(r => r.cveError && r.nomError ? `Error ${r.cveError}: ${r.nomError}` : r.nomError || 'Error desconocido');

        resultadosProcesamiento.push({
          afiliadoId: afiliado.id,
          folio: afiliado.folio,
          nombreCompleto,
          estadoAnterior: afiliado.statusActual,
          estadoNuevo: null,
          exito: false,
          mensaje: erroresDetallados.length > 0
            ? `Algunos movimientos fallaron en la migración a Firebird. Errores: ${erroresDetallados.join('; ')}`
            : 'Algunos movimientos fallaron en la migración a Firebird',
          movimientos: resultadosMovimientos,
          errores: erroresDetallados
        });
        continue;
      }

      try {
        await actualizarAfiliadoAplicadoBdiSspea({
          afiliadoId: afiliado.id,
          usuarioId,
          ipAddress,
          userAgent
        });
      } catch (errorSQL: any) {
        resultadosProcesamiento.push({
          afiliadoId: afiliado.id,
          folio: afiliado.folio,
          nombreCompleto,
          estadoAnterior: afiliado.statusActual,
          estadoNuevo: null,
          exito: false,
          mensaje: `⚠️ INCONSISTENCIA: Movimientos migrados a Firebird exitosamente pero falló actualización SQL Server: ${errorSQL.message}`,
          movimientos: resultadosMovimientos,
          inconsistenciaDetectada: true
        });
        continue;
      }

      movimientosMigrados.push(...resultadosMovimientos);

      try {
        const afiliadoCompletoDespues = await getAfiliadoById(afiliado.id);
        const internoNuevo = afiliadoCompletoDespues?.interno || null;
        if ((internoAnterior === null || internoAnterior === 0) && internoNuevo && internoNuevo > 0 && !internosNuevos.includes(internoNuevo)) {
          internosNuevos.push(internoNuevo);
        }
      } catch {
        // La actualización del afiliado ya fue exitosa; esta verificación solo enriquece bitácora.
      }

      resultadosProcesamiento.push({
        afiliadoId: afiliado.id,
        folio: afiliado.folio,
        nombreCompleto,
        estadoAnterior: afiliado.statusActual,
        estadoNuevo: 'Aplicado a la BDIsspea',
        exito: true,
        mensaje: 'Afiliado procesado exitosamente: movimientos migrados a Firebird y estado actualizado a 7',
        movimientos: resultadosMovimientos
      });
    } catch (error: any) {
      resultadosProcesamiento.push({
        afiliadoId: afiliado.id,
        folio: afiliado.folio,
        nombreCompleto,
        estadoAnterior: afiliado.statusActual,
        estadoNuevo: null,
        exito: false,
        mensaje: `Error al procesar afiliado: ${error.message}`,
        movimientos: [],
        error: {
          message: error.message,
          code: error.code,
          name: error.name
        }
      });
    }
  }

  const afiliadosExitosos = resultadosProcesamiento.filter(r => r.exito).length;
  const afiliadosFallidos = resultadosProcesamiento.filter(r => !r.exito).length;
  const todosExitosos = afiliadosFallidos === 0 && afiliadosExitosos > 0;
  let bitacoraActualizada = 0;

  if (todosExitosos) {
    try {
      const bitacoraResult = await actualizarBitacoraAplicacionLote({
        afectacionId: qna.afectacionId,
        org0,
        org1,
        usuarioId,
        afiliadosExitosos,
        resumenFinalizacion,
        internosNuevos
      });
      bitacoraActualizada = bitacoraResult.registrosActualizados;
    } catch {
      bitacoraActualizada = 0;
    }
  }

  const movimientosExitosos = movimientosMigrados.filter(m => m.exito).length;
  const movimientosFallidos = detallesMigracion.filter(m => !m.exito).length;

  return {
    afiliadosProcesados: resultadosProcesamiento,
    afiliadosCambiadosEstado: afiliadosExitosos,
    afiliadosFallidos,
    afiliadosCompletos: afiliadosExitosos,
    bitacoraActualizada: todosExitosos ? bitacoraActualizada : 0,
    movimientosMigrados,
    afiliadosConMigracionExitosa: afiliadosExitosos,
    afiliadosConMigracionFallida: afiliadosFallidos,
    detallesMigracion,
    resumen: {
      totalEncontrados: afiliadosParaProcesar.length,
      procesadosExitosamente: afiliadosExitosos,
      procesadosConError: afiliadosFallidos,
      movimientosTotales: detallesMigracion.length,
      movimientosExitosos,
      movimientosFallidos,
      bitacoraActualizada: todosExitosos && bitacoraActualizada > 0,
      mensaje: todosExitosos
        ? `Todos los ${afiliadosExitosos} afiliados procesados exitosamente`
        : `${afiliadosExitosos} de ${afiliadosParaProcesar.length} afiliados procesados exitosamente`,
      organica: `${org0}/${org1}`
    },
    periodo: qna.periodo,
    quincena: qna.quincena,
    anio: qna.anio,
    quincenaId: qna.quincenaId,
    afectacionId: qna.afectacionId
  };
}
