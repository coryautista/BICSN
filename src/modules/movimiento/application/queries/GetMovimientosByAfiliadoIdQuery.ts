import { IMovimientoRepository } from '../../domain/repositories/IMovimientoRepository.js';
import { Movimiento } from '../../domain/entities/Movimiento.js';
import { MovimientoInvalidTipoMovimientoError, MovimientoError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getMovimientosByAfiliadoIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetMovimientosByAfiliadoIdQuery {
  constructor(private movimientoRepo: IMovimientoRepository) {}

  async execute(afiliadoId: number, userId?: string): Promise<Movimiento[]> {
    try {
      logger.info({
        operation: 'getMovimientosByAfiliadoId',
        afiliadoId,
        userId,
        timestamp: new Date().toISOString()
      }, 'Consultando movimientos por afiliado ID');

      // Validar afiliadoId
      this.validateAfiliadoId(afiliadoId);

      const movimientos = await this.movimientoRepo.findByAfiliadoId(afiliadoId);

      logger.info({
        operation: 'getMovimientosByAfiliadoId',
        afiliadoId,
        count: movimientos.length,
        userId,
        timestamp: new Date().toISOString()
      }, 'Consulta de movimientos por afiliado completada exitosamente');

      return movimientos;
    } catch (error) {
      if (error instanceof MovimientoInvalidTipoMovimientoError) {
        throw error;
      }

      logger.error({
        operation: 'getMovimientosByAfiliadoId',
        error: (error as Error).message,
        afiliadoId,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar movimientos por afiliado ID');

      throw new MovimientoError('Error interno al consultar movimientos', 'MOVIMIENTO_QUERY_ERROR', 500);
    }
  }

  private validateAfiliadoId(afiliadoId: number): void {
    if (!Number.isInteger(afiliadoId) || afiliadoId <= 0) {
      throw new MovimientoInvalidTipoMovimientoError('el ID del afiliado debe ser un número entero positivo');
    }
  }
}
