import { createHash } from 'node:crypto';
import type { SnapshotCalculoV2Detalle, SnapshotCalculoV2Input } from '../../../aportacionesFondos/domain/entities/SnapshotCalculoV2.js';
import { AportacionesMonetaryKernel } from '../../../aportacionesFondos/domain/services/AportacionesMonetaryKernel.js';
import type {
  CreateQnaCandidateInput,
  QnaDomain,
  QnaEmployeeDetail,
  QnaSource,
  QnaTotals
} from '../entities/LiquidacionQna.js';
import type { CapturedQnaFundRow, QnaFundDomain, QnaTenDomainCapture } from '../entities/QnaTenDomainCapture.js';
import { calculateCanonicalHash, calculateQnaEmployeeDetailHash } from './LiquidacionQnaContracts.js';

export type QnaOfficialSnapshotV5 = {
  snapshotV2: SnapshotCalculoV2Input;
  candidate: Omit<CreateQnaCandidateInput, 'snapshotCalculoV2Id'>;
};

export type QnaNotApplicableApproval = {
  dominio: keyof QnaTenDomainCapture['auxiliares'];
  motivo: string;
  evidencia: string;
};

export class QnaOfficialSnapshotV5Factory {
  private readonly money = new AportacionesMonetaryKernel();

  create(capture: QnaTenDomainCapture, approvals: QnaNotApplicableApproval[] = []): QnaOfficialSnapshotV5 {
    const fundRows = Object.fromEntries(Object.entries(capture.fondos).map(([domain, fund]) => [
      domain,
      new Map(fund.rows.map((row) => [row.interno, row]))
    ])) as Record<QnaFundDomain, Map<number, Readonly<CapturedQnaFundRow>>>;
    const internos = [...fundRows.AHORRO.keys()].sort((left, right) => left - right);
    const snapshotDetails = internos.map((interno, index) => this.snapshotDetail(capture, fundRows, interno, index + 1));
    const snapshotV2: SnapshotCalculoV2Input = {
      ...capture.scope,
      organica0: capture.scope.organica0,
      organica1: capture.scope.organica1,
      organica2: capture.scope.organica2,
      organica3: capture.scope.organica3,
      ambiente: capture.ambiente,
      fuente: 'LIQUIDACION_V2',
      estado: 'COMPLETO',
      formulaCalculoVersionId: capture.formulaCalculoVersionId,
      nominaCargaId: capture.nominaCargaId,
      precisionPolicy: capture.precisionPolicy,
      versionEsquema: 5,
      usuarioId: capture.usuarioId,
      totalesA2: this.snapshotTotals(capture, snapshotDetails),
      detalles: snapshotDetails
    };
    const employeeDetails = internos.map((interno, index) => this.employeeDetail(capture, fundRows, snapshotDetails[index], interno));
    const auxiliarySources = this.applyApprovals(capture, approvals);
    const sources = [
      ...(['AHORRO', 'VIVIENDA', 'PRESTACIONES', 'CAIR'] as QnaFundDomain[]).map((domain) =>
        this.fundSource(capture, domain, employeeDetails)),
      ...Object.values(auxiliarySources)
    ];
    const totals = this.qnaTotals(capture, snapshotV2);
    return {
      snapshotV2,
      candidate: {
        ...capture.scope,
        ambiente: capture.ambiente,
        nominaCargaId: capture.nominaCargaId,
        formulaCalculoVersionId: capture.formulaCalculoVersionId,
        fuentes: sources,
        totales: totals,
        detalles: Object.values(capture.auxiliares).flatMap((source) => source.details.map((detail) => ({
          dominio: detail.dominio,
          orden: detail.orden,
          claveFilaHash: detail.claveFilaHash,
          sourceScale: detail.sourceScale,
          importeOficialD6: detail.importeOficialD6,
          payloadCanonico: detail.payloadCanonico,
          hashFila: detail.hashFila,
          empleadoClave: detail.empleadoClave,
          rfc: detail.rfc,
          nombre: detail.nombre,
          payloadVersion: detail.payloadVersion
        }))),
        usuarioId: capture.usuarioId,
        versionEsquema: 5,
        detallesEmpleado: employeeDetails
      }
    };
  }

