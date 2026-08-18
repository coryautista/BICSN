import type { SnapshotCalculoV2Fuente, SnapshotCalculoV2Estado, SnapshotTotalesA2 } from './SnapshotCalculoV2.js';

export type SnapshotCalculoV2ConsultaFiltro = {
  entidadId: number;
  anio: number;
  quincena: number;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
  fuente: SnapshotCalculoV2Fuente;
  revision?: number;
  incluirDetalles: boolean;
};

export type SnapshotCalculoV2ConsultaDetalle = {
  orden: number;
  empleadoClaveHash: string;
  diasLaborados: string | null;
  diasOrigen: string;
  cairD6: string | null;
  fraD6: string | null;
  freD6: string | null;
  fhD6: string | null;
  fvD6: string | null;
  faaD6: string | null;
  faeD6: string | null;
  fatD6: string | null;
  faiD6: string | null;
};

export type SnapshotCalculoV2ConsultaRaw = {
  snapshot: {
    snapshotId: string;
    entidadId: number;
    anio: number;
    quincena: number;
    periodo: string;
    organica0: string;
    organica1: string;
    organica2: string;
    organica3: string;
    ambiente: string;
    fuente: SnapshotCalculoV2Fuente;
    estado: SnapshotCalculoV2Estado;
    formulaCalculoVersionId: string | null;
    nominaCargaId: string | null;
    precisionPolicy: string;
    versionEsquema: number;
    revision: number;
    hashContenido: string;
    registros: number;
    esCerrado: boolean;
    fechaCreacion: string;
    totalesA2: SnapshotTotalesA2;
    detalles?: SnapshotCalculoV2ConsultaDetalle[];
  };
  revisa: SnapshotTotalesA2 | null;
  historico: Omit<SnapshotTotalesA2, 'FAI'> & { FAI: null };
  linea: { estatus: string; importe: string } | null;
};

export type SnapshotComparacionFondo = {
  snapshot: string;
  revisa: string | null;
  diferenciaRevisa: string | null;
  historico: string | null;
  diferenciaHistorico: string | null;
};

export type SnapshotCalculoV2ConsultaResultado = SnapshotCalculoV2ConsultaRaw & {
  comparacion: Record<keyof SnapshotTotalesA2, SnapshotComparacionFondo>;
};
