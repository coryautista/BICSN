import { sql } from '../../../../../db/context.js';
import { Programa } from '../entities/Programa.js';

export interface IProgramaRepository {
  findAll(): Promise<Programa[]>;
  findById(programaId: number): Promise<Programa | null>;
  findByEje(ejeId: number): Promise<Programa[]>;
  findByLineaEstrategica(lineaEstrategicaId: number): Promise<Programa[]>;
  create(
    idEje: number,
    idLineaEstrategica: number,
    nombre: string,
    descripcion: string,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<Programa>;
  update(
    programaId: number,
    nombre?: string,
    descripcion?: string,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<Programa | null>;
  delete(programaId: number, tx?: sql.Transaction): Promise<number | null>;
}

