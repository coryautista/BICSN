import type { AportacionCompleta, AportacionFondo, AportacionIndividual } from '../../../aportacionesFondos/domain/entities/AportacionFondo.js';
import type { FondoFaiIdentity } from '../../../aportacionesFondos/domain/repositories/IAportacionFondoRepository.js';
import type { AportacionGuarderia } from '../../../aportacionesFondos/domain/entities/AportacionGuarderia.js';
import type { Aguinaldo } from '../../../aportacionesFondos/domain/entities/Aguinaldo.js';
import type { PensionNominaTransitorio } from '../../../aportacionesFondos/domain/entities/PensionNominaTransitorio.js';
import type { Prestamo } from '../../../aportacionesFondos/domain/entities/Prestamo.js';
import type { PrestamoHipotecario } from '../../../aportacionesFondos/domain/entities/PrestamoHipotecario.js';
import type { PrestamoMedianoPlazo } from '../../../aportacionesFondos/domain/entities/PrestamoMedianoPlazo.js';
import { sumD6ToA2 } from '../../../aportacionesFondos/domain/entities/PrestamoMoney.js';
import type { QnaEnvironment, QnaSource, QnaSourceDetail } from '../entities/LiquidacionQna.js';
import type {
  CapturedQnaAuxiliaryDetail,
  CapturedQnaAuxiliarySource,
  CapturedQnaFund,
  QnaAuxiliaryDomain,
  QnaCaptureScope,
  QnaTenDomainCapture
} from '../entities/QnaTenDomainCapture.js';
import { calculateCanonicalHash } from './LiquidacionQnaContracts.js';
import { createQnaAuxiliaryPayloadV1 } from './QnaAuxiliaryPayloadV1.js';

export type GuarderiaCaptureRow = { interno: number; row: AportacionGuarderia };

export type QnaTenDomainCaptureFactoryInput = {
  captureId: string;
  capturedAt: string;
  periodo: string;
  scope: QnaCaptureScope;
  ambiente: QnaEnvironment;
  usuarioId: string;
  hipProcedure: 'AP_S_HIP_QNA' | 'AP_S_COMP_QNA';
  fondos: AportacionCompleta;
  identidadesFai: FondoFaiIdentity[];
  guarderias: GuarderiaCaptureRow[];
  transitorio: PensionNominaTransitorio[];
  aguinaldo: Aguinaldo[];
  pcp: Prestamo[];
  pmp: PrestamoMedianoPlazo[];
  hip: PrestamoHipotecario[];
};

type AuxiliaryDescriptor = {
  interno: number;
  rfc: string | null;
  nombre: string;
  key: unknown[];
  amountD6: string;
  payload: Record<string, unknown>;
};

