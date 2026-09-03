import assert from 'node:assert/strict';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
process.env.QNA_HIP_LEGACY_PERIODS = '1526,1626';
process.env.QNA_LEGACY_DUAL_WRITE_ENABLED = 'false';
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const scope = {
  entidadId: 1,
  anio: 2026,
  quincena: 15,
  organica0: '04',
  organica1: '24',
  organica2: '01',
  organica3: '01'
};
const actor = '00000000-0000-0000-0000-000000000013';

async function main(): Promise<void> {
  const [mssql, firebird, formulaModule, fundModule, captureModule, factoryModule, liquidacionModule] = await Promise.all([
    import('../src/db/mssql.js'),
    import('../src/db/firebird.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/FormulaCalculoRepository.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.js'),
    import('../src/modules/liquidacionQna/application/queries/CaptureQnaTenDomainsQuery.js'),
    import('../src/modules/liquidacionQna/domain/services/QnaOfficialSnapshotV5Factory.js'),
    import('../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.js')
  ]);
  const pool = await mssql.connectDatabase();
  const before = await globalCounts(pool);
  const transaction = new sql.Transaction(pool);
  let active = false;

  try {
    const funds = new fundModule.AportacionFondoRepository(new formulaModule.FormulaCalculoRepository(pool));
    const capture = await new captureModule.CaptureQnaTenDomainsQuery(funds).execute({
      ...scope,
      ambiente: 'DESARROLLO',
      usuarioId: actor
    });
    const approvals = Object.entries(capture.auxiliares)
      .filter(([, source]) => source.source.estado === 'EMPTY')
      .map(([dominio]) => ({
        dominio: dominio as keyof typeof capture.auxiliares,
        motivo: 'Validacion rollback-only de fase 13',
        evidencia: 'Prueba automatizada con dual-write desactivado'
      }));
    const official = new factoryModule.QnaOfficialSnapshotV5Factory().create(capture, approvals);
    // Scope libre (04/24/31/01: sin oficial ni TXT vigente) con ausencia confirmada de carga
    // nominal; conserva la evidencia y procedencia de 1526 (org0/org1) sin tocar la oficial ya aplicada.
    const targetScope = { entidadId: 1, anio: 2026, quincena: 15, organica0: '04', organica1: '24', organica2: '31', organica3: '01' };
    official.snapshotV2 = { ...official.snapshotV2, ...targetScope, nominaCargaId: null };
    official.candidate = { ...official.candidate, ...targetScope, nominaCargaId: null };

    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    active = true;
    const repository = new liquidacionModule.LiquidacionQnaRepository(pool);
    const created = await repository.createOfficialV5EnTransaccion(transaction, official);
    await repository.appendDecisionEnTransaccion(
      transaction,
      created.liquidacionSnapshotId,
      'APROBADO',
      'Aprobacion automatica rollback-only de fase 13',
      actor
    );
    const promoted = await repository.promote(
      created.liquidacionSnapshotId,
      'Validacion rollback-only de fase 13',
      actor,
      transaction
    );

    assert.equal(promoted.legacyProjectionStatus, 'DISABLED');
    assert.deepEqual(promoted.legacyProjectionDetails, ['QNA_LEGACY_DUAL_WRITE_DISABLED']);

    const evidence = await snapshotEvidence(transaction, created.liquidacionSnapshotId);
    assert.equal(evidence.projection, 0, 'No debe existir cabecera QnaLegacyProjection');
    assert.equal(evidence.ownership, 0, 'No debe existir ownership legacy');
    for (const [store, total] of Object.entries(evidence.retirableStores)) {
      assert.equal(total, 0, `El store retirable ${store} no debe recibir filas`);
    }

    const expectedRetentions = Object.fromEntries(['PCP', 'PMP', 'HIP'].map((domain) => [
      domain,
      official.candidate.detalles.filter((detail) => detail.dominio === domain).length
    ]));
    assert.deepEqual(evidence.retentionStores, expectedRetentions, 'Retenciones V3 debe conservar su proyeccion independiente');

    await transaction.rollback();
    active = false;
    assert.deepEqual(await globalCounts(pool), before, 'La prueba no debe retener filas en Desarrollo');

    console.log(JSON.stringify({
      result: 'QNA_PHASE13_DUAL_WRITE_DISABLED_INTEGRATION_DESARROLLO_ROLLBACK_OK',
      environment: 'DESARROLLO',
      legacyProjectionStatus: promoted.legacyProjectionStatus,
      retirableStores: evidence.retirableStores,
      retentionStores: evidence.retentionStores,
      rollback: 'EXPLICIT_AND_GLOBAL_COUNTS_UNCHANGED'
    }, null, 2));
  } finally {
    if (active) await transaction.rollback().catch(() => undefined);
    await Promise.allSettled([mssql.closeDatabaseConnection(), firebird.closeFirebirdConnection()]);
  }
}

