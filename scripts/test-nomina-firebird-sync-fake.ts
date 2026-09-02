import assert from 'node:assert/strict';
import { executeTypedTransaction, type FirebirdTransactionHandle } from '../src/db/firebird.js';
import { NominaLayout20FirebirdSyncService } from '../src/modules/nomina/infrastructure/firebird/NominaLayout20FirebirdSyncService.js';
import { NominaLayout20FirebirdSyncError } from '../src/modules/nomina/domain/services/NominaLayout20FirebirdSync.js';
import type { NominaAplicacionQnalRegistroParsed } from '../src/modules/nomina/domain/entities/NominaAplicacionQnalTxt.js';

const row: NominaAplicacionQnalRegistroParsed = { numeroLinea: 2, lote: '0126007', tipoRegistro: '2', clavePersonal: 'SYN000001', rfc: 'SYNX000101T01', nombreAfiliado: 'SINTETICO', aportacionAfiliadoFondoAhorro: 10, aportacionEntidadFondoAhorro: 20, aportacionAfiliadoEBI: null, aportacionEntidadEBI: null, baseCotizacionSueldo: 1000, baseCotizacionQuinquenios: 6, sueldoMensual: 2000, ayudasMensuales: null, quinqueniosMensual: 12, descuentoPrestamoCortoPlazo: 30, descuentoPrestamoHipotecario: 40, fechaMovimiento: new Date('2026-04-15T00:00:00Z'), descuentoPrestamoMedianoPlazo: null, descuentosOtros: null, cair: 50, cairVoluntario: null, fechaRegistro: new Date(), diasLaborados: 15, layoutVersion: '20', lineaOriginal: '' };
const fechaResumen = new Date(2026, 7, 12, 12, 5, 0);
const input = { scope: { organica0: '04', organica1: '24', organica2: '01', organica3: '01' }, registros: [row], fechaResumen };

