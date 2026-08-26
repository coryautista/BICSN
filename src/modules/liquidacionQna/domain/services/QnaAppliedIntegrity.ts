import type { CreateQnaCandidateInput } from '../entities/LiquidacionQna.js';
import { qnaFail } from '../errors.js';
import { calculateCanonicalHash, validateQnaCandidate } from './LiquidacionQnaContracts.js';
import { fundProjection } from './QnaOfficialSnapshotV5Factory.js';
import { AportacionesMonetaryKernel } from '../../../aportacionesFondos/domain/services/AportacionesMonetaryKernel.js';

export function validateAppliedQnaCandidate(input: CreateQnaCandidateInput, expectedHash: string): void {
  try {
    const validated = validateQnaCandidate(input,{retentionProvenanceMode:'PERSISTED_HISTORICAL'});
    if (validated.hashContenido !== expectedHash) throw new Error('QNA_HASH_CONTENIDO_INVALIDO');
    for (const domain of ['AHORRO','VIVIENDA','PRESTACIONES','CAIR'] as const) {
      const rows=(input.detallesEmpleado??[]).map(detail => [detail.empleadoClaveHash,calculateCanonicalHash(fundProjection(domain,detail))]);
      const expected=rows.length===0?null:calculateCanonicalHash(rows);
      if (input.fuentes.find(source => source.dominio===domain)?.hashFuente!==expected) throw new Error(`QNA_HASH_FONDO_${domain}_INVALIDO`);
    }
    const kernel=new AportacionesMonetaryKernel();
    const employees=input.detallesEmpleado??[];
    const component=(field:keyof typeof employees[number])=>kernel.agregarComponenteA2(employees.map(detail=>String(detail[field])));
    const aggregate=(field:keyof typeof employees[number])=>kernel.agregarA2(employees.map(detail=>String(detail[field])));
    const expectedTotals={ cairA2:component('cairD6'),fraA2:component('fraD6'),freA2:component('freD6'),fhA2:component('fhD6'),fvA2:component('fvD6'),
      faaA2:component('faaD6'),faeA2:component('faeD6'),fatA2:aggregate('fatD6'),faiA2:component('faiD6'),ahorroA2:aggregate('fatD6'),
      viviendaA2:aggregate('viviendaD6'),prestacionesA2:aggregate('prestacionesD6'),cairFondoA2:aggregate('cairFondoD6') };
    for(const [field,value] of Object.entries(expectedTotals)) if(input.totales[field as keyof typeof expectedTotals]!==value) throw new Error(`QNA_AGREGADO_${field}_INVALIDO`);
  } catch {
    qnaFail('La evidencia oficial V5 aplicada no cumple integridad','QNA_APLICADA_INTEGRIDAD_INVALIDA',500);
  }
}
