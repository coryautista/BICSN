// Domain entity for aguinaldo (bonus payment)
export interface Aguinaldo {
  interno: number | null;
  org0: string | null;
  org1: string | null;
  org2: string | null;
  org3: string | null;
  movimiento: string | null;
  noempleado: string | null;
  tipomovimiento: string | null;
  nombres: string | null;
  rfc: string | null;
  curp: string | null;
  fecha: Date | null;
  dias_aguinaldo: number | null;
  cuantos: number | null;
  cuantos_ori: number | null;
  nocontar: string | null;
  sdo: number | null;
  op: number | null;
  q: number | null;
  activo: string | null;
  nom_activo: string | null;
  qna_a: number | null;
  porcentaje_a: number | null;
  diario: number | null;
  general: number | null;
  general_d6: string;
  porcentaje: number | null;
  proporcion: number | null;
  mensaje: string | null;
  dias_gral_agui: number | null;
  fecha_lf: Date | null;
  fecha_li: Date | null;
  f_inicio: Date | null;
  f_fin: Date | null;
  norg0: string | null;
  norg1: string | null;
  norg2: string | null;
  norg3: string | null;
  dias_laborados?: number;
  dias_laborados_origen?: 'nomina' | 'movimiento' | 'default' | 'nomina_sin_coincidencia';
}

// Response structure for aguinaldo endpoint
export interface AguinaldoResponse {
  clave_organica_0: string;
  clave_organica_1: string;
  periodo: string;
  accion: string;
  aguinaldos: Aguinaldo[];
}

