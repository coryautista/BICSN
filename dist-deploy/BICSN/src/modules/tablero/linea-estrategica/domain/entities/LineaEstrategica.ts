export interface LineaEstrategica {
  id: number;
  idEje: number;
  nombre: string;
  descripcion: string;
  eje?: {
    id: number;
    nombre: string;
  };
}

export interface LineaEstrategicaWithProgramas extends LineaEstrategica {
  programas: Array<{
    id: number;
    nombre: string;
    descripcion: string;
  }>;
}

