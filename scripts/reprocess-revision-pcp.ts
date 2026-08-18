import type { ImportesRevision, RevisionTarea } from '../src/modules/reportes/revision/domain/Revision.types.js';
import { resolveDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const EXECUTE = process.argv.includes('--execute') || process.env.npm_config_execute === 'true';
const expectedDatabaseArg = process.argv.find((arg) => arg.startsWith('--database='));
const EXPECTED_DATABASE = expectedDatabaseArg?.slice('--database='.length).trim()
  || process.env.npm_config_database?.trim();
const expectedFirebirdArg = process.argv.find((arg) => arg.startsWith('--firebird='));
const EXPECTED_FIREBIRD = expectedFirebirdArg?.slice('--firebird='.length).trim()
  || process.env.npm_config_firebird?.trim();
const PERIODO = obtenerArgumento('periodo');
const ORG0 = obtenerArgumento('org0');
const ORG1 = obtenerArgumento('org1');
const ORG2 = obtenerArgumento('org2');
const ORG3 = obtenerArgumento('org3');

if (!EXPECTED_DATABASE || !EXPECTED_FIREBIRD) {
  throw new Error('Uso: npm run reprocess:revision:pcp -- --database=NOMBRE_BD --firebird=RUTA_FDB [--periodo=QQAA --org0=NN --org1=NN --org2=NN --org3=NN] [--execute]');
}
if (!resolveDatabaseEnvironment(EXPECTED_DATABASE, EXPECTED_FIREBIRD)) {
  throw new Error(`DESTINOS_FUERA_DE_MATRIZ: SQL=${EXPECTED_DATABASE}, Firebird=${EXPECTED_FIREBIRD}`);
}
process.env.FIREBIRD_READ_ONLY = 'true';
if (EXECUTE && (!PERIODO || !ORG0 || !ORG1 || !ORG2 || !ORG3)) {
  throw new Error('REPROCESO_SIN_FILTROS: --execute requiere periodo y org0-org3 explícitos');
}

interface ResultadoTarea {
  tarea: string;
  conceptos: Array<{
    numeroConcepto: 13 | 15 | 16;
    tipoFondo: 'LFA' | 'LFM' | 'LFP';
    registros: number;
    operacion: 'INSERT' | 'UPDATE' | 'SIN_CAMBIOS';
    importesActuales?: ImportesRevision;
    importesCalculados: ImportesRevision;
  }>;
  error?: string;
}

async function main(): Promise<void> {
  const [mssql, firebird, revisionModule, configModule] = await Promise.all([
    import('../src/db/mssql.js'),
    import('../src/db/firebird.js'),
    import('../src/modules/reportes/revision/infrastructure/persistence/RevisionRepository.js'),
    import('../src/config/env.js')
  ]);
  const pool = await mssql.connectDatabase();
  const resultados: ResultadoTarea[] = [];

  try {
    const databaseResult = await pool.request().query('SELECT DB_NAME() AS databaseName;');
    const databaseName = String(databaseResult.recordset[0]?.databaseName || '');
    if (databaseName !== EXPECTED_DATABASE) {
      throw new Error(`DESTINO_SQL_NO_PERMITIDO: esperado=${EXPECTED_DATABASE}, actual=${databaseName}`);
    }
    if (configModule.env.firebird.database !== EXPECTED_FIREBIRD) {
      throw new Error(`DESTINO_FIREBIRD_NO_PERMITIDO: esperado=${EXPECTED_FIREBIRD}, actual=${configModule.env.firebird.database}`);
    }

    const catalogo = await pool.request().query(`
      SELECT numeroConcepto, Concepto, activo
      FROM reportes.catalogoRevision
      WHERE numeroConcepto IN (13, 14, 15, 16)
      ORDER BY numeroConcepto;
    `);
    const catalogoPorNumero = new Map(catalogo.recordset.map((row) => [Number(row.numeroConcepto), row]));
    for (const numero of [13, 15, 16]) {
      const concepto = catalogoPorNumero.get(numero);
      if (!concepto || !Boolean(concepto.activo)) {
        throw new Error(`CONCEPTO_REQUERIDO_INACTIVO_O_INEXISTENTE: ${numero}`);
      }
    }

    const tareasResult = await pool.request()
      .input('periodoFiltro', mssql.sql.Char(4), PERIODO || null)
      .input('org0Filtro', mssql.sql.Char(2), ORG0 || null)
      .input('org1Filtro', mssql.sql.Char(2), ORG1 || null)
      .input('org2Filtro', mssql.sql.Char(2), ORG2 || null)
      .input('org3Filtro', mssql.sql.Char(2), ORG3 || null)
      .query(`
      WITH tareas AS (
        SELECT IdRevisionTarea, Organica0, Organica1, Organica2, Organica3,
          Periodo, UsuarioId,
          ROW_NUMBER() OVER (
            PARTITION BY Organica0, Organica1, Organica2, Organica3, Periodo
            ORDER BY IdRevisionTarea DESC
          ) AS rn
        FROM conciliacion.RevisionTarea
        WHERE Estatus = 'COMPLETADA'
          AND (@periodoFiltro IS NULL OR Periodo = @periodoFiltro)
          AND (@org0Filtro IS NULL OR Organica0 = @org0Filtro)
          AND (@org1Filtro IS NULL OR Organica1 = @org1Filtro)
          AND (@org2Filtro IS NULL OR Organica2 = @org2Filtro)
          AND (@org3Filtro IS NULL OR Organica3 = @org3Filtro)
      )
      SELECT IdRevisionTarea, Organica0, Organica1, Organica2, Organica3,
        Periodo, CONVERT(NVARCHAR(36), UsuarioId) AS UsuarioId
      FROM tareas
      WHERE rn = 1
      ORDER BY Periodo, Organica0, Organica1, Organica2, Organica3;
    `);

    const revisionRepo = new revisionModule.RevisionRepository(pool);
    for (const row of tareasResult.recordset) {
      const tarea: RevisionTarea = {
        idRevisionTarea: Number(row.IdRevisionTarea),
        org0: String(row.Organica0).trim(),
        org1: String(row.Organica1).trim(),
        org2: String(row.Organica2).trim(),
        org3: String(row.Organica3).trim(),
        periodo: String(row.Periodo).trim(),
        usuarioId: String(row.UsuarioId || '').trim(),
        intentos: 0,
        claimToken: ''
      };
      const clave = `${tarea.org0}-${tarea.org1}-${tarea.org2}-${tarea.org3}/${tarea.periodo}`;
      const resultadoTarea: ResultadoTarea = { tarea: clave, conceptos: [] };
      resultados.push(resultadoTarea);

      try {
        if (!tarea.usuarioId) throw new Error('REVISION_TAREA_SIN_USUARIO');
        const definiciones = [
          { numeroConcepto: 13 as const, tipoFondo: 'LFA' as const },
          { numeroConcepto: 15 as const, tipoFondo: 'LFM' as const },
          { numeroConcepto: 16 as const, tipoFondo: 'LFP' as const }
        ];
        const calculados = [];
        for (const definicion of definiciones) {
          const calculo = await revisionRepo.calcularLiberacionPcp(tarea, definicion.tipoFondo);
          calculados.push({ ...definicion, ...calculo });
        }

        const actualesResult = await pool.request()
          .input('org0', mssql.sql.Char(2), tarea.org0)
          .input('org1', mssql.sql.Char(2), tarea.org1)
          .input('org2', mssql.sql.Char(2), tarea.org2)
          .input('org3', mssql.sql.Char(2), tarea.org3)
          .input('periodo', mssql.sql.Char(4), tarea.periodo)
          .query(`
            SELECT c.numeroConcepto, r.CAIR, r.FRA, r.FRE, r.FH, r.FV,
              r.FAA, r.FAE, r.FAT, r.FAI, r.Estatus, r.Usuario
            FROM conciliacion.Revision r
            INNER JOIN reportes.catalogoRevision c
              ON c.idcatalogoRevision = r.IdCatalogoRevision
            WHERE r.Organica0 = @org0 AND r.Organica1 = @org1
              AND r.Organica2 = @org2 AND r.Organica3 = @org3
              AND r.Periodo = @periodo AND c.numeroConcepto IN (13, 15, 16);
          `);
        const actuales = new Map(actualesResult.recordset.map((item) => [Number(item.numeroConcepto), item]));
        const usuarioRevision = String(actuales.get(13)?.Usuario || '').trim();
        if (usuarioRevision) tarea.usuarioId = usuarioRevision;

        const guardados = EXECUTE
          ? await revisionRepo.guardarRevisiones(calculados.map((item) => ({
              tarea,
              numeroConcepto: item.numeroConcepto,
              importes: item.importes
            })))
          : [];

        resultadoTarea.conceptos = calculados.map((item, index) => ({
          numeroConcepto: item.numeroConcepto,
          tipoFondo: item.tipoFondo,
          registros: item.registros,
          operacion: EXECUTE
            ? guardados[index].operacion
            : operacionPrevista(actuales.get(item.numeroConcepto), item.importes, tarea.usuarioId),
          importesActuales: actuales.has(item.numeroConcepto)
            ? mapearImportes(actuales.get(item.numeroConcepto))
            : undefined,
          importesCalculados: item.importes
        }));
        console.log(JSON.stringify(resultadoTarea));
      } catch (error) {
        resultadoTarea.error = error instanceof Error ? error.message : String(error);
        console.error(JSON.stringify(resultadoTarea));
      }
    }

    const fallidos = resultados.filter((item) => item.error).length;
    console.log(JSON.stringify({
      modo: EXECUTE ? 'EXECUTE' : 'PREVIEW',
      databaseName,
      firebirdDatabase: configModule.env.firebird.database,
      tareas: resultados.length,
      exitosas: resultados.length - fallidos,
      fallidas: fallidos
    }, null, 2));
    if (fallidos > 0) process.exitCode = 1;
  } finally {
    await Promise.allSettled([
      firebird.closeFirebirdPool(),
      mssql.closeDatabaseConnection()
    ]);
  }
}

function operacionPrevista(
  actual: Record<string, unknown> | undefined,
  calculados: ImportesRevision,
  usuarioId: string
): 'INSERT' | 'UPDATE' | 'SIN_CAMBIOS' {
  if (!actual) return 'INSERT';
  const importesActuales = mapearImportes(actual);
  const mismosImportes = Object.keys(calculados).every((fondo) =>
    importesActuales[fondo as keyof ImportesRevision] === calculados[fondo as keyof ImportesRevision]);
  const mismoEstatus = String(actual.Estatus).trim() === 'A';
  const mismoUsuario = String(actual.Usuario || '').toUpperCase() === usuarioId.toUpperCase();
  return mismosImportes && mismoEstatus && mismoUsuario ? 'SIN_CAMBIOS' : 'UPDATE';
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

function redondear(valor: unknown): number {
  return Math.round(Number(valor || 0) * 100) / 100;
}

function obtenerArgumento(nombre: string): string | undefined {
  const valor = process.argv.find((arg) => arg.startsWith(`--${nombre}=`))
    ?.slice(nombre.length + 3)
    .trim() || process.env[`npm_config_${nombre}`]?.trim();
  if (!valor) return undefined;
  if (nombre === 'periodo' && !/^(0[1-9]|1[0-9]|2[0-4])\d{2}$/.test(valor)) {
    throw new Error(`PERIODO_INVALIDO: ${valor}`);
  }
  if (nombre !== 'periodo' && !/^\d{2}$/.test(valor)) {
    throw new Error(`${nombre.toUpperCase()}_INVALIDO: ${valor}`);
  }
  return valor;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
