import { NominaAplicacionQnalCargaVigente, NominaAplicacionQnalScope } from '../../domain/entities/NominaAplicacionQnalTxt.js';
import { INominaAplicacionQnalTxtRepository } from '../../domain/repositories/INominaAplicacionQnalTxtRepository.js';

export class GetNominaAplicacionQnalCargaVigenteQuery {
  constructor(private nominaAplicacionQnalTxtRepo: INominaAplicacionQnalTxtRepository) {}

  execute(scope: NominaAplicacionQnalScope): Promise<NominaAplicacionQnalCargaVigente | null> {
    return this.nominaAplicacionQnalTxtRepo.consultarCargaVigente(scope);
  }
}
