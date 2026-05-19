export interface Eje {
  id: number;
  nombre: string;
}

export interface EjeWithLineas {
  id: number;
  nombre: string;
  lineasEstrategicas: Array<{
    id: number;
    nombre: string;
    descripcion: string | null;
  }>;
}

