import assert from 'node:assert/strict';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const scope = { entidadId: 1, anio: 2026, quincena: 15, organica0: '04', organica1: '24', organica2: '01', organica3: '01' };
const validationUserId = '00000000-0000-0000-0000-000000000006';

async function main(): Promise<void> {
  const [mssql, firebird, formulaModule, fundModule, snapshotModule, captureModule, factoryModule, liquidacionModule] = await Promise.all([
    import('../src/db/mssql.js'), import('../src/db/firebird.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/FormulaCalculoRepository.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/SnapshotCalculoV2Repository.js'),
    import('../src/modules/liquidacionQna/application/queries/CaptureQnaTenDomainsQuery.js'),
    import('../src/modules/liquidacionQna/domain/services/QnaOfficialSnapshotV5Factory.js'),
    import('../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.js')
  ]);
  const pool = await mssql.connectDatabase();
  const before = await counts(pool);
  const transaction = new sql.Transaction(pool);
  let activeTransaction = false;
  try {
    const funds = new fundModule.AportacionFondoRepository(new formulaModule.FormulaCalculoRepository(pool));
    const capture = await new captureModule.CaptureQnaTenDomainsQuery(funds).execute({
      ...scope, ambiente: 'DESARROLLO', usuarioId: validationUserId
    });
    const approvals = Object.entries(capture.auxiliares).filter(([, source]) => source.source.estado === 'EMPTY')
      .map(([dominio]) => ({ dominio: dominio as keyof typeof capture.auxiliares, motivo: 'Validacion rollback-only', evidencia: 'Prueba automatizada fase 6' }));
    const factory = new factoryModule.QnaOfficialSnapshotV5Factory();
    const official = factory.create(capture, approvals);
    const equivalentOfficial = factory.create({ ...capture, captureId: 'REINTENTO-CAPTURE-ID', capturedAt: '2099-01-01T00:00:00.000Z' }, approvals);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    activeTransaction = true;
    const repository = new liquidacionModule.LiquidacionQnaRepository(pool);
    const result = await repository.createOfficialV5EnTransaccion(transaction, official);
    const retry = await repository.createOfficialV5EnTransaccion(transaction, equivalentOfficial);
    assert.equal(retry.liquidacionSnapshotId, result.liquidacionSnapshotId);
    assert.equal(retry.revision, result.revision);
    assert.equal(retry.hashContenido, result.hashContenido);
    assert.equal(retry.idempotente, true);
    const snapshotV2Id = await new sql.Request(transaction).input('Id', sql.BigInt, result.liquidacionSnapshotId)
      .query('SELECT SnapshotCalculoV2Id FROM liquidacion.QnaSnapshot WHERE LiquidacionSnapshotId=@Id');
    const differentActorDecision = await new snapshotModule.SnapshotCalculoV2Repository(pool).guardarDecisionAprobadaEnTransaccion(
      transaction, String(snapshotV2Id.recordset[0].SnapshotCalculoV2Id), '00000000-0000-0000-0000-000000000007', 'Otro actor y comentario'
    );
    const decisionComment = 'Aprobacion automatica: diez fuentes e invariantes V5 validos';
    const firstDecision = await repository.appendDecisionEnTransaccion(
      transaction, result.liquidacionSnapshotId, 'APROBADO', decisionComment, validationUserId
    );
    const retriedDecision = await repository.appendDecisionEnTransaccion(
      transaction, result.liquidacionSnapshotId, 'APROBADO', decisionComment, validationUserId
    );
    assert.equal(retriedDecision.qnaSnapshotDecisionId, firstDecision.qnaSnapshotDecisionId);
    const persisted = await new sql.Request(transaction).input('Id', sql.BigInt, result.liquidacionSnapshotId).query(`
      SELECT VersionEsquema,SnapshotCalculoV2Id FROM liquidacion.QnaSnapshot WHERE LiquidacionSnapshotId=@Id;
      SELECT COUNT(*) AS Total FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@Id;
      SELECT COUNT(*) AS Total FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=@Id
        AND EmpleadoClave IS NOT NULL AND Nombre IS NOT NULL AND PayloadVersion=1;
      SELECT COUNT(*) AS Total FROM aportaciones.SnapshotCalculoV2Decision d
        JOIN liquidacion.QnaSnapshot q ON q.SnapshotCalculoV2Id=d.SnapshotId WHERE q.LiquidacionSnapshotId=@Id
          AND d.Decision='APROBADO' AND d.PoliticaVersion='MXN-A2-DIFF-0.20-v1' AND d.UsuarioId='${validationUserId}';
      SELECT COUNT(*) AS Total FROM liquidacion.QnaSnapshotDecision WHERE LiquidacionSnapshotId=@Id;`);
    assert.equal(Number(persisted.recordsets[0][0].VersionEsquema), 5);
    assert.equal(Number(persisted.recordsets[1][0].Total), capture.fondos.AHORRO.rows.length);
    assert.equal(Number(persisted.recordsets[2][0].Total), official.candidate.detalles.length);
    assert.equal(Number(persisted.recordsets[3][0].Total), 1, 'La aprobacion V2 debe ser atomica e idempotente');
    assert.equal(differentActorDecision.usuarioId, validationUserId, 'Debe reutilizar la aprobacion vigente original');
    assert.equal(Number(persisted.recordsets[4][0].Total), 1, 'La decision QNA repetida no debe duplicarse');
    await transaction.rollback();
    activeTransaction = false;
    const after = await counts(pool);
    assert.deepEqual(after, before, 'La integracion V5 debe revertir todas las escrituras');
    console.log('QNA_V5_WRITER_INTEGRATION_DESARROLLO_ROLLBACK_OK');
  } finally {
    if (activeTransaction) await transaction.rollback().catch(() => undefined);
    await Promise.allSettled([mssql.closeDatabaseConnection(), firebird.closeFirebirdConnection()]);
  }
}

async function counts(pool: sql.ConnectionPool): Promise<Record<string, number>> {
  const result = await pool.request().query(`SELECT
    (SELECT COUNT(*) FROM aportaciones.SnapshotCalculoV2) AS V2,
    (SELECT COUNT(*) FROM liquidacion.QnaSnapshot) AS Qna,
    (SELECT COUNT(*) FROM liquidacion.QnaSnapshotDetalle) AS Detalle,
    (SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuenteDetalle) AS FuenteDetalle;`);
  return Object.fromEntries(Object.entries(result.recordset[0]).map(([key, value]) => [key, Number(value)]));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