  private applyApprovals(capture: QnaTenDomainCapture, approvals: QnaNotApplicableApproval[]): QnaSource[] {
    const byDomain = new Map<string, QnaNotApplicableApproval>();
    for (const approval of approvals) {
      if (byDomain.has(approval.dominio)) throw new Error(`QNA_NOT_APPLICABLE_DUPLICADO:${approval.dominio}`);
      const motivo = approval.motivo.trim();
      const evidencia = approval.evidencia.trim();
      if (!motivo || !evidencia) throw new Error(`QNA_NOT_APPLICABLE_JUSTIFICACION_REQUERIDA:${approval.dominio}`);
      byDomain.set(approval.dominio, { ...approval, motivo, evidencia });
    }
    return Object.entries(capture.auxiliares).map(([domain, captured]) => {
      const approval = byDomain.get(domain);
      if (!approval) return { ...captured.source };
      if (captured.source.estado !== 'EMPTY' || captured.details.length !== 0) {
        throw new Error(`QNA_NOT_APPLICABLE_FUENTE_NO_VACIA:${domain}`);
      }
      const evidence = `MOTIVO: ${approval.motivo}; EVIDENCIA: ${approval.evidencia}`;
      if (evidence.length > 500) throw new Error(`QNA_NOT_APPLICABLE_EVIDENCIA_EXCEDE_500:${domain}`);
      return { ...captured.source, estado: 'NOT_APPLICABLE', notApplicableAprobado: true,
        aprobadoPor: capture.usuarioId, evidencia: evidence };
    });
  }

  private snapshotDetail(
    capture: QnaTenDomainCapture,
    funds: Record<QnaFundDomain, Map<number, Readonly<CapturedQnaFundRow>>>,
    interno: number,
    orden: number
  ): SnapshotCalculoV2Detalle {
    const ahorro = funds.AHORRO.get(interno)!;
    const vivienda = funds.VIVIENDA.get(interno)!;
    const prestaciones = funds.PRESTACIONES.get(interno)!;
    const cair = funds.CAIR.get(interno)!;
    return {
      orden,
      empleadoClaveHash: this.employeeHash(capture, interno),
      diasLaborados: daysD2(ahorro.dias_laborados),
      diasOrigen: ahorro.dias_laborados_origen as SnapshotCalculoV2Detalle['diasOrigen'],
      sueldoMensualD6: ahorro.sueldo_d6,
      otrasPrestacionesMensualesD6: ahorro.otras_prestaciones_d6,
      quinqueniosMensualD6: ahorro.quinquenios_d6,
      baseCotizacionSueldoD6: ahorro.base_cotizacion_sueldo_d6,
      baseCotizacionQuinqueniosD6: prestaciones.base_cotizacion_quinquenios_d6,
      cairD6: requiredD6(cair.afe_d6, 'CAIR'),
      cairFondoD6: cair.total_d6,
      fraD6: requiredD6(prestaciones.afpa_d6, 'FRA'),
      freD6: requiredD6(prestaciones.afpe_d6, 'FRE'),
      prestacionesD6: prestaciones.total_d6,
      fhD6: requiredD6(vivienda.fh_d6, 'FH'),
      fvD6: requiredD6(vivienda.fv_d6, 'FV'),
      viviendaD6: vivienda.total_d6,
      faaD6: requiredD6(ahorro.afaa_d6, 'FAA'),
      faeD6: requiredD6(ahorro.afae_d6, 'FAE'),
      fatD6: ahorro.total_d6,
      faiD6: ahorro.faiD6
    };
  }

