// Domain entity for fund contributions
export interface AportacionFondo {
  interno: number;
  nombre: string | null;
  sueldo: number | null;
  quinquenios: number | null;
  otras_prestaciones: number | null;
  sueldo_base: number;
  afae?: number; // Ahorro - patron contribution
  afaa?: number; // Ahorro - employee contribution
  afe?: number;  // Vivienda/CAIR - patron contribution
  afpe?: number; // Prestaciones - patron contribution  
  afpa?: number; // Prestaciones - employee contribution
  total: number;
  tipo: string;
}

// Individual contribution result
export interface AportacionIndividual {
  tipo: 'ahorro' | 'vivienda' | 'prestaciones' | 'cair';
  clave_organica_0: string;
  clave_organica_1: string;
  datos: AportacionFondo[];
  resumen: {
    total_empleados: number;
    total_contribucion: number;
    total_sueldo_base: number;
  };
}

// Combined contribution result
export interface AportacionCompleta {
  clave_organica_0: string;
  clave_organica_1: string;
  ahorro?: AportacionIndividual;
  vivienda?: AportacionIndividual;
  prestaciones?: AportacionIndividual;
  cair?: AportacionIndividual;
  resumen_general: {
    total_empleados: number;
    total_contribucion_general: number;
    total_sueldo_base_general: number;
    fondos_incluidos: string[];
  };
}

export type TipoFondo = 'ahorro' | 'vivienda' | 'prestaciones' | 'cair';

export interface ObtenerAportacionesParams {
  tipo?: TipoFondo | 'todos';
  clave_organica_0?: string;
  clave_organica_1?: string;
}