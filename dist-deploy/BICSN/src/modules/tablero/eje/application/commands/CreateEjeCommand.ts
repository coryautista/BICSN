import { IEjeRepository } from '../../domain/repositories/IEjeRepository.js';
import { Eje } from '../../domain/entities/Eje.js';
import { EjeAlreadyExistsError, InvalidEjeNombreError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'createEjeCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface CreateEjeInput {
  nombre: string;
  userId?: string;
}

export class CreateEjeCommand {
  constructor(private ejeRepo: IEjeRepository) {}

  async execute(input: CreateEjeInput, tx?: sql.Transaction): Promise<Eje> {
    const logContext = {
      operation: 'createEje',
      nombre: input.nombre,
      userId: input.userId
    };

    logger.info(logContext, 'Iniciando creación de eje');

    // Validación de entrada
    if (!input.nombre || typeof input.nombre !== 'string') {
      throw new InvalidEjeNombreError('', 'El nombre es requerido y debe ser una cadena de texto');
    }

    const nombreTrimmed = input.nombre.trim();
    if (nombreTrimmed.length === 0) {
      throw new InvalidEjeNombreError('', 'El nombre no puede estar vacío');
    }

    if (nombreTrimmed.length > 500) {
      throw new InvalidEjeNombreError(nombreTrimmed, 'El nombre no puede tener más de 500 caracteres');
    }

    try {
      const result = await this.ejeRepo.create(nombreTrimmed, input.userId, tx);
      logger.info({ ...logContext, ejeId: result.id }, 'Eje creado exitosamente');
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al crear eje');

      if (errorMessage.includes('Violation of PRIMARY KEY constraint') || 
          errorMessage.includes('duplicate key')) {
        throw new EjeAlreadyExistsError(nombreTrimmed);
      }
      throw error;
    }
  }
}

