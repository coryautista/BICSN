import {
  aplicarBDIsspeaIndividual,
  AplicarBDIsspeaIndividualParams,
  AplicarBDIsspeaIndividualResult
} from '../../infrastructure/services/AfiliadoBdiSspeaIndividualService.js';
import pino from 'pino';

const logger = pino({
  name: 'aplicarBDIsspeaIndividualCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class AplicarBDIsspeaIndividualCommand {
  async execute(data: AplicarBDIsspeaIndividualParams): Promise<AplicarBDIsspeaIndividualResult> {
    logger.info({
      operation: 'aplicarBDIsspeaIndividual',
      afiliadoId: data.afiliadoId,
      org0: data.org0,
      org1: data.org1,
      usuarioId: data.usuarioId
    }, 'Iniciando aplicacion individual a BDIsspea');

    return aplicarBDIsspeaIndividual(data);
  }
}