export class QnaTenDomainCaptureFactory {
  create(input: QnaTenDomainCaptureFactoryInput): QnaTenDomainCapture {
    if (!/^\d{4}$/.test(input.periodo)) throw new Error('QNA_CAPTURE_PERIODO_INVALIDO');
    if (!input.captureId || !input.usuarioId) throw new Error('QNA_CAPTURE_IDENTIDAD_INVALIDA');
    const fai = this.indexFai(input.identidadesFai);
    const fondos = {
      AHORRO: this.captureFund('AHORRO', input.fondos.ahorro, fai),
      VIVIENDA: this.captureFund('VIVIENDA', input.fondos.vivienda, fai),
      PRESTACIONES: this.captureFund('PRESTACIONES', input.fondos.prestaciones, fai),
      CAIR: this.captureFund('CAIR', input.fondos.cair, fai)
    };
    this.validateSameEmployees(fondos);
    this.validateFaiEmployees(fai, fondos.AHORRO.rows);

    const context = `${input.periodo}:${input.scope.organica0}:${input.scope.organica1}`;
    const auxiliares = {
      GUARDERIAS: this.captureAuxiliary('GUARDERIAS', 'EBI2_RECIBOS_IMPRIMIR', input.ambiente, context, 6,
        input.guarderias.map(({ interno, row }) => ({
          interno,
          rfc: nullableText(row.titular_rfc),
          nombre: requiredName(row.titular_nombre, 'GUARDERIAS'),
          key: [interno, row.recibo_folio, row.menor_id],
          amountD6: row.recibo_total_d6,
          payload: payloadWithName('GUARDERIAS', row, 'titular_nombre', requiredName(row.titular_nombre, 'GUARDERIAS'))
        }))),
      TRANSITORIO: this.captureAuxiliary('TRANSITORIO', 'PENSION_NOMINA_QNAL_TRANSITORIO', input.ambiente,
        `04:60:${input.scope.organica0}:${input.scope.organica1}:${input.periodo}`, 6,
        input.transitorio.map((row) => ({
          interno: requiredInterno(row.interno, 'TRANSITORIO'),
          rfc: nullableText(row.rfc ?? row.norfc),
          nombre: requiredName(row.nombres ?? row.nonombre, 'TRANSITORIO'),
          key: [row.interno, row.cconcepto],
          amountD6: row.total_d6,
          payload: payloadWithName('TRANSITORIO', row, 'nombres', requiredName(row.nombres ?? row.nonombre, 'TRANSITORIO'))
        }))),
      AGUINALDO: this.captureAuxiliary('AGUINALDO', 'AGUINALDO_ORGANICAS', input.ambiente, context, 6,
        input.aguinaldo.map((row) => ({
          interno: requiredInterno(row.interno, 'AGUINALDO'),
          rfc: nullableText(row.rfc),
          nombre: requiredName(row.nombres, 'AGUINALDO'),
          key: [row.interno, row.movimiento],
          amountD6: row.general_d6,
          payload: payloadWithName('AGUINALDO', row, 'nombres', requiredName(row.nombres, 'AGUINALDO'))
        }))),
      PCP: this.captureAuxiliary('PCP', 'AP_S_PCP', input.ambiente, context, 2,
        input.pcp.map((row) => ({
          interno: requiredInterno(row.interno, 'PCP'),
          rfc: nullableText(row.rfc),
          nombre: requiredName(row.nombre, 'PCP'),
          key: [row.interno, row.prestamo, row.letra],
          amountD6: requiredD6(row.total_d6, 'PCP'),
          payload: payloadWithName('PCP', row, 'nombre', requiredName(row.nombre, 'PCP'))
        }))),
      PMP: this.captureAuxiliary('PMP', 'AP_S_VIV', input.ambiente, context, 2,
        input.pmp.map((row) => ({
          interno: requiredInterno(row.interno, 'PMP'),
          rfc: nullableText(row.rfc),
          nombre: requiredName(row.nombre, 'PMP'),
          key: [row.interno, row.prestamo, row.letra, row.folio],
          amountD6: requiredD6(row.total_d6, 'PMP'),
          payload: payloadWithName('PMP', row, 'nombre', requiredName(row.nombre, 'PMP'))
        }))),
      HIP: this.captureAuxiliary('HIP', input.hipProcedure, input.ambiente, context, 2,
        input.hip.map((row) => ({
          interno: requiredInterno(row.interno, 'HIP'),
          rfc: nullableText(row.rfc),
          nombre: requiredName(row.nombre, 'HIP'),
          key: [row.interno, row.pno_solicitud, row.pano],
          amountD6: requiredD6(row.cantidad_d6, 'HIP'),
          payload: payloadWithName('HIP', row, 'nombre', requiredName(row.nombre, 'HIP'))
        })))
    };

    return deepFreeze({
      captureId: input.captureId,
      capturedAt: input.capturedAt,
      periodo: input.periodo,
      scope: { ...input.scope },
      ambiente: input.ambiente,
      usuarioId: input.usuarioId,
      precisionPolicy: input.fondos.precision_policy,
      formulaCalculoVersionId: input.fondos.formula_version_id,
      nominaCargaId: input.fondos.nomina_carga_id,
      hipProcedure: input.hipProcedure,
      fondos,
      auxiliares
    });
  }

  private captureFund(domain: string, fund: AportacionIndividual | undefined, fai: Map<number, FondoFaiIdentity>): CapturedQnaFund {
    if (!fund) throw new Error(`QNA_CAPTURE_FONDO_FALTANTE:${domain}`);
    const seen = new Set<number>();
    const rows = fund.datos.map((row) => {
      const interno = requiredInterno(row.interno, domain);
      if (seen.has(interno)) throw new Error(`QNA_CAPTURE_INTERNO_DUPLICADO:${domain}:${interno}`);
      seen.add(interno);
      const nombre = requiredName(row.nombre, domain);
      const identity = fai.get(interno);
      if (!identity) throw new Error(`QNA_CAPTURE_FAI_FALTANTE:${interno}`);
      return { ...row, nombre, faiD6: requiredD6(identity.faiD6, 'FAI') };
    });
    return {
      rows,
      totalA2: String(fund.resumen.total_contribucion_a2),
      componentsA2: Object.fromEntries(Object.entries(fund.resumen.componentes_a2)
        .map(([key, value]) => [key, String(value)]))
    };
  }

