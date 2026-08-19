import type { ILiquidacionQnaRepository } from '../../domain/repositories/ILiquidacionQnaRepository.js';
import type { QnaScope } from '../../domain/entities/LiquidacionQna.js';

export class ResolveOfficialQnaSnapshotQuery {
  constructor(private liquidacionQnaRepo: ILiquidacionQnaRepository) {}
  execute(id: string) { return this.liquidacionQnaRepo.resolveOfficialById(id); }
  executeByScope(scope: QnaScope) { return this.liquidacionQnaRepo.resolveOfficialByScope(scope); }
}
