import type { CreateQnaCandidateInput } from '../../domain/entities/LiquidacionQna.js';
import type { ILiquidacionQnaRepository } from '../../domain/repositories/ILiquidacionQnaRepository.js';

export class CreateQnaCandidateCommand {
  constructor(private liquidacionQnaRepo: ILiquidacionQnaRepository) {}
  execute(input: CreateQnaCandidateInput) { return this.liquidacionQnaRepo.createCandidate(input); }
}
