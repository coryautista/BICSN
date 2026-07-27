import { getPool, sql } from '../../../../db/mssql.js';
import { getMovimientosByAfiliadoId } from '../../../movimiento/movimiento.repo.js';
import { migrarMovimientoAFirebird } from '../firebird/FirebirdMovimientoService.js';

export interface AplicarBDIsspeaIndividualParams {
  afiliadoId: number;
  org0: string;
  org1: string;
  usuarioId: string;
  motivo?: string;
  observaciones?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AplicarBDIsspeaIndividualResult {
  afiliadoId: number;
  folio: number | null;
  nombreCompleto: string;
  exito: boolean;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  mensaje: string;
  movimientos: any[];
  movimientosExitosos: number;
  movimientosFallidos: number;
  afiliadoCompleto: boolean;
}

async function getAfiliadoElegiblePorOrganica(afiliadoId: number, org0: string, org1: string): Promise<any | null> {
  const p = await getPool();
  const result = await p.request()
    .input('afiliadoId', sql.Int, afiliadoId)
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .query(`
      SELECT TOP 1
        a.id, a.folio, a.nombre, a.apellidoPaterno, a.apellidoMaterno,
        a.numValidacion, a.estatus, s.nombreStatus as statusActual
      FROM afi.Afiliado a
      INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
      LEFT JOIN afi.AfiliadoStatusControl s ON a.numValidacion = s.numValidacion AND s.activo = 1
      WHERE a.id = @afiliadoId
        AND ao.claveOrganica0 = @org0
        AND ao.claveOrganica1 = @org1
        AND a.estatus = 1
    `);

  return result.recordset[0] || null;
}

async function actualizarAfiliadoAplicadoIndividual(params: AplicarBDIsspeaIndividualParams): Promise<void> {
  const p = await getPool();
  const transaction = p.transaction();

  try {
    await transaction.begin();

    await transaction.request()
      .input('afiliadoId', sql.Int, params.afiliadoId)
      .input('numValidacionNuevo', sql.Int, 7)
      .input('usuarioId', sql.NVarChar(50), params.usuarioId)
      .input('motivo', sql.NVarChar(500), params.motivo || 'Aplicacion individual a BDIsspea')
      .input('observaciones', sql.NVarChar(1000), params.observaciones)
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
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {
      // Ignore rollback failure; caller handles the primary error.
    }
    throw error;
  }
}

export async function aplicarBDIsspeaIndividual(params: AplicarBDIsspeaIndividualParams): Promise<AplicarBDIsspeaIndividualResult> {
  const afiliado = await getAfiliadoElegiblePorOrganica(params.afiliadoId, params.org0, params.org1);

  if (!afiliado) {
    throw new Error('AFILIADO_NOT_FOUND_OR_NOT_IN_ORGANICA');
  }

  if (Number(afiliado.numValidacion) !== 2) {
    throw new Error(`AFILIADO_STATUS_NOT_ELIGIBLE:${afiliado.numValidacion}`);
  }

  const nombreCompleto = `${afiliado.nombre || ''} ${afiliado.apellidoPaterno || ''} ${afiliado.apellidoMaterno || ''}`.trim();
  const movimientos = await getMovimientosByAfiliadoId(params.afiliadoId);
  const movimientosActivos = movimientos.filter((movimiento) => movimiento.estatus === 'A');

  if (movimientosActivos.length === 0) {
    throw new Error('AFILIADO_WITHOUT_ACTIVE_MOVEMENTS');
  }

  const resultadosMovimientos = [];
  let todosLosMovimientosExitosos = true;

  for (const movimiento of movimientosActivos) {
    let resultadoMigracion;
    try {
      resultadoMigracion = await migrarMovimientoAFirebird(movimiento, params.org0, params.org1);
    } catch (error: any) {
      resultadoMigracion = {
        exito: false,
        cveError: -1,
        nomError: `Error inesperado: ${error.message || String(error)}`,
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento: null
      };
    }

    if (!resultadoMigracion.exito) {
      todosLosMovimientosExitosos = false;
    }

    resultadosMovimientos.push(resultadoMigracion);
  }

  const movimientosExitosos = resultadosMovimientos.filter((movimiento) => movimiento.exito).length;
  const movimientosFallidos = resultadosMovimientos.filter((movimiento) => !movimiento.exito).length;

  if (!todosLosMovimientosExitosos) {
    return {
      afiliadoId: afiliado.id,
      folio: afiliado.folio,
      nombreCompleto,
      exito: false,
      estadoAnterior: afiliado.statusActual || null,
      estadoNuevo: null,
      mensaje: 'Algunos movimientos fallaron en la migracion a Firebird. No se cambio el estado del afiliado.',
      movimientos: resultadosMovimientos,
      movimientosExitosos,
      movimientosFallidos,
      afiliadoCompleto: false
    };
  }

  await actualizarAfiliadoAplicadoIndividual(params);

  return {
    afiliadoId: afiliado.id,
    folio: afiliado.folio,
    nombreCompleto,
    exito: true,
    estadoAnterior: afiliado.statusActual || null,
    estadoNuevo: 'Aplicado a la BDIsspea',
    mensaje: 'Afiliado procesado exitosamente: movimientos migrados a Firebird y estado actualizado a 7.',
    movimientos: resultadosMovimientos,
    movimientosExitosos,
    movimientosFallidos,
    afiliadoCompleto: true
  };
}
