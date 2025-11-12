import { IMovimientoRepository } from '../../domain/repositories/IMovimientoRepository.js';
import { Movimiento } from '../../domain/entities/Movimiento.js';
import { MovimientoError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getAllMovimientosQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAllMovimientosQuery {
  constructor(private movimientoRepo: IMovimientoRepository) {}

  async execute(userId?: string): Promise<Movimiento[]> {
    try {
      logger.info({
        operation: 'getAllMovimientos',
        userId,
        timestamp: new Date().toISOString()
      }, 'Consultando todos los movimientos');

      const movimientos = await this.movimientoRepo.findAll();

      logger.info({
        operation: 'getAllMovimientos',
        count: movimientos.length,
        userId,
        timestamp: new Date().toISOString()
      }, 'Consulta de movimientos completada exitosamente');

      return movimientos;
    } catch (error) {
      logger.error({
        operation: 'getAllMovimientos',
        error: (error as Error).message,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar movimientos');

      throw new MovimientoError('Error interno al consultar movimientos', 'MOVIMIENTO_QUERY_ERROR', 500);
    }
  }
}
