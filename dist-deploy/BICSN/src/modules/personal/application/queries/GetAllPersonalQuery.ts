import { IPersonalRepository } from '../../domain/repositories/IPersonalRepository.js';
import { Personal } from '../../domain/entities/Personal.js';

export class GetAllPersonalQuery {
  constructor(private personalRepo: IPersonalRepository) {}

  async execute(claveOrganica0?: string, claveOrganica1?: string, userId?: string): Promise<Personal[]> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId || 'N/A'}] Consultando todos los registros personales`, {
      claveOrganica0: claveOrganica0 || null,
      claveOrganica1: claveOrganica1 || null
    });

    try {
      // Validar parámetros opcionales si se proporcionan
      if (claveOrganica0 !== undefined && claveOrganica0 !== null) {
        if (typeof claveOrganica0 !== 'string' || claveOrganica0.length < 1 || claveOrganica0.length > 2) {
          console.warn(`[${timestamp}] [Usuario: ${userId || 'N/A'}] Parámetro claveOrganica0 inválido: ${claveOrganica0}`);
        }
      }

      if (claveOrganica1 !== undefined && claveOrganica1 !== null) {
        if (typeof claveOrganica1 !== 'string' || claveOrganica1.length < 1 || claveOrganica1.length > 2) {
          console.warn(`[${timestamp}] [Usuario: ${userId || 'N/A'}] Parámetro claveOrganica1 inválido: ${claveOrganica1}`);
        }
      }

      const result = await this.personalRepo.findAll(claveOrganica0, claveOrganica1);

      console.log(`[${timestamp}] [Usuario: ${userId || 'N/A'}] Consulta de registros personales completada`, {
        totalRegistros: result.length,
        claveOrganica0: claveOrganica0 || null,
        claveOrganica1: claveOrganica1 || null
      });

      return result;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId || 'N/A'}] Error en consulta de registros personales`, {
        claveOrganica0: claveOrganica0 || null,
        claveOrganica1: claveOrganica1 || null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }
}
