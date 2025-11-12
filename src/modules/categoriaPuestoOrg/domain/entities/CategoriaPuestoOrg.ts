export interface CategoriaPuestoOrg {
  categoriaPuestoOrgId: number;
  nivel: number;
  org0: string;
  org1: string;
  org2: string | null;
  org3: string | null;
  categoria: string;
  nombreCategoria: string;
  ingresoBrutoMensual: number;
  vigenciaInicio: string;
  vigenciaFin: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface CreateCategoriaPuestoOrgData {
  nivel: number;
  org0: string;
  org1: string;
  org2?: string;
  org3?: string;
  categoria: string;
  nombreCategoria: string;
  ingresoBrutoMensual: number;
  vigenciaInicio: string;
  vigenciaFin?: string;
  userId?: string;
}

export interface UpdateCategoriaPuestoOrgData {
  categoriaPuestoOrgId: number;
  nombreCategoria?: string;
  ingresoBrutoMensual?: number;
  vigenciaFin?: string;
  userId?: string;
}

export interface DeleteCategoriaPuestoOrgData {
  categoriaPuestoOrgId: number;
}

export interface ListCategoriaPuestoOrgFilters {
  nivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
  vigenciaInicio?: string;
  categoria?: string;
}
