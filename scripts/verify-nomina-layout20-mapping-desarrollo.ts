import assert from 'node:assert/strict';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import { parseNominaAplicacionQnalTxt } from '../src/modules/nomina/application/NominaAplicacionQnalTxtParser.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const assertCorrect = process.argv.includes('--assert-correct');
const assertSqlCorrect = process.argv.includes('--assert-sql-correct');
const scopes = [
  { cargaId: 12, periodo: '1426', anio: 2026, quincena: 14 },
  { cargaId: 20, periodo: '1526', anio: 2026, quincena: 15 },
] as const;
const mappings = [
  ['aportacionAfiliadoFondoAhorro', 'FPEA', 'AportacionAfiliadoFondoAhorro'],
  ['aportacionEntidadFondoAhorro', 'FAA', 'AportacionEntidadFondoAhorro'],
  ['descuentoPrestamoCortoPlazo', 'PCP', 'DescuentoPrestamoCortoPlazo'],
  ['descuentoPrestamoHipotecario', 'HIP', 'DescuentoPrestamoHipotecario'],
  ['baseCotizacionSueldo', 'SDOBCOT', 'BaseCotizacionSueldo'],
  ['baseCotizacionQuinquenios', 'AQBCOT', 'BaseCotizacionQuinquenios'],
  ['sueldoMensual', 'SUELDOMEN', 'SueldoMensual'],
  ['quinqueniosMensual', 'QUINQMEN', 'QuinqueniosMensual'],
  ['cair', 'CAIR', 'CAIR'],
] as const;

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const firebird = await import('../src/db/firebird.js');
const pool = await connectDatabase();

