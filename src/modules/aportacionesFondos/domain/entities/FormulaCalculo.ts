export const FORMULA_CALCULO_CLAVE = 'APORTACIONES-NOMINA';
export const FORMULA_PRECISION_POLICY_LEGACY = 'MXN-DETAIL6-AGG2-TRUNC-v1';
export const FORMULA_PRECISION_POLICY = 'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3';

export const FORMULA_PARAMETRO_CLAVES = [
  'DIAS_MES',
  'DIAS_DEFAULT_SIN_TXT',
  'DIAS_MIN',
  'DIAS_MAX',
  'CAIR_SUELDO',
  'FRA_SUELDO',
  'FRA_OTRAS',
  'FRA_QUINQUENIOS',
  'FRE_SUELDO',
  'FRE_OTRAS',
  'FRE_QUINQUENIOS',
  'FH_SUELDO',
  'FV_SUELDO',
  'FAA_SUELDO',
  'FAE_SUELDO'
] as const;

export type FormulaParametroClave = typeof FORMULA_PARAMETRO_CLAVES[number];
export type FormulaParametroUnidad = 'TASA' | 'DIAS' | 'DIVISOR';
export type FormulaCalculoParametros = Record<FormulaParametroClave, string>;

export interface FormulaCalculoParametro {
  clave: FormulaParametroClave;
  valor: string;
  unidad: FormulaParametroUnidad;
  fuente: string;
  observaciones: string | null;
}

export interface FormulaCalculo {
  formulaCalculoVersionId: string;
  claveFormula: string;
  anioVigencia: number;
  numeroVersion: number;
  quincenaDesde: number;
  quincenaHasta: number;
  precisionPolicy: string;
  estado: 'ACTIVA';
  parametros: FormulaCalculoParametros;
  detalleParametros: FormulaCalculoParametro[];
}
