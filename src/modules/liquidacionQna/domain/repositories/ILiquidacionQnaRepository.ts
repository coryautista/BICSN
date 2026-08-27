import type {
  CreateQnaCandidateInput, CreateQnaCandidateResult, PromoteQnaResult, QnaDecision,
  QnaDecisionRecord, QnaListFilter, QnaListResult, QnaSnapshot, QnaProcessState, QnaScope,
} from '../entities/LiquidacionQna.js';
import type { SnapshotCalculoV2Input } from '../../../aportacionesFondos/domain/entities/SnapshotCalculoV2.js';
import type {
  QnaAppliedDetailFilter, QnaAppliedDetailResult, QnaAppliedListFilter, QnaAppliedListResult,
  QnaAppliedSelection, QnaAppliedSummary,
} from '../entities/QnaAppliedRead.js';
import type { QnaApplicationAction, QnaApplicationClaimType, QnaManualResolution } from '../services/QnaApplicationSagaPolicy.js';

export interface QnaApplicationSnapshot {
  liquidacionSnapshotId: string;
  estadoProceso: QnaProcessState;
  action: QnaApplicationAction;
  scope: QnaScope;
  periodo: string;
  idempotente: boolean;
  intentoUuid: string;
  afectacionId: number;
  claimToken: string | null;
}

export interface QnaManualResolutionResult {
  intentoUuid: string;
  liquidacionSnapshotId: string;
  estadoProceso: Extract<QnaProcessState, 'FIREBIRD_CONFIRMADO' | 'FIREBIRD_REVERTIDO'>;
  resolution: QnaManualResolution;
  idempotente: boolean;
  action: 'REANUDAR_SQL' | 'REINTENTAR_FIREBIRD';
}

export type CreateQnaOfficialV5Input = {
  snapshotV2: SnapshotCalculoV2Input;
  candidate: Omit<import('../entities/LiquidacionQna.js').CreateQnaCandidateInput, 'snapshotCalculoV2Id'>;
};

export interface ILiquidacionQnaRepository {
  createCandidate(input: CreateQnaCandidateInput): Promise<CreateQnaCandidateResult>;
  createOfficialV5(input: CreateQnaOfficialV5Input): Promise<CreateQnaCandidateResult>;
  createOfficialV5FromCapture(scope: QnaScope, capture: () => Promise<CreateQnaOfficialV5Input>): Promise<CreateQnaCandidateResult>;
  getById(id: string): Promise<QnaSnapshot | null>;
  list(filter: QnaListFilter): Promise<QnaListResult>;
  appendDecision(id: string, decision: QnaDecision, comentario: string | null, usuarioId: string): Promise<QnaDecisionRecord>;
  promote(id: string, motivo: string | null, usuarioId: string): Promise<PromoteQnaResult>;
  resolveOfficialById(id: string): Promise<QnaSnapshot | null>;
  resolveOfficialByScope(scope: QnaScope): Promise<QnaSnapshot | null>;
  appendProcessTransition(id: string, destination: QnaProcessState, motivo: string | null, usuarioId: string, allowSame?: boolean): Promise<void>;
  beginOrResumeApplication(id: string, scope: QnaScope, usuarioId: string): Promise<QnaApplicationSnapshot>;
  resolveUncertainApplication(id: string, intentoUuid: string, scope: QnaScope, resolution: QnaManualResolution, motivo: string, evidencia: string, usuarioId: string): Promise<QnaManualResolutionResult>;
  renewApplicationClaim(intentoUuid: string, claimToken: string, claimType: QnaApplicationClaimType, usuarioId: string): Promise<void>;
  completeFirebirdAttempt(intentoUuid: string, claimToken: string, destination: Extract<QnaProcessState,'FIREBIRD_CONFIRMADO'|'FIREBIRD_REVERTIDO'|'APLICACION_INCIERTA'>, motivo: string, usuarioId: string): Promise<void>;
  advanceRecoveryAttempt(intentoUuid: string, claimToken: string, destination: Extract<QnaProcessState,'LINEA_CONFIRMADA'|'REVISA_PROGRAMADA'|'TERMINADO'>, motivo: string, usuarioId: string): Promise<void>;
  releaseRecoveryClaim(intentoUuid: string, claimToken: string, motivo: string, usuarioId: string): Promise<void>;
  listApplied(filter: QnaAppliedListFilter): Promise<QnaAppliedListResult>;
  getAppliedSummary(filter: QnaAppliedSelection): Promise<QnaAppliedSummary | null>;
  getAppliedDetails(filter: QnaAppliedDetailFilter): Promise<QnaAppliedDetailResult | null>;
}
