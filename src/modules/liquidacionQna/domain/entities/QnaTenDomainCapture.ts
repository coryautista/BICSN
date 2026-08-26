import type { AportacionFondo } from '../../../aportacionesFondos/domain/entities/AportacionFondo.js';
import type { QnaEnvironment, QnaSource, QnaSourceDetail } from './LiquidacionQna.js';

export const QNA_FUND_DOMAINS = ['AHORRO', 'VIVIENDA', 'PRESTACIONES', 'CAIR'] as const;
export const QNA_AUXILIARY_DOMAINS = ['GUARDERIAS', 'TRANSITORIO', 'AGUINALDO', 'PCP', 'PMP', 'HIP'] as const;

export type QnaFundDomain = typeof QNA_FUND_DOMAINS[number];
export type QnaAuxiliaryDomain = typeof QNA_AUXILIARY_DOMAINS[number];

export type QnaCaptureScope = {
  entidadId: number;
  anio: number;
  quincena: number;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
};

export type CapturedQnaFund = {
  rows: readonly Readonly<AportacionFondo>[];
  totalA2: string;
  componentsA2: Readonly<Record<string, string>>;
};

export type CapturedQnaAuxiliaryDetail = QnaSourceDetail & {
  empleadoClave: string;
  rfc: string | null;
  nombre: string;
  payloadVersion: 1;
  captureOrdinal: number;
};

export type CapturedQnaAuxiliarySource = {
  procedure: string;
  source: Readonly<QnaSource>;
  details: readonly Readonly<CapturedQnaAuxiliaryDetail>[];
  totalA2: string;
};

export type QnaTenDomainCapture = {
  captureId: string;
  capturedAt: string;
  periodo: string;
  scope: Readonly<QnaCaptureScope>;
  ambiente: QnaEnvironment;
  usuarioId: string;
  precisionPolicy: string;
  formulaCalculoVersionId: string;
  nominaCargaId: string | null;
  hipProcedure: 'AP_S_HIP_QNA' | 'AP_S_COMP_QNA';
  fondos: Readonly<Record<QnaFundDomain, Readonly<CapturedQnaFund>>>;
  auxiliares: Readonly<Record<QnaAuxiliaryDomain, Readonly<CapturedQnaAuxiliarySource>>>;
};
