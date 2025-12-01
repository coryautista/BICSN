import { IIndicadorRepository } from '../../domain/repositories/IIndicadorRepository.js';
import { IndicadorAlreadyExistsError, InvalidIndicadorNombreError, InvalidIndicadorDescripcionError } from '../../domain/errors.js';
import { Indicador } from '../../domain/entities/Indicador.js';
import { ProgramaNotFoundError } from '../../../programa/domain/errors.js';

export interface CreateIndicadorInput {
  idPrograma: number;
  nombre: string;
  descripcion: string;
  tipoIndicador: 'PORCENTAJE' | 'NUMERICO' | 'MONETARIO' | 'BOOLEANO';
  frecuenciaMedicion: 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
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

export class CreateIndicadorCommand {
  constructor(private indicadorRepo: IIndicadorRepository) {}

  async execute(input: CreateIndicadorInput, tx?: any): Promise<Indicador> {
    // Validación de entrada
    if (!input.nombre || input.nombre.trim().length === 0) {
      throw new InvalidIndicadorNombreError(input.nombre, 'El nombre es requerido');
    }
    if (input.nombre.length > 500) {
      throw new InvalidIndicadorNombreError(input.nombre, 'El nombre no puede exceder 500 caracteres');
    }
    if (!input.descripcion || input.descripcion.trim().length === 0) {
      throw new InvalidIndicadorDescripcionError(input.descripcion, 'La descripción es requerida');
    }
    if (input.descripcion.length > 5000) {
      throw new InvalidIndicadorDescripcionError(input.descripcion, 'La descripción no puede exceder 5000 caracteres');
    }
    if (!input.idPrograma || input.idPrograma <= 0) {
      throw new ProgramaNotFoundError(input.idPrograma);
    }

    try {
      return await this.indicadorRepo.create(
        input.idPrograma,
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
    } catch (error: any) {
      if (error.message?.includes('FOREIGN KEY constraint')) {
        throw new ProgramaNotFoundError(input.idPrograma);
      }
      if (error.message?.includes('Violation of PRIMARY KEY constraint')) {
        throw new IndicadorAlreadyExistsError(input.nombre);
      }
      throw error;
    }
  }
}

