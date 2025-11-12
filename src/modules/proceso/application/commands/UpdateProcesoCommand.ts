import { IProcesoRepository } from '../../domain/repositories/IProcesoRepository.js';
import { Proceso, UpdateProcesoData } from '../../domain/entities/Proceso.js';
import {
  ProcesoNotFoundError,
  ProcesoInvalidIdError,
  ProcesoInvalidNombreError,
  ProcesoInvalidComponenteError,
  ProcesoInvalidIdModuloError,
  ProcesoInvalidOrdenError,
  ProcesoInvalidTipoError
} from '../../domain/errors.js';

export interface UpdateProcesoInput {
  id: number;
  nombre?: string;
  componente?: string;
  idModulo?: number;
  orden?: number;
  tipo?: string;
}

export class UpdateProcesoCommand {
  constructor(private procesoRepo: IProcesoRepository) {}

  async execute(input: UpdateProcesoInput, userId: string, tx?: any): Promise<Proceso> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando actualización de proceso`, {
      procesoId: input.id,
      camposActualizar: Object.keys(input).filter(key => key !== 'id' && input[key as keyof UpdateProcesoInput] !== undefined)
    });

    try {
      // Validar ID del proceso
      if (!input.id || typeof input.id !== 'number' || input.id <= 0 || !Number.isInteger(input.id)) {
        throw new ProcesoInvalidIdError(input.id);
      }

      // Verificar que el proceso existe
      const existing = await this.procesoRepo.findById(input.id);
      if (!existing) {
        throw new ProcesoNotFoundError(input.id);
      }

      // Validar datos de entrada si se proporcionan
      await this.validateUpdateInput(input);

      // Verificar si hay al menos un campo para actualizar
      const hasFieldsToUpdate = input.nombre !== undefined ||
                               input.componente !== undefined ||
                               input.idModulo !== undefined ||
                               input.orden !== undefined ||
                               input.tipo !== undefined;

      if (!hasFieldsToUpdate) {
        console.log(`[${timestamp}] [Usuario: ${userId}] No hay campos para actualizar en proceso ${input.id}`);
        return existing;
      }

      const updateData: UpdateProcesoData = {
        nombre: input.nombre,
        componente: input.componente,
        idModulo: input.idModulo,
        orden: input.orden,
        tipo: input.tipo
      };

      const updated = await this.procesoRepo.update(input.id, updateData, tx);
      if (!updated) {
        throw new Error('Error interno al actualizar proceso');
      }

      console.log(`[${timestamp}] [Usuario: ${userId}] Proceso actualizado exitosamente`, {
        procesoId: updated.id,
        nombre: updated.nombre,
        cambiosAplicados: Object.keys(updateData).filter(key => updateData[key as keyof UpdateProcesoData] !== undefined)
      });

      return updated;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en actualización de proceso`, {
        procesoId: input.id,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  private async validateUpdateInput(input: UpdateProcesoInput): Promise<void> {
    // Validar nombre si se proporciona
    if (input.nombre !== undefined) {
      if (typeof input.nombre !== 'string' || input.nombre.trim().length < 2 || input.nombre.length > 100) {
        throw new ProcesoInvalidNombreError(input.nombre);
      }
    }

    // Validar componente si se proporciona
    if (input.componente !== undefined) {
      if (typeof input.componente !== 'string' || input.componente.trim().length === 0 || input.componente.length > 100) {
        throw new ProcesoInvalidComponenteError(input.componente);
      }
    }

    // Validar idModulo si se proporciona
    if (input.idModulo !== undefined) {
      if (typeof input.idModulo !== 'number' || input.idModulo <= 0 || !Number.isInteger(input.idModulo)) {
        throw new ProcesoInvalidIdModuloError(input.idModulo);
      }
    }

    // Validar orden si se proporciona
    if (input.orden !== undefined) {
      if (typeof input.orden !== 'number' || input.orden < 0 || !Number.isInteger(input.orden)) {
        throw new ProcesoInvalidOrdenError(input.orden);
      }
    }

    // Validar tipo si se proporciona
    if (input.tipo !== undefined) {
      if (typeof input.tipo !== 'string' || input.tipo.trim().length === 0) {
        throw new ProcesoInvalidTipoError(input.tipo);
      }
    }
  }
}
