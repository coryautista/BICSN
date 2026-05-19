import { ITipoMovimientoRepository } from '../../domain/repositories/ITipoMovimientoRepository.js';
import { TipoMovimiento } from '../../domain/entities/TipoMovimiento.js';
import {
  TipoMovimientoNotFoundError,
  TipoMovimientoInvalidIdError
} from '../../domain/errors.js';

export interface GetTipoMovimientoByIdInput {
  id: number;
}

export class GetTipoMovimientoByIdQuery {
  constructor(private tipoMovimientoRepo: ITipoMovimientoRepository) {}

  async execute(input: GetTipoMovimientoByIdInput, userId?: string): Promise<TipoMovimiento> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] Consultando tipo de movimiento por ID`, {
      id: input.id,
      userId: userId || 'anonymous'
    });

    // 1. Validar ID
    this.validateId(input.id);

    try {
      const tipoMovimiento = await this.tipoMovimientoRepo.findById(input.id);

      if (!tipoMovimiento) {
        throw new TipoMovimientoNotFoundError(input.id.toString());
      }

      console.log(`[${timestamp}] Tipo de movimiento encontrado por ID`, {
        id: input.id,
        nombre: tipoMovimiento.nombre,
        abreviatura: tipoMovimiento.abreviatura,
        userId: userId || 'anonymous'
      });

      return tipoMovimiento;

    } catch (error: any) {
      console.error(`[${timestamp}] Error consultando tipo de movimiento por ID`, {
        id: input.id,
        error: error.message,
        userId: userId || 'anonymous'
      });
      throw error;
    }
  }

  private validateId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new TipoMovimientoInvalidIdError(id.toString());
    }
  }
}
