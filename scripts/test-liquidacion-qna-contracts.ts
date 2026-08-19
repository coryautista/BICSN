import assert from 'node:assert/strict';
import { QNA_DOMAINS, type CreateQnaCandidateInput, type QnaSource, type QnaTotals } from '../src/modules/liquidacionQna/domain/entities/LiquidacionQna.js';
import { calculateQnaHash, countCompleteQnaSources, validateQnaTotals } from '../src/modules/liquidacionQna/domain/services/LiquidacionQnaContracts.js';
import { LiquidacionQnaError } from '../src/modules/liquidacionQna/domain/errors.js';

const HASH = 'A'.repeat(64);
const sources = (): QnaSource[] => QNA_DOMAINS.map(dominio => ({
  dominio, tipoFuente: 'FIREBIRD', estado: 'COMPLETE', requerida: true,
  identificadorFuente: `source:${dominio}`, hashFuente: HASH, sourceScale: 6,
  registros: 1, notApplicableAprobado: false, aprobadoPor: null, evidencia: null, errorCode: null,
}));

const totals = (): QnaTotals => ({
  registros: 1,
  cairA2: '4.00', fraA2: '1.00', freA2: '2.00', fhA2: '3.00', fvA2: '4.00',
  faaA2: '5.00', faeA2: '6.00', fatA2: '11.00', faiA2: '7.00',
  ahorroA2: '10.00', viviendaA2: '20.00', prestacionesA2: '30.00', cairFondoA2: '4.00', guarderiasA2: '40.00',
  transitorioA2: '50.00', aguinaldoA2: '60.00', retencionPcpA2: '1.00', retencionPmpA2: '2.00',
  retencionHipA2: '3.00', totalAportacionesA2: '214.00', totalRetencionesA2: '6.00', totalGeneralA2: '220.00',
});

const candidate = (): CreateQnaCandidateInput => ({
  entidadId: 1, anio: 2026, quincena: 14, organica0: '01', organica1: '02', organica2: '00', organica3: '00',
  ambiente: 'CALIDAD', snapshotCalculoV2Id: '10', nominaCargaId: null, formulaCalculoVersionId: '20',
  fuentes: sources(), totales: totals(), usuarioId: 'test', detalles: [{
    dominio: 'PCP', orden: 1, claveFilaHash: HASH, sourceScale: 6, importeOficialD6: '1.000000',
    payloadCanonico: { z: 1, a: { y: true, b: 'x' } }, hashFila: HASH,
  }],
});

assert.equal(countCompleteQnaSources(sources()), 10);
const approvedNa = sources();
approvedNa[0] = { ...approvedNa[0], estado: 'NOT_APPLICABLE', registros: 0, hashFuente: null,
  notApplicableAprobado: true, aprobadoPor: 'admin', evidencia: 'oficio:1' };
assert.equal(countCompleteQnaSources(approvedNa), 10);
const incomplete = sources();
incomplete[0] = { ...incomplete[0], estado: 'EMPTY', registros: 0, hashFuente: null };
assert.equal(countCompleteQnaSources(incomplete), 9);

validateQnaTotals(totals());
const independentFat = { ...totals(), fatA2: '10.99' };
assert.doesNotThrow(() => validateQnaTotals(independentFat));
const invalidParent = { ...totals(), totalGeneralA2: '219.99' };
assert.throws(() => validateQnaTotals(invalidParent), (error: unknown) => error instanceof LiquidacionQnaError && error.code === 'QNA_TOTAL_GENERAL_INCONSISTENTE');
const invalidContributions = { ...totals(), totalAportacionesA2: '213.99' };
assert.throws(() => validateQnaTotals(invalidContributions), (error: unknown) => error instanceof LiquidacionQnaError && error.code === 'QNA_TOTAL_APORTACIONES_INCONSISTENTE');
const invalidRetentions = { ...totals(), totalRetencionesA2: '5.99' };
assert.throws(() => validateQnaTotals(invalidRetentions), (error: unknown) => error instanceof LiquidacionQnaError && error.code === 'QNA_TOTAL_RETENCIONES_INCONSISTENTE');

const first = candidate();
const reordered = candidate();
reordered.fuentes.reverse();
reordered.detalles[0].payloadCanonico = { a: { b: 'x', y: true }, z: 1 };
assert.equal(calculateQnaHash(first), calculateQnaHash(reordered));
assert.match(calculateQnaHash(first), /^[0-9A-F]{64}$/);
reordered.totales.totalGeneralA2 = '220.01';
assert.notEqual(calculateQnaHash(first), calculateQnaHash(reordered));

console.log('Liquidacion QNA pure contracts: OK');