  private employeeDetail(
    capture: QnaTenDomainCapture,
    funds: Record<QnaFundDomain, Map<number, Readonly<CapturedQnaFundRow>>>,
    snapshot: SnapshotCalculoV2Detalle,
    interno: number
  ): QnaEmployeeDetail {
    const ahorro = funds.AHORRO.get(interno)!;
    const amounts = (domain: keyof typeof capture.auxiliares): string => this.money.sumarD6(
      capture.auxiliares[domain].details.filter((row) => row.empleadoClave === String(interno)).map((row) => row.importeOficialD6)
    );
    const detail: QnaEmployeeDetail = {
      orden: snapshot.orden,
      empleadoClave: String(interno),
      empleadoClaveHash: snapshot.empleadoClaveHash,
      interno,
      rfc: ahorro.rfc,
      nombre: String(ahorro.nombre),
      sourceScale: 6,
      sueldoD6: requiredD6(snapshot.sueldoMensualD6, 'SUELDO'),
      otrasPrestacionesD6: requiredD6(snapshot.otrasPrestacionesMensualesD6, 'OTRAS_PRESTACIONES'),
      quinqueniosD6: requiredD6(snapshot.quinqueniosMensualD6, 'QUINQUENIOS'),
      diasLaborados: requiredText(snapshot.diasLaborados, 'DIAS'),
      diasOrigen: snapshot.diasOrigen,
      sueldoMensualD6: requiredD6(snapshot.sueldoMensualD6, 'SUELDO_MENSUAL'),
      baseCotizacionSueldoD6: snapshot.baseCotizacionSueldoD6,
      quinqueniosMensualD6: requiredD6(snapshot.quinqueniosMensualD6, 'QUINQUENIOS_MENSUAL'),
      baseCotizacionQuinqueniosD6: snapshot.baseCotizacionQuinqueniosD6,
      cairD6: requiredD6(snapshot.cairD6, 'CAIR'),
      cairFondoD6: requiredD6(snapshot.cairFondoD6, 'CAIR_FONDO'),
      fraD6: requiredD6(snapshot.fraD6, 'FRA'),
      freD6: requiredD6(snapshot.freD6, 'FRE'),
      prestacionesD6: requiredD6(snapshot.prestacionesD6, 'PRESTACIONES'),
      fhD6: requiredD6(snapshot.fhD6, 'FH'),
      fvD6: requiredD6(snapshot.fvD6, 'FV'),
      viviendaD6: requiredD6(snapshot.viviendaD6, 'VIVIENDA'),
      faaD6: requiredD6(snapshot.faaD6, 'FAA'),
      faeD6: requiredD6(snapshot.faeD6, 'FAE'),
      fatD6: requiredD6(snapshot.fatD6, 'FAT'),
      faiD6: requiredD6(snapshot.faiD6, 'FAI'),
      guarderiasD6: amounts('GUARDERIAS'),
      transitorioD6: amounts('TRANSITORIO'),
      aguinaldoD6: amounts('AGUINALDO'),
      retencionPcpD6: amounts('PCP'),
      retencionPmpD6: amounts('PMP'),
      retencionHipD6: amounts('HIP'),
      hashFila: ''
    };
    detail.hashFila = calculateQnaEmployeeDetailHash(detail);
    return detail;
  }

  private fundSource(capture: QnaTenDomainCapture, domain: QnaFundDomain, details: QnaEmployeeDetail[]): QnaSource {
    const rows = details.map((detail) => [detail.empleadoClaveHash, calculateCanonicalHash(fundProjection(domain, detail))]);
    return {
      dominio: domain as QnaDomain,
      tipoFuente: 'FIREBIRD',
      estado: rows.length > 0 ? 'COMPLETE' : 'EMPTY',
      requerida: true,
      identificadorFuente: `FIREBIRD:APORTACIONES_FONDOS:${capture.ambiente}:${capture.periodo}:${capture.scope.organica0}:${capture.scope.organica1}:${capture.scope.organica2}:${capture.scope.organica3}:${domain}`,
      hashFuente: rows.length > 0 ? calculateCanonicalHash(rows) : null,
      sourceScale: 6,
      registros: rows.length,
      notApplicableAprobado: false,
      aprobadoPor: null,
      evidencia: null,
      errorCode: null
    };
  }

  private snapshotTotals(capture: QnaTenDomainCapture, details: SnapshotCalculoV2Detalle[]): SnapshotCalculoV2Input['totalesA2'] {
    const component = (field: keyof SnapshotCalculoV2Detalle) => this.money.agregarComponenteA2(details.map((row) => String(row[field] ?? '0')));
    return {
      CAIR: component('cairD6'),
      CAIR_FONDO: capture.fondos.CAIR.totalA2,
      FRA: component('fraD6'),
      FRE: component('freD6'),
      PRESTACIONES: capture.fondos.PRESTACIONES.totalA2,
      FH: component('fhD6'),
      FV: component('fvD6'),
      VIVIENDA: capture.fondos.VIVIENDA.totalA2,
      FAA: component('faaD6'),
      FAE: component('faeD6'),
      FAT: capture.fondos.AHORRO.totalA2,
      FAI: component('faiD6')
    };
  }

