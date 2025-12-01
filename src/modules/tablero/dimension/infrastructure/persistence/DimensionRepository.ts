import { IDimensionRepository } from '../../domain/repositories/IDimensionRepository.js';
import { Dimension, TipoDimension } from '../../domain/entities/Dimension.js';
import { getPool, sql } from '../../../../../db/mssql.js';
import { sql as sqlType } from '../../../../../db/context.js';

/**
 * Repository implementation para el módulo Dimension
 * Implementa la interface del dominio con acceso directo a la base de datos
 */
export class DimensionRepository implements IDimensionRepository {
  async findAll(): Promise<Dimension[]> {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT
        id,
        nombre,
        descripcion,
        tipoDimension,
        esActiva
      FROM tablero.Dimension
      ORDER BY tipoDimension ASC, nombre ASC
    `);
    return r.recordset.map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      tipoDimension: row.tipoDimension as TipoDimension,
      esActiva: row.esActiva
    }));
  }

  async findById(dimensionId: number): Promise<Dimension | null> {
    if (!dimensionId || typeof dimensionId !== 'number' || dimensionId <= 0) {
      throw new Error('Invalid dimensionId: must be a positive number');
    }
    const p = await getPool();
    const r = await p.request()
      .input('dimensionId', sql.Int, dimensionId)
      .query(`
        SELECT
          id,
          nombre,
          descripcion,
          tipoDimension,
          esActiva
        FROM tablero.Dimension
        WHERE id = @dimensionId
      `);
    const row = r.recordset[0];
    if (!row) return null;
    return {
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      tipoDimension: row.tipoDimension as TipoDimension,
      esActiva: row.esActiva
    };
  }

  async findByTipo(tipoDimension: TipoDimension): Promise<Dimension[]> {
    if (!tipoDimension || !['GEOGRAFICA', 'TEMPORAL', 'DEMOGRAFICA', 'ECONOMICA', 'SOCIAL', 'AMBIENTAL', 'INSTITUCIONAL'].includes(tipoDimension)) {
      throw new Error('Invalid tipoDimension: must be GEOGRAFICA, TEMPORAL, DEMOGRAFICA, ECONOMICA, SOCIAL, AMBIENTAL, or INSTITUCIONAL');
    }
    const p = await getPool();
    const r = await p.request()
      .input('tipoDimension', sql.VarChar(20), tipoDimension)
      .query(`
        SELECT
          id,
          nombre,
          descripcion,
          tipoDimension,
          esActiva
        FROM tablero.Dimension
        WHERE tipoDimension = @tipoDimension
        ORDER BY nombre ASC
      `);
    return r.recordset.map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      tipoDimension: row.tipoDimension as TipoDimension,
      esActiva: row.esActiva
    }));
  }

  async create(
    nombre: string,
    descripcion: string,
    tipoDimension: TipoDimension,
    esActiva?: boolean,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<Dimension> {
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 200) {
      throw new Error('Invalid nombre: must be a non-empty string with max 200 characters');
    }
    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.length > 1000) {
      throw new Error('Invalid descripcion: must be a non-empty string with max 1000 characters');
    }
    if (!tipoDimension || !['GEOGRAFICA', 'TEMPORAL', 'DEMOGRAFICA', 'ECONOMICA', 'SOCIAL', 'AMBIENTAL', 'INSTITUCIONAL'].includes(tipoDimension)) {
      throw new Error('Invalid tipoDimension: must be GEOGRAFICA, TEMPORAL, DEMOGRAFICA, ECONOMICA, SOCIAL, AMBIENTAL, or INSTITUCIONAL');
    }

    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('nombre', sql.NVarChar(200), nombre)
      .input('descripcion', sql.NVarChar(1000), descripcion)
      .input('tipoDimension', sql.VarChar(20), tipoDimension)
      .input('esActiva', sql.Bit, esActiva ?? true)
      .query(`
        INSERT INTO tablero.Dimension (nombre, descripcion, tipoDimension, esActiva)
        OUTPUT
          INSERTED.id,
          INSERTED.nombre,
          INSERTED.descripcion,
          INSERTED.tipoDimension,
          INSERTED.esActiva
        VALUES (@nombre, @descripcion, @tipoDimension, @esActiva)
      `);
    const row = r.recordset[0];
    return {
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      tipoDimension: row.tipoDimension as TipoDimension,
      esActiva: row.esActiva
    };
  }

  async update(
    dimensionId: number,
    nombre?: string,
    descripcion?: string,
    tipoDimension?: TipoDimension,
    esActiva?: boolean,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<Dimension | null> {
    if (!dimensionId || typeof dimensionId !== 'number' || dimensionId <= 0) {
      throw new Error('Invalid dimensionId: must be a positive number');
    }
    if (nombre !== undefined && (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 200)) {
      throw new Error('Invalid nombre: must be a non-empty string with max 200 characters');
    }
    if (descripcion !== undefined && (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.length > 1000)) {
      throw new Error('Invalid descripcion: must be a non-empty string with max 1000 characters');
    }
    if (tipoDimension !== undefined && !['GEOGRAFICA', 'TEMPORAL', 'DEMOGRAFICA', 'ECONOMICA', 'SOCIAL', 'AMBIENTAL', 'INSTITUCIONAL'].includes(tipoDimension)) {
      throw new Error('Invalid tipoDimension: must be GEOGRAFICA, TEMPORAL, DEMOGRAFICA, ECONOMICA, SOCIAL, AMBIENTAL, or INSTITUCIONAL');
    }

    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('dimensionId', sql.Int, dimensionId)
      .input('nombre', sql.NVarChar(200), nombre ?? null)
      .input('descripcion', sql.NVarChar(1000), descripcion ?? null)
      .input('tipoDimension', sql.VarChar(20), tipoDimension ?? null)
      .input('esActiva', sql.Bit, esActiva ?? null)
      .query(`
        UPDATE tablero.Dimension
        SET nombre = @nombre,
            descripcion = @descripcion,
            tipoDimension = @tipoDimension,
            esActiva = @esActiva
        OUTPUT
          INSERTED.id,
          INSERTED.nombre,
          INSERTED.descripcion,
          INSERTED.tipoDimension,
          INSERTED.esActiva
        WHERE id = @dimensionId
      `);
    const row = r.recordset[0];
    if (!row) return null;
    return {
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      tipoDimension: row.tipoDimension as TipoDimension,
      esActiva: row.esActiva
    };
  }

  async delete(dimensionId: number, tx?: sql.Transaction): Promise<number | null> {
    if (!dimensionId || typeof dimensionId !== 'number' || dimensionId <= 0) {
      throw new Error('Invalid dimensionId: must be a positive number');
    }
    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('dimensionId', sql.Int, dimensionId)
      .query(`
        DELETE FROM tablero.Dimension
        OUTPUT DELETED.id
        WHERE id = @dimensionId
      `);
    return r.recordset[0]?.id || null;
  }
}
