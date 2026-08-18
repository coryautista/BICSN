import type { ImportesRevision, RevisionTarea } from '../src/modules/reportes/revision/domain/Revision.types.js';
import { DATABASE_ENVIRONMENTS } from '../src/config/databaseEnvironments.js';

const EXECUTE = process.argv.includes('--execute') || process.env.npm_config_execute === 'true';
const EXPECTED_DATABASE = obtenerArgumento('database');
const ID_REVISION = 13;
const ORG0 = '04';
const ORG1 = '24';
const ORG2 = '01';
const ORG3 = '01';
const PERIODO = '1426';
const IMPORTES: ImportesRevision = {
  CAIR: 0,
  FRA: 0,
  FRE: 0,
  FH: 0,
  FV: 0,
  FAA: -42889.69,
  FAE: -12577.02,
  FAT: -55466.71,
  FAI: -1448.00
};
const IMPORTES_APLICADOS_SIN_FAT: ImportesRevision = { ...IMPORTES, FAT: 0 };

if (!EXPECTED_DATABASE) {
  throw new Error('Uso: npm run recover:revision:concepto13-1426 -- --database=NOMBRE_BD [--execute]');
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

    const actualResult = await pool.request()
      .input('idRevision', mssql.sql.BigInt, ID_REVISION)
      .query(`
        SELECT r.IdRevision, r.Organica0, r.Organica1, r.Organica2, r.Organica3,
          r.Periodo, c.numeroConcepto, r.CAIR, r.FRA, r.FRE, r.FH, r.FV,
          r.FAA, r.FAE, r.FAT, r.FAI, r.Estatus, r.Usuario
        FROM conciliacion.Revision r
        INNER JOIN reportes.catalogoRevision c
          ON c.idcatalogoRevision = r.IdCatalogoRevision
        WHERE r.IdRevision = @idRevision;
      `);
    const actual = actualResult.recordset[0];
    if (!actual) throw new Error('REVISION_13_NO_ENCONTRADA');
    if (
      String(actual.Organica0).trim() !== ORG0
      || String(actual.Organica1).trim() !== ORG1
      || String(actual.Organica2).trim() !== ORG2
      || String(actual.Organica3).trim() !== ORG3
      || String(actual.Periodo).trim() !== PERIODO
      || Number(actual.numeroConcepto) !== 13
    ) {
      throw new Error('REVISION_13_NO_COINCIDE_CON_DESTINO_ESPERADO');
    }

    const actuales = mapearImportes(actual);
    const yaAplicado = mismosImportes(actuales, IMPORTES);
    const estaEnCeros = Object.values(actuales).every((importe) => importe === 0);
    const esCorreccionPreviaSinFat = mismosImportes(actuales, IMPORTES_APLICADOS_SIN_FAT);
    if (!yaAplicado && !estaEnCeros && !esCorreccionPreviaSinFat) {
      throw new Error('REVISION_13_TIENE_IMPORTES_NO_ESPERADOS');
    }

    if (!EXECUTE) {
      console.log(JSON.stringify({
        modo: 'PREVIEW',
        databaseName,
        idRevision: ID_REVISION,
        organica: `${ORG0}-${ORG1}-${ORG2}-${ORG3}`,
        periodo: PERIODO,
        concepto: 13,
        registrosOrigen: 6,
        importesActuales: actuales,
        importesCalculados: IMPORTES,
        operacion: yaAplicado ? 'SIN_CAMBIOS' : 'UPDATE'
      }, null, 2));
      return;
    }

    const usuarioId = String(actual.Usuario || '').trim();
    if (!usuarioId) throw new Error('REVISION_13_SIN_USUARIO');
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
    const revisionRepo = new revisionModule.RevisionRepository(pool);
    const [resultado] = await revisionRepo.guardarRevisiones([{
      tarea,
      numeroConcepto: 13,
      importes: IMPORTES
    }]);
    if (resultado.idRevision !== ID_REVISION) {
      throw new Error(`REVISION_ACTUALIZADA_INESPERADA: ${resultado.idRevision}`);
    }
    console.log(JSON.stringify({
      modo: 'EXECUTE',
      databaseName,
      idRevision: ID_REVISION,
      registrosOrigen: 6,
      importes: IMPORTES,
      resultado
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

function mismosImportes(actuales: ImportesRevision, esperados: ImportesRevision): boolean {
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
