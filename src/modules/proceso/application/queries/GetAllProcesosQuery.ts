import { IProcesoRepository } from '../../domain/repositories/IProcesoRepository.js';
import { Proceso } from '../../domain/entities/Proceso.js';

export interface GetAllProcesosInput {
  // Podríamos agregar filtros opcionales aquí si fuera necesario
  // idModulo?: number;
  // tipo?: string;
  // ordenarPor?: 'nombre' | 'orden' | 'id';
  // orden?: 'asc' | 'desc';
}

export class GetAllProcesosQuery {
  constructor(private procesoRepo: IProcesoRepository) {}

  async execute(input: GetAllProcesosInput = {}, userId: string): Promise<Proceso[]> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Consultando todos los procesos`, {
      filtros: input
    });

    try {
      const procesos = await this.procesoRepo.findAll();

      console.log(`[${timestamp}] [Usuario: ${userId}] Consulta de procesos completada`, {
        totalProcesos: procesos.length
      });

      return procesos;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en consulta de procesos`, {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }
}