  private qnaTotals(capture: QnaTenDomainCapture, snapshot: SnapshotCalculoV2Input): QnaTotals {
    const t = snapshot.totalesA2;
    const auxiliary = capture.auxiliares;
    const totalAportacionesA2 = addA2(t.FAT, t.VIVIENDA, t.PRESTACIONES, t.CAIR_FONDO,
      auxiliary.GUARDERIAS.totalA2, auxiliary.TRANSITORIO.totalA2, auxiliary.AGUINALDO.totalA2);
    const totalRetencionesA2 = addA2(auxiliary.PCP.totalA2, auxiliary.PMP.totalA2, auxiliary.HIP.totalA2);
    return {
      registros: snapshot.detalles.length,
      cairA2: t.CAIR, fraA2: t.FRA, freA2: t.FRE, fhA2: t.FH, fvA2: t.FV,
      faaA2: t.FAA, faeA2: t.FAE, fatA2: t.FAT, faiA2: t.FAI,
      ahorroA2: t.FAT, viviendaA2: t.VIVIENDA, prestacionesA2: t.PRESTACIONES, cairFondoA2: t.CAIR_FONDO,
      guarderiasA2: auxiliary.GUARDERIAS.totalA2,
      transitorioA2: auxiliary.TRANSITORIO.totalA2,
      aguinaldoA2: auxiliary.AGUINALDO.totalA2,
      retencionPcpA2: auxiliary.PCP.totalA2,
      retencionPmpA2: auxiliary.PMP.totalA2,
      retencionHipA2: auxiliary.HIP.totalA2,
      totalAportacionesA2,
      totalRetencionesA2,
      totalGeneralA2: addA2(totalAportacionesA2, totalRetencionesA2)
    };
  }

  private employeeHash(capture: QnaTenDomainCapture, interno: number): string {
    return createHash('sha256').update(`${capture.periodo}|${capture.scope.organica0}|${capture.scope.organica1}|${capture.scope.organica2}|${capture.scope.organica3}|${interno}`)
      .digest('hex').toUpperCase();
  }
}

export function fundProjection(domain: QnaFundDomain, detail: QnaEmployeeDetail): Record<string, unknown> {
  const shared = { empleadoClaveHash: detail.empleadoClaveHash, interno: detail.interno, diasLaborados: detail.diasLaborados, diasOrigen: detail.diasOrigen };
  if (domain === 'AHORRO') return { ...shared, sueldoD6: detail.sueldoD6, otrasPrestacionesD6: detail.otrasPrestacionesD6,
    quinqueniosD6: detail.quinqueniosD6, faaD6: detail.faaD6, faeD6: detail.faeD6, fatD6: detail.fatD6, faiD6: detail.faiD6 };
  if (domain === 'VIVIENDA') return { ...shared, fhD6: detail.fhD6, fvD6: detail.fvD6, viviendaD6: detail.viviendaD6 };
  if (domain === 'PRESTACIONES') return { ...shared, baseCotizacionSueldoD6: detail.baseCotizacionSueldoD6,
    baseCotizacionQuinqueniosD6: detail.baseCotizacionQuinqueniosD6, fraD6: detail.fraD6, freD6: detail.freD6, prestacionesD6: detail.prestacionesD6 };
  return { ...shared, cairD6: detail.cairD6, cairFondoD6: detail.cairFondoD6 };
}

function requiredD6(value: string | null | undefined, field: string): string {
  if (!/^-?(0|[1-9]\d*)\.\d{6}$/.test(value ?? '')) throw new Error(`QNA_V5_${field}_INVALIDO`);
  return value!;
}

function requiredText(value: string | null, field: string): string {
  if (!value) throw new Error(`QNA_V5_${field}_INVALIDO`);
  return value;
}

function daysD2(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value > 15) throw new Error('QNA_V5_DIAS_INVALIDOS');
  return value.toFixed(2);
}

function addA2(...values: string[]): string {
  const cents = values.reduce((sum, value) => {
    if (!/^-?(0|[1-9]\d*)\.\d{2}$/.test(value)) throw new Error('QNA_V5_A2_INVALIDO');
    const negative = value.startsWith('-');
    const [whole, fraction] = (negative ? value.slice(1) : value).split('.');
    const amount = BigInt(whole) * 100n + BigInt(fraction);
    return sum + (negative ? -amount : amount);
  }, 0n);
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  return `${negative ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}
