import { sql } from '../../../../../db/context.js';
import { Dependencia, DependenciaWithHijas, TipoDependencia } from '../entities/Dependencia.js';

export interface IDependenciaRepository {
  findAll(): Promise<Dependencia[]>;
  findById(dependenciaId: number): Promise<Dependencia | null>;
  findByTipo(tipoDependencia: TipoDependencia): Promise<Dependencia[]>;
  findHijas(dependenciaPadreId: number): Promise<Dependencia[]>;
  getDependenciaWithHijas(dependenciaId: number): Promise<DependenciaWithHijas | null>;
  create(
    nombre: string,
    descripcion: string,
    tipoDependencia: TipoDependencia,
    claveDependencia: string,
    idDependenciaPadre?: number,
    responsable?: string,
    telefono?: string,
    email?: string,
    esActiva?: boolean,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<Dependencia>;
  update(
    dependenciaId: number,
    nombre?: string,
    descripcion?: string,
    tipoDependencia?: TipoDependencia,
    claveDependencia?: string,
    idDependenciaPadre?: number,
    responsable?: string,
    telefono?: string,
    email?: string,
    esActiva?: boolean,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<Dependencia | null>;
  delete(dependenciaId: number, tx?: sql.Transaction): Promise<number | null>;
}

