import { crearImportesRevision } from '../src/modules/reportes/revision/domain/Revision.types.js';
import type { ImportesRevision, RevisionTarea } from '../src/modules/reportes/revision/domain/Revision.types.js';
import { DATABASE_ENVIRONMENTS } from '../src/config/databaseEnvironments.js';

const EXECUTE = process.argv.includes('--execute') || process.env.npm_config_execute === 'true';
const EXPECTED_DATABASE = obtenerArgumento('database');
const ORG0 = '04';
const ORG1 = '24';
const ORG2 = '01';
const ORG3 = '01';
const PERIODO = '1426';
const CONCEPTOS = [8, 11] as const;
const IMPORTES_CERO = crearImportesRevision();

if (!EXPECTED_DATABASE) {
  throw new Error('Uso: npm run recover:revision:anuales-1426 -- --database=NOMBRE_BD [--execute]');
}
if (EXPECTED_DATABASE !== DATABASE_ENVIRONMENTS.CALIDAD.sqlDatabase) {
  throw new Error(`RECUPERACION_1426_SOLO_CALIDAD: ${EXPECTED_DATABASE}`);
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

    const actualesResult = await pool.request()
      .input('org0', mssql.sql.Char(2), ORG0)
      .input('org1', mssql.sql.Char(2), ORG1)
      .input('org2', mssql.sql.Char(2), ORG2)
      .input('org3', mssql.sql.Char(2), ORG3)
      .input('periodo', mssql.sql.Char(4), PERIODO)
      .query(`
        SELECT r.IdRevision, c.numeroConcepto, r.CAIR, r.FRA, r.FRE, r.FH, r.FV,
          r.FAA, r.FAE, r.FAT, r.FAI, r.Estatus, r.Usuario
        FROM conciliacion.Revision r
        INNER JOIN reportes.catalogoRevision c
          ON c.idcatalogoRevision = r.IdCatalogoRevision
        WHERE r.Organica0 = @org0 AND r.Organica1 = @org1
          AND r.Organica2 = @org2 AND r.Organica3 = @org3
          AND r.Periodo = @periodo AND c.numeroConcepto IN (8, 11)
        ORDER BY c.numeroConcepto;
      `);
    if (actualesResult.recordset.length !== CONCEPTOS.length) {
      throw new Error('CONCEPTOS_8_11_1426_INCOMPLETOS');
    }
    const actuales = new Map(actualesResult.recordset.map((row) => [Number(row.numeroConcepto), row]));
    const usuarioId = String(actuales.get(8)?.Usuario || '').trim();
    if (!usuarioId) throw new Error('CONCEPTO_8_1426_SIN_USUARIO');

    const tarea: RevisionTarea = {
      idRevisionTarea: 0,
      org0: ORG0,
      org1: ORG1,
      org2: ORG2,
      org3: ORG3,
      periodo: PERIODO,
      usuarioId,
      intentos: 0,
      claimToken: ''
    };
    const operaciones = CONCEPTOS.map((numeroConcepto) => {
      const actual = actuales.get(numeroConcepto)!;
      return {
        idRevision: Number(actual.IdRevision),
        numeroConcepto,
        importesActuales: mapearImportes(actual),
        importesCalculados: IMPORTES_CERO,
        operacion: mismosImportes(actual, IMPORTES_CERO) ? 'SIN_CAMBIOS' : 'UPDATE'
      };
    });

    if (!EXECUTE) {
      console.log(JSON.stringify({
        modo: 'PREVIEW',
        databaseName,
        organica: `${ORG0}-${ORG1}-${ORG2}-${ORG3}`,
        periodo: PERIODO,
        operaciones
      }, null, 2));
      return;
    }

    const revisionRepo = new revisionModule.RevisionRepository(pool);
    const resultados = await revisionRepo.guardarRevisiones(CONCEPTOS.map((numeroConcepto) => ({
      tarea,
      numeroConcepto,
      importes: IMPORTES_CERO
    })));
    console.log(JSON.stringify({
      modo: 'EXECUTE',
      databaseName,
      organica: `${ORG0}-${ORG1}-${ORG2}-${ORG3}`,
      periodo: PERIODO,
      resultados: resultados.map((resultado, index) => ({
        numeroConcepto: CONCEPTOS[index],
        ...resultado
      }))
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

function mapearImportes(row: Record<string, unknown>): ImportesRevision {
  return {
    CAIR: redondear(row.CAIR),
    FRA: redondear(row.FRA),
    FRE: redondear(row.FRE),
    FH: redondear(row.FH),
    FV: redondear(row.FV),
    FAA: redondear(row.FAA),
    FAE: redondear(row.FAE),
    FAT: redondear(row.FAT),
    FAI: redondear(row.FAI)
  };
}

function mismosImportes(row: Record<string, unknown>, esperados: ImportesRevision): boolean {
  const actuales = mapearImportes(row);
  return Object.keys(esperados).every((fondo) =>
    actuales[fondo as keyof ImportesRevision] === esperados[fondo as keyof ImportesRevision]);
}

function redondear(valor: unknown): number {
  return Math.round(Number(valor || 0) * 100) / 100;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
