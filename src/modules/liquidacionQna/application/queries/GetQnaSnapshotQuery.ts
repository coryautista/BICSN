import type { ILiquidacionQnaRepository } from '../../domain/repositories/ILiquidacionQnaRepository.js';

export class GetQnaSnapshotQuery {
  constructor(private liquidacionQnaRepo: ILiquidacionQnaRepository) {}
  execute(id: string) { return this.liquidacionQnaRepo.getById(id); }
}
