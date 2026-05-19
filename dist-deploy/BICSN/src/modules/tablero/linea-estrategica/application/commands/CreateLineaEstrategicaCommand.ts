import { ILineaEstrategicaRepository } from '../../domain/repositories/ILineaEstrategicaRepository.js';
import { LineaEstrategica } from '../../domain/entities/LineaEstrategica.js';
import { LineaEstrategicaAlreadyExistsError, InvalidLineaEstrategicaNombreError, InvalidLineaEstrategicaDescripcionError } from '../../domain/errors.js';
import { EjeNotFoundError } from '../../../eje/domain/errors.js';
import { IEjeRepository } from '../../../eje/domain/repositories/IEjeRepository.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'createLineaEstrategicaCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface CreateLineaEstrategicaInput {
  idEje: number;
  nombre: string;
  descripcion: string;
  userId?: string;
}

export class CreateLineaEstrategicaCommand {
  constructor(
    private lineaEstrategicaRepo: ILineaEstrategicaRepository,
    private ejeRepo: IEjeRepository
  ) {}

  async execute(input: CreateLineaEstrategicaInput, tx?: sql.Transaction): Promise<LineaEstrategica> {
    const logContext = {
      operation: 'createLineaEstrategica',
      idEje: input.idEje,
      nombre: input.nombre,
      userId: input.userId
    };

    logger.info(logContext, 'Iniciando creación de línea estratégica');

    // Validación de entrada
    if (!input.idEje || typeof input.idEje !== 'number' || input.idEje <= 0) {
      throw new EjeNotFoundError(input.idEje);
    }

    // Validar que el eje existe
    const eje = await this.ejeRepo.findById(input.idEje);
    if (!eje) {
      throw new EjeNotFoundError(input.idEje);
    }

    if (!input.nombre || typeof input.nombre !== 'string') {
      throw new InvalidLineaEstrategicaNombreError('', 'El nombre es requerido y debe ser una cadena de texto');
    }

    const nombreTrimmed = input.nombre.trim();
    if (nombreTrimmed.length === 0) {
      throw new InvalidLineaEstrategicaNombreError('', 'El nombre no puede estar vacío');
    }

    if (nombreTrimmed.length > 500) {
      throw new InvalidLineaEstrategicaNombreError(nombreTrimmed, 'El nombre no puede tener más de 500 caracteres');
    }

    if (!input.descripcion || typeof input.descripcion !== 'string') {
      throw new InvalidLineaEstrategicaDescripcionError('', 'La descripción es requerida y debe ser una cadena de texto');
    }

    const descripcionTrimmed = input.descripcion.trim();
    if (descripcionTrimmed.length === 0) {
      throw new InvalidLineaEstrategicaDescripcionError('', 'La descripción no puede estar vacía');
    }

    if (descripcionTrimmed.length > 5000) {
      throw new InvalidLineaEstrategicaDescripcionError(descripcionTrimmed, 'La descripción no puede tener más de 5000 caracteres');
    }

    try {
      const result = await this.lineaEstrategicaRepo.create(
        input.idEje,
        nombreTrimmed,
        descripcionTrimmed,
        input.userId,
        tx
      );
      logger.info({ ...logContext, lineaEstrategicaId: result.id }, 'Línea estratégica creada exitosamente');
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al crear línea estratégica');

      if (errorMessage.includes('FOREIGN KEY constraint') && errorMessage.includes('idEje')) {
        throw new EjeNotFoundError(input.idEje);
      }

      if (errorMessage.includes('Violation of PRIMARY KEY constraint') || 
          errorMessage.includes('duplicate key')) {
        throw new LineaEstrategicaAlreadyExistsError(nombreTrimmed);
      }
      throw error;
    }
  }
}

