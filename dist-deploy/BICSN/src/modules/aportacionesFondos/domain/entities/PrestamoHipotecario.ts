// Domain entity for mortgage loans (préstamos hipotecarios)
export interface PrestamoHipotecario {
  interno: number;
  nombre: string | null;
  noempleado: string | null;
  cantidad: number | null;
  status: string | null;
  referencia_1: string | null;
  referencia_2: string | null;
  capital_pagar: number | null;
  interes_pagar: number | null;
  interes_diferido_pagar: number | null;
  seguro_pagar: number | null;
  moratorio_pagar: number | null;
  pno_solicitud: number | null;
  pano: number | null;
  pclave_clase_prestamo: string | null;
  pdescripcion: string | null;
  rfc: string | null;
  org0: string | null;
  org1: string | null;
  org2: string | null;
  org3: string | null;
  norg0: string | null;
  norg1: string | null;
  norg2: string | null;
  norg3: string | null;
  pclave_prestamo: string | null;
  prestamo_desc: string | null;
  tipo: string | null;
  periodo_c: string | null;
  descto: number | null;
  fecha_c: Date | null;
  resultado: string | null;
  po: string | null;
  fecha_origen: Date | null;
  plazo: number | null;
}

// Response structure for préstamos hipotecarios endpoint
export interface PrestamosHipotecariosResponse {
  clave_organica_0: string;
  clave_organica_1: string;
  periodo: string;
  accion: string;
  computadora_antigua: boolean;
  prestamos: PrestamoHipotecario[];
}

