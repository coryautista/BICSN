import type { QnaDecision } from '../../domain/entities/LiquidacionQna.js';
import type { ILiquidacionQnaRepository } from '../../domain/repositories/ILiquidacionQnaRepository.js';

export class AppendQnaDecisionCommand {
  constructor(private liquidacionQnaRepo: ILiquidacionQnaRepository) {}
  execute(id: string, decision: QnaDecision, comentario: string | null, usuarioId: string) {
    return this.liquidacionQnaRepo.appendDecision(id, decision, comentario, usuarioId);
  }
}
