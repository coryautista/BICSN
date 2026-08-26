import type { QnaAppliedDetailFilter } from '../../domain/entities/QnaAppliedRead.js';
import type { ILiquidacionQnaRepository } from '../../domain/repositories/ILiquidacionQnaRepository.js';

export class GetAppliedQnaDetailsQuery {
  constructor(private liquidacionQnaRepo: ILiquidacionQnaRepository) {}
  execute(filter: QnaAppliedDetailFilter) { return this.liquidacionQnaRepo.getAppliedDetails(filter); }
}
