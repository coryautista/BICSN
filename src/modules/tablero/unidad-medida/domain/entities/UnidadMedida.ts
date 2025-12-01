export type CategoriaUnidadMedida = 'CANTIDAD' | 'PORCENTAJE' | 'MONETARIA' | 'TIEMPO' | 'PESO' | 'VOLUMEN' | 'AREA' | 'DISTANCIA' | 'VELOCIDAD' | 'TEMPERATURA';

export interface UnidadMedida {
  id: number;
  nombre: string;
  simbolo: string;
  descripcion: string;
  categoria: CategoriaUnidadMedida;
  esActiva: boolean;
}

