/**
 * Entidad FormatoExtemporanea
 * Representa un registro de semanas extemporáneas para carga por lote
 */

export interface FormatoExtemporanea {
  id: number;
  qnaAplica: number;
  interno: number;
  org0: string;
  org1: string;
  org2: string;
  org3: string;
  qnasPlus: number;
  cair: number;
  fra: number;
  fre: number;
  fh: number;
  fv: number;
  faa: number;
  fae: number;
  usuario: string;
}

/**
 * Datos requeridos para crear un registro de FormatoExtemporanea
 */
export interface CreateFormatoExtemporaneaData {
  qnaAplica: number;
  interno: number;
  org0: string;
  org1: string;
  org2: string;
  org3: string;
  qnasPlus: number;
  cair: number;
  fra: number;
  fre: number;
  fh: number;
  fv: number;
  faa: number;
  fae: number;
  usuario: string;
}

/**
 * Par único para validación de duplicados
 */
export interface InternoQnaPair {
  interno: number;
  qnaAplica: number;
}
