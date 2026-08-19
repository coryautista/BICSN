export type SnapshotCalculoV2Fuente = 'LIQUIDACION_V2' | 'HISTORICO_SQL';
export type SnapshotCalculoV2Estado = 'COMPLETO' | 'AGREGADO_LEGADO' | 'INCOMPLETO';
export type SnapshotDiasOrigen = 'nomina' | 'movimiento' | 'nomina_sin_coincidencia' | 'default' | 'historico_legacy_sin_dias';

export type SnapshotTotalesA2 = {
  CAIR: string;
  CAIR_FONDO: string;
  FRA: string;
  FRE: string;
  PRESTACIONES: string;
  FH: string;
  FV: string;
  VIVIENDA: string;
  FAA: string;
  FAE: string;
  FAT: string;
  FAI: string;
};

export type SnapshotCalculoV2Detalle = {
  orden: number;
  empleadoClaveHash: string;
  diasLaborados: string | null;
  diasOrigen: SnapshotDiasOrigen;
  sueldoMensualD6: string | null;
  otrasPrestacionesMensualesD6: string | null;
  quinqueniosMensualD6: string | null;
  baseCotizacionQuinqueniosD6: string | null;
  cairD6: string | null;
  cairFondoD6: string | null;
  fraD6: string | null;
  freD6: string | null;
  prestacionesD6: string | null;
  fhD6: string | null;
  fvD6: string | null;
  viviendaD6: string | null;
  faaD6: string | null;
  faeD6: string | null;
  fatD6: string | null;
  faiD6: string | null;
};

export type SnapshotCalculoV2Input = {
  entidadId: number;
  anio: number;
  quincena: number;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
  ambiente: 'DESARROLLO' | 'CALIDAD' | 'PRODUCCION';
  fuente: SnapshotCalculoV2Fuente;
  estado: SnapshotCalculoV2Estado;
  formulaCalculoVersionId: string | null;
  nominaCargaId: string | null;
  precisionPolicy: string;
  versionEsquema: number;
  usuarioId: string | null;
  totalesA2: SnapshotTotalesA2;
  detalles: SnapshotCalculoV2Detalle[];
};

export type SnapshotCalculoV2Resultado = {
  snapshotId: string;
  revision: number;
  hashContenido: string;
  idempotente: boolean;
  registros: number;
};
