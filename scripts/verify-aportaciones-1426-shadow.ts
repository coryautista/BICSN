import assert from 'node:assert/strict';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import { AportacionesMonetaryKernel } from '../src/modules/aportacionesFondos/domain/services/AportacionesMonetaryKernel.js';

const QUALITY = DATABASE_ENVIRONMENTS.CALIDAD;
const ORG0 = '04';
const ORG1 = '24';
const PERIODO = '1426';
const ANIO = 2026;
const QUINCENA = 14;
const EXPECTED_LINEA = '736168.13';
const EXPECTED_HISTORICO = {
  CAIR: '27536.299600',
  FRA: '61956.674100',
  FRE: '318153.127294',
  Vivienda: '24094.262197',
  FAA: '68840.749000',
  FAE: '34420.374500',
  FAT: '103261.123500'
} as const;
const EXPECTED_REVISA_DIAS = {
  CAIR: '27523.57',
  FRA: '61927.58',
  FRE: '318009.80',
  FH: '4816.62',
  FV: '19266.27',
  FAA: '68808.66',
  FAE: '34404.08',
  FAT: '103212.74',
  FAI: '16930.00'
} as const;

process.env.SQLSERVER_DB = QUALITY.sqlDatabase;
process.env.FIREBIRD_DATABASE = QUALITY.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function main(): Promise<void> {
  const [mssql, firebird] = await Promise.all([
    import('../src/db/mssql.js'),
    import('../src/db/firebird.js')
  ]);
  const pool = await mssql.connectDatabase();
  const kernel = new AportacionesMonetaryKernel();

  try {
    const sqlResult = await pool.request()
      .input('org0', mssql.sql.Char(2), ORG0)
      .input('org1', mssql.sql.Char(2), ORG1)
      .input('anio', mssql.sql.Int, ANIO)
      .input('quincena', mssql.sql.Int, QUINCENA)
      .input('periodo', mssql.sql.Char(4), PERIODO)
      .query(`
        SELECT DB_NAME() AS BaseDatos;

        SELECT
          (SELECT COUNT(*) FROM aportaciones.IndividualesAhorroHistorico
            WHERE clave_organica_0=@org0 AND clave_organica_1=@org1 AND anio=@anio AND quincena=@quincena) AS RegistrosAhorro,
          (SELECT COUNT(*) FROM aportaciones.IndividualesViviendaHistorico
            WHERE clave_organica_0=@org0 AND clave_organica_1=@org1 AND anio=@anio AND quincena=@quincena) AS RegistrosVivienda,
          (SELECT COUNT(*) FROM aportaciones.IndividualesPrestacionesHistorico
            WHERE clave_organica_0=@org0 AND clave_organica_1=@org1 AND anio=@anio AND quincena=@quincena) AS RegistrosPrestaciones,
          (SELECT COUNT(*) FROM aportaciones.IndividualesCairHistorico
            WHERE clave_organica_0=@org0 AND clave_organica_1=@org1 AND anio=@anio AND quincena=@quincena) AS RegistrosCair,
          (SELECT SUM(afaa) FROM aportaciones.IndividualesAhorroHistorico
            WHERE clave_organica_0=@org0 AND clave_organica_1=@org1 AND anio=@anio AND quincena=@quincena) AS FAA,
          (SELECT SUM(afae) FROM aportaciones.IndividualesAhorroHistorico
            WHERE clave_organica_0=@org0 AND clave_organica_1=@org1 AND anio=@anio AND quincena=@quincena) AS FAE,
          (SELECT SUM(total) FROM aportaciones.IndividualesAhorroHistorico
            WHERE clave_organica_0=@org0 AND clave_organica_1=@org1 AND anio=@anio AND quincena=@quincena) AS FAT,
          (SELECT SUM(afpa) FROM aportaciones.IndividualesPrestacionesHistorico
            WHERE clave_organica_0=@org0 AND clave_organica_1=@org1 AND anio=@anio AND quincena=@quincena) AS FRA,
          (SELECT SUM(afpe) FROM aportaciones.IndividualesPrestacionesHistorico
            WHERE clave_organica_0=@org0 AND clave_organica_1=@org1 AND anio=@anio AND quincena=@quincena) AS FRE,
          (SELECT SUM(afe) FROM aportaciones.IndividualesCairHistorico
            WHERE clave_organica_0=@org0 AND clave_organica_1=@org1 AND anio=@anio AND quincena=@quincena) AS CAIR,
          (SELECT SUM(afe) FROM aportaciones.IndividualesViviendaHistorico
            WHERE clave_organica_0=@org0 AND clave_organica_1=@org1 AND anio=@anio AND quincena=@quincena) AS Vivienda,
          (SELECT SUM(ROUND(afe * CAST(0.2 AS DECIMAL(19,9)), 6, 1)) FROM aportaciones.IndividualesViviendaHistorico
            WHERE clave_organica_0=@org0 AND clave_organica_1=@org1 AND anio=@anio AND quincena=@quincena) AS FHCandidatoD6,
          (SELECT SUM(ROUND(afe * CAST(0.8 AS DECIMAL(19,9)), 6, 1)) FROM aportaciones.IndividualesViviendaHistorico
            WHERE clave_organica_0=@org0 AND clave_organica_1=@org1 AND anio=@anio AND quincena=@quincena) AS FVCandidatoD6;

        SELECT TOP 1 RegistrosOrigen,CAIR,FRA,FRE,FH,FV,FAA,FAE,FAT,FAI
        FROM conciliacion.RevisionAplicacionHistorico
        WHERE Organica0=@org0 AND Organica1=@org1 AND Periodo=@periodo
        ORDER BY IdRevisionAplicacionHistorico DESC;

        SELECT TOP 1 Estatus,Importe
        FROM pagos.LineaCapturaPeriodo
        WHERE Org0=@org0 AND Org1=@org1 AND Periodo=@periodo
        ORDER BY CreatedAt DESC,LineaCapturaPeriodoId DESC;
      `);

    const recordsets = sqlResult.recordsets as mssql.sql.IRecordSet<any>[];
    const databaseName = String(recordsets[0][0]?.BaseDatos ?? '');
    const historico = recordsets[1][0];
    const revisa = recordsets[2][0];
    const linea = recordsets[3][0];

    assert.equal(databaseName, QUALITY.sqlDatabase);
    assert.ok(historico, 'HISTORICO_1426_NO_ENCONTRADO');
    assert.ok(revisa, 'REVISA_SNAPSHOT_1426_NO_ENCONTRADO');
    assert.ok(linea, 'LINEA_1426_NO_ENCONTRADA');
    for (const key of ['RegistrosAhorro', 'RegistrosVivienda', 'RegistrosPrestaciones', 'RegistrosCair']) {
      assert.equal(Number(historico[key]), 169, `${key}_INCOMPLETO`);
    }
    assert.equal(Number(revisa.RegistrosOrigen), 169);
    assert.equal(String(linea.Estatus), 'VIGENTE');
    assert.equal(a2(linea.Importe), EXPECTED_LINEA, 'LINEA_1426_IMPORTE_DIFIERE');
    for (const [field, expected] of Object.entries(EXPECTED_HISTORICO)) {
      assert.equal(d6(historico[field]), expected, `HISTORICO_1426_DIFIERE_${field}`);
    }

    const firebirdRows = await firebird.executeSafeQuery(`
      SELECT COUNT(*) AS REGISTROS,
        COALESCE(SUM(SARE), 0) AS CAIR,
        COALESCE(SUM(FRA), 0) AS FRA,
        COALESCE(SUM(FRE), 0) AS FRE,
        COALESCE(SUM(FHE), 0) AS FH,
        COALESCE(SUM(FVE), 0) AS FV,
        COALESCE(SUM(FAA), 0) AS FAA,
        COALESCE(SUM(FAE), 0) AS FAE,
        COALESCE(SUM(FAT), 0) AS FAT,
        COALESCE(SUM(FAI), 0) AS FAI
      FROM AP_S_FONDOS(?, ?, ?)
    `, [ORG0, ORG1, PERIODO], firebird.FIREBIRD_TIMEOUTS.BATCH_OPERATION);
    const firebirdSnapshot = firebirdRows[0] ?? {};
    assert.equal(Number(firebirdSnapshot.REGISTROS), 169);

    const fondos = ['CAIR', 'FRA', 'FRE', 'FH', 'FV', 'FAA', 'FAE', 'FAT', 'FAI'] as const;
    for (const fondo of fondos) {
      assert.equal(a2(revisa[fondo]), EXPECTED_REVISA_DIAS[fondo], `REVISA_DIAS_DIFIERE_${fondo}`);
    }

    const candidato = {
      CAIR: a2(historico.CAIR),
      FRA: a2(historico.FRA),
      FRE: a2(historico.FRE),
      FH: a2(historico.FHCandidatoD6),
      FV: a2(historico.FVCandidatoD6),
      FAA: a2(historico.FAA),
      FAE: a2(historico.FAE),
      FATHistorico: a2(historico.FAT),
      FATPorComponentes: kernel.agregarA2([a2(historico.FAA), a2(historico.FAE)]),
      FAI: a2(firebirdSnapshot.FAI)
    };

    console.log(JSON.stringify({
      environment: 'CALIDAD',
      sqlDatabase: QUALITY.sqlDatabase,
      firebirdDatabase: QUALITY.firebirdDatabase,
      periodo: PERIODO,
      linea: { estatus: linea.Estatus, importe: a2(linea.Importe) },
      historicoSql: {
        registros: 169,
        CAIR: d6(historico.CAIR),
        FRA: d6(historico.FRA),
        FRE: d6(historico.FRE),
        Vivienda: d6(historico.Vivienda),
        FAA: d6(historico.FAA),
        FAE: d6(historico.FAE),
        FAT: d6(historico.FAT)
      },
      revisaActual: Object.fromEntries(fondos.map((fondo) => [fondo, a2(revisa[fondo])])),
      candidato,
      diferenciasCandidatoMenosRevisa: Object.fromEntries(
        fondos.map((fondo) => {
          const candidateKey = fondo === 'FAT' ? 'FATPorComponentes' : fondo;
          return [fondo, difference(candidato[candidateKey as keyof typeof candidato], a2(revisa[fondo]))];
        })
      )
    }));
    console.log('APORTACIONES_1426_SHADOW_OK');
  } finally {
    await Promise.allSettled([mssql.closeDatabaseConnection(), firebird.closeFirebirdPool()]);
  }

  function a2(value: unknown): string {
    return kernel.truncarA2(String(value ?? '0'));
  }

  function d6(value: unknown): string {
    return kernel.truncarD6(String(value ?? '0'));
  }
}

function difference(left: string, right: string): string {
  const kernel = new AportacionesMonetaryKernel();
  return kernel.truncarA2(kernel.restarD6(left, right));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
