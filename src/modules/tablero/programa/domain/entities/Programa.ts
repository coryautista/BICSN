export interface Programa {
  id: number;
  idEje: number;
  idLineaEstrategica: number;
  nombre: string;
  descripcion: string;
  eje?: {
    id: number;
    nombre: string;
  };
  lineaEstrategica?: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
}