try {
  for (const expected of scopes) {
    const carga = await pool.request().input('CargaId', sql.BigInt, expected.cargaId).query(`
      SELECT Id,Anio,Quincena,Organica0,Organica1,Organica2,Organica3
      FROM dbo.NominaAplicacionQnalCarga WHERE Id=@CargaId;
      SELECT LineaOriginal,AportacionAfiliadoFondoAhorro,AportacionEntidadFondoAhorro,
        AportacionAfiliadoEBI,AportacionEntidadEBI,DescuentoPrestamoCortoPlazo,
        DescuentoPrestamoHipotecario,BaseCotizacionSueldo,BaseCotizacionQuinquenios,
        SueldoMensual,AyudasMensuales,QuinqueniosMensual,CAIR
      FROM dbo.NominaAplicacionQnalDetalle WHERE CargaId=@CargaId ORDER BY LineaNumero;`);
    const sets = carga.recordsets as sql.IRecordSet<Record<string, unknown>>[];
    assert.equal(sets[0].length, 1, `CARGA_${expected.cargaId}_NO_EXISTE`);
    const header = sets[0][0];
    assert.equal(Number(header.Anio), expected.anio);
    assert.equal(Number(header.Quincena), expected.quincena);
    const parsed = parseLines(sets[1].map((row) => String(row.LineaOriginal ?? '')), expected.cargaId);
    const params = [expected.periodo, header.Organica0, header.Organica1];
    const firebirdRows = await firebird.executeSafeQuery(`
      SELECT RFC,FPEA,FAA,PCP,HIP,SDOBCOT,AQBCOT,SUELDOMEN,AYUDASMEN,QUINQMEN,CAIR,
        FAE,EBIA,EBIE,VIV,EBI,CAIRVOL,AYUDBCOT,QUINQBCOT,DESCTOS,STATUS,MOVIMIENTO,
        DOMICILIO,COLONIA,CIUDAD,CLAVE_EDO,CLAVE_MPIO,COD_POS,TELEFONO,SEXO,EDO_CIVIL,
        FECHANAC,CORG0,CORG1,CORG2,CORG3,ENCONTRO,N_ERROR
      FROM AP_D_ORIGEN_TODOS WHERE QNA=? AND ORG0=? AND ORG1=?`, params);
    const byRfc = new Map(firebirdRows.map((row) => [normalize(row.RFC), row]));
    assert.equal(byRfc.size, firebirdRows.length, `RFC_DUPLICADO_FIREBIRD_${expected.periodo}`);
    const mismatches = Object.fromEntries(mappings.map(([, column]) => [column, 0])) as Record<string, number>;
    const sqlMismatches = Object.fromEntries(mappings.map(([, , column]) => [column, 0])) as Record<string, number>;
    let missing = 0;
    let zeroDefaults = 0;
    const legacyMismatches: Record<string, number> = {};
    const mismatchDefault = (column: string) => { legacyMismatches[column] = (legacyMismatches[column] ?? 0) + 1; };
    for (const [index, registro] of parsed.entries()) {
      const sqlRow = sets[1][index];
      const row = byRfc.get(normalize(registro.rfc));
      if (!row) { missing++; continue; }
      for (const [property, column, sqlColumn] of mappings) {
        if (cents(registro[property] ?? 0) !== cents(row[column] ?? row[column.toLowerCase()] ?? 0)) mismatches[column]++;
        if (cents(registro[property] ?? 0) !== cents(sqlRow[sqlColumn] ?? 0)) sqlMismatches[sqlColumn]++;
      }
      if (cents(sqlRow.AportacionAfiliadoEBI) !== 0 || cents(sqlRow.AportacionEntidadEBI) !== 0 || cents(sqlRow.AyudasMensuales) !== 0) sqlMismatches.SinFuente = (sqlMismatches.SinFuente ?? 0) + 1;
      for (const column of ['AYUDASMEN','FAE','EBIA','EBIE','VIV','EBI','CAIRVOL','AYUDBCOT','QUINQBCOT','DESCTOS']) {
        if (cents(row[column] ?? row[column.toLowerCase()] ?? 0) !== 0) zeroDefaults++;
      }
      for (const column of ['DOMICILIO','COLONIA','CIUDAD','CLAVE_EDO','CLAVE_MPIO','COD_POS','TELEFONO','SEXO','EDO_CIVIL']) {
        if (String(row[column] ?? row[column.toLowerCase()] ?? '').trim() !== '.') mismatchDefault(column);
      }
      if (String(row.MOVIMIENTO ?? row.movimiento ?? '').trim() !== '') mismatchDefault('MOVIMIENTO');
      if (dateOnly(row.FECHANAC ?? row.fechanac) !== '2050-01-01') mismatchDefault('FECHANAC');
      for (const column of ['CORG0','CORG1','CORG2','CORG3']) {
        if (!/^\d{2}$/.test(String(row[column] ?? row[column.toLowerCase()] ?? '').trim())) mismatchDefault(column);
      }
      if (String(row.ENCONTRO ?? row.encontro ?? '').trim() !== 'S') mismatchDefault('ENCONTRO');
      if (cents(row.N_ERROR ?? row.n_error) !== 0) mismatchDefault('N_ERROR');
    }
    const mismatchTotal = Object.values(mismatches).reduce((sum, value) => sum + value, 0);
    const sqlMismatchTotal = Object.values(sqlMismatches).reduce((sum, value) => sum + value, 0);
    const legacyDefaults = Object.values(legacyMismatches).reduce((sum, value) => sum + value, 0);
    const result = { environment: 'DESARROLLO', cargaId: expected.cargaId, periodo: expected.periodo, sql: parsed.length, firebird: firebirdRows.length, missing, sqlMismatchTotal, mismatchTotal, zeroDefaults, legacyDefaults, legacyMismatches, sqlMismatches, mismatches };
    console.log(JSON.stringify(result));
    if (assertCorrect) assert.deepEqual({ missing, sqlMismatchTotal, mismatchTotal, zeroDefaults, legacyDefaults, firebird: firebirdRows.length }, { missing: 0, sqlMismatchTotal: 0, mismatchTotal: 0, zeroDefaults: 0, legacyDefaults: 0, firebird: parsed.length });
    if (assertSqlCorrect) assert.equal(sqlMismatchTotal, 0, `SQL_CARGA_${expected.cargaId}_MAPEO_INCORRECTO`);
  }
} finally {
  await Promise.all([closeDatabaseConnection(), firebird.closeFirebirdPool()]);
}

function parseLines(lines: string[], cargaId: number) {
  return lines.map((line, index) => {
    const result = parseNominaAplicacionQnalTxt(Buffer.from(line, 'latin1'));
    assert.deepEqual(result.errores, [], `CARGA_${cargaId}_LINEA_${index + 1}_INVALIDA`);
    assert.equal(result.registros.length, 1, `CARGA_${cargaId}_LINEA_${index + 1}_SIN_DETALLE`);
    return result.registros[0];
  });
}

function normalize(value: unknown): string { return String(value ?? '').trim().toUpperCase(); }
function cents(value: unknown): number { return Math.round(Number(value ?? 0) * 100); }
function dateOnly(value: unknown): string { return value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '').slice(0, 10); }
