import { ITipoMovimientoRepository } from '../../domain/repositories/ITipoMovimientoRepository.js';
import { TipoMovimiento, UpdateTipoMovimientoData } from '../../domain/entities/TipoMovimiento.js';
import {
  TipoMovimientoNotFoundError,
  TipoMovimientoInvalidIdError,
  TipoMovimientoInvalidAbreviaturaError,
  TipoMovimientoInvalidNombreError
} from '../../domain/errors.js';

export interface UpdateTipoMovimientoInput {
  id: number;
  abreviatura?: string;
  nombre?: string;
}

export class UpdateTipoMovimientoCommand {
  constructor(private tipoMovimientoRepo: ITipoMovimientoRepository) {}

  async execute(input: UpdateTipoMovimientoInput, userId?: string): Promise<TipoMovimiento> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] Iniciando actualización de tipo de movimiento`, {
      id: input.id,
      hasNombre: !!input.nombre,
      hasAbreviatura: !!input.abreviatura,
      userId: userId || 'anonymous'
    });

    // 1. Validar ID
    this.validateId(input.id);

    // 2. Validar nombre si está presente
    if (input.nombre !== undefined) {
      this.validateNombre(input.nombre);
    }

    // 3. Validar abreviatura si está presente
    if (input.abreviatura !== undefined) {
      this.validateAbreviatura(input.abreviatura);
    }

    try {
      // 4. Verificar que el tipo de movimiento existe
      const existing = await this.tipoMovimientoRepo.findById(input.id);
      if (!existing) {
        throw new TipoMovimientoNotFoundError(input.id.toString());
      }

      // 5. Preparar datos de actualización
      const updateData: UpdateTipoMovimientoData = {
        id: input.id,
        abreviatura: input.abreviatura,
        nombre: input.nombre
      };

      // 6. Actualizar tipo de movimiento
      const updated = await this.tipoMovimientoRepo.update(input.id, updateData);
      if (!updated) {
        throw new TipoMovimientoNotFoundError(input.id.toString());
      }

      console.log(`[${timestamp}] Tipo de movimiento actualizado exitosamente`, {
        id: input.id,
        nombre: updated.nombre,
        abreviatura: updated.abreviatura,
        userId: userId || 'anonymous'
      });

      return updated;

    } catch (error: any) {
      console.error(`[${timestamp}] Error actualizando tipo de movimiento`, {
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

  private validateNombre(nombre: string | null): void {
    if (nombre === null) {
      return; // Nombre puede ser null (opcional en actualización)
    }

    if (typeof nombre !== 'string') {
      throw new TipoMovimientoInvalidNombreError(String(nombre));
    }

    const trimmed = nombre.trim();
    if (trimmed.length === 0) {
      return; // Nombre vacío es válido (no se actualiza)
    }

    if (trimmed.length > 100) {
      throw new TipoMovimientoInvalidNombreError(nombre);
    }
  }

  private validateAbreviatura(abreviatura: string | null): void {
    if (abreviatura === null) {
      return; // Abreviatura puede ser null
    }

    if (typeof abreviatura !== 'string') {
      throw new TipoMovimientoInvalidAbreviaturaError(String(abreviatura));
    }

    const trimmed = abreviatura.trim();
    if (trimmed.length === 0) {
      return; // Abreviatura vacía es válida (no se actualiza)
    }

    if (trimmed.length > 10) {
      throw new TipoMovimientoInvalidAbreviaturaError(abreviatura);
    }
  }
}
