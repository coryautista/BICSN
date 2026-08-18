import { AfectacionOrgService } from '../../../afectacionOrg/infrastructure/services/AfectacionOrgService.js';
import { NominaAplicacionQnalUploadInput, NominaAplicacionQnalUploadResult } from '../../domain/entities/NominaAplicacionQnalTxt.js';
import { INominaAplicacionQnalTxtRepository } from '../../domain/repositories/INominaAplicacionQnalTxtRepository.js';
import { parseNominaAplicacionQnalTxt } from '../NominaAplicacionQnalTxtParser.js';

export class CargarNominaAplicacionQnalTxtCommand {
  constructor(
    private nominaAplicacionQnalTxtRepo: INominaAplicacionQnalTxtRepository,
    private afectacionOrgService: AfectacionOrgService
  ) {}

  async execute(input: NominaAplicacionQnalUploadInput): Promise<NominaAplicacionQnalUploadResult> {
    const parseResult = parseNominaAplicacionQnalTxt(input.archivoContenido);
    const quincenaActual = await this.afectacionOrgService.getQuincenaFromFirebird(
      input.organica0,
      input.organica1,
      input.organica2,
      input.organica3
    );

    if (quincenaActual.anio !== input.anio || quincenaActual.quincena !== input.quincena) {
      parseResult.errores.push({
        numeroLinea: 0,
        campo: 'anio/quincena',
        mensaje: `La carga corresponde a ${input.anio}/${input.quincena}, pero la quincena vigente es ${quincenaActual.anio}/${quincenaActual.quincena}.`
      });
    }

    const rfcLines = new Map<string, number>();
    for (const registro of parseResult.registros) {
      const rfc = registro.rfc.trim().toUpperCase();
      const previousLine = rfcLines.get(rfc);
      if (previousLine !== undefined) {
        parseResult.errores.push({
          numeroLinea: registro.numeroLinea,
          campo: 'rfc',
          mensaje: `RFC duplicado en las líneas ${previousLine} y ${registro.numeroLinea}.`
        });
      } else {
        rfcLines.set(rfc, registro.numeroLinea);
      }
    }

    if (parseResult.errores.length > 0) {
      return this.nominaAplicacionQnalTxtRepo.registrarCargaRechazada(input, parseResult.errores, parseResult.registros.length);
    }

    return this.nominaAplicacionQnalTxtRepo.reemplazarVigentes(input, parseResult.registros);
  }
}
