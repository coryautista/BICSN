// Domain entity for medium-term loans (préstamos a mediano plazo)
export interface PrestamoMedianoPlazo {
  interno: number;
  rfc: string | null;
  nombre: string | null;
  prestamo: number | null;
  letra: number | null;
  plazo: number | null;
  periodo_c: string | null;
  fecha_c: Date | null;
  capital: number | null;
  moratorios: number | null;
  interes: number | null;
  seguro: number | null;
  total: number | null;
  resultado: string | null;
  clase: string | null;
  org0: string | null;
  org1: string | null;
  org2: string | null;
  org3: string | null;
  norg0: string | null;
  norg1: string | null;
  norg2: string | null;
  norg3: string | null;
  desc_clase: string | null;
  desc_prestamo: string | null;
  clave_p: string | null;
  noemple: string | null;
  folio: number | null;
  anio: number | null;
  po: string | null;
  fecha_origen: Date | null;
}

// Response structure for préstamos a mediano plazo endpoint
export interface PrestamosMedianoPlazoResponse {
  clave_organica_0: string;
  clave_organica_1: string;
  periodo: string;
  accion: string;
  prestamos: PrestamoMedianoPlazo[];
}

