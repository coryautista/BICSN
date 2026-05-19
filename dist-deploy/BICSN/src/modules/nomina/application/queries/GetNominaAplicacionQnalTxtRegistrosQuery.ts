import { NominaAplicacionQnalQueryFilters, NominaAplicacionQnalQueryResult } from '../../domain/entities/NominaAplicacionQnalTxt.js';
import { INominaAplicacionQnalTxtRepository } from '../../domain/repositories/INominaAplicacionQnalTxtRepository.js';

export class GetNominaAplicacionQnalTxtRegistrosQuery {
  constructor(private nominaAplicacionQnalTxtRepo: INominaAplicacionQnalTxtRepository) {}

  execute(filters: NominaAplicacionQnalQueryFilters): Promise<NominaAplicacionQnalQueryResult> {
    return this.nominaAplicacionQnalTxtRepo.consultarRegistros(filters);
  }
}
