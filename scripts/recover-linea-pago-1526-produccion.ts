import assert from 'node:assert/strict';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const EXECUTE = process.argv.includes('--execute');
const CONFIRMED = process.argv.includes('--confirm-production=SII-ISSSSPEA-PROD');
const PRODUCTION = DATABASE_ENVIRONMENTS.PRODUCCION;
const ORG0 = '04';
const ORG1 = '24';
const PERIODO = '1526';
const LIQUIDACION_SNAPSHOT_ID = '1';
const USUARIO_ID = 'EA87ADBE-97A3-49D8-9F7D-E09CF5FE29EE';
const USUARIO = 'manuel';

if (EXECUTE && !CONFIRMED) {
  throw new Error('CONFIRMACION_PRODUCCION_REQUERIDA:--confirm-production=SII-ISSSSPEA-PROD');
}

process.env.SQLSERVER_DB = PRODUCTION.sqlDatabase;
process.env.FIREBIRD_DATABASE = PRODUCTION.firebirdDatabase;
assertDatabaseEnvironment('PRODUCCION', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const mssql = await import('../src/db/mssql.js');
const { LineaCapturaPeriodoRepository } = await import('../src/modules/reportes/aplicacionesQNA/infrastructure/persistence/LineaCapturaPeriodoRepository.js');
const { LineaCapturaService } = await import('../src/modules/reportes/aplicacionesQNA/domain/services/LineaCapturaService.js');
const { GenerateLineaCapturaPeriodoCommand } = await import('../src/modules/reportes/aplicacionesQNA/application/commands/GenerateLineaCapturaPeriodoCommand.js');
const { RevisionRepository } = await import('../src/modules/reportes/revision/infrastructure/persistence/RevisionRepository.js');
const { RevisionScheduler } = await import('../src/modules/reportes/revision/application/RevisionScheduler.js');
const { LiquidacionQnaRepository } = await import('../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.js');
const { registrarSiguienteQnaSiDisponible } = await import('../src/modules/afiliado/infrastructure/services/AfiliadoBdiSspeaService.js');

const pool = await mssql.connectDatabase();
try {
  const preflight = await pool.request()
    .input('UsuarioId', sql.UniqueIdentifier, USUARIO_ID)
    .input('Usuario', sql.NVarChar(100), USUARIO)
    .input('Org0', sql.Char(2), ORG0)
    .input('Org1', sql.Char(2), ORG1)
    .input('Periodo', sql.Char(4), PERIODO)
    .input('Anio', sql.SmallInt, 2026)
    .input('Quincena', sql.TinyInt, 15)
    .input('SnapshotId', sql.BigInt, LIQUIDACION_SNAPSHOT_ID)
    .query(`
      SELECT id,username,idOrganica0,idOrganica1,isLockedOut
      FROM auth.[user]
      WHERE id=@UsuarioId AND normalizedUsername=UPPER(@Usuario);

      SELECT TOP (1) AfectacionId,Accion,Resultado,Mensaje
      FROM afec.BitacoraAfectacionOrg
      WHERE Org0=@Org0 AND Org1=@Org1 AND Anio=@Anio AND Quincena=@Quincena
      ORDER BY ModifiedAt DESC,CreatedAt DESC;

      SELECT TOP (1) p.QnaProcesoId,t.EstadoDestino
      FROM liquidacion.QnaProceso p
      INNER JOIN liquidacion.QnaProcesoTransicion t ON t.QnaProcesoId=p.QnaProcesoId
      WHERE p.Anio=@Anio AND p.Quincena=@Quincena AND p.Organica0=@Org0 AND p.Organica1=@Org1
      ORDER BY t.QnaProcesoTransicionId DESC;

      SELECT LineaCapturaPeriodoId,Periodo,CONVERT(VARCHAR(40),Importe) AS Importe,Estatus,LiquidacionSnapshotId
      FROM pagos.LineaCapturaPeriodo
      WHERE LiquidacionSnapshotId=@SnapshotId;

      SELECT IdRevisionTarea,Estatus,CONVERT(NVARCHAR(36),UsuarioId) AS UsuarioId,LiquidacionSnapshotId
      FROM conciliacion.RevisionTarea
      WHERE LiquidacionSnapshotId=@SnapshotId;
    `);
  const sets = preflight.recordsets as Array<Array<Record<string, unknown>>>;
  const user = sets[0][0];
  const afectacion = sets[1][0];
  const process = sets[2][0];
  const line = sets[3][0];
  assert.ok(user, 'USUARIO_PRODUCTIVO_NO_ENCONTRADO');
  assert.equal(Boolean(user.isLockedOut), false, 'USUARIO_PRODUCTIVO_BLOQUEADO');
  assert.equal(String(user.idOrganica0).trim(), ORG0, 'USUARIO_ORG0_INVALIDA');
  assert.equal(String(user.idOrganica1).trim(), ORG1, 'USUARIO_ORG1_INVALIDA');
  assert.equal(String(afectacion?.Accion), 'APLICAR', 'AFECTACION_NO_PENDIENTE');
  assert.equal(String(afectacion?.Resultado), 'PENDIENTE', 'AFECTACION_NO_PENDIENTE');
  assert.equal(String(process?.EstadoDestino), 'FIREBIRD_CONFIRMADO', 'PROCESO_NO_RECUPERABLE');
  assert.equal(String(line?.Periodo), PERIODO, 'LINEA_PERIODO_INVALIDO');
  assert.equal(String(line?.Estatus), 'VIGENTE', 'LINEA_NO_VIGENTE');
  assert.equal(String(line?.LiquidacionSnapshotId), LIQUIDACION_SNAPSHOT_ID, 'LINEA_SNAPSHOT_INVALIDO');
  assert.equal(sets[4].length, 0, 'REVISION_TAREA_YA_EXISTE');

  if (!EXECUTE) {
    console.log(JSON.stringify({ environment: 'PRODUCCION', execute: false, user, afectacion, process, line }, null, 2));
  } else {
    const liquidacionQnaRepo = new LiquidacionQnaRepository(pool);
    const revisionRepo = new RevisionRepository(pool);
    const command = new GenerateLineaCapturaPeriodoCommand(
      new LineaCapturaPeriodoRepository(pool),
      new LineaCapturaService(),
      new RevisionScheduler(revisionRepo),
      liquidacionQnaRepo
    );
    const linea = await command.executeFromSnapshot({
      org0: ORG0,
      org1: ORG1,
      periodo: PERIODO,
      usuarioId: USUARIO_ID,
      finalizarPendiente: true,
      liquidacionSnapshotId: LIQUIDACION_SNAPSHOT_ID
    });
    await liquidacionQnaRepo.appendProcessTransition(LIQUIDACION_SNAPSHOT_ID, 'LINEA_CONFIRMADA', 'Linea de pago recuperada', USUARIO_ID);
    await liquidacionQnaRepo.appendProcessTransition(LIQUIDACION_SNAPSHOT_ID, 'REVISA_PROGRAMADA', 'Tarea REVISA recuperada', USUARIO_ID);
    await liquidacionQnaRepo.appendProcessTransition(LIQUIDACION_SNAPSHOT_ID, 'TERMINADO', 'Aplicacion QNA recuperada', USUARIO_ID);
    const siguiente = await registrarSiguienteQnaSiDisponible(ORG0, ORG1, PERIODO, USUARIO_ID);

    const post = await pool.request()
      .input('SnapshotId', sql.BigInt, LIQUIDACION_SNAPSHOT_ID)
      .input('Anio', sql.SmallInt, 2026)
      .input('Quincena', sql.TinyInt, 15)
      .input('Org0', sql.Char(2), ORG0)
      .input('Org1', sql.Char(2), ORG1)
      .query(`
        SELECT TOP (1) Accion,Resultado,Usuario FROM afec.BitacoraAfectacionOrg
        WHERE Org0=@Org0 AND Org1=@Org1 AND Anio=@Anio AND Quincena=@Quincena
        ORDER BY ModifiedAt DESC,CreatedAt DESC;
        SELECT TOP (1) Estatus,CONVERT(NVARCHAR(36),UsuarioId) AS UsuarioId,LiquidacionSnapshotId
        FROM conciliacion.RevisionTarea WHERE LiquidacionSnapshotId=@SnapshotId;
        SELECT TOP (1) t.EstadoDestino FROM liquidacion.QnaProcesoTransicion t
        INNER JOIN liquidacion.QnaProceso p ON p.QnaProcesoId=t.QnaProcesoId
        WHERE p.Anio=@Anio AND p.Quincena=@Quincena AND p.Organica0=@Org0 AND p.Organica1=@Org1
        ORDER BY t.QnaProcesoTransicionId DESC;
      `);
    const postSets = post.recordsets as Array<Array<Record<string, unknown>>>;
    assert.equal(String(postSets[0][0]?.Accion), 'TERMINADO');
    assert.equal(String(postSets[0][0]?.Resultado), 'OK');
    assert.equal(String(postSets[1][0]?.LiquidacionSnapshotId), LIQUIDACION_SNAPSHOT_ID);
    assert.equal(String(postSets[2][0]?.EstadoDestino), 'TERMINADO');
    console.log(JSON.stringify({ linea, siguiente, afectacion: postSets[0][0], revision: postSets[1][0], proceso: postSets[2][0] }, null, 2));
    console.log('LINEA_PAGO_1526_PRODUCCION_RECUPERADA');
  }
} finally {
  await mssql.closeDatabaseConnection();
}
