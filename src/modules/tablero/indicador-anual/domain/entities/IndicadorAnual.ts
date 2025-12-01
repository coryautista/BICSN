export interface IndicadorAnual {
  id: number;
  idIndicador: number;
  anio: number;
  enero?: number;
  febrero?: number;
  marzo?: number;
  abril?: number;
  mayo?: number;
  junio?: number;
  julio?: number;
  agosto?: number;
  septiembre?: number;
  octubre?: number;
  noviembre?: number;
  diciembre?: number;
  metaAnual?: number;
  observaciones?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface IndicadorAnualWithRelations {
  id: number;
  idIndicador: number;
  anio: number;
  enero?: number;
  febrero?: number;
  marzo?: number;
  abril?: number;
  mayo?: number;
  junio?: number;
  julio?: number;
  agosto?: number;
  septiembre?: number;
  octubre?: number;
  noviembre?: number;
  diciembre?: number;
  metaAnual?: number;
  observaciones?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  indicador: {
    id: number;
    nombre: string;
    descripcion?: string;
    tipoIndicador: string;
    frecuenciaMedicion: string;
    meta?: number;
    sentido?: string;
  };
}

