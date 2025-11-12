import { ITipoMovimientoRepository } from '../../domain/repositories/ITipoMovimientoRepository.js';
import { TipoMovimiento, CreateTipoMovimientoData } from '../../domain/entities/TipoMovimiento.js';
import {
  TipoMovimientoAlreadyExistsError,
  TipoMovimientoInvalidIdError,
  TipoMovimientoInvalidAbreviaturaError,
  TipoMovimientoInvalidNombreError
} from '../../domain/errors.js';

export interface CreateTipoMovimientoInput {
  id: number;
  abreviatura?: string;
  nombre: string;
}

export class CreateTipoMovimientoCommand {
  constructor(private tipoMovimientoRepo: ITipoMovimientoRepository) {}

  async execute(input: CreateTipoMovimientoInput, userId?: string): Promise<TipoMovimiento> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] Iniciando creación de tipo de movimiento`, {
      id: input.id,
      nombre: input.nombre,
      abreviatura: input.abreviatura,
      userId: userId || 'anonymous'
    });

    // 1. Validar ID
    this.validateId(input.id);

    // 2. Validar nombre
    this.validateNombre(input.nombre);

    // 3. Validar abreviatura si está presente
    if (input.abreviatura !== undefined) {
      this.validateAbreviatura(input.abreviatura);
    }

    try {
      // 4. Verificar unicidad del ID
      const existing = await this.tipoMovimientoRepo.findById(input.id);
      if (existing) {
        throw new TipoMovimientoAlreadyExistsError(input.id.toString());
      }

      // 5. Preparar datos de creación
      const createData: CreateTipoMovimientoData = {
        id: input.id,
        abreviatura: input.abreviatura ?? null,
        nombre: input.nombre
      };

      // 6. Crear tipo de movimiento
      const tipoMovimiento = await this.tipoMovimientoRepo.create(createData);

      console.log(`[${timestamp}] Tipo de movimiento creado exitosamente`, {
        id: tipoMovimiento.id,
        nombre: tipoMovimiento.nombre,
        abreviatura: tipoMovimiento.abreviatura,
        userId: userId || 'anonymous'
      });

      return tipoMovimiento;

    } catch (error: any) {
      console.error(`[${timestamp}] Error creando tipo de movimiento`, {
        id: input.id,
        nombre: input.nombre,
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

  private validateNombre(nombre: string): void {
    if (!nombre || typeof nombre !== 'string') {
      throw new TipoMovimientoInvalidNombreError(nombre || 'undefined');
    }

    const trimmed = nombre.trim();
    if (trimmed.length === 0 || trimmed.length > 100) {
      throw new TipoMovimientoInvalidNombreError(nombre);
    }
  }

  private validateAbreviatura(abreviatura: string): void {
    if (abreviatura === null) {
      return; // Abreviatura puede ser null
    }

    if (typeof abreviatura !== 'string') {
      throw new TipoMovimientoInvalidAbreviaturaError(String(abreviatura));
    }

    const trimmed = abreviatura.trim();
    if (trimmed.length === 0) {
      return; // Abreviatura vacía es válida (se establece como null)
    }

    if (trimmed.length > 10) {
      throw new TipoMovimientoInvalidAbreviaturaError(abreviatura);
    }
  }
}
