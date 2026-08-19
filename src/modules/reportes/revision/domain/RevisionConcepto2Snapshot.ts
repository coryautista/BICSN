import type {
  ImportesRevisionSnapshot,
  RevisionSnapshotMetadata,
  RevisionTarea
} from './Revision.types.js';

export interface RevisionQnaSnapshotRecord extends RevisionSnapshotMetadata {
  estado: string;
  esOficial: boolean;
  ultimaDecision: string | null;
  fuentes: number;
  fuentesCompletas: number;
  anio: number;
  quincena: number;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
  registros: number;
  cairA2: string;
  fraA2: string;
  freA2: string;
  prestacionesA2: string;
  fhA2: string;
  fvA2: string;
  viviendaA2: string;
  faaA2: string;
  faeA2: string;
  fatA2: string;
  faiA2: string;
}

export interface RevisionConcepto2SnapshotResultado {
  importes: ImportesRevisionSnapshot;
  registros: number;
  liquidacionSnapshot: RevisionSnapshotMetadata;
}

const A2_PATTERN = /^-?\d+\.\d{2}$/;

export function resolverConcepto2Snapshot(
  tarea: RevisionTarea,
  snapshot: RevisionQnaSnapshotRecord | null
): RevisionConcepto2SnapshotResultado {
  if (!snapshot) {
    throw new Error(`REVISION_QNA_SNAPSHOT_NO_ENCONTRADO: ${tarea.liquidacionSnapshotId}`);
  }
  if (!snapshot.esOficial) {
    throw new Error(`REVISION_QNA_SNAPSHOT_NO_OFICIAL: ${snapshot.liquidacionSnapshotId}`);
  }
  if (snapshot.ultimaDecision !== 'APROBADO') {
    throw new Error(`REVISION_QNA_SNAPSHOT_NO_OFICIAL: ${snapshot.liquidacionSnapshotId}`);
  }
  if (snapshot.estado !== 'COMPLETO' || snapshot.fuentes !== 10 || snapshot.fuentesCompletas !== 10) {
    throw new Error(`REVISION_QNA_SNAPSHOT_NO_COMPLETO: ${snapshot.liquidacionSnapshotId}`);
  }

  const quincena = tarea.periodo.slice(0, 2);
  const anio = `20${tarea.periodo.slice(2, 4)}`;
  const mismoAlcance = String(snapshot.quincena).padStart(2, '0') === quincena
    && String(snapshot.anio) === anio
    && snapshot.organica0 === tarea.org0
    && snapshot.organica1 === tarea.org1
    && snapshot.organica2 === tarea.org2
    && snapshot.organica3 === tarea.org3;
  if (!mismoAlcance) {
    throw new Error(`REVISION_QNA_SNAPSHOT_SCOPE_MISMATCH: ${snapshot.liquidacionSnapshotId}`);
  }

  const importes: ImportesRevisionSnapshot = {
    CAIR: snapshot.cairA2,
    FRA: snapshot.fraA2,
    FRE: snapshot.freA2,
    PRESTACIONES: snapshot.prestacionesA2,
    FH: snapshot.fhA2,
    FV: snapshot.fvA2,
    VIVIENDA: snapshot.viviendaA2,
    FAA: snapshot.faaA2,
    FAE: snapshot.faeA2,
    FAT: snapshot.fatA2,
    FAI: snapshot.faiA2
  };
  if (Object.values(importes).some((importe) => !A2_PATTERN.test(importe))) {
    throw new Error(`REVISION_QNA_SNAPSHOT_A2_INVALIDO: ${snapshot.liquidacionSnapshotId}`);
  }

  return {
    importes,
    registros: snapshot.registros,
    liquidacionSnapshot: {
      liquidacionSnapshotId: snapshot.liquidacionSnapshotId,
      hashContenido: snapshot.hashContenido,
      revision: snapshot.revision,
      precisionPolicy: snapshot.precisionPolicy
    }
  };
}
