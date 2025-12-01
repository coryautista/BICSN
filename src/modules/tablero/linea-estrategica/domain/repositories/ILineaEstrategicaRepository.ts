import { sql } from '../../../../../db/context.js';
import { LineaEstrategica, LineaEstrategicaWithProgramas } from '../entities/LineaEstrategica.js';

export interface ILineaEstrategicaRepository {
  findAll(): Promise<LineaEstrategica[]>;
  findById(lineaEstrategicaId: number): Promise<LineaEstrategica | null>;
  findByEje(ejeId: number): Promise<LineaEstrategica[]>;
  getLineaEstrategicaWithProgramas(lineaEstrategicaId: number): Promise<LineaEstrategicaWithProgramas | null>;
  create(
    idEje: number,
    nombre: string,
    descripcion: string,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<LineaEstrategica>;
  update(
    lineaEstrategicaId: number,
    nombre?: string,
    descripcion?: string,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<LineaEstrategica | null>;
  delete(lineaEstrategicaId: number, tx?: sql.Transaction): Promise<number | null>;
}

