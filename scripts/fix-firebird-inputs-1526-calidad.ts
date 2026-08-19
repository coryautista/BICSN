import assert from 'node:assert/strict';

const QUALITY_SQL = 'SII-ISSSSPEA';
const QUALITY_FIREBIRD = '/db/db/dbQna1426.fdb';

process.env.SQLSERVER_DB = QUALITY_SQL;
process.env.FIREBIRD_DATABASE = QUALITY_FIREBIRD;
process.env.FIREBIRD_READ_ONLY = 'false';

type SourceRow = {
  INTERNO: number;
  RFC: string;
  SUELDO: number;
  QUINQUENIOS: number;
};

const expected = {
  TORN71052064A: { interno: 88117, currentSueldo: 13795.67, targetSueldo: 9656.97 },
  PEMN790425RYA: { interno: 40488, currentQuinquenios: 1814.64, targetQuinquenios: 2419.52 }
} as const;

async function main(): Promise<void> {
  assert.equal(process.env.CONFIRM_FIX_1526, 'YES', 'CONFIRM_FIX_1526=YES es requerido');
  const [{ assertDatabaseEnvironment }, firebird] = await Promise.all([
    import('../src/config/databaseEnvironments.js'),
    import('../src/db/firebird.js')
  ]);
  assertDatabaseEnvironment('CALIDAD', QUALITY_SQL, QUALITY_FIREBIRD);

  try {
    const result = await firebird.executeInTransaction(async (tx) => {
      const before = await selectRows(tx, firebird.executeQueryInTransaction);
      validateRows(before, true);

      const torn = before.find((row) => normalizeRfc(row.RFC) === 'TORN71052064A')!;
      const pemn = before.find((row) => normalizeRfc(row.RFC) === 'PEMN790425RYA')!;
      const alreadyApplied = money(torn.SUELDO) === expected.TORN71052064A.targetSueldo
        && money(pemn.QUINQUENIOS) === expected.PEMN790425RYA.targetQuinquenios;

      if (!alreadyApplied) {
        await firebird.executeQueryInTransaction(tx, `
          UPDATE ORG_PERSONAL
          SET SUELDO = ?
          WHERE INTERNO = ?
            AND CLAVE_ORGANICA_0 = '04'
            AND CLAVE_ORGANICA_1 = '24'
            AND CLAVE_ORGANICA_2 = '01'
            AND CLAVE_ORGANICA_3 = '01'
            AND ACTIVO = 'A'
        `, [expected.TORN71052064A.targetSueldo, expected.TORN71052064A.interno]);
        await firebird.executeQueryInTransaction(tx, `
          UPDATE ORG_PERSONAL
          SET QUINQUENIOS = ?
          WHERE INTERNO = ?
            AND CLAVE_ORGANICA_0 = '04'
            AND CLAVE_ORGANICA_1 = '24'
            AND CLAVE_ORGANICA_2 = '01'
            AND CLAVE_ORGANICA_3 = '01'
            AND ACTIVO = 'A'
        `, [expected.PEMN790425RYA.targetQuinquenios, expected.PEMN790425RYA.interno]);
      }

      const after = await selectRows(tx, firebird.executeQueryInTransaction);
      validateRows(after, false);
      return { before, after, alreadyApplied };
    });

    console.log(JSON.stringify({
      environment: 'CALIDAD',
      periodo: '1526',
      organica: '04-24-01-01',
      database: QUALITY_FIREBIRD,
      ...result
    }, null, 2));
    console.log(result.alreadyApplied ? 'FIREBIRD_INPUTS_1526_ALREADY_APPLIED' : 'FIREBIRD_INPUTS_1526_FIXED');
  } finally {
    await firebird.closeFirebirdConnection();
  }
}

async function selectRows(
  tx: unknown,
  execute: (tx: unknown, sql: string, params?: unknown[]) => Promise<unknown[]>
): Promise<SourceRow[]> {
  const rows = await execute(tx, `
    SELECT o.INTERNO, p.RFC, o.SUELDO, o.QUINQUENIOS
    FROM ORG_PERSONAL o
    INNER JOIN PERSONAL p ON p.INTERNO = o.INTERNO
    WHERE o.CLAVE_ORGANICA_0 = '04'
      AND o.CLAVE_ORGANICA_1 = '24'
      AND o.CLAVE_ORGANICA_2 = '01'
      AND o.CLAVE_ORGANICA_3 = '01'
      AND o.ACTIVO = 'A'
      AND UPPER(TRIM(p.RFC)) IN ('TORN71052064A', 'PEMN790425RYA')
    ORDER BY p.RFC
  `);
  return rows as SourceRow[];
}

function validateRows(rows: SourceRow[], before: boolean): void {
  assert.equal(rows.length, 2, 'Se esperaban exactamente dos filas fuente');
  const byRfc = new Map(rows.map((row) => [normalizeRfc(row.RFC), row]));
  const torn = byRfc.get('TORN71052064A');
  const pemn = byRfc.get('PEMN790425RYA');
  assert.ok(torn && pemn, 'No se encontraron ambos RFC esperados');
  assert.equal(Number(torn.INTERNO), expected.TORN71052064A.interno, 'Interno TORN inesperado');
  assert.equal(Number(pemn.INTERNO), expected.PEMN790425RYA.interno, 'Interno PEMN inesperado');

  if (before) {
    assert.ok(
      [expected.TORN71052064A.currentSueldo, expected.TORN71052064A.targetSueldo].includes(money(torn.SUELDO)),
      `Sueldo TORN no conciliado: ${money(torn.SUELDO)}`
    );
    assert.ok(
      [expected.PEMN790425RYA.currentQuinquenios, expected.PEMN790425RYA.targetQuinquenios].includes(money(pemn.QUINQUENIOS)),
      `Quinquenios PEMN no conciliado: ${money(pemn.QUINQUENIOS)}`
    );
    return;
  }

  assert.equal(money(torn.SUELDO), expected.TORN71052064A.targetSueldo, 'No se aplicó sueldo TORN');
  assert.equal(money(pemn.QUINQUENIOS), expected.PEMN790425RYA.targetQuinquenios, 'No se aplicó quinquenio PEMN');
}

function normalizeRfc(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

function money(value: unknown): number {
  return Number(Number(value).toFixed(2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
