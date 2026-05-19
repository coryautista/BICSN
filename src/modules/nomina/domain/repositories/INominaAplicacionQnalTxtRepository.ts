import {
  NominaAplicacionQnalQueryFilters,
  NominaAplicacionQnalQueryResult,
  NominaAplicacionQnalRegistroParsed,
  NominaAplicacionQnalUploadInput,
  NominaAplicacionQnalUploadResult
} from '../entities/NominaAplicacionQnalTxt.js';

export interface INominaAplicacionQnalTxtRepository {
  registrarCargaRechazada(
    input: NominaAplicacionQnalUploadInput,
    errores: Array<{ numeroLinea: number; campo?: string; mensaje: string }>,
    totalRegistros: number
  ): Promise<NominaAplicacionQnalUploadResult>;

  reemplazarVigentes(
    input: NominaAplicacionQnalUploadInput,
    registros: NominaAplicacionQnalRegistroParsed[]
  ): Promise<NominaAplicacionQnalUploadResult>;

  consultarRegistros(filters: NominaAplicacionQnalQueryFilters): Promise<NominaAplicacionQnalQueryResult>;
}
