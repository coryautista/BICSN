import { IUnidadMedidaRepository } from '../../domain/repositories/IUnidadMedidaRepository.js';
import { UnidadMedida, CategoriaUnidadMedida } from '../../domain/entities/UnidadMedida.js';
import { UnidadMedidaNotFoundError, InvalidUnidadMedidaNombreError, InvalidUnidadMedidaDescripcionError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'updateUnidadMedidaCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface UpdateUnidadMedidaInput {
  unidadMedidaId: number;
  nombre?: string;
  simbolo?: string;
  descripcion?: string;
  categoria?: CategoriaUnidadMedida;
  esActiva?: boolean;
  userId?: string;
}

export class UpdateUnidadMedidaCommand {
  constructor(private unidadMedidaRepo: IUnidadMedidaRepository) {}

  async execute(input: UpdateUnidadMedidaInput, tx?: sql.Transaction): Promise<UnidadMedida> {
    const logContext = {
      operation: 'updateUnidadMedida',
      unidadMedidaId: input.unidadMedidaId,
      userId: input.userId
    };

    logger.info(logContext, 'Iniciando actualización de unidad de medida');

    // Validación de entrada
    if (!input.unidadMedidaId || typeof input.unidadMedidaId !== 'number' || input.unidadMedidaId <= 0) {
      throw new UnidadMedidaNotFoundError(input.unidadMedidaId);
    }

    if (input.nombre !== undefined) {
      if (typeof input.nombre !== 'string') {
        throw new InvalidUnidadMedidaNombreError('', 'El nombre debe ser una cadena de texto');
      }
      const nombreTrimmed = input.nombre.trim();
      if (nombreTrimmed.length === 0) {
        throw new InvalidUnidadMedidaNombreError('', 'El nombre no puede estar vacío');
      }
      if (nombreTrimmed.length > 100) {
        throw new InvalidUnidadMedidaNombreError(nombreTrimmed, 'El nombre no puede tener más de 100 caracteres');
      }
    }

    if (input.simbolo !== undefined) {
      if (typeof input.simbolo !== 'string') {
        throw new Error('El símbolo debe ser una cadena de texto');
      }
      const simboloTrimmed = input.simbolo.trim();
      if (simboloTrimmed.length === 0) {
        throw new Error('El símbolo no puede estar vacío');
      }
      if (simboloTrimmed.length > 20) {
        throw new Error('El símbolo no puede tener más de 20 caracteres');
      }
    }

    if (input.descripcion !== undefined) {
      if (typeof input.descripcion !== 'string') {
        throw new InvalidUnidadMedidaDescripcionError('', 'La descripción debe ser una cadena de texto');
      }
      const descripcionTrimmed = input.descripcion.trim();
      if (descripcionTrimmed.length === 0) {
        throw new InvalidUnidadMedidaDescripcionError('', 'La descripción no puede estar vacía');
      }
      if (descripcionTrimmed.length > 500) {
        throw new InvalidUnidadMedidaDescripcionError(descripcionTrimmed, 'La descripción no puede tener más de 500 caracteres');
      }
    }

    if (input.categoria !== undefined && !['CANTIDAD', 'PORCENTAJE', 'MONETARIA', 'TIEMPO', 'PESO', 'VOLUMEN', 'AREA', 'DISTANCIA', 'VELOCIDAD', 'TEMPERATURA'].includes(input.categoria)) {
      throw new Error('Categoría inválida');
    }

    // Verificar que la unidad de medida existe
    const existingUnidadMedida = await this.unidadMedidaRepo.findById(input.unidadMedidaId);
    if (!existingUnidadMedida) {
      throw new UnidadMedidaNotFoundError(input.unidadMedidaId);
    }

    try {
      const result = await this.unidadMedidaRepo.update(
        input.unidadMedidaId,
        input.nombre,
        input.simbolo,
        input.descripcion,
        input.categoria,
        input.esActiva,
        input.userId,
        tx
      );
      if (!result) {
        throw new UnidadMedidaNotFoundError(input.unidadMedidaId);
      }
      logger.info({ ...logContext, unidadMedidaId: result.id }, 'Unidad de medida actualizada exitosamente');
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al actualizar unidad de medida');

      if (error instanceof UnidadMedidaNotFoundError) {
        throw error;
      }
      throw error;
    }
  }
}

