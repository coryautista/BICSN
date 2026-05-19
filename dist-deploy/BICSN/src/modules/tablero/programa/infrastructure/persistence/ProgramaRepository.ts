import { IProgramaRepository } from '../../domain/repositories/IProgramaRepository.js';
import { Programa } from '../../domain/entities/Programa.js';
import { getPool, sql } from '../../../../../db/mssql.js';
import { sql as sqlType } from '../../../../../db/context.js';

/**
 * Repository implementation para el módulo Programa
 * Implementa la interface del dominio con acceso directo a la base de datos
 */
export class ProgramaRepository implements IProgramaRepository {
  async findAll(): Promise<Programa[]> {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT
        p.id,
        p.idEje,
        p.idLineaEstrategica,
        p.nombre,
        p.descripcion,
        e.nombre as ejeNombre,
        le.nombre as lineaEstrategicaNombre
      FROM tablero.Programa p
      INNER JOIN tablero.Eje e ON p.idEje = e.id
      INNER JOIN tablero.LineaEstrategica le ON p.idLineaEstrategica = le.id
      ORDER BY e.nombre ASC, le.nombre ASC, p.nombre ASC
    `);
    return r.recordset.map((row: any) => this.mapToPrograma(row));
  }

  async findById(programaId: number): Promise<Programa | null> {
    if (!programaId || typeof programaId !== 'number' || programaId <= 0) {
      throw new Error('Invalid programaId: must be a positive number');
    }
    const p = await getPool();
    const r = await p.request()
      .input('programaId', sql.Int, programaId)
      .query(`
        SELECT
          p.id,
          p.idEje,
          p.idLineaEstrategica,
          p.nombre,
          p.descripcion,
          e.nombre as ejeNombre,
          le.nombre as lineaEstrategicaNombre,
          le.descripcion as lineaEstrategicaDescripcion
        FROM tablero.Programa p
        INNER JOIN tablero.Eje e ON p.idEje = e.id
        INNER JOIN tablero.LineaEstrategica le ON p.idLineaEstrategica = le.id
        WHERE p.id = @programaId
      `);
    const row = r.recordset[0];
    if (!row) return null;
    return {
      id: row.id,
      idEje: row.idEje,
      idLineaEstrategica: row.idLineaEstrategica,
      nombre: row.nombre,
      descripcion: row.descripcion,
      eje: {
        id: row.idEje,
        nombre: row.ejeNombre
      },
      lineaEstrategica: {
        id: row.idLineaEstrategica,
        nombre: row.lineaEstrategicaNombre,
        descripcion: row.lineaEstrategicaDescripcion
      }
    };
  }

  async findByEje(ejeId: number): Promise<Programa[]> {
    if (!ejeId || typeof ejeId !== 'number' || ejeId <= 0) {
      throw new Error('Invalid ejeId: must be a positive number');
    }
    const p = await getPool();
    const r = await p.request()
      .input('ejeId', sql.Int, ejeId)
      .query(`
        SELECT
          p.id,
          p.idEje,
          p.idLineaEstrategica,
          p.nombre,
          p.descripcion,
          le.nombre as lineaEstrategicaNombre,
          le.descripcion as lineaEstrategicaDescripcion
        FROM tablero.Programa p
        INNER JOIN tablero.LineaEstrategica le ON p.idLineaEstrategica = le.id
        WHERE p.idEje = @ejeId
        ORDER BY le.nombre ASC, p.nombre ASC
      `);
    return r.recordset.map((row: any) => ({
      id: row.id,
      idEje: row.idEje,
      idLineaEstrategica: row.idLineaEstrategica,
      nombre: row.nombre,
      descripcion: row.descripcion,
      lineaEstrategica: {
        id: row.idLineaEstrategica,
        nombre: row.lineaEstrategicaNombre,
        descripcion: row.lineaEstrategicaDescripcion
      }
    }));
  }

  async findByLineaEstrategica(lineaEstrategicaId: number): Promise<Programa[]> {
    if (!lineaEstrategicaId || typeof lineaEstrategicaId !== 'number' || lineaEstrategicaId <= 0) {
      throw new Error('Invalid lineaEstrategicaId: must be a positive number');
    }
    const p = await getPool();
    const r = await p.request()
      .input('lineaEstrategicaId', sql.Int, lineaEstrategicaId)
      .query(`
        SELECT
          p.id,
          p.idEje,
          p.idLineaEstrategica,
          p.nombre,
          p.descripcion,
          e.nombre as ejeNombre
        FROM tablero.Programa p
        INNER JOIN tablero.Eje e ON p.idEje = e.id
        WHERE p.idLineaEstrategica = @lineaEstrategicaId
        ORDER BY p.nombre ASC
      `);
    return r.recordset.map((row: any) => ({
      id: row.id,
      idEje: row.idEje,
      idLineaEstrategica: row.idLineaEstrategica,
      nombre: row.nombre,
      descripcion: row.descripcion,
      eje: {
        id: row.idEje,
        nombre: row.ejeNombre
      }
    }));
  }

  async create(
    idEje: number,
    idLineaEstrategica: number,
    nombre: string,
    descripcion: string,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<Programa> {
    if (!idEje || typeof idEje !== 'number' || idEje <= 0) {
      throw new Error('Invalid idEje: must be a positive number');
    }
    if (!idLineaEstrategica || typeof idLineaEstrategica !== 'number' || idLineaEstrategica <= 0) {
      throw new Error('Invalid idLineaEstrategica: must be a positive number');
    }
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 500) {
      throw new Error('Invalid nombre: must be a non-empty string with max 500 characters');
    }
    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.length > 5000) {
      throw new Error('Invalid descripcion: must be a non-empty string with max 5000 characters');
    }
    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('idEje', sql.Int, idEje)
      .input('idLineaEstrategica', sql.Int, idLineaEstrategica)
      .input('nombre', sql.NVarChar(500), nombre)
      .input('descripcion', sql.NVarChar(5000), descripcion)
      .query(`
        INSERT INTO tablero.Programa (idEje, idLineaEstrategica, nombre, descripcion)
        OUTPUT
          INSERTED.id,
          INSERTED.idEje,
          INSERTED.idLineaEstrategica,
          INSERTED.nombre,
          INSERTED.descripcion
        VALUES (@idEje, @idLineaEstrategica, @nombre, @descripcion)
      `);
    const row = r.recordset[0];
    return {
      id: row.id,
      idEje: row.idEje,
      idLineaEstrategica: row.idLineaEstrategica,
      nombre: row.nombre,
      descripcion: row.descripcion
    };
  }

  async update(
    programaId: number,
    nombre?: string,
    descripcion?: string,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<Programa | null> {
    if (!programaId || typeof programaId !== 'number' || programaId <= 0) {
      throw new Error('Invalid programaId: must be a positive number');
    }
    if (nombre !== undefined && (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 500)) {
      throw new Error('Invalid nombre: must be a non-empty string with max 500 characters');
    }
    if (descripcion !== undefined && (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.length > 5000)) {
      throw new Error('Invalid descripcion: must be a non-empty string with max 5000 characters');
    }
    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('programaId', sql.Int, programaId)
      .input('nombre', sql.NVarChar(500), nombre ?? null)
      .input('descripcion', sql.NVarChar(5000), descripcion ?? null)
      .query(`
        UPDATE tablero.Programa
        SET nombre = @nombre,
            descripcion = @descripcion
        OUTPUT
          INSERTED.id,
          INSERTED.idEje,
          INSERTED.idLineaEstrategica,
          INSERTED.nombre,
          INSERTED.descripcion
        WHERE id = @programaId
      `);
    const row = r.recordset[0];
    if (!row) return null;
    return {
      id: row.id,
      idEje: row.idEje,
      idLineaEstrategica: row.idLineaEstrategica,
      nombre: row.nombre,
      descripcion: row.descripcion
    };
  }

  async delete(programaId: number, tx?: sql.Transaction): Promise<number | null> {
    if (!programaId || typeof programaId !== 'number' || programaId <= 0) {
      throw new Error('Invalid programaId: must be a positive number');
    }
    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('programaId', sql.Int, programaId)
      .query(`
        DELETE FROM tablero.Programa
        OUTPUT DELETED.id
        WHERE id = @programaId
      `);
    return r.recordset[0]?.id || null;
  }

  private mapToPrograma(row: any): Programa {
    return {
      id: row.id,
      idEje: row.idEje,
      idLineaEstrategica: row.idLineaEstrategica,
      nombre: row.nombre,
      descripcion: row.descripcion,
      eje: row.ejeNombre ? {
        id: row.idEje,
        nombre: row.ejeNombre
      } : undefined,
      lineaEstrategica: row.lineaEstrategicaNombre ? {
        id: row.idLineaEstrategica,
        nombre: row.lineaEstrategicaNombre
      } : undefined
    };
  }
}
