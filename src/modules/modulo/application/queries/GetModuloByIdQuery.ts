import { IModuloRepository } from '../../domain/repositories/IModuloRepository.js';
import { Modulo } from '../../domain/entities/Modulo.js';
import { ModuloNotFoundError, ModuloInvalidNameError, ModuloError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getModuloByIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetModuloByIdQuery {
  constructor(private moduloRepo: IModuloRepository) {}

  async execute(id: number, userId?: string): Promise<Modulo> {
    try {
      logger.info({
        operation: 'getModuloById',
        moduloId: id,
        userId,
        timestamp: new Date().toISOString()
      }, 'Consultando módulo por ID');

      // Validar entrada
      this.validateInput(id);

      const modulo = await this.moduloRepo.findById(id);
      if (!modulo) {
        throw new ModuloNotFoundError(id);
      }

      logger.info({
        operation: 'getModuloById',
        moduloId: modulo.id,
        nombre: modulo.nombre,
        userId,
        timestamp: new Date().toISOString()
      }, 'Módulo encontrado exitosamente');

      return modulo;
    } catch (error) {
      if (error instanceof ModuloNotFoundError) {
        throw error;
      }

      logger.error({
        operation: 'getModuloById',
        error: (error as Error).message,
        moduloId: id,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar módulo por ID');

      throw new ModuloError('Error interno al consultar módulo', 'MODULO_QUERY_ERROR', 500);
    }
  }

  private validateInput(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ModuloInvalidNameError('el ID debe ser un número entero positivo');
    }
  }
}
