import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LiquidacionQnaRepository,legacySelectionJsonCte,officialSelectionJsonCte,snapshotSelectionJsonCte} from '../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.js';
import {qnaAppliedDetailResponses,qnaAppliedListResponses,qnaAppliedSummaryResponses} from '../src/modules/liquidacionQna/liquidacionQna.applied.openapi.js';

const repository=new LiquidacionQnaRepository({} as any) as any;
const names=['cairA2','fraA2','freA2','fhA2','fvA2','faaA2','faeA2','fatA2','faiA2','ahorroA2','viviendaA2','prestacionesA2','cairFondoA2','guarderiasA2','transitorioA2','aguinaldoA2','retencionPcpA2','retencionPmpA2','retencionHipA2','totalAportacionesA2','totalRetencionesA2','totalGeneralA2'];
const totals=Object.fromEntries(['registros',...names].map(key=>[key,null]));
const strategies=Object.fromEntries(names.map(key=>[key,'UNAVAILABLE']));
Object.assign(totals,{retencionPcpA2:'1.10',retencionPmpA2:'2.20',retencionHipA2:'3.30'});
repository.deriveLegacyCombinedTotals(totals,strategies);
assert.equal(totals.totalRetencionesA2,'6.60');assert.equal(strategies.totalRetencionesA2,'DERIVED_DETAIL');
assert.equal(totals.totalAportacionesA2,null,'La ausencia parcial nunca se fabrica como cero');
const largeTotals={...totals,retencionPcpA2:'999999999999999.99',retencionPmpA2:'0.01',retencionHipA2:'-1.00'};
const largeStrategies={...strategies};repository.deriveLegacyCombinedTotals(largeTotals,largeStrategies);
assert.equal(largeTotals.totalRetencionesA2,'999999999999999.00','Los combinados A2 no deben perder precision por Number');
const nullable=repository.mapNullableAppliedTotals({Registros:2,cairA2:'5.00',cairFondoA2:null});
assert.equal(nullable.cairA2,'5.00');assert.equal(nullable.cairFondoA2,null);assert.equal(nullable.ahorroA2,null);
for(const schema of [qnaAppliedListResponses,qnaAppliedSummaryResponses,qnaAppliedDetailResponses]){
  const text=JSON.stringify(schema);
  for(const source of ['SNAPSHOT_OFICIAL','SNAPSHOT_OFICIAL_RECONSTRUIDO','HISTORICO_LEGACY'])assert(text.includes(source));
}
assert(JSON.stringify(qnaAppliedListResponses).includes('ABSENT_UNVERIFIED'));assert(JSON.stringify(qnaAppliedSummaryResponses).includes('ABSENT_UNVERIFIED'));
for(const strategy of ['PERSISTED','PERSISTED_CAIR_CONTROL_FALLBACK','DERIVED_DETAIL','UNAVAILABLE']){
  assert(JSON.stringify(qnaAppliedSummaryResponses).includes(strategy));assert(JSON.stringify(qnaAppliedDetailResponses).includes(strategy));
}
const source=await readFile(new URL('../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.ts',import.meta.url),'utf8');
const applied=source.slice(source.indexOf('async listApplied'),source.indexOf('async appendDecision'));
const listApplied=source.slice(source.indexOf('private async listAppliedInTransaction'),source.indexOf('async getAppliedSummary'));
assert.doesNotMatch(listApplied,/Promise\.all/,'Una Transaction mssql no debe compartir requests concurrentes');
assert.match(source,/ROW_NUMBER\(\) OVER\(PARTITION BY tr\.QnaProcesoId ORDER BY tr\.FechaCreacion DESC,tr\.QnaProcesoTransicionId DESC\)/);
assert.match(source,/CASE WHEN s\.VersionEsquema=5 THEN 'SNAPSHOT_OFICIAL' ELSE 'SNAPSHOT_OFICIAL_RECONSTRUIDO' END/);
assert.match(applied,/QNA_APLICADA_LEGACY_OWNERSHIP_CONFLICT/);
assert.match(applied,/PERSISTED_CAIR_CONTROL_FALLBACK/);
for(const cte of [legacySelectionJsonCte(),officialSelectionJsonCte(),snapshotSelectionJsonCte()]){assert.match(cte,/OPENJSON\(@SelectionJson\)/);assert.doesNotMatch(cte,/@(?:Id|Proceso|LE|LA|LQ|L0)\d+/);}
assert.doesNotMatch(applied,/input\(`(?:Id|Proceso|RId|LE|LA|LQ|L0|L1|L2|L3)\$\{index\}`/,'Los bundles de pagina no deben crecer parametros por fila');
assert.match(applied,/LIKE @Busqueda ESCAPE '~'/);
assert.doesNotMatch(applied,/firebird|AP_S_|FormulaCalculoParametro|NominaAplicacionQnalDetalle/i);
console.log('QNA_PHASE10_APPLIED_CONTRACTS_OK');
