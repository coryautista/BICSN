import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { AportacionesMonetaryKernel } from '../src/modules/aportacionesFondos/domain/services/AportacionesMonetaryKernel.js';
import { assertDatabaseEnvironment, DATABASE_ENVIRONMENTS } from '../src/config/databaseEnvironments.js';

const CARGA_ID = 15;
const ANIO = 2026;
const QUINCENA = 11;
const PERIODO = '1126';
const ORG0 = '04';
const ORG1 = '24';
const ORG2 = '01';
const ORG3 = '01';
const QUALITY = DATABASE_ENVIRONMENTS.CALIDAD;

process.env.SQLSERVER_DB = QUALITY.sqlDatabase;
process.env.FIREBIRD_DATABASE = QUALITY.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const monetaryKernel = new AportacionesMonetaryKernel();
const money = (value: unknown, scale: number) => {
  const decimal = String(value ?? '0');
  if (scale === 2) return monetaryKernel.truncarA2(decimal);
  if (scale === 6) return monetaryKernel.truncarD6(decimal);
  if (scale === 9) {
    const [integer, fraction = ''] = decimal.split('.');
    return `${integer}.${fraction.padEnd(9, '0').slice(0, 9)}`;
  }
  throw new Error(`UNSUPPORTED_DECIMAL_SCALE:${scale}`);
};
const normalizeRfc = (value: unknown) => String(value ?? '').trim().toUpperCase();

