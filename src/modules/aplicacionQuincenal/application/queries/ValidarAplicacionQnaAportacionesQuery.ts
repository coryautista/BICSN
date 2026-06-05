import {
  IAplicacionQuincenalRepository,
  ValidarAplicacionQnaAportacionesResult
} from '../../domain/repositories/IAplicacionQuincenalRepository.js';
import pino from 'pino';

const logger = pino({
  name: 'ValidarAplicacionQnaAportacionesQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class ValidarAplicacionQnaAportacionesQuery {
  constructor(private aplicacionQuincenalRepo: IAplicacionQuincenalRepository) {}

  async execute(organica0: string, organica1: string, periodo: string, userId?: string): Promise<ValidarAplicacionQnaAportacionesResult> {
    logger.info({
      operation: 'VALIDAR_APLICACION_QNA_APORTACIONES',
      userId: userId || 'SYSTEM',
      organica0,
      organica1,
      periodo,
      timestamp: new Date().toISOString()
    }, 'VALIDAR_APLICACION_QNA_APORTACIONES_QUERY');

    const result = await this.aplicacionQuincenalRepo.validarAplicacionQnaAportaciones(organica0, organica1, periodo);

    logger.info({
      operation: 'VALIDAR_APLICACION_QNA_APORTACIONES',
      userId: userId || 'SYSTEM',
      organica0,
      organica1,
      periodo,
      aplicada: result.aplicada,
      timestamp: new Date().toISOString()
    }, 'VALIDAR_APLICACION_QNA_APORTACIONES_QUERY_SUCCESS');

    return result;
  }
}
