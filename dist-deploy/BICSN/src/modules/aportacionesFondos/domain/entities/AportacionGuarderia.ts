// Domain entity for aportación guarderías
export interface AportacionGuarderia {
  titular_nombre: string | null;
  titular_no_empleado: string | null;
  titular_monto: number | null;
  titular_rfc: string | null;
  titular_monto_texto: string | null;
  titular_org0: string | null;
  titular_org0_nombre: string | null;
  titular_org1: string | null;
  titular_org1_nombre: string | null;
  titular_org2: string | null;
  titular_org2_nombre: string | null;
  titular_org3: string | null;
  titular_org3_nombre: string | null;
  entidad_monto: number | null;
  recibo_ajuste: number | null;
  recibo_total: number | null;
  recibo_mes_ano: string | null;
  recibo_fecha_venc: Date | null;
  recibo_folio: string | null;
  menor_id: number | null;
  menor_nombre: string | null;
  menor_rfc: string | null;
  menor_nivel: string | null;
  menor_sala: string | null;
  estatus: string | null;
}

// Response structure for aportación guarderías endpoint
export interface AportacionGuarderiasResponse {
  clave_organica_0: string;
  clave_organica_1: string;
  periodo: string;
  accion: string;
  aportaciones: AportacionGuarderia[];
}

