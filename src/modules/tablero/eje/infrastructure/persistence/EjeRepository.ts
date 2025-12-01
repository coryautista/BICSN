import { IEjeRepository } from '../../domain/repositories/IEjeRepository.js';
import { Eje, EjeWithLineas } from '../../domain/entities/Eje.js';
import { getPool, sql } from '../../../../../db/mssql.js';
import { sql as sqlType } from '../../../../../db/context.js';

/**
 * Repository implementation para el módulo Eje
 * Implementa la interface del dominio con acceso directo a la base de datos
 */
export class EjeRepository implements IEjeRepository {
  async findAll(): Promise<Eje[]> {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT
        id,
        nombre
      FROM tablero.Eje
      ORDER BY nombre ASC
    `);
    return r.recordset.map((row: any) => ({
      id: row.id,
      nombre: row.nombre
    }));
  }

  async findById(ejeId: number): Promise<Eje | null> {
    if (!ejeId || typeof ejeId !== 'number' || ejeId <= 0) {
      throw new Error('Invalid ejeId: must be a positive number');
    }
    const p = await getPool();
    const r = await p.request()
      .input('ejeId', sql.Int, ejeId)
      .query(`
        SELECT
          id,
          nombre
        FROM tablero.Eje
        WHERE id = @ejeId
      `);
    const row = r.recordset[0];
    if (!row) return null;
    return {
      id: row.id,
      nombre: row.nombre
    };
  }

  async create(nombre: string, userId?: string, tx?: sql.Transaction): Promise<Eje> {
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 500) {
      throw new Error('Invalid nombre: must be a non-empty string with max 500 characters');
    }
    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('nombre', sql.NVarChar(500), nombre)
      .query(`
        INSERT INTO tablero.Eje (nombre)
        OUTPUT
          INSERTED.id,
          INSERTED.nombre
        VALUES (@nombre)
      `);
    const row = r.recordset[0];
    return {
      id: row.id,
      nombre: row.nombre
    };
  }

  async update(ejeId: number, nombre: string, userId?: string, tx?: sql.Transaction): Promise<Eje | null> {
    if (!ejeId || typeof ejeId !== 'number' || ejeId <= 0) {
      throw new Error('Invalid ejeId: must be a positive number');
    }
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 500) {
      throw new Error('Invalid nombre: must be a non-empty string with max 500 characters');
    }
    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('ejeId', sql.Int, ejeId)
      .input('nombre', sql.NVarChar(500), nombre)
      .query(`
        UPDATE tablero.Eje
        SET nombre = @nombre
        OUTPUT
          INSERTED.id,
          INSERTED.nombre
        WHERE id = @ejeId
      `);
    const row = r.recordset[0];
    if (!row) return null;
    return {
      id: row.id,
      nombre: row.nombre
    };
  }

  async delete(ejeId: number, tx?: sql.Transaction): Promise<number | null> {
    if (!ejeId || typeof ejeId !== 'number' || ejeId <= 0) {
      throw new Error('Invalid ejeId: must be a positive number');
    }
    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('ejeId', sql.Int, ejeId)
      .query(`
        DELETE FROM tablero.Eje
        OUTPUT DELETED.id
        WHERE id = @ejeId
      `);
    return r.recordset[0]?.id || null;
  }

  async getEjeWithLineasEstrategicas(ejeId: number): Promise<EjeWithLineas | null> {
    if (!ejeId || typeof ejeId !== 'number' || ejeId <= 0) {
      throw new Error('Invalid ejeId: must be a positive number');
    }
    const p = await getPool();
    const r = await p.request()
      .input('ejeId', sql.Int, ejeId)
      .query(`
        SELECT
          e.id as ejeId,
          e.nombre as ejeNombre,
          le.id as lineaId,
          le.nombre as lineaNombre,
          le.descripcion as lineaDescripcion
        FROM tablero.Eje e
        LEFT JOIN tablero.LineaEstrategica le ON e.id = le.idEje
        WHERE e.id = @ejeId
        ORDER BY le.nombre ASC
      `);

    if (r.recordset.length === 0) return null;

    const eje = {
      id: r.recordset[0].ejeId,
      nombre: r.recordset[0].ejeNombre,
      lineasEstrategicas: r.recordset
        .filter((row: any) => row.lineaId)
        .map((row: any) => ({
          id: row.lineaId,
          nombre: row.lineaNombre,
          descripcion: row.lineaDescripcion
        }))
    };

    return eje;
  }
}
