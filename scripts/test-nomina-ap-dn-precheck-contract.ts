import assert from 'node:assert/strict';
import { verificarAP_DN_APLICAR } from '../src/modules/afiliado/infrastructure/services/AfiliadoBdiSspeaFirebirdService.js';

type Counts = { total: number; preparados: number; nuevos: number; aplicados: number; resumenes: number };

async function verify(counts: Counts): Promise<void> {
  let query = 0;
  const tx = { query: async () => ++query === 1
    ? [{ TOTAL: counts.total, PREPARADOS: counts.preparados, NUEVOS: counts.nuevos, APLICADOS: counts.aplicados }]
    : [{ TOTAL: counts.resumenes }] };
  await verificarAP_DN_APLICAR('0127', '04', '24', '01', '01', tx);
  assert.equal(query, 2);
}

await verify({ total: 2, preparados: 2, nuevos: 0, aplicados: 0, resumenes: 1 });
for (const invalid of [
  { total: 2, preparados: 1, nuevos: 1, aplicados: 0, resumenes: 1 },
  { total: 2, preparados: 1, nuevos: 0, aplicados: 1, resumenes: 1 },
  { total: 0, preparados: 0, nuevos: 0, aplicados: 0, resumenes: 1 },
  { total: 2, preparados: 2, nuevos: 0, aplicados: 0, resumenes: 0 },
  { total: 2, preparados: 2, nuevos: 0, aplicados: 0, resumenes: 2 },
]) await assert.rejects(verify(invalid), /NOMINA_FIREBIRD_SCOPE_NO_PREPARADO/);

console.log('NOMINA_AP_DN_PRECHECK_CONTRACT_OK');
