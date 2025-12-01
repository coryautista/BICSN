import { sql } from '../../../../../db/context.js';
import { IndicadorAnual, IndicadorAnualWithRelations } from '../entities/IndicadorAnual.js';

export interface IIndicadorAnualRepository {
  findById(indicadorAnualId: number): Promise<IndicadorAnualWithRelations | null>;
  findByIndicador(indicadorId: number): Promise<IndicadorAnualWithRelations[]>;
  findByAnio(anio: number): Promise<IndicadorAnualWithRelations[]>;
  create(
    idIndicador: number,
    anio: number,
    enero?: number,
    febrero?: number,
    marzo?: number,
    abril?: number,
    mayo?: number,
    junio?: number,
    julio?: number,
    agosto?: number,
    septiembre?: number,
    octubre?: number,
    noviembre?: number,
    diciembre?: number,
    metaAnual?: number,
    observaciones?: string,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<IndicadorAnual>;
  update(
    indicadorAnualId: number,
    enero?: number,
    febrero?: number,
    marzo?: number,
    abril?: number,
    mayo?: number,
    junio?: number,
    julio?: number,
    agosto?: number,
    septiembre?: number,
    octubre?: number,
    noviembre?: number,
    diciembre?: number,
    metaAnual?: number,
    observaciones?: string,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<IndicadorAnual | null>;
  delete(indicadorAnualId: number, tx?: sql.Transaction): Promise<number | null>;
}

