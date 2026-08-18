import type { ImportesRevision, RevisionTarea } from '../src/modules/reportes/revision/domain/Revision.types.js';
import { DATABASE_ENVIRONMENTS } from '../src/config/databaseEnvironments.js';

const EXECUTE = process.argv.includes('--execute') || process.env.npm_config_execute === 'true';
const EXPECTED_DATABASE = obtenerArgumento('database');
const ORG0 = '04';
const ORG1 = '24';
const ORG2 = '01';
const ORG3 = '01';
const PERIODO_SALDO = '1326';
const PERIODO_SIGUIENTE = '1426';
const IMPORTES: ImportesRevision = {
  CAIR: 3342051.64,
  FRA: 6880480.89,
  FRE: 38807600.94,
  FH: 582809.84,
  FV: 2331234.67,
  FAA: 3413456.51,
  FAE: 1706376.95,
  FAT: 5119833.46,
  FAI: 90879.00
};

if (!EXPECTED_DATABASE) {
  throw new Error('Uso: npm run recover:revision:saldo-1326 -- --database=NOMBRE_BD [--execute]');
}
if (EXPECTED_DATABASE !== DATABASE_ENVIRONMENTS.CALIDAD.sqlDatabase) {
  throw new Error(`RECUPERACION_1326_SOLO_CALIDAD: ${EXPECTED_DATABASE}`);
}

async function main(): Promise<void> {
  const [mssql, revisionModule] = await Promise.all([
    import('../src/db/mssql.js'),
    import('../src/modules/reportes/revision/infrastructure/persistence/RevisionRepository.js')
  ]);
  const pool = await mssql.connectDatabase();

  try {
    const databaseResult = await pool.request().query('SELECT DB_NAME() AS databaseName;');
    const databaseName = String(databaseResult.recordset[0]?.databaseName || '');
    if (databaseName !== EXPECTED_DATABASE) {
      throw new Error(`DESTINO_SQL_NO_PERMITIDO: esperado=${EXPECTED_DATABASE}, actual=${databaseName}`);
    }

    const tareaResult = await pool.request()
      .input('org0', mssql.sql.Char(2), ORG0)
      .input('org1', mssql.sql.Char(2), ORG1)
      .input('org2', mssql.sql.Char(2), ORG2)
      .input('org3', mssql.sql.Char(2), ORG3)
      .input('periodo', mssql.sql.Char(4), PERIODO_SIGUIENTE)
      .query(`
        SELECT TOP (1) IdRevisionTarea, CONVERT(NVARCHAR(36), UsuarioId) AS UsuarioId
        FROM conciliacion.RevisionTarea
        WHERE Organica0 = @org0 AND Organica1 = @org1
          AND Organica2 = @org2 AND Organica3 = @org3
          AND Periodo = @periodo AND Estatus = 'COMPLETADA'
        ORDER BY IdRevisionTarea DESC;
      `);
    const usuarioId = String(tareaResult.recordset[0]?.UsuarioId || '').trim();
    if (!usuarioId) throw new Error('TAREA_1426_COMPLETADA_SIN_USUARIO');

    const actualesResult = await pool.request()
      .input('org0', mssql.sql.Char(2), ORG0)
      .input('org1', mssql.sql.Char(2), ORG1)
      .input('org2', mssql.sql.Char(2), ORG2)
      .input('org3', mssql.sql.Char(2), ORG3)
      .query(`
        SELECT r.IdRevision, r.Periodo, c.numeroConcepto,
          r.CAIR, r.FRA, r.FRE, r.FH, r.FV, r.FAA, r.FAE, r.FAT, r.FAI,
          r.Estatus, r.Usuario
        FROM conciliacion.Revision r
        INNER JOIN reportes.catalogoRevision c
          ON c.idcatalogoRevision = r.IdCatalogoRevision
        WHERE r.Organica0 = @org0 AND r.Organica1 = @org1
          AND r.Organica2 = @org2 AND r.Organica3 = @org3
          AND ((r.Periodo = '${PERIODO_SALDO}' AND c.numeroConcepto = 12)
            OR (r.Periodo = '${PERIODO_SIGUIENTE}' AND c.numeroConcepto = 1));
      `);
    const saldoActual = actualesResult.recordset.find((row) => String(row.Periodo).trim() === PERIODO_SALDO);
    const saldoAnterior = actualesResult.recordset.find((row) => String(row.Periodo).trim() === PERIODO_SIGUIENTE);
    if (!saldoAnterior) throw new Error('CONCEPTO_1_1426_NO_ENCONTRADO');
    if (saldoActual && !mismosImportes(saldoActual, IMPORTES)) {
      throw new Error('CONCEPTO_12_1326_EXISTE_CON_IMPORTES_DIFERENTES');
    }

    const tareaBase: Omit<RevisionTarea, 'periodo'> = {
      idRevisionTarea: Number(tareaResult.recordset[0].IdRevisionTarea),
      org0: ORG0,
      org1: ORG1,
      org2: ORG2,
      org3: ORG3,
      usuarioId,
      intentos: 0,
      claimToken: ''
    };
    const operacionesPrevistas = [
      {
        periodo: PERIODO_SALDO,
        numeroConcepto: 12,
        operacion: saldoActual ? 'SIN_CAMBIOS' : 'INSERT'
      },
      {
        periodo: PERIODO_SIGUIENTE,
        numeroConcepto: 1,
        operacion: mismosImportes(saldoAnterior, IMPORTES) ? 'SIN_CAMBIOS' : 'UPDATE'
      }
    ];

    if (!EXECUTE) {
      console.log(JSON.stringify({
        modo: 'PREVIEW',
        databaseName,
        organica: `${ORG0}-${ORG1}-${ORG2}-${ORG3}`,
        importes: IMPORTES,
        operaciones: operacionesPrevistas
      }, null, 2));
      return;
    }

    const revisionRepo = new revisionModule.RevisionRepository(pool);
    const resultados = await revisionRepo.guardarRevisiones([
      {
        tarea: { ...tareaBase, periodo: PERIODO_SALDO },
        numeroConcepto: 12,
        importes: IMPORTES
      },
      {
        tarea: { ...tareaBase, periodo: PERIODO_SIGUIENTE },
        numeroConcepto: 1,
        importes: IMPORTES
      }
    ]);
    console.log(JSON.stringify({
      modo: 'EXECUTE',
      databaseName,
      organica: `${ORG0}-${ORG1}-${ORG2}-${ORG3}`,
      resultados: [
        { periodo: PERIODO_SALDO, numeroConcepto: 12, ...resultados[0] },
        { periodo: PERIODO_SIGUIENTE, numeroConcepto: 1, ...resultados[1] }
      ]
    }, null, 2));
  } finally {
    await mssql.closeDatabaseConnection();
  }
}

function obtenerArgumento(nombre: string): string | undefined {
  return process.argv.find((arg) => arg.startsWith(`--${nombre}=`))
    ?.slice(nombre.length + 3)
    .trim() || process.env[`npm_config_${nombre}`]?.trim();
}

function mismosImportes(row: Record<string, unknown>, esperados: ImportesRevision): boolean {
  return Object.entries(esperados).every(([fondo, esperado]) =>
    redondear(row[fondo]) === redondear(esperado));
}

function redondear(valor: unknown): number {
  return Math.round(Number(valor || 0) * 100) / 100;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