async function snapshotEvidence(transaction: sql.Transaction, snapshotId: string): Promise<{
  projection: number;
  ownership: number;
  retirableStores: Record<string, number>;
  retentionStores: Record<string, number>;
}> {
  const result = await new sql.Request(transaction).input('Id', sql.BigInt, snapshotId).query(`
    SELECT
      (SELECT COUNT(*) FROM liquidacion.QnaLegacyProjection WHERE LiquidacionSnapshotId=@Id) Projection,
      (SELECT COUNT(*) FROM liquidacion.QnaLegacyScopeOwnership WHERE LiquidacionSnapshotId=@Id) Ownership,
      (SELECT COUNT(*) FROM aportaciones.IndividualesAhorroHistorico WHERE QnaLiquidacionSnapshotId=@Id) Ahorro,
      (SELECT COUNT(*) FROM aportaciones.IndividualesViviendaHistorico WHERE QnaLiquidacionSnapshotId=@Id) Vivienda,
      (SELECT COUNT(*) FROM aportaciones.IndividualesPrestacionesHistorico WHERE QnaLiquidacionSnapshotId=@Id) Prestaciones,
      (SELECT COUNT(*) FROM aportaciones.IndividualesCairHistorico WHERE QnaLiquidacionSnapshotId=@Id) Cair,
      (SELECT COUNT(*) FROM aportaciones.GuarderiasHistorico WHERE QnaLiquidacionSnapshotId=@Id) Guarderias,
      (SELECT COUNT(*) FROM aportaciones.PensionNominaTransitorioHistorico WHERE QnaLiquidacionSnapshotId=@Id) Transitorio,
      (SELECT COUNT(*) FROM aportaciones.AguinaldoHistorico WHERE QnaLiquidacionSnapshotId=@Id) Aguinaldo,
      (SELECT COUNT(*) FROM aportaciones.ResumenHistorico WHERE QnaLiquidacionSnapshotId=@Id) Resumen,
      (SELECT COUNT(*) FROM conciliacion.RevisionAplicacionHistorico WHERE QnaLiquidacionSnapshotId=@Id) Revision,
      (SELECT COUNT(*) FROM retenciones.RetencionPCPHistoricoV3 WHERE LiquidacionSnapshotId=@Id) PCP,
      (SELECT COUNT(*) FROM retenciones.RetencionPMPHistoricoV3 WHERE LiquidacionSnapshotId=@Id) PMP,
      (SELECT COUNT(*) FROM retenciones.RetencionHIPHistoricoV3 WHERE LiquidacionSnapshotId=@Id) HIP;
  `);
  const row = result.recordset[0];
  return {
    projection: Number(row.Projection),
    ownership: Number(row.Ownership),
    retirableStores: Object.fromEntries(['Ahorro', 'Vivienda', 'Prestaciones', 'Cair', 'Guarderias', 'Transitorio', 'Aguinaldo', 'Resumen', 'Revision']
      .map((key) => [key, Number(row[key])])),
    retentionStores: Object.fromEntries(['PCP', 'PMP', 'HIP'].map((key) => [key, Number(row[key])]))
  };
}

async function globalCounts(pool: sql.ConnectionPool): Promise<Record<string, number>> {
  const result = await pool.request().query(`SELECT
    (SELECT COUNT(*) FROM aportaciones.SnapshotCalculoV2) SnapshotV2,
    (SELECT COUNT(*) FROM liquidacion.QnaSnapshot) QnaSnapshot,
    (SELECT COUNT(*) FROM liquidacion.QnaLegacyProjection) LegacyProjection,
    (SELECT COUNT(*) FROM liquidacion.QnaLegacyScopeOwnership) LegacyOwnership,
    (SELECT COUNT(*) FROM aportaciones.IndividualesAhorroHistorico) Ahorro,
    (SELECT COUNT(*) FROM aportaciones.IndividualesViviendaHistorico) Vivienda,
    (SELECT COUNT(*) FROM aportaciones.IndividualesPrestacionesHistorico) Prestaciones,
    (SELECT COUNT(*) FROM aportaciones.IndividualesCairHistorico) Cair,
    (SELECT COUNT(*) FROM aportaciones.GuarderiasHistorico) Guarderias,
    (SELECT COUNT(*) FROM aportaciones.PensionNominaTransitorioHistorico) Transitorio,
    (SELECT COUNT(*) FROM aportaciones.AguinaldoHistorico) Aguinaldo,
    (SELECT COUNT(*) FROM aportaciones.ResumenHistorico) Resumen,
    (SELECT COUNT(*) FROM conciliacion.RevisionAplicacionHistorico) Revision,
    (SELECT COUNT(*) FROM retenciones.PrestamosCortoPlazoHistorico) PCP,
    (SELECT COUNT(*) FROM retenciones.PrestamosMedianoPlazoHistorico) PMP,
    (SELECT COUNT(*) FROM retenciones.PrestamosHipotecariosHistorico) HIP;`);
  return Object.fromEntries(Object.entries(result.recordset[0]).map(([key, value]) => [key, Number(value)]));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
