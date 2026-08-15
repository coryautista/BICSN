import pino from 'pino';
import { RevisionRepository } from '../infrastructure/persistence/RevisionRepository.js';

const logger = pino({ name: 'revisionScheduler', level: process.env.LOG_LEVEL || 'info' });

export interface ProgramarRevisionParams {
  org0: string;
  org1: string;
  periodo: string;
  usuarioId?: string;
}

export class RevisionScheduler {
  constructor(private revisionRepo: RevisionRepository) {}

  async programar(params: ProgramarRevisionParams): Promise<number> {
    if (!params.usuarioId) {
      throw new Error('REVISION_USUARIO_ID_REQUERIDO');
    }

    const idRevisionTarea = await this.revisionRepo.encolar({
      org0: params.org0,
      org1: params.org1,
      org2: '01',
      org3: '01',
      periodo: params.periodo,
      usuarioId: params.usuarioId
    });
    logger.info({ idRevisionTarea, ...params }, 'Tarea REVISA programada');
    return idRevisionTarea;
  }
}
