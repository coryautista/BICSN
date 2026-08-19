import type { ILiquidacionQnaRepository } from '../../domain/repositories/ILiquidacionQnaRepository.js';

export class PromoteQnaSnapshotCommand {
  constructor(private liquidacionQnaRepo: ILiquidacionQnaRepository) {}
  execute(id: string, motivo: string | null, usuarioId: string) {
    return this.liquidacionQnaRepo.promote(id, motivo, usuarioId);
  }
}
