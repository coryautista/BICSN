import { IModuloRepository } from '../../domain/repositories/IModuloRepository.js';
import { Modulo } from '../../domain/entities/Modulo.js';
import { ModuloError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getAllModulosQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAllModulosQuery {
  constructor(private moduloRepo: IModuloRepository) {}

  async execute(userId?: string): Promise<Modulo[]> {
    try {
      logger.info({
        operation: 'getAllModulos',
        userId,
        timestamp: new Date().toISOString()
      }, 'Consultando todos los módulos');

      const modulos = await this.moduloRepo.findAll();

      logger.info({
        operation: 'getAllModulos',
        moduloCount: modulos.length,
        userId,
        timestamp: new Date().toISOString()
      }, 'Módulos obtenidos exitosamente');

      return modulos;
    } catch (error) {
      logger.error({
        operation: 'getAllModulos',
        error: (error as Error).message,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar módulos');

      throw new ModuloError('Error interno al consultar módulos', 'MODULO_QUERY_ERROR', 500);
    }
  }
}
