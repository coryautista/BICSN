import { sql } from '../../../../../db/context.js';
import { Indicador, IndicadorWithRelations } from '../entities/Indicador.js';

export interface IIndicadorRepository {
  findAll(): Promise<IndicadorWithRelations[]>;
  findById(indicadorId: number): Promise<IndicadorWithRelations | null>;
  findByPrograma(programaId: number): Promise<IndicadorWithRelations[]>;
  findByLineaEstrategica(lineaEstrategicaId: number): Promise<IndicadorWithRelations[]>;
  findByEje(ejeId: number): Promise<IndicadorWithRelations[]>;
  create(
    idPrograma: number,
    nombre: string,
    descripcion: string,
    tipoIndicador: string,
    frecuenciaMedicion: string,
    meta?: number,
    sentido?: string,
    formula?: string,
    idUnidadMedida?: number,
    idDimension?: number,
    fuenteDatos?: string,
    responsable?: string,
    observaciones?: string,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<Indicador>;
  update(
    indicadorId: number,
    nombre?: string,
    descripcion?: string,
    tipoIndicador?: string,
    frecuenciaMedicion?: string,
    meta?: number,
    sentido?: string,
    formula?: string,
    idUnidadMedida?: number,
    idDimension?: number,
    fuenteDatos?: string,
    responsable?: string,
    observaciones?: string,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<Indicador | null>;
  delete(indicadorId: number, tx?: sql.Transaction): Promise<number | null>;
}

