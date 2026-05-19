import { sql } from '../../../../../db/context.js';
import { UnidadMedida, CategoriaUnidadMedida } from '../entities/UnidadMedida.js';

export interface IUnidadMedidaRepository {
  findAll(): Promise<UnidadMedida[]>;
  findById(unidadMedidaId: number): Promise<UnidadMedida | null>;
  findByCategoria(categoria: CategoriaUnidadMedida): Promise<UnidadMedida[]>;
  create(
    nombre: string,
    simbolo: string,
    descripcion: string,
    categoria: CategoriaUnidadMedida,
    esActiva?: boolean,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<UnidadMedida>;
  update(
    unidadMedidaId: number,
    nombre?: string,
    simbolo?: string,
    descripcion?: string,
    categoria?: CategoriaUnidadMedida,
    esActiva?: boolean,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<UnidadMedida | null>;
  delete(unidadMedidaId: number, tx?: sql.Transaction): Promise<number | null>;
}

