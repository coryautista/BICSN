import assert from 'node:assert/strict';
import { executeTypedTransaction, type FirebirdTransactionHandle } from '../src/db/firebird.js';
import { NominaLayout20FirebirdSyncService } from '../src/modules/nomina/infrastructure/firebird/NominaLayout20FirebirdSyncService.js';
import { NominaLayout20FirebirdSyncError } from '../src/modules/nomina/domain/services/NominaLayout20FirebirdSync.js';
import type { NominaAplicacionQnalRegistroParsed } from '../src/modules/nomina/domain/entities/NominaAplicacionQnalTxt.js';

const row: NominaAplicacionQnalRegistroParsed = { numeroLinea: 2, lote: '0126007', tipoRegistro: '2', clavePersonal: 'SYN000001', rfc: 'SYNX000101T01', nombreAfiliado: 'SINTETICO', aportacionAfiliadoFondoAhorro: 10, aportacionEntidadFondoAhorro: 20, aportacionAfiliadoEBI: 30, aportacionEntidadEBI: 40, baseCotizacionSueldo: 1000, baseCotizacionQuinquenios: 0, sueldoMensual: 2000, descuentoPrestamoCortoPlazo: 0, descuentoPrestamoHipotecario: 0, fechaMovimiento: new Date('2026-04-15T00:00:00Z'), descuentoPrestamoMedianoPlazo: null, descuentosOtros: null, cair: 50, cairVoluntario: null, fechaRegistro: new Date(), diasLaborados: 15, layoutVersion: '20', lineaOriginal: '' };
const input = { scope: { organica0: '04', organica1: '24', organica2: '01', organica3: '01' }, registros: [row] };

class FakeTx {
  calls: string[] = [];
  status: 'EMPTY' | 'N' | 'P' = 'EMPTY';
  summary = false;
  constructor(
    private conflictTable?: 'TODOS' | 'RESUMEN',
    private failInsert = false,
    private identificationCount = 1
  ) {}
  async query(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
    this.calls.push(sql);
    if (sql.includes('COUNT(*) AS TOTAL FROM AP_D_ORIGEN_TODOS')) return [{ TOTAL: this.conflictTable === 'TODOS' ? 1 : 0 }];
    if (sql.includes('COUNT(*) AS TOTAL FROM AP_D_ORIGEN_RESUMEN')) return [{ TOTAL: this.conflictTable === 'RESUMEN' ? 1 : 0 }];
    if (sql.includes('FROM PERSONAL P') && sql.includes('INNER JOIN ORG_PERSONAL O')) {
      return Array.from({ length: this.identificationCount }, () => ({
        INTERNO: 123,
        PLAZAORIGEN: 'PLAZA123',
        CORG0: '04',
        CORG1: '24',
        CORG2: '01',
        CORG3: '01',
        ACTIVO: 'A',
      }));
    }
    if (sql.includes("SUM(CASE WHEN STATUS = 'N'")) return [{ N: this.status === 'N' ? 1 : 0, P: this.status === 'P' ? 1 : 0 }];
    if (sql.includes('AP_DN_FONDOS')) return [{ FO_AFIL: 1, FO_FAA: 10, FO_FAE: 20 }];
    if (sql.includes('AP_DN_MINIMOS')) return [{}];
    if (sql.includes('AP_DN_PCP_COBRAR')) return [{ PCP_COBRO: 0 }];
    if (sql.includes('AP_DN_PPV_HIP') && sql.includes('CLASE <> 4')) return [{ PPV_N_HIP: 1, PPV_HIP_K: 5 }];
    if (sql.includes('AP_DN_PPV_HIP') && sql.includes('CLASE = 4')) return [{ PPV_N_PC: 1, PPV_PC_K: 7 }];
    if (sql.includes('AP_DN_EBI')) return [{ EBIA: 30, EBIE: 40, EBI_N: 1 }];
    if (sql.includes('AP_DN_PMP')) return [];
    if (sql.includes('FROM AP_D_ORIGEN_RESUMEN WHERE PERIODO')) return this.summary ? [{ FO_AFIL: 1, FO_FAA: 10, FO_FAE: 20, EBIA: 30, EBIE: 40, EBI_N: 1, PPV_N_HIP: 1, PPV_HIP_K: 5, PPV_N_PC: 1, PPV_PC_K: 7 }] : [];
    throw new Error(`FAKE_QUERY_NO_ESPERADA: ${sql}`);
  }
  async execute(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
    this.calls.push(sql);
    if (sql.startsWith('INSERT INTO AP_D_ORIGEN_TODOS')) {
      assert.equal(params.length, 50);
      if (this.failInsert) throw new Error('FALLA_FILA');
      this.status = 'N';
    }
    else if (sql.startsWith('UPDATE AP_D_ORIGEN_TODOS')) this.status = 'P';
    else if (sql.startsWith('INSERT INTO AP_D_ORIGEN_RESUMEN')) this.summary = true;
    else throw new Error(`FAKE_EXECUTE_NO_ESPERADO: ${sql}`);
    return [];
  }
  async executeSingleton(sql: string): Promise<Record<string, unknown>> {
    throw new Error(`FAKE_EXECUTE_SINGLETON_NO_ESPERADO: ${sql}`);
  }
}

