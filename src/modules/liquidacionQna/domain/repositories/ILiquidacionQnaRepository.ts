import type {
  CreateQnaCandidateInput, CreateQnaCandidateResult, PromoteQnaResult, QnaDecision,
  QnaDecisionRecord, QnaListFilter, QnaListResult, QnaSnapshot, QnaProcessState, QnaScope,
} from '../entities/LiquidacionQna.js';
import type { SnapshotCalculoV2Input } from '../../../aportacionesFondos/domain/entities/SnapshotCalculoV2.js';
import type {
  QnaAppliedDetailFilter, QnaAppliedDetailResult, QnaAppliedListFilter, QnaAppliedListResult,
  QnaAppliedSelection, QnaAppliedSummary,
} from '../entities/QnaAppliedRead.js';

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
  listApplied(filter: QnaAppliedListFilter): Promise<QnaAppliedListResult>;
  getAppliedSummary(filter: QnaAppliedSelection): Promise<QnaAppliedSummary | null>;
  getAppliedDetails(filter: QnaAppliedDetailFilter): Promise<QnaAppliedDetailResult | null>;
}
