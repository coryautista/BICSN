import { IProgramaRepository } from '../../domain/repositories/IProgramaRepository.js';
import { Programa } from '../../domain/entities/Programa.js';
import { ProgramaAlreadyExistsError, InvalidProgramaNombreError, InvalidProgramaDescripcionError } from '../../domain/errors.js';
import { EjeNotFoundError } from '../../../eje/domain/errors.js';
import { LineaEstrategicaNotFoundError } from '../../../linea-estrategica/domain/errors.js';
import { IEjeRepository } from '../../../eje/domain/repositories/IEjeRepository.js';
import { ILineaEstrategicaRepository } from '../../../linea-estrategica/domain/repositories/ILineaEstrategicaRepository.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'createProgramaCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface CreateProgramaInput {
  idEje: number;
  idLineaEstrategica: number;
  nombre: string;
  descripcion: string;
  userId?: string;
}

export class CreateProgramaCommand {
  constructor(
    private programaRepo: IProgramaRepository,
    private ejeRepo: IEjeRepository,
    private lineaEstrategicaRepo: ILineaEstrategicaRepository
  ) {}

  async execute(input: CreateProgramaInput, tx?: sql.Transaction): Promise<Programa> {
    const logContext = {
      operation: 'createPrograma',
      idEje: input.idEje,
      idLineaEstrategica: input.idLineaEstrategica,
      nombre: input.nombre,
      userId: input.userId
    };

    logger.info(logContext, 'Iniciando creación de programa');

    // Validación de entrada
    if (!input.idEje || typeof input.idEje !== 'number' || input.idEje <= 0) {
      throw new EjeNotFoundError(input.idEje);
    }

    if (!input.idLineaEstrategica || typeof input.idLineaEstrategica !== 'number' || input.idLineaEstrategica <= 0) {
      throw new LineaEstrategicaNotFoundError(input.idLineaEstrategica);
    }

    // Validar que el eje existe
    const eje = await this.ejeRepo.findById(input.idEje);
    if (!eje) {
      throw new EjeNotFoundError(input.idEje);
    }

    // Validar que la línea estratégica existe
    const lineaEstrategica = await this.lineaEstrategicaRepo.findById(input.idLineaEstrategica);
    if (!lineaEstrategica) {
      throw new LineaEstrategicaNotFoundError(input.idLineaEstrategica);
    }

    if (!input.nombre || typeof input.nombre !== 'string') {
      throw new InvalidProgramaNombreError('', 'El nombre es requerido y debe ser una cadena de texto');
    }

    const nombreTrimmed = input.nombre.trim();
    if (nombreTrimmed.length === 0) {
      throw new InvalidProgramaNombreError('', 'El nombre no puede estar vacío');
    }

    if (nombreTrimmed.length > 500) {
      throw new InvalidProgramaNombreError(nombreTrimmed, 'El nombre no puede tener más de 500 caracteres');
    }

    if (!input.descripcion || typeof input.descripcion !== 'string') {
      throw new InvalidProgramaDescripcionError('', 'La descripción es requerida y debe ser una cadena de texto');
    }

    const descripcionTrimmed = input.descripcion.trim();
    if (descripcionTrimmed.length === 0) {
      throw new InvalidProgramaDescripcionError('', 'La descripción no puede estar vacía');
    }

    if (descripcionTrimmed.length > 5000) {
      throw new InvalidProgramaDescripcionError(descripcionTrimmed, 'La descripción no puede tener más de 5000 caracteres');
    }

    try {
      const result = await this.programaRepo.create(
        input.idEje,
        input.idLineaEstrategica,
        nombreTrimmed,
        descripcionTrimmed,
        input.userId,
        tx
      );
      logger.info({ ...logContext, programaId: result.id }, 'Programa creado exitosamente');
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al crear programa');

      if (errorMessage.includes('FOREIGN KEY constraint')) {
        if (errorMessage.includes('idEje')) {
          throw new EjeNotFoundError(input.idEje);
        }
        if (errorMessage.includes('idLineaEstrategica')) {
          throw new LineaEstrategicaNotFoundError(input.idLineaEstrategica);
        }
      }

      if (errorMessage.includes('Violation of PRIMARY KEY constraint') || 
          errorMessage.includes('duplicate key')) {
        throw new ProgramaAlreadyExistsError(nombreTrimmed);
      }
      throw error;
    }
  }
}

