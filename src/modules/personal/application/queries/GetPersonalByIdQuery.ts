import { IPersonalRepository } from '../../domain/repositories/IPersonalRepository.js';
import { Personal } from '../../domain/entities/Personal.js';
import {
  PersonalNotFoundError,
  PersonalInvalidInternoError
} from '../../domain/errors.js';

export class GetPersonalByIdQuery {
  constructor(private personalRepo: IPersonalRepository) {}

  async execute(interno: number, userId?: string): Promise<Personal> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId || 'N/A'}] Consultando registro personal por ID`, {
      interno
    });

    try {
      // Validar interno
      if (!interno || typeof interno !== 'number' || interno <= 0 || !Number.isInteger(interno)) {
        throw new PersonalInvalidInternoError(interno);
      }

      const personal = await this.personalRepo.findById(interno);
      if (!personal) {
        throw new PersonalNotFoundError(interno);
      }

      console.log(`[${timestamp}] [Usuario: ${userId || 'N/A'}] Registro personal encontrado`, {
        interno: personal.interno,
        nombre: personal.nombre,
        curp: personal.curp
      });

      return personal;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId || 'N/A'}] Error en consulta de registro personal por ID`, {
        interno,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }
}
