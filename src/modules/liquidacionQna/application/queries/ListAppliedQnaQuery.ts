import type { QnaAppliedListFilter } from '../../domain/entities/QnaAppliedRead.js';
import type { ILiquidacionQnaRepository } from '../../domain/repositories/ILiquidacionQnaRepository.js';

export class ListAppliedQnaQuery {
  constructor(private liquidacionQnaRepo: ILiquidacionQnaRepository) {}
  execute(filter: QnaAppliedListFilter) { return this.liquidacionQnaRepo.listApplied(filter); }
}
