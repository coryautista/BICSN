import { ILineaEstrategicaRepository } from '../../domain/repositories/ILineaEstrategicaRepository.js';
import { LineaEstrategica, LineaEstrategicaWithProgramas } from '../../domain/entities/LineaEstrategica.js';
import { getPool, sql } from '../../../../../db/mssql.js';
import { sql as sqlType } from '../../../../../db/context.js';

/**
 * Repository implementation para el módulo LineaEstrategica
 * Implementa la interface del dominio con acceso directo a la base de datos
 */
export class LineaEstrategicaRepository implements ILineaEstrategicaRepository {
  async findAll(): Promise<LineaEstrategica[]> {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT
        le.id,
        le.idEje,
        le.nombre,
        le.descripcion,
        e.nombre as ejeNombre
      FROM tablero.LineaEstrategica le
      INNER JOIN tablero.Eje e ON le.idEje = e.id
      ORDER BY e.nombre ASC, le.nombre ASC
    `);
    return r.recordset.map((row: any) => this.mapToLineaEstrategica(row));
  }

  async findById(lineaEstrategicaId: number): Promise<LineaEstrategica | null> {
    if (!lineaEstrategicaId || typeof lineaEstrategicaId !== 'number' || lineaEstrategicaId <= 0) {
      throw new Error('Invalid lineaEstrategicaId: must be a positive number');
    }
    const p = await getPool();
    const r = await p.request()
      .input('lineaEstrategicaId', sql.Int, lineaEstrategicaId)
      .query(`
        SELECT
          le.id,
          le.idEje,
          le.nombre,
          le.descripcion,
          e.nombre as ejeNombre
        FROM tablero.LineaEstrategica le
        INNER JOIN tablero.Eje e ON le.idEje = e.id
        WHERE le.id = @lineaEstrategicaId
      `);
    const row = r.recordset[0];
    if (!row) return null;
    return this.mapToLineaEstrategica(row);
  }

  async findByEje(ejeId: number): Promise<LineaEstrategica[]> {
    if (!ejeId || typeof ejeId !== 'number' || ejeId <= 0) {
      throw new Error('Invalid ejeId: must be a positive number');
    }
    const p = await getPool();
    const r = await p.request()
      .input('ejeId', sql.Int, ejeId)
      .query(`
        SELECT
          le.id,
          le.idEje,
          le.nombre,
          le.descripcion,
          e.nombre as ejeNombre
        FROM tablero.LineaEstrategica le
        INNER JOIN tablero.Eje e ON le.idEje = e.id
        WHERE le.idEje = @ejeId
        ORDER BY le.nombre ASC
      `);
    return r.recordset.map((row: any) => this.mapToLineaEstrategica(row));
  }

  async getLineaEstrategicaWithProgramas(lineaEstrategicaId: number): Promise<LineaEstrategicaWithProgramas | null> {
    if (!lineaEstrategicaId || typeof lineaEstrategicaId !== 'number' || lineaEstrategicaId <= 0) {
      throw new Error('Invalid lineaEstrategicaId: must be a positive number');
    }
    const p = await getPool();
    const r = await p.request()
      .input('lineaEstrategicaId', sql.Int, lineaEstrategicaId)
      .query(`
        SELECT
          le.id as lineaId,
          le.nombre as lineaNombre,
          le.descripcion as lineaDescripcion,
          le.idEje,
          e.nombre as ejeNombre,
          p.id as programaId,
          p.nombre as programaNombre,
          p.descripcion as programaDescripcion
        FROM tablero.LineaEstrategica le
        INNER JOIN tablero.Eje e ON le.idEje = e.id
        LEFT JOIN tablero.Programa p ON le.id = p.idLineaEstrategica
        WHERE le.id = @lineaEstrategicaId
        ORDER BY p.nombre ASC
      `);

    if (r.recordset.length === 0) return null;

    const linea = {
      id: r.recordset[0].lineaId,
      idEje: r.recordset[0].idEje,
      nombre: r.recordset[0].lineaNombre,
      descripcion: r.recordset[0].lineaDescripcion,
      eje: {
        id: r.recordset[0].idEje,
        nombre: r.recordset[0].ejeNombre
      },
      programas: r.recordset
        .filter((row: any) => row.programaId)
        .map((row: any) => ({
          id: row.programaId,
          nombre: row.programaNombre,
          descripcion: row.programaDescripcion
        }))
    };

    return linea;
  }

  async create(
    idEje: number,
    nombre: string,
    descripcion: string,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<LineaEstrategica> {
    if (!idEje || typeof idEje !== 'number' || idEje <= 0) {
      throw new Error('Invalid idEje: must be a positive number');
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
      .input('nombre', sql.NVarChar(500), nombre)
      .input('descripcion', sql.NVarChar(5000), descripcion)
      .query(`
        INSERT INTO tablero.LineaEstrategica (idEje, nombre, descripcion)
        OUTPUT
          INSERTED.id,
          INSERTED.idEje,
          INSERTED.nombre,
          INSERTED.descripcion
        VALUES (@idEje, @nombre, @descripcion)
      `);
    const row = r.recordset[0];
    return {
      id: row.id,
      idEje: row.idEje,
      nombre: row.nombre,
      descripcion: row.descripcion
    };
  }

  async update(
    lineaEstrategicaId: number,
    nombre?: string,
    descripcion?: string,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<LineaEstrategica | null> {
    if (!lineaEstrategicaId || typeof lineaEstrategicaId !== 'number' || lineaEstrategicaId <= 0) {
      throw new Error('Invalid lineaEstrategicaId: must be a positive number');
    }
    if (nombre !== undefined && (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 500)) {
      throw new Error('Invalid nombre: must be a non-empty string with max 500 characters');
    }
    if (descripcion !== undefined && (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.length > 5000)) {
      throw new Error('Invalid descripcion: must be a non-empty string with max 5000 characters');
    }
    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('lineaEstrategicaId', sql.Int, lineaEstrategicaId)
      .input('nombre', sql.NVarChar(500), nombre ?? null)
      .input('descripcion', sql.NVarChar(5000), descripcion ?? null)
      .query(`
        UPDATE tablero.LineaEstrategica
        SET nombre = @nombre,
            descripcion = @descripcion
        OUTPUT
          INSERTED.id,
          INSERTED.idEje,
          INSERTED.nombre,
          INSERTED.descripcion
        WHERE id = @lineaEstrategicaId
      `);
    const row = r.recordset[0];
    if (!row) return null;
    return {
      id: row.id,
      idEje: row.idEje,
      nombre: row.nombre,
      descripcion: row.descripcion
    };
  }

  async delete(lineaEstrategicaId: number, tx?: sql.Transaction): Promise<number | null> {
    if (!lineaEstrategicaId || typeof lineaEstrategicaId !== 'number' || lineaEstrategicaId <= 0) {
      throw new Error('Invalid lineaEstrategicaId: must be a positive number');
    }
    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('lineaEstrategicaId', sql.Int, lineaEstrategicaId)
      .query(`
        DELETE FROM tablero.LineaEstrategica
        OUTPUT DELETED.id
        WHERE id = @lineaEstrategicaId
      `);
    return r.recordset[0]?.id || null;
  }

  private mapToLineaEstrategica(row: any): LineaEstrategica {
    return {
      id: row.id,
      idEje: row.idEje,
      nombre: row.nombre,
      descripcion: row.descripcion,
      eje: {
        id: row.idEje,
        nombre: row.ejeNombre
      }
    };
  }
}
