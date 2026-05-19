import { IUnidadMedidaRepository } from '../../domain/repositories/IUnidadMedidaRepository.js';
import { UnidadMedida, CategoriaUnidadMedida } from '../../domain/entities/UnidadMedida.js';
import { getPool, sql } from '../../../../../db/mssql.js';
import { sql as sqlType } from '../../../../../db/context.js';

/**
 * Repository implementation para el módulo UnidadMedida
 * Implementa la interface del dominio con acceso directo a la base de datos
 */
export class UnidadMedidaRepository implements IUnidadMedidaRepository {
  async findAll(): Promise<UnidadMedida[]> {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT
        id,
        nombre,
        simbolo,
        descripcion,
        categoria,
        esActiva
      FROM tablero.UnidadMedida
      ORDER BY categoria ASC, nombre ASC
    `);
    return r.recordset.map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      simbolo: row.simbolo,
      descripcion: row.descripcion,
      categoria: row.categoria as CategoriaUnidadMedida,
      esActiva: row.esActiva
    }));
  }

  async findById(unidadMedidaId: number): Promise<UnidadMedida | null> {
    if (!unidadMedidaId || typeof unidadMedidaId !== 'number' || unidadMedidaId <= 0) {
      throw new Error('Invalid unidadMedidaId: must be a positive number');
    }
    const p = await getPool();
    const r = await p.request()
      .input('unidadMedidaId', sql.Int, unidadMedidaId)
      .query(`
        SELECT
          id,
          nombre,
          simbolo,
          descripcion,
          categoria,
          esActiva
        FROM tablero.UnidadMedida
        WHERE id = @unidadMedidaId
      `);
    const row = r.recordset[0];
    if (!row) return null;
    return {
      id: row.id,
      nombre: row.nombre,
      simbolo: row.simbolo,
      descripcion: row.descripcion,
      categoria: row.categoria as CategoriaUnidadMedida,
      esActiva: row.esActiva
    };
  }

  async findByCategoria(categoria: CategoriaUnidadMedida): Promise<UnidadMedida[]> {
    if (!categoria || !['CANTIDAD', 'PORCENTAJE', 'MONETARIA', 'TIEMPO', 'PESO', 'VOLUMEN', 'AREA', 'DISTANCIA', 'VELOCIDAD', 'TEMPERATURA'].includes(categoria)) {
      throw new Error('Invalid categoria: must be CANTIDAD, PORCENTAJE, MONETARIA, TIEMPO, PESO, VOLUMEN, AREA, DISTANCIA, VELOCIDAD, or TEMPERATURA');
    }
    const p = await getPool();
    const r = await p.request()
      .input('categoria', sql.VarChar(20), categoria)
      .query(`
        SELECT
          id,
          nombre,
          simbolo,
          descripcion,
          categoria,
          esActiva
        FROM tablero.UnidadMedida
        WHERE categoria = @categoria
        ORDER BY nombre ASC
      `);
    return r.recordset.map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      simbolo: row.simbolo,
      descripcion: row.descripcion,
      categoria: row.categoria as CategoriaUnidadMedida,
      esActiva: row.esActiva
    }));
  }

  async create(
    nombre: string,
    simbolo: string,
    descripcion: string,
    categoria: CategoriaUnidadMedida,
    esActiva?: boolean,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<UnidadMedida> {
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 100) {
      throw new Error('Invalid nombre: must be a non-empty string with max 100 characters');
    }
    if (!simbolo || typeof simbolo !== 'string' || simbolo.trim().length === 0 || simbolo.length > 20) {
      throw new Error('Invalid simbolo: must be a non-empty string with max 20 characters');
    }
    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.length > 500) {
      throw new Error('Invalid descripcion: must be a non-empty string with max 500 characters');
    }
    if (!categoria || !['CANTIDAD', 'PORCENTAJE', 'MONETARIA', 'TIEMPO', 'PESO', 'VOLUMEN', 'AREA', 'DISTANCIA', 'VELOCIDAD', 'TEMPERATURA'].includes(categoria)) {
      throw new Error('Invalid categoria: must be CANTIDAD, PORCENTAJE, MONETARIA, TIEMPO, PESO, VOLUMEN, AREA, DISTANCIA, VELOCIDAD, or TEMPERATURA');
    }

    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('nombre', sql.NVarChar(100), nombre)
      .input('simbolo', sql.NVarChar(20), simbolo)
      .input('descripcion', sql.NVarChar(500), descripcion)
      .input('categoria', sql.VarChar(20), categoria)
      .input('esActiva', sql.Bit, esActiva ?? true)
      .query(`
        INSERT INTO tablero.UnidadMedida (nombre, simbolo, descripcion, categoria, esActiva)
        OUTPUT
          INSERTED.id,
          INSERTED.nombre,
          INSERTED.simbolo,
          INSERTED.descripcion,
          INSERTED.categoria,
          INSERTED.esActiva
        VALUES (@nombre, @simbolo, @descripcion, @categoria, @esActiva)
      `);
    const row = r.recordset[0];
    return {
      id: row.id,
      nombre: row.nombre,
      simbolo: row.simbolo,
      descripcion: row.descripcion,
      categoria: row.categoria as CategoriaUnidadMedida,
      esActiva: row.esActiva
    };
  }

  async update(
    unidadMedidaId: number,
    nombre?: string,
    simbolo?: string,
    descripcion?: string,
    categoria?: CategoriaUnidadMedida,
    esActiva?: boolean,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<UnidadMedida | null> {
    if (!unidadMedidaId || typeof unidadMedidaId !== 'number' || unidadMedidaId <= 0) {
      throw new Error('Invalid unidadMedidaId: must be a positive number');
    }
    if (nombre !== undefined && (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 100)) {
      throw new Error('Invalid nombre: must be a non-empty string with max 100 characters');
    }
    if (simbolo !== undefined && (!simbolo || typeof simbolo !== 'string' || simbolo.trim().length === 0 || simbolo.length > 20)) {
      throw new Error('Invalid simbolo: must be a non-empty string with max 20 characters');
    }
    if (descripcion !== undefined && (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.length > 500)) {
      throw new Error('Invalid descripcion: must be a non-empty string with max 500 characters');
    }
    if (categoria !== undefined && !['CANTIDAD', 'PORCENTAJE', 'MONETARIA', 'TIEMPO', 'PESO', 'VOLUMEN', 'AREA', 'DISTANCIA', 'VELOCIDAD', 'TEMPERATURA'].includes(categoria)) {
      throw new Error('Invalid categoria: must be CANTIDAD, PORCENTAJE, MONETARIA, TIEMPO, PESO, VOLUMEN, AREA, DISTANCIA, VELOCIDAD, or TEMPERATURA');
    }

    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('unidadMedidaId', sql.Int, unidadMedidaId)
      .input('nombre', sql.NVarChar(100), nombre ?? null)
      .input('simbolo', sql.NVarChar(20), simbolo ?? null)
      .input('descripcion', sql.NVarChar(500), descripcion ?? null)
      .input('categoria', sql.VarChar(20), categoria ?? null)
      .input('esActiva', sql.Bit, esActiva ?? null)
      .query(`
        UPDATE tablero.UnidadMedida
        SET nombre = @nombre,
            simbolo = @simbolo,
            descripcion = @descripcion,
            categoria = @categoria,
            esActiva = @esActiva
        OUTPUT
          INSERTED.id,
          INSERTED.nombre,
          INSERTED.simbolo,
          INSERTED.descripcion,
          INSERTED.categoria,
          INSERTED.esActiva
        WHERE id = @unidadMedidaId
      `);
    const row = r.recordset[0];
    if (!row) return null;
    return {
      id: row.id,
      nombre: row.nombre,
      simbolo: row.simbolo,
      descripcion: row.descripcion,
      categoria: row.categoria as CategoriaUnidadMedida,
      esActiva: row.esActiva
    };
  }

  async delete(unidadMedidaId: number, tx?: sql.Transaction): Promise<number | null> {
    if (!unidadMedidaId || typeof unidadMedidaId !== 'number' || unidadMedidaId <= 0) {
      throw new Error('Invalid unidadMedidaId: must be a positive number');
    }
    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('unidadMedidaId', sql.Int, unidadMedidaId)
      .query(`
        DELETE FROM tablero.UnidadMedida
        OUTPUT DELETED.id
        WHERE id = @unidadMedidaId
      `);
    return r.recordset[0]?.id || null;
  }
}