function runner(tx: FakeTx, options: { commitFails?: boolean; rollbackFails?: boolean } = {}) {
  return <T>(fn: (context: FakeTx) => Promise<T>) => executeTypedTransaction(async (): Promise<FirebirdTransactionHandle<FakeTx>> => ({ context: tx, commit: async () => { if (options.commitFails) throw new Error('COMMIT_FAIL'); }, rollback: async () => { if (options.rollbackFails) throw new Error('ROLLBACK_FAIL'); }, isValid: () => true }), fn);
}

for (const table of ['TODOS', 'RESUMEN'] as const) {
  const tx = new FakeTx(table);
  const result = await new NominaLayout20FirebirdSyncService(runner(tx)).sincronizar(input);
  assert.equal(result.outcome, 'ROLLBACK_CONFIRMADO');
  assert(result.error instanceof NominaLayout20FirebirdSyncError && result.error.code === 'NOMINA_FIREBIRD_SCOPE_EXISTENTE');
  assert.equal(tx.calls.length, 2, 'Ambos prechecks deben ejecutarse antes de rechazar');
}

const successfulTx = new FakeTx();
const success = await new NominaLayout20FirebirdSyncService(runner(successfulTx)).sincronizar(input);
assert.equal(success.outcome, 'COMMIT_CONFIRMADO', String(success.error));
assert.equal(success.value?.detallesP, 1);
const order = ['AP_D_ORIGEN_TODOS WHERE QNA', 'AP_D_ORIGEN_RESUMEN WHERE PERIODO', 'FROM PERSONAL P', 'INSERT INTO AP_D_ORIGEN_TODOS', "SUM(CASE WHEN STATUS = 'N'", 'UPDATE AP_D_ORIGEN_TODOS', 'AP_DN_FONDOS', 'INSERT INTO AP_D_ORIGEN_RESUMEN', 'SELECT FA_SA'];
let previous = -1;
for (const fragment of order) { const index = successfulTx.calls.findIndex((call) => call.includes(fragment)); assert(index > previous, `Orden inválido para ${fragment}`); previous = index; }
assert(!successfulTx.calls.some((call) => /\bDELETE\b|AP_D_VALIDAR|AP_DN_APLICAR|AP_D_IDENTIFICA_ARCHIVOTXT|EXECUTE\s+PROCEDURE/i.test(call)));
assert(successfulTx.calls.some((call) => call.includes('CLASE <> 4')));
assert(successfulTx.calls.some((call) => call.includes('CLASE = 4')));

const rollback = await new NominaLayout20FirebirdSyncService(runner(new FakeTx(undefined, true))).sincronizar(input);
assert.equal(rollback.outcome, 'ROLLBACK_CONFIRMADO');
const unidentified = await new NominaLayout20FirebirdSyncService(runner(new FakeTx(undefined, false, 0))).sincronizar(input);
assert(unidentified.error instanceof NominaLayout20FirebirdSyncError && unidentified.error.code === 'NOMINA_FIREBIRD_PERSONAL_NO_IDENTIFICADO');
const ambiguous = await new NominaLayout20FirebirdSyncService(runner(new FakeTx(undefined, false, 2))).sincronizar(input);
assert(ambiguous.error instanceof NominaLayout20FirebirdSyncError && ambiguous.error.code === 'NOMINA_FIREBIRD_PERSONAL_AMBIGUO');
const uncertainRollback = await new NominaLayout20FirebirdSyncService(runner(new FakeTx(undefined, true), { rollbackFails: true })).sincronizar(input);
assert.equal(uncertainRollback.outcome, 'RESULTADO_INCIERTO');
const uncertainCommit = await new NominaLayout20FirebirdSyncService(runner(new FakeTx(), { commitFails: true })).sincronizar(input);
assert.equal(uncertainCommit.outcome, 'RESULTADO_INCIERTO');

await assert.rejects(() => new NominaLayout20FirebirdSyncService(runner(new FakeTx())).sincronizar({ ...input, scope: { ...input.scope, organica0: '01' } }), /ORGANICA no está certificada/);
console.log('NOMINA_FIREBIRD_SYNC_FAKE_OK');
