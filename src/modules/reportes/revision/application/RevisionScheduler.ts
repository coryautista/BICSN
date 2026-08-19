import pino from 'pino';
import { RevisionRepository } from '../infrastructure/persistence/RevisionRepository.js';

const logger = pino({ name: 'revisionScheduler', level: process.env.LOG_LEVEL || 'info' });

export interface ProgramarRevisionParams {
  org0: string;
  org1: string;
  periodo: string;
  usuarioId?: string;
  liquidacionSnapshotId?: string;
}

export class RevisionScheduler {
  constructor(private revisionRepo: RevisionRepository) {}

  async programar(params: ProgramarRevisionParams): Promise<number> {
    if (!params.usuarioId) {
      throw new Error('REVISION_USUARIO_ID_REQUERIDO');
    }

    const liquidacionSnapshotId = params.liquidacionSnapshotId
      ?? await this.revisionRepo.resolverSnapshotOficialParaTarea({
        org0: params.org0,
        org1: params.org1,
        org2: '01',
        org3: '01',
        periodo: params.periodo
      });
    const idRevisionTarea = await this.revisionRepo.encolar({
      org0: params.org0,
      org1: params.org1,
      org2: '01',
      org3: '01',
      periodo: params.periodo,
      usuarioId: params.usuarioId,
      liquidacionSnapshotId
    });
    logger.info({ idRevisionTarea, liquidacionSnapshotId, ...params }, 'Tarea REVISA programada');
    return idRevisionTarea;
  }
}
