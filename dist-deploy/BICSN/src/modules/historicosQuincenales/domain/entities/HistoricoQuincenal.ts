export type HistoricoGrupo = 'aportaciones' | 'retenciones';

export interface HistoricoTipoConfig {
  grupo: HistoricoGrupo;
  tipo: string;
  schema: 'aportaciones' | 'retenciones';
  table: string;
  searchableColumns: string[];
}

export interface HistoricoQuincenalFilters {
  grupo: HistoricoGrupo;
  tipo: string;
  org0: string;
  org1: string;
  periodo: string;
  quincena: number;
  anio: number;
  page: number;
  pageSize: number;
  buscar?: string;
}

export interface HistoricoQuincenalResult {
  data: Record<string, unknown>[];
  meta: {
    grupo: HistoricoGrupo;
    tipo: string;
    tabla: string;
    org0: string;
    org1: string;
    periodo: string;
    quincena: number;
    anio: number;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