  private indexFai(rows: FondoFaiIdentity[]): Map<number, FondoFaiIdentity> {
    const result = new Map<number, FondoFaiIdentity>();
    for (const row of rows) {
      const interno = requiredInterno(row.interno, 'FAI');
      if (result.has(interno)) throw new Error(`QNA_CAPTURE_FAI_DUPLICADO:${interno}`);
      result.set(interno, row);
    }
    return result;
  }

  private validateSameEmployees(funds: Record<string, CapturedQnaFund>): void {
    const expected = funds.AHORRO.rows.map((row) => row.interno).sort((left, right) => left - right).join('|');
    for (const [domain, fund] of Object.entries(funds)) {
      const actual = fund.rows.map((row) => row.interno).sort((left, right) => left - right).join('|');
      if (actual !== expected) throw new Error(`QNA_CAPTURE_FONDO_EMPLEADOS_DIFERENTES:${domain}`);
    }
  }

  private validateFaiEmployees(fai: Map<number, FondoFaiIdentity>, fundRows: readonly Readonly<AportacionFondo>[]): void {
    const fundEmployees = new Set(fundRows.map((row) => row.interno));
    if (fai.size !== fundEmployees.size || [...fai.keys()].some((interno) => !fundEmployees.has(interno))) {
      throw new Error('QNA_CAPTURE_FAI_EMPLEADOS_DIFERENTES');
    }
  }

  private captureAuxiliary(
    domain: QnaAuxiliaryDomain,
    procedure: string,
    environment: string,
    sourceContext: string,
    sourceScale: 2 | 6,
    rows: AuxiliaryDescriptor[]
  ): CapturedQnaAuxiliarySource {
    const details = rows.map((row) => ({
      ...row,
      keyHash: calculateCanonicalHash(row.key),
      rowHash: calculateCanonicalHash(row.payload)
    })).sort((left, right) => left.keyHash.localeCompare(right.keyHash)
      || left.rowHash.localeCompare(right.rowHash))
      .map((row, index): CapturedQnaAuxiliaryDetail => ({
        dominio: domain as QnaSourceDetail['dominio'],
        orden: index + 1,
        claveFilaHash: row.keyHash,
        sourceScale,
        importeOficialD6: requiredD6(row.amountD6, domain),
        payloadCanonico: row.payload,
        hashFila: row.rowHash,
        empleadoClave: String(requiredInterno(row.interno, domain)),
        rfc: row.rfc,
        nombre: row.nombre,
        payloadVersion: 1,
        captureOrdinal: index + 1
      }));
    const source: QnaSource = {
      dominio: domain,
      tipoFuente: 'FIREBIRD',
      estado: rows.length > 0 ? 'COMPLETE' : 'EMPTY',
      requerida: true,
      identificadorFuente: `FIREBIRD:${procedure}:${environment}:${sourceContext}`,
      hashFuente: rows.length > 0
        ? calculateCanonicalHash(details.map((row) => [row.claveFilaHash, row.hashFila]))
        : null,
      sourceScale,
      registros: rows.length,
      notApplicableAprobado: false,
      aprobadoPor: null,
      evidencia: null,
      errorCode: null
    };
    return {
      procedure,
      source,
      details,
      totalA2: sumD6ToA2(rows.map((row) => requiredD6(row.amountD6, domain)))
    };
  }
}

function requiredInterno(value: number | null | undefined, domain: string): number {
  if (!Number.isInteger(value) || Number(value) <= 0) throw new Error(`QNA_${domain}_INTERNO_INVALIDO`);
  return Number(value);
}

function requiredName(value: string | null | undefined, domain: string): string {
  const name = String(value ?? '').trim();
  if (!name) throw new Error(`QNA_${domain}_NOMBRE_REQUERIDO`);
  if (name.length > 255) throw new Error(`QNA_${domain}_NOMBRE_EXCEDE_255`);
  return name;
}

function nullableText(value: string | null | undefined): string | null {
  const text = String(value ?? '').trim();
  return text || null;
}

function payloadWithName<D extends Parameters<typeof createQnaAuxiliaryPayloadV1>[0]>(
  domain: D,
  row: Parameters<typeof createQnaAuxiliaryPayloadV1<D>>[1],
  field: string,
  name: string
): Record<string, unknown> {
  const payload = createQnaAuxiliaryPayloadV1(domain, row);
  payload[field] = name;
  return payload;
}

function requiredD6(value: string | null | undefined, domain: string): string {
  if (!/^-?(0|[1-9]\d*)\.\d{6}$/.test(value ?? '')) throw new Error(`QNA_${domain}_D6_INVALIDO`);
  return value!;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