async function main(): Promise<void> {
  const [mssql, firebird] = await Promise.all([
    import('../src/db/mssql.js'),
    import('../src/db/firebird.js')
  ]);
  assertDatabaseEnvironment(
    'CALIDAD',
    process.env.SQLSERVER_DB ?? '',
    process.env.FIREBIRD_DATABASE ?? ''
  );
  const pool = await mssql.connectDatabase();

  try {
    const sqlResult = await pool.request().query(`
      SELECT DB_NAME() AS BaseDatos;

      SELECT
        v.FormulaCalculoVersionId,
        v.ClaveFormula,
        v.AnioVigencia,
        v.NumeroVersion,
        v.QuincenaDesde,
        v.QuincenaHasta,
        v.PrecisionPolicy,
        v.Estado,
        p.ClaveParametro,
        CONVERT(VARCHAR(40), p.Valor) AS Valor,
        p.Unidad,
        p.Fuente
      FROM aportaciones.FormulaCalculoVersion v
      JOIN aportaciones.FormulaCalculoParametro p
        ON p.FormulaCalculoVersionId = v.FormulaCalculoVersionId
      WHERE v.ClaveFormula = 'APORTACIONES-NOMINA'
        AND v.AnioVigencia = ${ANIO}
        AND v.Estado = 'ACTIVA'
        AND ${QUINCENA} BETWEEN v.QuincenaDesde AND v.QuincenaHasta
      ORDER BY p.ClaveParametro;

      SELECT
        d.RFC,
        CONVERT(VARCHAR(40), d.DiasLaborados) AS DiasLaborados,
        CONVERT(VARCHAR(40), d.BaseCotizacionSueldo) AS BaseCotizacionSueldo,
        CONVERT(VARCHAR(40), d.BaseCotizacionQuinquenios) AS BaseCotizacionQuinquenios,
        CONVERT(VARCHAR(40), d.SueldoMensual) AS SueldoMensual,
        c.Anio AS CargaAnio,
        c.Quincena AS CargaQuincena,
        c.Organica0 AS CargaOrganica0,
        c.Organica1 AS CargaOrganica1,
        c.Organica2 AS CargaOrganica2,
        c.Organica3 AS CargaOrganica3
      FROM dbo.NominaAplicacionQnalDetalle d
      JOIN dbo.NominaAplicacionQnalCarga c ON c.Id = d.CargaId
      WHERE d.CargaId = ${CARGA_ID};

      SELECT TOP 1 Accion, Resultado
      FROM afec.BitacoraAfectacionOrg
      WHERE Entidad = 'AFILIADOS'
        AND Org0 = '${ORG0}' AND Org1 = '${ORG1}'
        AND Org2 = '${ORG2}' AND Org3 = '${ORG3}'
        AND Anio = ${ANIO} AND Quincena = ${QUINCENA}
      ORDER BY ModifiedAt DESC, CreatedAt DESC;

      SELECT 'AHORRO' AS Fondo, COUNT(*) AS Registros,
             CONVERT(VARCHAR(40), SUM(afaa)) AS Componente1,
             CONVERT(VARCHAR(40), SUM(afae)) AS Componente2,
             CONVERT(VARCHAR(40), SUM(total)) AS Total
      FROM aportaciones.IndividualesAhorroHistorico
      WHERE clave_organica_0 = '${ORG0}' AND clave_organica_1 = '${ORG1}'
        AND anio = ${ANIO} AND quincena = ${QUINCENA}
      UNION ALL
      SELECT 'PRESTACIONES', COUNT(*), CONVERT(VARCHAR(40), SUM(afpa)), CONVERT(VARCHAR(40), SUM(afpe)), CONVERT(VARCHAR(40), SUM(total))
      FROM aportaciones.IndividualesPrestacionesHistorico
      WHERE clave_organica_0 = '${ORG0}' AND clave_organica_1 = '${ORG1}'
        AND anio = ${ANIO} AND quincena = ${QUINCENA}
      UNION ALL
      SELECT 'VIVIENDA', COUNT(*), NULL, CONVERT(VARCHAR(40), SUM(afe)), CONVERT(VARCHAR(40), SUM(total))
      FROM aportaciones.IndividualesViviendaHistorico
      WHERE clave_organica_0 = '${ORG0}' AND clave_organica_1 = '${ORG1}'
        AND anio = ${ANIO} AND quincena = ${QUINCENA}
      UNION ALL
      SELECT 'CAIR', COUNT(*), NULL, CONVERT(VARCHAR(40), SUM(afe)), CONVERT(VARCHAR(40), SUM(total))
      FROM aportaciones.IndividualesCairHistorico
      WHERE clave_organica_0 = '${ORG0}' AND clave_organica_1 = '${ORG1}'
        AND anio = ${ANIO} AND quincena = ${QUINCENA};

      SELECT tipo_endpoint, total_empleados,
             CONVERT(VARCHAR(40), total_contribucion) AS total_contribucion,
             CONVERT(VARCHAR(40), total_sueldo_base) AS total_sueldo_base
      FROM aportaciones.ResumenHistorico
      WHERE clave_organica_0 = '${ORG0}' AND clave_organica_1 = '${ORG1}'
        AND anio = ${ANIO} AND quincena = ${QUINCENA}
      ORDER BY tipo_endpoint;
    `);

    const firebirdDetails = await firebird.executeSafeQuery(
      `SELECT RFC,
              CAST(SUELDOM AS VARCHAR(40)) AS SUELDOM,
              CAST(OTRAS_PRESTACIONES AS VARCHAR(40)) AS OTRAS_PRESTACIONES,
              CAST(QUINQUENIOS AS VARCHAR(40)) AS QUINQUENIOS,
              CAST(SARE AS VARCHAR(40)) AS SARE,
              CAST(FRA AS VARCHAR(40)) AS FRA,
              CAST(FRE AS VARCHAR(40)) AS FRE,
              CAST(FHE AS VARCHAR(40)) AS FHE,
              CAST(FVE AS VARCHAR(40)) AS FVE,
              CAST(FAA AS VARCHAR(40)) AS FAA,
              CAST(FAE AS VARCHAR(40)) AS FAE,
              CAST(FAT AS VARCHAR(40)) AS FAT,
              CAST(FAI AS VARCHAR(40)) AS FAI
       FROM AP_S_FONDOS(?, ?, ?)`,
      [ORG0, ORG1, PERIODO]
    );
    const firebirdAggregate = await firebird.executeSafeQuery(
      `SELECT COUNT(*) AS REGISTROS,
              CAST(SUM(SARE) AS VARCHAR(40)) AS CAIR,
              CAST(SUM(FRA) AS VARCHAR(40)) AS FRA,
              CAST(SUM(FRE) AS VARCHAR(40)) AS FRE,
              CAST(SUM(FHE) AS VARCHAR(40)) AS FH,
              CAST(SUM(FVE) AS VARCHAR(40)) AS FV,
              CAST(SUM(FAA) AS VARCHAR(40)) AS FAA,
              CAST(SUM(FAE) AS VARCHAR(40)) AS FAE,
              CAST(SUM(FAT) AS VARCHAR(40)) AS FAT,
              CAST(SUM(FAI) AS VARCHAR(40)) AS FAI
       FROM AP_S_FONDOS(?, ?, ?)`,
      [ORG0, ORG1, PERIODO]
    );

    const recordsets = sqlResult.recordsets as Array<Array<Record<string, unknown>>>;
    const databaseName = String(recordsets[0][0]?.BaseDatos ?? 'UNKNOWN');
    const formulaRows = recordsets[1];
    const payrollRows = recordsets[2];
    const bitacora = recordsets[3][0] ?? null;
    const detailHistory = recordsets[4];
    const summaryHistory = recordsets[5];

    if (formulaRows.length !== 15) throw new Error(`FORMULA_PARAMETERS_EXPECTED_15_ACTUAL_${formulaRows.length}`);
    if (payrollRows.length !== 169) throw new Error(`PAYROLL_ROWS_EXPECTED_169_ACTUAL_${payrollRows.length}`);
    if (firebirdDetails.length !== 169) throw new Error(`FIREBIRD_ROWS_EXPECTED_169_ACTUAL_${firebirdDetails.length}`);
    for (const row of payrollRows) {
      const scope = [row.CargaOrganica0, row.CargaOrganica1, row.CargaOrganica2, row.CargaOrganica3].map(String);
      if (Number(row.CargaAnio) !== ANIO || Number(row.CargaQuincena) !== QUINCENA || scope.join('-') !== [ORG0, ORG1, ORG2, ORG3].join('-')) {
        throw new Error('PAYROLL_LOAD_SCOPE_MISMATCH');
      }
    }

    const payrollByRfc = new Map(payrollRows.map((row) => [normalizeRfc(row.RFC), row]));
    const firebirdByRfc = new Map(firebirdDetails.map((row) => [normalizeRfc(row.RFC), row]));
    const matchedRfcs = [...payrollByRfc.keys()].filter((rfc) => firebirdByRfc.has(rfc));
    const payrollOnlyRfcs = [...payrollByRfc.keys()].filter((rfc) => !firebirdByRfc.has(rfc));
    const firebirdOnlyRfcs = [...firebirdByRfc.keys()].filter((rfc) => !payrollByRfc.has(rfc));

    const partialCases = matchedRfcs
      .map((rfc) => ({ rfc, payroll: payrollByRfc.get(rfc)!, firebird: firebirdByRfc.get(rfc)! }))
      .filter(({ payroll }) => Number(payroll.DiasLaborados) > 0 && Number(payroll.DiasLaborados) < 15)
      .sort((a, b) =>
        Number(a.payroll.DiasLaborados) - Number(b.payroll.DiasLaborados)
        || Number(a.payroll.BaseCotizacionSueldo) - Number(b.payroll.BaseCotizacionSueldo)
        || a.rfc.localeCompare(b.rfc)
      )
      .map(({ payroll, firebird }, index) => ({
        caseId: `PARTIAL_${String(index + 1).padStart(3, '0')}`,
        origin: 'MATCHED',
        diasLaborados: money(payroll.DiasLaborados, 2),
        baseCotizacionSueldoTxt: money(payroll.BaseCotizacionSueldo, 2),
        baseCotizacionQuinqueniosTxt: money(payroll.BaseCotizacionQuinquenios, 2),
        sueldoMensualFirebird: money(firebird.SUELDOM, 2),
        otrasPrestacionesFirebird: money(firebird.OTRAS_PRESTACIONES, 2),
        quinqueniosFirebird: money(firebird.QUINQUENIOS, 2),
        legacyFirebird: {
          cair: money(firebird.SARE, 2),
          fra: money(firebird.FRA, 2),
          fre: money(firebird.FRE, 2),
          fh: money(firebird.FHE, 2),
          fv: money(firebird.FVE, 2),
          faa: money(firebird.FAA, 2),
          fae: money(firebird.FAE, 2),
          fat: money(firebird.FAT, 2),
          fai: money(firebird.FAI, 2)
        }
      }));

    const missingPayrollCases = firebirdOnlyRfcs.map((rfc, index) => {
      const row = firebirdByRfc.get(rfc)!;
      return {
        caseId: `MISSING_PAYROLL_${String(index + 1).padStart(3, '0')}`,
        origin: 'NOMINA_SIN_COINCIDENCIA',
        diasLaborados: '0.00',
        sueldoMensualFirebird: money(row.SUELDOM, 2),
        otrasPrestacionesFirebird: money(row.OTRAS_PRESTACIONES, 2),
        quinqueniosFirebird: money(row.QUINQUENIOS, 2),
        expectedProportionalBase: '0.000000'
      };
    });

    const missingFirebirdCases = payrollOnlyRfcs.map((rfc, index) => {
      const row = payrollByRfc.get(rfc)!;
      return {
        caseId: `MISSING_FIREBIRD_${String(index + 1).padStart(3, '0')}`,
        origin: 'NOMINA_SIN_AFILIADO_FIREBIRD',
        diasLaborados: money(row.DiasLaborados, 2),
        baseCotizacionSueldoTxt: money(row.BaseCotizacionSueldo, 2),
        baseCotizacionQuinqueniosTxt: money(row.BaseCotizacionQuinquenios, 2)
      };
    });

    const daysDistribution = payrollRows.reduce<Record<string, number>>((acc, row) => {
      const key = money(row.DiasLaborados, 2);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const formula = formulaRows[0];
    const payload = {
      schemaVersion: 1,
      fixtureId: 'APORTACIONES-04-24-01-01-1126',
      source: {
        environment: 'CALIDAD',
        database: databaseName,
        firebirdDatabase: QUALITY.firebirdDatabase,
        cargaId: CARGA_ID,
        anio: ANIO,
        quincena: QUINCENA,
        periodo: PERIODO,
        organica: [ORG0, ORG1, ORG2, ORG3],
        closed: bitacora?.Accion === 'TERMINADO',
        bitacoraResult: bitacora?.Resultado ?? null,
        readOnly: true
      },
      formula: {
        formulaCalculoVersionId: Number(formula.FormulaCalculoVersionId),
        clave: formula.ClaveFormula,
        anioVigencia: formula.AnioVigencia,
        numeroVersion: formula.NumeroVersion,
        quincenaDesde: formula.QuincenaDesde,
        quincenaHasta: formula.QuincenaHasta,
        precisionPolicy: formula.PrecisionPolicy,
        estado: formula.Estado,
        parameters: Object.fromEntries(formulaRows.map((row) => [
          row.ClaveParametro,
          { value: money(row.Valor, 9), unit: row.Unidad, source: row.Fuente }
        ]))
      },
      coverage: {
        payrollRows: payrollRows.length,
        payrollUniqueKeys: payrollByRfc.size,
        firebirdRows: firebirdDetails.length,
        firebirdUniqueKeys: firebirdByRfc.size,
        matched: matchedRfcs.length,
        payrollOnly: payrollOnlyRfcs.length,
        firebirdOnly: firebirdOnlyRfcs.length,
        daysDistribution
      },
      cases: [...partialCases, ...missingPayrollCases, ...missingFirebirdCases],
      baselines: {
        detailHistory: detailHistory.map((row) => ({
          fund: row.Fondo,
          rows: row.Registros,
          component1D6: row.Componente1 == null ? null : money(row.Componente1, 6),
          component2D6: row.Componente2 == null ? null : money(row.Componente2, 6),
          totalD6: money(row.Total, 6)
        })),
        summaryHistory: summaryHistory.map((row) => ({
          endpoint: row.tipo_endpoint,
          employees: row.total_empleados,
          contributionD6: money(row.total_contribucion, 6),
          salaryBaseD6: money(row.total_sueldo_base, 6)
        })),
        firebirdA2: Object.fromEntries(Object.entries(firebirdAggregate[0] ?? {}).map(([key, value]) => [
          key.toLowerCase(),
          key === 'REGISTROS' ? Number(value) : money(value, 2)
        ]))
      }
    };

    const serialized = `${JSON.stringify(payload, null, 2)}\n`;
    const forbiddenKeys = ['RFC', 'NombreAfiliado', 'nombre', 'interno', 'LineaOriginal'];
    if (forbiddenKeys.some((key) => serialized.includes(`"${key}"`))) {
      throw new Error('PII_GUARD_FAILED');
    }

    const outputUrl = new URL('./fixtures/aportaciones/periodo-1126.golden.json', import.meta.url);
    await mkdir(fileURLToPath(new URL('./fixtures/aportaciones/', import.meta.url)), { recursive: true });
    await writeFile(fileURLToPath(outputUrl), serialized, 'utf8');
    console.log(`Golden fixture generado: ${fileURLToPath(outputUrl)}`);
    console.log(`Casos anonimizados: ${payload.cases.length}`);
  } finally {
    await Promise.allSettled([mssql.closeDatabaseConnection(), firebird.closeFirebirdPool()]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
