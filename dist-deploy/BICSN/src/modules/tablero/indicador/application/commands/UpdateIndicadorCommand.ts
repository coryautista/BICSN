import { IIndicadorRepository } from '../../domain/repositories/IIndicadorRepository.js';
import { IndicadorNotFoundError, InvalidIndicadorNombreError, InvalidIndicadorDescripcionError } from '../../domain/errors.js';
import { Indicador } from '../../domain/entities/Indicador.js';

export interface UpdateIndicadorInput {
  indicadorId: number;
  nombre?: string;
  descripcion?: string;
  tipoIndicador?: 'PORCENTAJE' | 'NUMERICO' | 'MONETARIO' | 'BOOLEANO';
  frecuenciaMedicion?: 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  meta?: number;
  sentido?: 'ASCENDENTE' | 'DESCENDENTE';
  formula?: string;
  idUnidadMedida?: number;
  idDimension?: number;
  fuenteDatos?: string;
  responsable?: string;
  observaciones?: string;
  userId?: string;
}

export class UpdateIndicadorCommand {
  constructor(private indicadorRepo: IIndicadorRepository) {}

  async execute(input: UpdateIndicadorInput, tx?: any): Promise<Indicador> {
    // Validación de entrada
    if (input.nombre !== undefined) {
      if (!input.nombre || input.nombre.trim().length === 0) {
        throw new InvalidIndicadorNombreError(input.nombre, 'El nombre no puede estar vacío');
      }
      if (input.nombre.length > 500) {
        throw new InvalidIndicadorNombreError(input.nombre, 'El nombre no puede exceder 500 caracteres');
      }
    }
    if (input.descripcion !== undefined) {
      if (!input.descripcion || input.descripcion.trim().length === 0) {
        throw new InvalidIndicadorDescripcionError(input.descripcion, 'La descripción no puede estar vacía');
      }
      if (input.descripcion.length > 5000) {
        throw new InvalidIndicadorDescripcionError(input.descripcion, 'La descripción no puede exceder 5000 caracteres');
      }
    }

    const indicador = await this.indicadorRepo.update(
      input.indicadorId,
      input.nombre,
      input.descripcion,
      input.tipoIndicador,
      input.frecuenciaMedicion,
      input.meta,
      input.sentido,
      input.formula,
      input.idUnidadMedida,
      input.idDimension,
      input.fuenteDatos,
      input.responsable,
      input.observaciones,
      input.userId,
      tx
    );

    if (!indicador) {
      throw new IndicadorNotFoundError(input.indicadorId);
    }

    return indicador;
  }
}

