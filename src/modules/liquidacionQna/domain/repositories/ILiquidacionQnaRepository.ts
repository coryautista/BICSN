import type {
  CreateQnaCandidateInput, CreateQnaCandidateResult, PromoteQnaResult, QnaDecision,
  QnaDecisionRecord, QnaListFilter, QnaListResult, QnaSnapshot, QnaProcessState, QnaScope,
} from '../entities/LiquidacionQna.js';

export interface ILiquidacionQnaRepository {
  createCandidate(input: CreateQnaCandidateInput): Promise<CreateQnaCandidateResult>;
  getById(id: string): Promise<QnaSnapshot | null>;
  list(filter: QnaListFilter): Promise<QnaListResult>;
  appendDecision(id: string, decision: QnaDecision, comentario: string | null, usuarioId: string): Promise<QnaDecisionRecord>;
  promote(id: string, motivo: string | null, usuarioId: string): Promise<PromoteQnaResult>;
  resolveOfficialById(id: string): Promise<QnaSnapshot | null>;
  resolveOfficialByScope(scope: QnaScope): Promise<QnaSnapshot | null>;
  appendProcessTransition(id: string, destination: QnaProcessState, motivo: string | null, usuarioId: string, allowSame?: boolean): Promise<void>;
}
