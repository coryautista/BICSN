import { ITipoMovimientoRepository } from '../../domain/repositories/ITipoMovimientoRepository.js';
import { TipoMovimiento } from '../../domain/entities/TipoMovimiento.js';

export class GetAllTipoMovimientosQuery {
  constructor(private tipoMovimientoRepo: ITipoMovimientoRepository) {}

  async execute(userId?: string): Promise<TipoMovimiento[]> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] Consultando todos los tipos de movimiento`, {
      userId: userId || 'anonymous'
    });

    try {
      const tiposMovimiento = await this.tipoMovimientoRepo.findAll();

      console.log(`[${timestamp}] Consulta de tipos de movimiento completada`, {
        totalTiposMovimiento: tiposMovimiento.length,
        userId: userId || 'anonymous'
      });

      return tiposMovimiento;

    } catch (error: any) {
      console.error(`[${timestamp}] Error consultando tipos de movimiento`, {
        error: error.message,
        userId: userId || 'anonymous'
      });
      throw error;
    }
  }
}