class FakeTx {
  calls: string[] = [];
  status: 'EMPTY' | 'N' | 'P' = 'EMPTY';
  summary = false;
  detailParams?: unknown[];
  summaryDate?: Date;
  constructor(
    private conflictTable?: 'APLICADO' | 'TODOS' | 'RESUMEN',
    private failInsert = false,
    private identificationCount = 1
  ) {}
  async query(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
    this.calls.push(sql);
    if (sql.includes("SUM(CASE WHEN STATUS='A'")) return [{ TOTAL: this.status === 'P' ? 1 : 0, TOTAL_A: 0, TOTAL_P: this.status === 'P' ? 1 : 0 }];
    if (sql.includes("STATUS = 'A'")) return [{ TOTAL: this.conflictTable === 'APLICADO' ? 1 : 0 }];
    if (sql.includes('COUNT(*) AS TOTAL FROM AP_D_ORIGEN_TODOS')) return [{ TOTAL: this.conflictTable === 'TODOS' ? 1 : 0 }];
    if (sql.includes('COUNT(*) AS TOTAL FROM AP_D_ORIGEN_RESUMEN')) return [{ TOTAL: this.summary || this.conflictTable === 'RESUMEN' ? 1 : 0 }];
    if (sql.includes('FROM PERSONAL P') && sql.includes('INNER JOIN ORG_PERSONAL O')) {
      return Array.from({ length: this.identificationCount }, () => ({
        INTERNO: 123,
        PLAZAORIGEN: 'PLAZA123',
        CORG0: '4',
        CORG1: '24',
        CORG2: '1',
        CORG3: '1',
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
    if (sql.includes('FROM AP_D_ORIGEN_RESUMEN WHERE PERIODO')) return this.summary ? [{ FO_AFIL: 1, FO_FAA: 10, FO_FAE: 20, EBIA: 30, EBIE: 40, EBI_N: 1, PPV_N_HIP: 1, PPV_HIP_K: 5, PPV_N_PC: 1, PPV_PC_K: 7, FMOV_ALT: this.summaryDate }] : [];
    throw new Error(`FAKE_QUERY_NO_ESPERADA: ${sql}`);
  }
  async execute(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
    this.calls.push(sql);
    if (sql.startsWith('INSERT INTO AP_D_ORIGEN_TODOS')) {
      assert.equal(params.length, 50);
      this.detailParams = params;
      if (this.failInsert) throw new Error('FALLA_FILA');
      this.status = 'N';
    }
    else if (sql.startsWith('DELETE FROM AP_D_ORIGEN_TODOS')) this.status = 'EMPTY';
    else if (sql.startsWith('DELETE FROM AP_D_ORIGEN_RESUMEN')) this.summary = false;
    else if (sql.startsWith('UPDATE AP_D_ORIGEN_TODOS')) this.status = 'P';
    else if (sql.startsWith('UPDATE AP_D_ORIGEN_RESUMEN')) { this.summary = true; this.summaryDate = params.at(-4) as Date; }
    else if (sql.startsWith('INSERT INTO AP_D_ORIGEN_RESUMEN')) { this.summary = true; this.summaryDate = params.at(-1) as Date; }
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

const appliedTx = new FakeTx('APLICADO');
const applied = await new NominaLayout20FirebirdSyncService(runner(appliedTx)).sincronizar(input);
assert.equal(applied.outcome, 'ROLLBACK_CONFIRMADO');
assert(applied.error instanceof NominaLayout20FirebirdSyncError && applied.error.code === 'NOMINA_FIREBIRD_SCOPE_APLICADO');
assert.equal(appliedTx.calls.length, 1, 'El STATUS A debe rechazar antes de borrar o insertar');

for (const table of ['TODOS', 'RESUMEN'] as const) {
  const tx = new FakeTx(table);
  const result = await new NominaLayout20FirebirdSyncService(runner(tx)).sincronizar(input);
  assert.equal(result.outcome, 'COMMIT_CONFIRMADO', String(result.error));
  assert(tx.calls.some((call) => call.startsWith('DELETE FROM AP_D_ORIGEN_TODOS')));
  assert(tx.calls.some((call) => call.startsWith('DELETE FROM AP_D_ORIGEN_RESUMEN')));
}

const successfulTx = new FakeTx();
const success = await new NominaLayout20FirebirdSyncService(runner(successfulTx)).sincronizar(input);
assert.equal(success.outcome, 'COMMIT_CONFIRMADO', String(success.error));
assert.equal(success.value?.detallesP, 1);
assert.equal(successfulTx.summaryDate, fechaResumen);
const order = ["STATUS = 'A'", 'COUNT(*) AS TOTAL FROM AP_D_ORIGEN_TODOS', 'AP_D_ORIGEN_RESUMEN WHERE PERIODO', 'FROM PERSONAL P', 'INSERT INTO AP_D_ORIGEN_TODOS', "SUM(CASE WHEN STATUS = 'N'", 'UPDATE AP_D_ORIGEN_TODOS', 'AP_DN_FONDOS', 'INSERT INTO AP_D_ORIGEN_RESUMEN', 'SELECT FA_SA'];
let previous = -1;
for (const fragment of order) { const index = successfulTx.calls.findIndex((call, callIndex) => callIndex > previous && call.includes(fragment)); assert(index > previous, `Orden inválido para ${fragment}`); previous = index; }
assert(!successfulTx.calls.some((call) => /\bDELETE\b|AP_D_VALIDAR|AP_DN_APLICAR|AP_D_IDENTIFICA_ARCHIVOTXT|EXECUTE\s+PROCEDURE/i.test(call)));
assert.equal(successfulTx.detailParams?.[10], 0, 'AYUDASMEN debe quedar en cero');
assert.equal(successfulTx.detailParams?.[11], 12, 'QUINQMEN debe tomar t9');
assert.equal(successfulTx.detailParams?.[13], 6, 'AQBCOT debe tomar t6');
assert.equal(successfulTx.detailParams?.[14], 20, 'FAA debe tomar t2');
assert.deepEqual(successfulTx.detailParams?.slice(15, 18), [0, 0, 0], 'FAE/EBIA/EBIE deben quedar en cero');
assert.deepEqual(successfulTx.detailParams?.slice(18, 20), [30, 40], 'PCP/HIP deben tomar t3/t4');
assert.deepEqual(successfulTx.detailParams?.slice(22, 29), Array(7).fill('.'));
assert.deepEqual([
  (successfulTx.detailParams?.[29] as Date).getFullYear(),
  (successfulTx.detailParams?.[29] as Date).getMonth(),
  (successfulTx.detailParams?.[29] as Date).getDate(),
], [2050, 0, 1]);
assert.deepEqual(successfulTx.detailParams?.slice(36, 40), ['04', '24', '01', '01']);
assert.equal(successfulTx.detailParams?.[46], 10, 'FPEA debe tomar t1');
assert.equal(successfulTx.detailParams?.[49], 0, 'QUINQBCOT no tiene fuente TXT certificada');
assert(successfulTx.calls.some((call) => call.includes('CLASE <> 4')));
assert(successfulTx.calls.some((call) => call.includes('CLASE = 4')));

const repairTx = new FakeTx();
repairTx.status = 'P';
repairTx.summary = true;
repairTx.summaryDate = new Date(2026, 7, 1);
const repair = await new NominaLayout20FirebirdSyncService(runner(repairTx)).corregirPendientesEnSitio(input);
assert.equal(repair.outcome, 'COMMIT_CONFIRMADO', String(repair.error));
assert(repairTx.calls.some((call) => call.startsWith('UPDATE AP_D_ORIGEN_TODOS')));
assert(repairTx.calls.some((call) => call.startsWith('UPDATE AP_D_ORIGEN_RESUMEN')));
assert.equal(repairTx.summaryDate, fechaResumen);
assert(!repairTx.calls.some((call) => call.startsWith('DELETE')));

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
