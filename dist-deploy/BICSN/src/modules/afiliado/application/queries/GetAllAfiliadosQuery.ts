import { IAfiliadoRepository } from '../../domain/repositories/IAfiliadoRepository.js';
import { Afiliado } from '../../domain/entities/Afiliado.js';
import pino from 'pino';
import { AfiliadoQueryError } from '../../domain/errors.js';

const logger = pino({
  name: 'getAllAfiliadosQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAllAfiliadosQuery {
  constructor(private afiliadoRepo: IAfiliadoRepository) {}

  async execute(): Promise<Afiliado[]> {
    const logContext = {
      operation: 'getAllAfiliados'
    };

    logger.info(logContext, 'Consultando todos los afiliados');

    try {
      const afiliados = await this.afiliadoRepo.findAll();
      logger.info({
        ...logContext,
        count: afiliados.length
      }, 'Consulta de todos los afiliados completada exitosamente');
      return afiliados;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al consultar todos los afiliados');

      throw new AfiliadoQueryError('Error al consultar todos los afiliados', {
        originalError: errorMessage
      });
    }
  }
}
