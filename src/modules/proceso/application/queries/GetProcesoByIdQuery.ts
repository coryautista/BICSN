import { IProcesoRepository } from '../../domain/repositories/IProcesoRepository.js';
import { Proceso } from '../../domain/entities/Proceso.js';
import {
  ProcesoNotFoundError,
  ProcesoInvalidIdError
} from '../../domain/errors.js';

export interface GetProcesoByIdInput {
  id: number;
}

export class GetProcesoByIdQuery {
  constructor(private procesoRepo: IProcesoRepository) {}

  async execute(input: GetProcesoByIdInput, userId: string): Promise<Proceso> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Consultando proceso por ID`, {
      procesoId: input.id
    });

    try {
      // Validar ID del proceso
      if (!input.id || typeof input.id !== 'number' || input.id <= 0 || !Number.isInteger(input.id)) {
        throw new ProcesoInvalidIdError(input.id);
      }

      const proceso = await this.procesoRepo.findById(input.id);
      if (!proceso) {
        throw new ProcesoNotFoundError(input.id);
      }

      console.log(`[${timestamp}] [Usuario: ${userId}] Proceso encontrado`, {
        procesoId: proceso.id,
        nombre: proceso.nombre
      });

      return proceso;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en consulta de proceso por ID`, {
        procesoId: input.id,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }
}
