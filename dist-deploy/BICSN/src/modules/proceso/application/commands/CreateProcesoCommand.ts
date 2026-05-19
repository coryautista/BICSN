import { IProcesoRepository } from '../../domain/repositories/IProcesoRepository.js';
import { Proceso, CreateProcesoData } from '../../domain/entities/Proceso.js';
import {
  ProcesoInvalidNombreError,
  ProcesoInvalidComponenteError,
  ProcesoInvalidIdModuloError,
  ProcesoInvalidOrdenError,
  ProcesoInvalidTipoError
} from '../../domain/errors.js';

export interface CreateProcesoInput {
  nombre: string;
  componente: string;
  idModulo: number;
  orden: number;
  tipo: string;
}

export class CreateProcesoCommand {
  constructor(private procesoRepo: IProcesoRepository) {}

  async execute(input: CreateProcesoInput, userId: string, tx?: any): Promise<Proceso> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando creación de proceso`, {
      nombre: input.nombre,
      componente: input.componente,
      idModulo: input.idModulo,
      orden: input.orden,
      tipo: input.tipo
    });

    try {
      // Validar datos de entrada
      await this.validateCreateInput(input);

      // Verificar si ya existe un proceso con el mismo nombre
      // Nota: Podríamos agregar esta validación si es requerida por negocio
      // const existing = await this.procesoRepo.findByName(input.nombre);
      // if (existing) {
      //   throw new ProcesoAlreadyExistsError(input.nombre);
      // }

      const createData: CreateProcesoData = {
        nombre: input.nombre,
        componente: input.componente,
        idModulo: input.idModulo,
        orden: input.orden,
        tipo: input.tipo
      };

      const proceso = await this.procesoRepo.create(createData, tx);

      console.log(`[${timestamp}] [Usuario: ${userId}] Proceso creado exitosamente`, {
        procesoId: proceso.id,
        nombre: proceso.nombre
      });

      return proceso;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en creación de proceso`, {
        nombre: input.nombre,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  private async validateCreateInput(input: CreateProcesoInput): Promise<void> {
    // Validar nombre (requerido)
    if (!input.nombre || typeof input.nombre !== 'string' || input.nombre.trim().length < 2 || input.nombre.length > 100) {
      throw new ProcesoInvalidNombreError(input.nombre || '');
    }

    // Validar componente (requerido)
    if (!input.componente || typeof input.componente !== 'string' || input.componente.trim().length === 0 || input.componente.length > 100) {
      throw new ProcesoInvalidComponenteError(input.componente || '');
    }

    // Validar idModulo (requerido)
    if (!input.idModulo || typeof input.idModulo !== 'number' || input.idModulo <= 0 || !Number.isInteger(input.idModulo)) {
      throw new ProcesoInvalidIdModuloError(input.idModulo);
    }

    // Validar orden (requerido)
    if (input.orden === undefined || input.orden === null || typeof input.orden !== 'number' || input.orden < 0 || !Number.isInteger(input.orden)) {
      throw new ProcesoInvalidOrdenError(input.orden);
    }

    // Validar tipo (requerido)
    if (!input.tipo || typeof input.tipo !== 'string' || input.tipo.trim().length === 0) {
      throw new ProcesoInvalidTipoError(input.tipo || '');
    }

    // Aquí podríamos agregar validaciones adicionales para tipos específicos si fuera necesario
    // const tiposValidos = ['WEB', 'API', 'BATCH', 'WORKFLOW'];
    // if (!tiposValidos.includes(input.tipo.toUpperCase())) {
    //   throw new ProcesoInvalidTipoError(input.tipo);
    // }
  }
}
