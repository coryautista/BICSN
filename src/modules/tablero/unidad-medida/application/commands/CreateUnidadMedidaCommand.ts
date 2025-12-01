import { IUnidadMedidaRepository } from '../../domain/repositories/IUnidadMedidaRepository.js';
import { UnidadMedida, CategoriaUnidadMedida } from '../../domain/entities/UnidadMedida.js';
import { UnidadMedidaAlreadyExistsError, InvalidUnidadMedidaNombreError, InvalidUnidadMedidaDescripcionError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'createUnidadMedidaCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface CreateUnidadMedidaInput {
  nombre: string;
  simbolo: string;
  descripcion: string;
  categoria: CategoriaUnidadMedida;
  esActiva?: boolean;
  userId?: string;
}

export class CreateUnidadMedidaCommand {
  constructor(private unidadMedidaRepo: IUnidadMedidaRepository) {}

  async execute(input: CreateUnidadMedidaInput, tx?: sql.Transaction): Promise<UnidadMedida> {
    const logContext = {
      operation: 'createUnidadMedida',
      nombre: input.nombre,
      categoria: input.categoria,
      userId: input.userId
    };

    logger.info(logContext, 'Iniciando creación de unidad de medida');

    // Validación de entrada
    if (!input.nombre || typeof input.nombre !== 'string') {
      throw new InvalidUnidadMedidaNombreError('', 'El nombre es requerido y debe ser una cadena de texto');
    }

    const nombreTrimmed = input.nombre.trim();
    if (nombreTrimmed.length === 0) {
      throw new InvalidUnidadMedidaNombreError('', 'El nombre no puede estar vacío');
    }

    if (nombreTrimmed.length > 100) {
      throw new InvalidUnidadMedidaNombreError(nombreTrimmed, 'El nombre no puede tener más de 100 caracteres');
    }

    if (!input.simbolo || typeof input.simbolo !== 'string') {
      throw new Error('El símbolo es requerido y debe ser una cadena de texto');
    }

    const simboloTrimmed = input.simbolo.trim();
    if (simboloTrimmed.length === 0) {
      throw new Error('El símbolo no puede estar vacío');
    }

    if (simboloTrimmed.length > 20) {
      throw new Error('El símbolo no puede tener más de 20 caracteres');
    }

    if (!input.descripcion || typeof input.descripcion !== 'string') {
      throw new InvalidUnidadMedidaDescripcionError('', 'La descripción es requerida y debe ser una cadena de texto');
    }

    const descripcionTrimmed = input.descripcion.trim();
    if (descripcionTrimmed.length === 0) {
      throw new InvalidUnidadMedidaDescripcionError('', 'La descripción no puede estar vacía');
    }

    if (descripcionTrimmed.length > 500) {
      throw new InvalidUnidadMedidaDescripcionError(descripcionTrimmed, 'La descripción no puede tener más de 500 caracteres');
    }

    if (!input.categoria || !['CANTIDAD', 'PORCENTAJE', 'MONETARIA', 'TIEMPO', 'PESO', 'VOLUMEN', 'AREA', 'DISTANCIA', 'VELOCIDAD', 'TEMPERATURA'].includes(input.categoria)) {
      throw new Error('Categoría inválida');
    }

    try {
      const result = await this.unidadMedidaRepo.create(
        nombreTrimmed,
        simboloTrimmed,
        descripcionTrimmed,
        input.categoria,
        input.esActiva ?? true,
        input.userId,
        tx
      );
      logger.info({ ...logContext, unidadMedidaId: result.id }, 'Unidad de medida creada exitosamente');
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al crear unidad de medida');

      if (errorMessage.includes('Violation of PRIMARY KEY constraint') || 
          errorMessage.includes('duplicate key')) {
        throw new UnidadMedidaAlreadyExistsError(nombreTrimmed);
      }
      throw error;
    }
  }
}

