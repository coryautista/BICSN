import type { MoneyA2, MoneyD6 } from './Money.js';
import type { FormulaCalculo } from './FormulaCalculo.js';

// Domain entity for fund contributions
export interface AportacionFondo {
  interno: number;
  nombre: string | null;
  sueldo: number | null;
  quinquenios: number | null;
  otras_prestaciones: number | null;
  sueldo_proporcional: number;
  sueldo_base: number;
  afae?: number; // Ahorro - patron contribution
  afaa?: number; // Ahorro - employee contribution
  afe?: number;  // Vivienda/CAIR - patron contribution
  afpe?: number; // Prestaciones - patron contribution  
  afpa?: number; // Prestaciones - employee contribution
  total: number;
  tipo: string;
  dias_laborados: number;
  dias_laborados_origen: 'nomina' | 'movimiento' | 'default' | 'nomina_sin_coincidencia' | 'historico_snapshot' | 'historico_sin_dias';
  base_cotizacion_quinquenios?: number | null;
  quinquenios_aplicado?: number | null;
  base_cotizacion_quinquenios_d6: MoneyD6 | null;
  quinquenios_aplicado_d6: MoneyD6 | null;
  sueldo_d6: MoneyD6;
  quinquenios_d6: MoneyD6;
  otras_prestaciones_d6: MoneyD6;
  sueldo_proporcional_d6: MoneyD6;
  sueldo_base_d6: MoneyD6;
  afae_d6?: MoneyD6;
  afaa_d6?: MoneyD6;
  afe_d6?: MoneyD6;
  fh_d6?: MoneyD6;
  fv_d6?: MoneyD6;
  afpe_d6?: MoneyD6;
  afpa_d6?: MoneyD6;
  total_d6: MoneyD6;
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
    total_contribucion_a2: MoneyA2;
    total_sueldo_base_a2: MoneyA2;
    componentes_a2: Partial<Record<'afae' | 'afaa' | 'afe' | 'afpe' | 'afpa', MoneyA2>>;
  };
  precision_policy: FormulaCalculo['precisionPolicy'];
  formula_version_id: string;
  fuente_datos: 'CALCULO_VIVO' | 'HISTORICO_SQL';
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
    total_contribucion_general_a2: MoneyA2;
    total_sueldo_base_general_a2: MoneyA2;
    fondos_incluidos: string[];
  };
  precision_policy: FormulaCalculo['precisionPolicy'];
  formula_version_id: string;
  fuente_datos: 'CALCULO_VIVO';
}

export type TipoFondo = 'ahorro' | 'vivienda' | 'prestaciones' | 'cair';

export interface ObtenerAportacionesParams {
  tipo?: TipoFondo | 'todos';
  clave_organica_0?: string;
  clave_organica_1?: string;
}
