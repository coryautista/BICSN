import assert from 'node:assert/strict';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const expectedIdentity = { ORG0: '04', ORG1: '24', ORG2: '01', ORG3: '01', PERIODO: '1526', TIPO: 'AN' };
const expectedNonzero: Record<string, number> = {
  FO_AFIL: 167,
  FO_SDO: 2723778.47,
  FO_SDOB: 1356840.24,
  FO_OPB: 44156.24,
  FO_Q: 88312.48,
  FO_SAR: 27136.95,
  FO_FRA: 61057.69,
  FO_FRE: 313708.76,
  FO_FHE: 4748.96,
  FO_FVE: 18995.66,
  FO_FAA: 67842.16,
  FO_FAE: 33920.82,
  PCP_N_COBRO: 89,
  PCP_COBRO: 65464.85,
  PCP_COBRO_K: 57619.97,
  PCP_COBRO_I: 7844.88,
  PPV_N_HIP: 12,
  PPV_HIP_K: 11713.63,
  PPV_HIP_S: 2319.46,
  PPV_HIP_I: 33492.25,
};
const expectedDate = new Date(2026, 7, 12, 12, 5, 0);
const firebird = await import('../src/db/firebird.js');

try {
  const [summaries, statuses] = await Promise.all([
    firebird.executeSafeQuery('SELECT * FROM AP_D_ORIGEN_RESUMEN WHERE PERIODO=? AND ORG0=? AND ORG1=? AND ORG2=? AND ORG3=? AND TIPO=?', ['1526','04','24','01','01','AN'], undefined, { org0: '04', org1: '24' }),
    firebird.executeSafeQuery(`SELECT COUNT(*) TOTAL,
      SUM(CASE WHEN STATUS='P' THEN 1 ELSE 0 END) TOTAL_P,
      SUM(CASE WHEN STATUS='A' THEN 1 ELSE 0 END) TOTAL_A
      FROM AP_D_ORIGEN_TODOS WHERE QNA=? AND ORG0=? AND ORG1=?`, ['1526','04','24'], undefined, { org0: '04', org1: '24' }),
  ]);
  assert.equal(summaries.length, 1, 'Q15_DEBE_TENER_UN_RESUMEN_AN');
  const row = summaries[0];
  assert.deepEqual(Object.fromEntries(Object.keys(expectedIdentity).map((key) => [key, String(row[key] ?? '').trim()])), expectedIdentity);
  assert.deepEqual({ total:Number(statuses[0]?.TOTAL ?? 0), pending:Number(statuses[0]?.TOTAL_P ?? 0), applied:Number(statuses[0]?.TOTAL_A ?? 0) }, { total:167, pending:167, applied:0 });

  const nulls = Object.entries(row).filter(([, value]) => value === null).map(([key]) => key);
  assert.deepEqual(nulls, [], `Q15_RESUMEN_CONTIENE_NULL: ${nulls.join(',')}`);
  for (const [column, expected] of Object.entries(expectedNonzero)) assert.equal(cents(row[column]), cents(expected), `Q15_${column}_DIFIERE`);
  for (const [column, value] of Object.entries(row)) {
    if (column in expectedIdentity || column === 'FMOV_ALT' || column in expectedNonzero) continue;
    assert.equal(cents(value), 0, `Q15_${column}_DEBE_SER_CERO`);
  }
  const actualDate = row.FMOV_ALT instanceof Date ? row.FMOV_ALT : new Date(String(row.FMOV_ALT ?? ''));
  assert.equal(localDateTime(actualDate), localDateTime(expectedDate), 'Q15_FMOV_ALT_DIFIERE');
  console.log(JSON.stringify({ environment:'DESARROLLO', periodo:'1526', summaryRows:1, detailRows:167, pending:167, applied:0, nulls:0, nonzeroFields:Object.keys(expectedNonzero).length, zeroFields:Object.keys(row).length - Object.keys(expectedIdentity).length - Object.keys(expectedNonzero).length - 1, fmovAlt:localDateTime(actualDate) }));
} finally {
  await firebird.closeFirebirdPool();
}

function cents(value: unknown): number { return Math.round(Number(value ?? 0) * 100); }
function localDateTime(date: Date): string {
  assert(Number.isFinite(date.getTime()), 'FECHA_RESUMEN_INVALIDA');
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
