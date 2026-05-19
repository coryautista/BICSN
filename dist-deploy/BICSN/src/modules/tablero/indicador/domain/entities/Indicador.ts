export interface Indicador {
  id: number;
  idPrograma: number;
  nombre: string;
  descripcion: string;
  tipoIndicador: 'PORCENTAJE' | 'NUMERICO' | 'MONETARIO' | 'BOOLEANO';
  frecuenciaMedicion: 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  meta?: number;
  sentido?: 'ASCENDENTE' | 'DESCENDENTE';
  formula?: string;
  unidadMedida?: string;
  idUnidadMedida?: number;
  idDimension?: number;
  fuenteDatos?: string;
  responsable?: string;
  observaciones?: string;
}

export interface IndicadorWithRelations {
  id: number;
  idPrograma: number;
  nombre: string;
  descripcion: string;
  tipoIndicador: 'PORCENTAJE' | 'NUMERICO' | 'MONETARIO' | 'BOOLEANO';
  frecuenciaMedicion: 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  meta?: number;
  sentido?: 'ASCENDENTE' | 'DESCENDENTE';
  formula?: string;
  unidadMedida?: string;
  fuenteDatos?: string;
  responsable?: string;
  observaciones?: string;
  programa: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  lineaEstrategica: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  eje: {
    id: number;
    nombre: string;
  };
}

