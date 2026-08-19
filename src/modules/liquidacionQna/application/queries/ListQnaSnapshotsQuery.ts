import type { QnaListFilter } from '../../domain/entities/LiquidacionQna.js';
import type { ILiquidacionQnaRepository } from '../../domain/repositories/ILiquidacionQnaRepository.js';

export class ListQnaSnapshotsQuery {
  constructor(private liquidacionQnaRepo: ILiquidacionQnaRepository) {}
  execute(filter: QnaListFilter) { return this.liquidacionQnaRepo.list(filter); }
}
