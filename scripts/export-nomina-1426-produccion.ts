import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import { parseNominaAplicacionQnalTxt } from '../src/modules/nomina/application/NominaAplicacionQnalTxtParser.js';

const PRODUCTION = DATABASE_ENVIRONMENTS.PRODUCCION;
const CARGA_ID = '12';
const OUTPUT_URL = new URL('../archivosTmp/241426.txt', import.meta.url);

process.env.SQLSERVER_DB = PRODUCTION.sqlDatabase;
process.env.FIREBIRD_DATABASE = PRODUCTION.firebirdDatabase;
assertDatabaseEnvironment('PRODUCCION', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function main(): Promise<void> {
  const { connectDatabase, closeDatabaseConnection, sql } = await import('../src/db/mssql.js');
  const pool = await connectDatabase();

  try {
    const result = await pool.request()
      .input('CargaId', sql.BigInt, CARGA_ID)
      .query(`
        SELECT DB_NAME() AS BaseDatos;

        SELECT Id,EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,
          ArchivoNombre,TotalDetalles,TipoCarga,Estatus,EsVigente
        FROM dbo.NominaAplicacionQnalCarga
        WHERE Id=@CargaId;

        SELECT LineaNumero,LineaOriginal
        FROM dbo.NominaAplicacionQnalDetalle
        WHERE CargaId=@CargaId
        ORDER BY LineaNumero,Id;
      `);
    const sets = result.recordsets as Array<Array<Record<string, unknown>>>;
    const database = String(sets[0][0]?.BaseDatos ?? '');
    const load = sets[1][0];
    const rows = sets[2];

    assert.equal(database, PRODUCTION.sqlDatabase, 'DESTINO_SQL_NO_PERMITIDO');
    assert.ok(load, `CARGA_${CARGA_ID}_NO_ENCONTRADA`);
    assert.equal(Number(load.Anio), 2026);
    assert.equal(Number(load.Quincena), 14);
    assert.equal(String(load.Organica0), '04');
    assert.equal(String(load.Organica1), '24');
    assert.equal(String(load.TipoCarga), 'TXT');
    assert.equal(String(load.Estatus), 'APLICADA');
    assert.equal(Boolean(load.EsVigente), true);
    assert.equal(Number(load.TotalDetalles), 169);
    assert.equal(rows.length, 169, 'DETALLE_VIGENTE_1426_INCOMPLETO');

    const lines = rows.map((row) => String(row.LineaOriginal ?? ''));
    assert.ok(lines.every((line) => line.length > 0), 'LINEA_ORIGINAL_VACIA');
    const text = `${lines.join('\r\n')}\r\n`;
    const buffer = Buffer.from(text, 'latin1');
    assert.equal(buffer.toString('latin1'), text, 'CONTENIDO_NO_REPRESENTABLE_EN_LATIN1');

    const parsed = parseNominaAplicacionQnalTxt(buffer);
    assert.deepEqual(parsed.errores, [], 'TXT_RECONSTRUIDO_INVALIDO');
    assert.equal(parsed.registros.length, 169, 'TXT_RECONSTRUIDO_INCOMPLETO');
    assert.equal(new Set(parsed.registros.map((row) => row.rfc.trim().toUpperCase())).size, 169, 'TXT_RECONSTRUIDO_RFC_DUPLICADO');
    assert.ok(parsed.registros.every((row) => row.diasLaborados >= 0 && row.diasLaborados <= 15), 'TXT_RECONSTRUIDO_DIAS_FUERA_RANGO');

    await writeFile(OUTPUT_URL, buffer);
    console.log(JSON.stringify({
      source: {
        environment: 'PRODUCCION',
        database,
        cargaId: CARGA_ID,
        archivo: String(load.ArchivoNombre),
        scope: `${load.Organica0}-${load.Organica1}-${load.Organica2}-${load.Organica3}`,
        periodo: '1426'
      },
      output: {
        path: OUTPUT_URL.pathname.replace(/^\/(.:)/, '$1'),
        encoding: 'latin1',
        lineEnding: 'CRLF',
        records: parsed.registros.length,
        bytes: buffer.length,
        sha256: createHash('sha256').update(buffer).digest('hex').toUpperCase()
      }
    }, null, 2));
    console.log('NOMINA_1426_TXT_EXPORT_OK');
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
