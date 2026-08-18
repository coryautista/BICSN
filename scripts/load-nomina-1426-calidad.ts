import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import { parseNominaAplicacionQnalTxt } from '../src/modules/nomina/application/NominaAplicacionQnalTxtParser.js';

const QUALITY = DATABASE_ENVIRONMENTS.CALIDAD;
const EXPECTED_SHA256 = '12015AC0BAF1357761EEEE7386025092B05C0707CA96057EC57EB734C9213BEF';
const FILE_URL = new URL('../archivosTmp/241426.txt', import.meta.url);

process.env.SQLSERVER_DB = QUALITY.sqlDatabase;
process.env.FIREBIRD_DATABASE = QUALITY.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function main(): Promise<void> {
  const [mssql, firebird, { AfectacionOrgService }, { NominaAplicacionQnalTxtRepository }] = await Promise.all([
    import('../src/db/mssql.js'),
    import('../src/db/firebird.js'),
    import('../src/modules/afectacionOrg/infrastructure/services/AfectacionOrgService.js'),
    import('../src/modules/nomina/infrastructure/persistence/NominaAplicacionQnalTxtRepository.js')
  ]);
  const content = await readFile(FILE_URL);
  assert.equal(createHash('sha256').update(content).digest('hex').toUpperCase(), EXPECTED_SHA256, 'TXT_1426_HASH_DIFIERE');
  const parsed = parseNominaAplicacionQnalTxt(content);
  assert.deepEqual(parsed.errores, [], 'TXT_1426_INVALIDO');
  assert.equal(parsed.registros.length, 169, 'TXT_1426_REGISTROS_DIFIERE');

  const pool = await mssql.connectDatabase();
  try {
    const databaseResult = await pool.request().query('SELECT DB_NAME() AS BaseDatos');
    assert.equal(String(databaseResult.recordset[0]?.BaseDatos), QUALITY.sqlDatabase, 'DESTINO_SQL_NO_PERMITIDO');

    const quincena = await new AfectacionOrgService().getQuincenaFromFirebird('04', '24', '01', '01');
    assert.deepEqual({ anio: quincena.anio, quincena: quincena.quincena }, { anio: 2026, quincena: 15 }, 'FIREBIRD_CALIDAD_VIGENTE_INESPERADO');

    const repository = new NominaAplicacionQnalTxtRepository(pool);
    // Importacion historica controlada: el comando HTTP solo admite la quincena vigente (1526).
    const input = {
      entidadId: 1,
      anio: 2026,
      quincena: 14,
      organica0: '04',
      organica1: '24',
      organica2: '01',
      organica3: '01',
      archivoNombre: '241426.txt',
      archivoContenido: content,
      usuarioId: 'fase4-import-produccion'
    };
    const result = await repository.reemplazarVigentes(input, parsed.registros);
    assert.equal(result.estado, 'ACEPTADA', `CARGA_1426_RECHAZADA:${JSON.stringify(result.errores)}`);
    assert.equal(result.totalRegistros, 169);

    const current = await repository.consultarCargaVigente({
      entidadId: 1,
      anio: 2026,
      quincena: 14,
      organica0: '04',
      organica1: '24',
      organica2: '01',
      organica3: '01'
    });
    assert.ok(current, 'CARGA_1426_VIGENTE_NO_ENCONTRADA');
    assert.equal(current.cargaId, String(result.cargaId));
    assert.equal(current.registrosCargaBase, 169);
    assert.equal(current.rfcUnicos, 169);
    assert.equal(current.rfcDuplicados, 0);
    assert.equal(current.diasNulos, 0);

    console.log(JSON.stringify({
      environment: 'CALIDAD',
      sqlDatabase: QUALITY.sqlDatabase,
      firebirdDatabase: QUALITY.firebirdDatabase,
      cargaId: String(result.cargaId),
      archivo: '241426.txt',
      registros: current.registrosCargaBase,
      rfcUnicos: current.rfcUnicos,
      dias: {
        parciales: current.diasParciales,
        cero: current.diasCero,
        nulos: current.diasNulos,
        quince: current.diasQuince
      }
    }, null, 2));
    console.log('NOMINA_1426_CALIDAD_LOAD_OK');
  } finally {
    await Promise.allSettled([mssql.closeDatabaseConnection(), firebird.closeFirebirdPool()]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
