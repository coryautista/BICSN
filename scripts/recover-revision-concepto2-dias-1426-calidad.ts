import assert from 'node:assert/strict';
import { assertDatabaseEnvironment, DATABASE_ENVIRONMENTS } from '../src/config/databaseEnvironments.js';
import { RevisionAplicacionDiasFactory } from '../src/modules/aplicacionQuincenal/domain/services/RevisionAplicacionDiasFactory.js';

const EXECUTE = process.argv.includes('--execute');
const QUALITY = DATABASE_ENVIRONMENTS.CALIDAD;
const ORG0 = '04';
const ORG1 = '24';
const PERIODO = '1426';
const ANIO = 2026;
const QUINCENA = 14;
const ACTUAL = {
  CAIR: 27536.45,
  FRA: 61956.55,
  FRE: 318153.05,
  FH: 4818.87,
  FV: 19275.28,
  FAA: 68840.85,
  FAE: 34420.17,
  FAT: 103261.02,
  FAI: 16930.00
};
const ESPERADO = {
  CAIR: 27523.57,
  FRA: 61927.58,
  FRE: 318009.80,
  FH: 4816.62,
  FV: 19266.27,
  FAA: 68808.66,
  FAE: 34404.08,
  FAT: 103212.74,
  FAI: 16930.00
};
const FONDOS = ['CAIR', 'FRA', 'FRE', 'FH', 'FV', 'FAA', 'FAE', 'FAT', 'FAI'] as const;

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
  try {
    const databaseResult = await pool.request().query('SELECT DB_NAME() AS BaseDatos;');
    assert.equal(String(databaseResult.recordset[0]?.BaseDatos), QUALITY.sqlDatabase, 'DESTINO_SQL_NO_PERMITIDO');

    const firebirdRows = await firebird.executeSafeQuery(`
      SELECT RFC,SARE,FRA,FRE,FHE,FVE,FAA,FAE,FAI
      FROM AP_S_FONDOS(?, ?, ?)
    `, [ORG0, ORG1, PERIODO], firebird.FIREBIRD_TIMEOUTS.BATCH_OPERATION);
    assert.equal(firebirdRows.length, 169, 'FIREBIRD_1426_INCOMPLETO');

    const sqlResult = await pool.request()
      .input('org0', mssql.sql.Char(2), ORG0)
      .input('org1', mssql.sql.Char(2), ORG1)
      .input('periodo', mssql.sql.Char(4), PERIODO)
      .input('anio', mssql.sql.SmallInt, ANIO)
      .input('quincena', mssql.sql.TinyInt, QUINCENA)
      .query(`
        SELECT Id AS CargaId
        FROM dbo.NominaAplicacionQnalCarga
        WHERE Anio=@anio AND Quincena=@quincena
          AND Organica0=@org0 AND Organica1=@org1
          AND TipoCarga='TXT' AND Estatus='APLICADA' AND EsVigente=1
        ORDER BY Id;

        SELECT TOP (1) IdRevisionAplicacionHistorico,CAIR,FRA,FRE,FH,FV,FAA,FAE,FAT,FAI,
          RegistrosOrigen,CONVERT(NVARCHAR(36),UsuarioId) AS UsuarioId
        FROM conciliacion.RevisionAplicacionHistorico
        WHERE Organica0=@org0 AND Organica1=@org1
          AND Organica2='01' AND Organica3='01' AND Periodo=@periodo
        ORDER BY IdRevisionAplicacionHistorico DESC;

        SELECT TOP (1) IdRevisionTarea,Estatus
        FROM conciliacion.RevisionTarea
        WHERE Organica0=@org0 AND Organica1=@org1
          AND Organica2='01' AND Organica3='01' AND Periodo=@periodo
        ORDER BY IdRevisionTarea DESC;
      `);
    const sets = sqlResult.recordsets as Array<Array<Record<string, unknown>>>;
    assert.equal(sets[0].length, 1, 'TXT_VIGENTE_1426_NO_UNICO');
    assert.equal(sets[1].length, 1, 'REVISION_APLICACION_1426_NO_ENCONTRADA');
    assert.equal(sets[2].length, 1, 'REVISION_TAREA_1426_NO_ENCONTRADA');
    const cargaId = String(sets[0][0].CargaId);
    const nominaResult = await pool.request()
      .input('cargaId', mssql.sql.BigInt, cargaId)
      .query(`
        SELECT RFC,DiasLaborados
        FROM dbo.NominaAplicacionQnalDetalle
        WHERE CargaId=@cargaId
        ORDER BY LineaNumero,Id;
      `);
    const nomina = new Map<string, { dias: number | null; baseCotizacionQuinquenios: null }>();
    for (const row of nominaResult.recordset) {
      const rfc = String(row.RFC ?? '').trim().toUpperCase();
      if (!rfc) continue;
      if (nomina.has(rfc)) throw new Error(`TXT_RFC_DUPLICADO:${rfc}`);
      nomina.set(rfc, {
        dias: row.DiasLaborados === null ? null : Number(row.DiasLaborados),
        baseCotizacionQuinquenios: null
      });
    }

    const calculo = new RevisionAplicacionDiasFactory().crear(firebirdRows, {
      tieneArchivo: true,
      registros: nomina
    });
    assert.equal(calculo.registros, 169);
    assert.equal(calculo.registrosNomina, 169);
    for (const fondo of FONDOS) assert.equal(calculo[fondo], ESPERADO[fondo], `CANDIDATO_DIFIERE_${fondo}`);

    const snapshotActual = sets[1][0];
    const estadoActual = Object.fromEntries(FONDOS.map((fondo) => [fondo, Number(snapshotActual[fondo])]));
    const yaCorregido = FONDOS.every((fondo) => Number(snapshotActual[fondo]) === ESPERADO[fondo]);
    const esPreimagen = FONDOS.every((fondo) => Number(snapshotActual[fondo]) === ACTUAL[fondo]);
    if (!yaCorregido && !esPreimagen) throw new Error(`PREIMAGEN_1426_NO_RECONOCIDA:${JSON.stringify(estadoActual)}`);

    console.log(JSON.stringify({
      mode: EXECUTE ? 'execute' : 'dry-run',
      target: {
        sqlDatabase: QUALITY.sqlDatabase,
        firebirdDatabase: QUALITY.firebirdDatabase,
        organica: `${ORG0}-${ORG1}-01-01`,
        periodo: PERIODO
      },
      cargaId,
      cobertura: { firebird: calculo.registros, nomina: calculo.registrosNomina },
      actual: estadoActual,
      candidato: Object.fromEntries(FONDOS.map((fondo) => [fondo, calculo[fondo]])),
      yaCorregido
    }, null, 2));

    if (!EXECUTE) {
      console.log('DRY_RUN_OK: use --execute solo despues de desplegar y autorizar la recuperacion en Calidad.');
      return;
    }
    const estatusTarea = String(sets[2][0].Estatus).trim();
    if (yaCorregido && estatusTarea === 'COMPLETADA') {
      console.log('RECOVERY_IDEMPOTENTE: snapshot corregido y tarea completada.');
      return;
    }
    if (estatusTarea === 'PROCESANDO') throw new Error('REVISION_TAREA_1426_EN_PROCESO');

    const transaction = new mssql.sql.Transaction(pool);
    await transaction.begin();
    try {
      const request = new mssql.sql.Request(transaction)
        .input('snapshotId', mssql.sql.BigInt, snapshotActual.IdRevisionAplicacionHistorico)
        .input('tareaId', mssql.sql.BigInt, sets[2][0].IdRevisionTarea)
        .input('registros', mssql.sql.Int, calculo.registros);
      for (const fondo of FONDOS) {
        request.input(`actual${fondo}`, mssql.sql.Decimal(19, 2), ACTUAL[fondo]);
        request.input(fondo, mssql.sql.Decimal(19, 2), calculo[fondo]);
      }
      if (!yaCorregido) {
        await request.query(`
          UPDATE conciliacion.RevisionAplicacionHistorico
          SET CAIR=@CAIR,FRA=@FRA,FRE=@FRE,FH=@FH,FV=@FV,
            FAA=@FAA,FAE=@FAE,FAT=@FAT,FAI=@FAI,
            RegistrosOrigen=@registros,FechaActualizacion=SYSDATETIME()
          WHERE IdRevisionAplicacionHistorico=@snapshotId
            AND CAIR=@actualCAIR AND FRA=@actualFRA AND FRE=@actualFRE
            AND FH=@actualFH AND FV=@actualFV AND FAA=@actualFAA
            AND FAE=@actualFAE AND FAT=@actualFAT AND FAI=@actualFAI;
          IF @@ROWCOUNT <> 1 THROW 50041, 'PREIMAGEN_1426_CAMBIO_DURANTE_RECUPERACION', 1;
        `);
      }
      await request.query(`
        UPDATE conciliacion.RevisionTarea
        SET Estatus='PENDIENTE',Intentos=0,FechaInicio=NULL,FechaFin=NULL,
          Error=NULL,ClaimToken=NULL,ProximoIntento=NULL
        WHERE IdRevisionTarea=@tareaId AND Estatus<>'PROCESANDO';
        IF @@ROWCOUNT <> 1 THROW 50042, 'REVISION_TAREA_1426_NO_REENCOLADA', 1;
      `);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    console.log('RECOVERY_ENCOLADA_OK');
  } finally {
    await Promise.allSettled([mssql.closeDatabaseConnection(), firebird.closeFirebirdPool()]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
