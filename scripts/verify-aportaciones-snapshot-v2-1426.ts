import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import type { SnapshotCalculoV2Detalle } from '../src/modules/aportacionesFondos/domain/entities/SnapshotCalculoV2.js';
import { AportacionesMonetaryKernel } from '../src/modules/aportacionesFondos/domain/services/AportacionesMonetaryKernel.js';
import { SnapshotCalculoV2Repository } from '../src/modules/aportacionesFondos/infrastructure/persistence/SnapshotCalculoV2Repository.js';

const QUALITY = DATABASE_ENVIRONMENTS.CALIDAD;
const ORG0 = '04';
const ORG1 = '24';
const ANIO = 2026;
const QUINCENA = 14;
const PERIODO = '1426';
const PRECISION_POLICY = 'MXN-DETAIL6-AGG2-TRUNC-v1';

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
      .input('anio', mssql.sql.SmallInt, ANIO)
      .input('quincena', mssql.sql.TinyInt, QUINCENA)
      .query(`
        SELECT DB_NAME() AS BaseDatos,
          OBJECT_ID(N'aportaciones.SnapshotCalculoV2', N'U') AS SnapshotTableId;

        SELECT TOP (1) CONVERT(VARCHAR(30), FormulaCalculoVersionId) AS FormulaCalculoVersionId
        FROM aportaciones.FormulaCalculoVersion
        WHERE AnioVigencia=@anio AND Estado='ACTIVA'
        ORDER BY NumeroVersion DESC, FormulaCalculoVersionId DESC;

        SELECT Id AS CargaId, EntidadId, Organica2, Organica3, TotalDetalles,
          TipoCarga,Estatus,EsVigente,ArchivoNombre
        FROM dbo.NominaAplicacionQnalCarga
        WHERE Anio=@anio AND Quincena=@quincena
          AND Organica0=@org0 AND Organica1=@org1
        ORDER BY Organica2,Organica3,FechaRegistro DESC,Id DESC;

        SELECT
          a.interno,
          CONVERT(VARCHAR(40), a.sueldo) AS Sueldo,
          CONVERT(VARCHAR(40), a.otras_prestaciones) AS OtrasPrestaciones,
          CONVERT(VARCHAR(40), a.quinquenios) AS Quinquenios,
          CONVERT(VARCHAR(40), c.afe) AS CAIR,
          CONVERT(VARCHAR(40), p.afpa) AS FRA,
          CONVERT(VARCHAR(40), p.afpe) AS FRE,
          CONVERT(VARCHAR(40), CAST(ROUND(v.afe * CAST(0.2 AS DECIMAL(19,9)), 6, 1) AS DECIMAL(19,6))) AS FH,
          CONVERT(VARCHAR(40), CAST(ROUND(v.afe * CAST(0.8 AS DECIMAL(19,9)), 6, 1) AS DECIMAL(19,6))) AS FV,
          CONVERT(VARCHAR(40), a.afaa) AS FAA,
          CONVERT(VARCHAR(40), a.afae) AS FAE,
          CONVERT(VARCHAR(40), a.total) AS FAT
        FROM aportaciones.IndividualesAhorroHistorico a
        INNER JOIN aportaciones.IndividualesViviendaHistorico v
          ON v.clave_organica_0=a.clave_organica_0 AND v.clave_organica_1=a.clave_organica_1
          AND v.anio=a.anio AND v.quincena=a.quincena AND v.interno=a.interno
        INNER JOIN aportaciones.IndividualesPrestacionesHistorico p
          ON p.clave_organica_0=a.clave_organica_0 AND p.clave_organica_1=a.clave_organica_1
          AND p.anio=a.anio AND p.quincena=a.quincena AND p.interno=a.interno
        INNER JOIN aportaciones.IndividualesCairHistorico c
          ON c.clave_organica_0=a.clave_organica_0 AND c.clave_organica_1=a.clave_organica_1
          AND c.anio=a.anio AND c.quincena=a.quincena AND c.interno=a.interno
        WHERE a.clave_organica_0=@org0 AND a.clave_organica_1=@org1
          AND a.anio=@anio AND a.quincena=@quincena
        ORDER BY a.interno;

        SELECT RFC, CONVERT(VARCHAR(40), DiasLaborados) AS DiasLaborados,
          CONVERT(VARCHAR(40), BaseCotizacionQuinquenios) AS BaseCotizacionQuinquenios
        FROM dbo.NominaAplicacionQnalDetalle
        WHERE CargaId=(
          SELECT TOP (1) Id FROM dbo.NominaAplicacionQnalCarga
          WHERE Anio=@anio AND Quincena=@quincena
            AND Organica0=@org0 AND Organica1=@org1
            AND TipoCarga='TXT' AND Estatus='APLICADA' AND EsVigente=1
          ORDER BY FechaRegistro DESC, Id DESC
        );
      `);
    const sets = sqlResult.recordsets as Array<Array<Record<string, unknown>>>;
    assert.equal(String(sets[0][0]?.BaseDatos), QUALITY.sqlDatabase);
    assert.ok(sets[0][0]?.SnapshotTableId, 'MIGRACION_SNAPSHOT_V2_NO_APLICADA');
    assert.equal(sets[1].length, 1, 'FORMULA_2026_ACTIVA_NO_ENCONTRADA');
    const cargasVigentes = sets[2].filter((row) => row.TipoCarga === 'TXT' && row.Estatus === 'APLICADA' && Boolean(row.EsVigente));
    assert.equal(cargasVigentes.length, 1,
      `TXT_VIGENTE_1426_04_24_NO_ENCONTRADO:${JSON.stringify(sets[2])}`);
    const cargaVigente = cargasVigentes[0];
    assert.equal(sets[3].length, 169, 'HISTORICO_SQL_1426_INCOMPLETO');
    assert.ok(sets[4].length > 0, 'TXT_VIGENTE_1426_SIN_DETALLE');

    const firebirdRows = await firebird.executeSafeQuery(`
      SELECT INTERNO, RFC, CAST(FAI AS VARCHAR(40)) AS FAI
      FROM AP_S_FONDOS(?, ?, ?)
    `, [ORG0, ORG1, PERIODO], firebird.FIREBIRD_TIMEOUTS.BATCH_OPERATION);
    assert.equal(firebirdRows.length, 169, 'FIREBIRD_1426_INCOMPLETO');
    const faiByInterno = new Map(firebirdRows.map((row) => [Number(row.INTERNO), d6(row.FAI)]));
    const rfcByInterno = new Map(firebirdRows.map((row) => [Number(row.INTERNO), normalizeRfc(row.RFC)]));
    const nominaByRfc = new Map<string, Record<string, unknown>>();
    const organica2 = String(cargaVigente.Organica2);
    const organica3 = String(cargaVigente.Organica3);
    for (const row of sets[4]) {
      const rfc = normalizeRfc(row.RFC);
      if (!rfc) continue;
      if (nominaByRfc.has(rfc)) throw new Error(`TXT_1426_RFC_DUPLICADO_${rfc}`);
      nominaByRfc.set(rfc, row);
    }

    const detalles: SnapshotCalculoV2Detalle[] = sets[3].map((row, index) => {
      const interno = Number(row.interno);
      const faiD6 = faiByInterno.get(interno);
      if (!faiD6) throw new Error(`FAI_1426_NO_ENCONTRADO_INTERNO_${interno}`);
      const rfc = rfcByInterno.get(interno);
      const nomina = rfc ? nominaByRfc.get(rfc) : undefined;
      const dias = Number(nomina?.DiasLaborados ?? 0);
      if (!Number.isFinite(dias) || dias < 0 || dias > 15) throw new Error(`TXT_1426_DIAS_FUERA_RANGO_${interno}`);
      return {
        orden: index + 1,
        empleadoClaveHash: sha256(`${PERIODO}|${ORG0}|${ORG1}|${organica2}|${organica3}|${interno}`),
        diasLaborados: dias.toFixed(2),
        diasOrigen: nomina ? 'nomina' : 'nomina_sin_coincidencia',
        sueldoMensualD6: d6(row.Sueldo),
        otrasPrestacionesMensualesD6: d6(row.OtrasPrestaciones),
        quinqueniosMensualD6: d6(row.Quinquenios),
        baseCotizacionQuinqueniosD6: nomina ? d6(nomina.BaseCotizacionQuinquenios) : null,
        cairD6: d6(row.CAIR),
        fraD6: d6(row.FRA),
        freD6: d6(row.FRE),
        fhD6: d6(row.FH),
        fvD6: d6(row.FV),
        faaD6: d6(row.FAA),
        faeD6: d6(row.FAE),
        fatD6: d6(row.FAT),
        faiD6
      };
    });
    const aggregate = (field: keyof SnapshotCalculoV2Detalle): string =>
      kernel.agregarA2(detalles.map((row) => String(row[field] ?? '0')));
    const totalesA2 = {
      CAIR: aggregate('cairD6'),
      FRA: aggregate('fraD6'),
      FRE: aggregate('freD6'),
      FH: aggregate('fhD6'),
      FV: aggregate('fvD6'),
      FAA: aggregate('faaD6'),
      FAE: aggregate('faeD6'),
      FAT: aggregate('fatD6'),
      FAI: aggregate('faiD6')
    };
    assert.equal(totalesA2.FAT, '103261.12', 'POLITICA_FAT_1426_DIFIERE');
    assert.equal(totalesA2.FAI, '16930.00', 'FAI_CONGELADO_1426_DIFIERE');

    const repository = new SnapshotCalculoV2Repository(pool);
    const input = {
      entidadId: Number(cargaVigente.EntidadId),
      anio: ANIO,
      quincena: QUINCENA,
      organica0: ORG0,
      organica1: ORG1,
      organica2,
      organica3,
      ambiente: 'CALIDAD' as const,
      fuente: 'HISTORICO_SQL' as const,
      estado: 'COMPLETO' as const,
      formulaCalculoVersionId: String(sets[1][0].FormulaCalculoVersionId),
      nominaCargaId: String(cargaVigente.CargaId),
      precisionPolicy: PRECISION_POLICY,
      versionEsquema: 1,
      usuarioId: 'shadow-fase4-1426',
      totalesA2,
      detalles
    };
    const first = await repository.guardar(input);
    const second = await repository.guardar(input);
    assert.equal(first.snapshotId, second.snapshotId, 'IDEMPOTENCIA_SNAPSHOT_ID_DIFIERE');
    assert.equal(second.idempotente, true, 'IDEMPOTENCIA_SNAPSHOT_NO_DETECTADA');

    const persisted = await pool.request()
      .input('snapshotId', mssql.sql.BigInt, first.snapshotId)
      .query(`
        SELECT Estado,EsCerrado,Registros,HashContenido,FAT,FAI
        FROM aportaciones.SnapshotCalculoV2 WHERE SnapshotId=@snapshotId;
        SELECT COUNT(*) AS Registros FROM aportaciones.SnapshotCalculoV2Detalle WHERE SnapshotId=@snapshotId;
      `);
    const persistedSets = persisted.recordsets as Array<Array<Record<string, unknown>>>;
    assert.equal(String(persistedSets[0][0].Estado), 'COMPLETO');
    assert.equal(Boolean(persistedSets[0][0].EsCerrado), true);
    assert.equal(Number(persistedSets[0][0].Registros), 169);
    assert.equal(Number(persistedSets[1][0].Registros), 169);
    assert.equal(String(persistedSets[0][0].HashContenido), first.hashContenido);
    assert.equal(kernel.truncarA2(String(persistedSets[0][0].FAT)), '103261.12');
    assert.equal(kernel.truncarA2(String(persistedSets[0][0].FAI)), '16930.00');

    const rollbackTransaction = new mssql.sql.Transaction(pool);
    await rollbackTransaction.begin();
    const rollbackResult = await repository.guardarEnTransaccion(rollbackTransaction, {
      ...input,
      precisionPolicy: `${PRECISION_POLICY}-ROLLBACK-PROBE`
    });
    await rollbackTransaction.rollback();
    const rollbackCheck = await pool.request()
      .input('hashContenido', mssql.sql.Char(64), rollbackResult.hashContenido)
      .query('SELECT COUNT(*) AS Registros FROM aportaciones.SnapshotCalculoV2 WHERE HashContenido=@hashContenido');
    assert.equal(Number(rollbackCheck.recordset[0].Registros), 0, 'SNAPSHOT_V2_ROLLBACK_FALLO');

    console.log(JSON.stringify({
      environment: 'CALIDAD',
      database: QUALITY.sqlDatabase,
      firebird: QUALITY.firebirdDatabase,
      periodo: PERIODO,
      snapshot: first,
      secondWrite: second,
      rollbackProbe: { hashContenido: rollbackResult.hashContenido, persisted: false },
      estado: 'COMPLETO',
      nominaCargaId: String(cargaVigente.CargaId),
      dias: {
        nomina: detalles.filter((row) => row.diasOrigen === 'nomina').length,
        sinCoincidencia: detalles.filter((row) => row.diasOrigen === 'nomina_sin_coincidencia').length
      },
      precisionPolicy: PRECISION_POLICY,
      totalesA2
    }, null, 2));
    console.log('APORTACIONES_SNAPSHOT_V2_1426_OK');
  } finally {
    await Promise.allSettled([mssql.closeDatabaseConnection(), firebird.closeFirebirdPool()]);
  }

  function d6(value: unknown): string {
    return kernel.truncarD6(String(value ?? '0'));
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex').toUpperCase();
}

function normalizeRfc(value: unknown): string | null {
  const normalized = String(value ?? '').trim().toUpperCase();
  return normalized || null;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
