import assert from 'node:assert/strict';
import { GenerateLineaCapturaPeriodoCommand } from '../src/modules/reportes/aplicacionesQNA/application/commands/GenerateLineaCapturaPeriodoCommand.js';
import { LineaCapturaService } from '../src/modules/reportes/aplicacionesQNA/domain/services/LineaCapturaService.js';
import type { LineaCapturaPeriodoRecord } from '../src/modules/reportes/aplicacionesQNA/infrastructure/persistence/LineaCapturaPeriodoRepository.js';

const snapshot = (totalGeneralA2: string) => ({
  liquidacionSnapshotId: '9001',
  periodo: '1426',
  organica0: '01',
  organica1: '02',
  totales: { totalGeneralA2 },
}) as any;

const record = (importeA2: string): LineaCapturaPeriodoRecord => ({
  lineaCapturaPeriodoId: 1,
  org0: '01', org1: '02', periodo: '1426', quincena: 14, anio: 2026,
  importe: Number(importeA2), importeA2, liquidacionSnapshotId: '9001',
  lineaCaptura: '010214264700054', referencia4: '0102',
  fechaInicioPeriodo: '2026-07-16', fechaFinalPeriodo: '2026-07-31',
  fechaInicioVigencia: '2026-08-18', fechaFinVigencia: '2026-08-20',
  fechaReferenciaValidacion: '2026-08-20', tipoReferenciaValidacion: 'PAGO',
  fechaLimite: '2026-08-20', fechaCondensada: '4700', montoCondensado: 0,
  digitoVerificador: '54', usuarioId: 'test', estatus: 'VIGENTE',
  createdAt: '2026-08-18T00:00:00.000Z', updatedAt: null,
});

const params = {
  org0: '01', org1: '02', periodo: '1426', liquidacionSnapshotId: '9001',
  usuarioId: 'test', omitirValidacionEstado: true,
};

let historicalCalls = 0;
let createCalls = 0;
let stored: LineaCapturaPeriodoRecord | null = null;
const repository = {
  calcularImporteHistorico: async () => { historicalCalls += 1; throw new Error('legacy calculation called'); },
  findVigenteBySnapshotId: async () => stored,
  findVigente: async () => null,
  findPrimerPagoDesde: async () => '2026-08-20',
  create: async (data: any) => {
    createCalls += 1;
    stored = { ...record(data.importeA2), liquidacionSnapshotId: data.liquidacionSnapshotId };
    return stored;
  },
};
const liquidacionRepository = { resolveOfficialById: async () => snapshot('100.01') };
const revisionScheduler = { programar: async () => undefined };
const command = new GenerateLineaCapturaPeriodoCommand(
  repository as any,
  new LineaCapturaService(),
  revisionScheduler as any,
  liquidacionRepository as any,
);

const created = await command.executeFromSnapshot(params);
const reused = await command.executeFromSnapshot(params);
assert.equal(created.reutilizada, false);
assert.equal(reused.reutilizada, true);
assert.equal(reused.liquidacionSnapshotId, '9001');
assert.equal(reused.importeA2, '100.01');
assert.equal(createCalls, 1, 'same snapshot must be idempotent');
assert.equal(historicalCalls, 0, 'snapshot path must not call historical calculation');

stored = record('100.00');
await assert.rejects(
  command.executeFromSnapshot(params),
  (error: any) => error?.message === 'LINEA_CAPTURA_IMPORTE_MISMATCH'
    && error?.details?.importeLineaA2 === '100.00'
    && error?.details?.importeSnapshotA2 === '100.01',
  'an exact 0.01 mismatch must block reuse',
);
assert.equal(historicalCalls, 0, 'mismatch handling must remain on the snapshot path');

console.log('Linea de Pago snapshot contracts: OK');
