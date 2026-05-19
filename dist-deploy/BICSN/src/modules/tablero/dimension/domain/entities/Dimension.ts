export type TipoDimension = 'GEOGRAFICA' | 'TEMPORAL' | 'DEMOGRAFICA' | 'ECONOMICA' | 'SOCIAL' | 'AMBIENTAL' | 'INSTITUCIONAL';

export interface Dimension {
  id: number;
  nombre: string;
  descripcion: string;
  tipoDimension: TipoDimension;
  esActiva: boolean;
}

