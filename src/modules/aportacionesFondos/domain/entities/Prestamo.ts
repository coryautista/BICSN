// Domain entity for short-term loans (préstamos a corto plazo)
export interface Prestamo {
  interno: number;
  rfc: string | null;
  nombre: string | null;
  prestamo: number | null;
  letra: number | null;
  plazo: number | null;
  periodo_c: string | null;
  fecha_c: Date | null;
  capital: number | null;
  capital_d6: string | null;
  interes: number | null;
  interes_d6: string | null;
  monto: number | null;
  monto_d6: string | null;
  moratorios: number | null;
  moratorios_d6: string | null;
  total: number | null;
  total_d6: string | null;
  resultado: string | null;
  td: string | null;
  org0: string | null;
  org1: string | null;
  org2: string | null;
  org3: string | null;
  norg0: string | null;
  norg1: string | null;
  norg2: string | null;
  norg3: string | null;
}

// Response structure for préstamos a corto plazo endpoint
export interface PrestamosResponse {
  clave_organica_0: string;
  clave_organica_1: string;
  periodo: string;
  accion: string;
  prestamos: Prestamo[];
}
