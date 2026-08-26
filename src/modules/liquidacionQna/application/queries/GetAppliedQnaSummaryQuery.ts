import type { QnaAppliedSelection } from '../../domain/entities/QnaAppliedRead.js';
import type { ILiquidacionQnaRepository } from '../../domain/repositories/ILiquidacionQnaRepository.js';

export class GetAppliedQnaSummaryQuery {
  constructor(private liquidacionQnaRepo: ILiquidacionQnaRepository) {}
  execute(filter: QnaAppliedSelection) { return this.liquidacionQnaRepo.getAppliedSummary(filter); }
}
