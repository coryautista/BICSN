import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { Expediente, CreateExpedienteData, UpdateExpedienteData } from '../../domain/entities/Expediente.js';
import { IExpedienteRepository } from '../../domain/repositories/IExpedienteRepository.js';

export class ExpedienteRepository implements IExpedienteRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(): Promise<Expediente[]> {
    const result = await this.mssqlPool.request().query(`
      SELECT
        CURP,
        AfiliadoId,
        Interno,
        Estado,
        Notas,
        CreatedAt,
        UpdatedAt
      FROM doc.Expediente
      ORDER BY CreatedAt DESC
    `);

    return result.recordset.map((row: any) => ({
      curp: row.CURP,
      afiliadoId: row.AfiliadoId,
      interno: row.Interno,
      estado: row.Estado,
      notas: row.Notas,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt
    }));
  }

  async findByCurp(curp: string): Promise<Expediente | undefined> {
    const result = await this.mssqlPool.request()
      .input('curp', sql.Char(18), curp)
      .query(`
        SELECT
          CURP,
          AfiliadoId,
          Interno,
          Estado,
          Notas,
          CreatedAt,
          UpdatedAt
        FROM doc.Expediente
        WHERE CURP = @curp
      `);

    const row = result.recordset[0];
    if (!row) return undefined;

    return {
      curp: row.CURP,
      afiliadoId: row.AfiliadoId,
      interno: row.Interno,
      estado: row.Estado,
      notas: row.Notas,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt
    };
  }

  async create(data: CreateExpedienteData, _userId?: string): Promise<Expediente> {
    const result = await this.mssqlPool.request()
      .input('curp', sql.Char(18), data.curp)
      .input('afiliadoId', sql.BigInt, data.afiliadoId)
      .input('interno', sql.Int, data.interno)
      .input('estado', sql.VarChar(20), data.estado)
      .input('notas', sql.NVarChar(300), data.notas)
      .query(`
        INSERT INTO doc.Expediente (CURP, AfiliadoId, Interno, Estado, Notas)
        OUTPUT
          INSERTED.CURP,
          INSERTED.AfiliadoId,
          INSERTED.Interno,
          INSERTED.Estado,
          INSERTED.Notas,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        VALUES (@curp, @afiliadoId, @interno, @estado, @notas)
      `);

    const row = result.recordset[0];
    return {
      curp: row.CURP,
      afiliadoId: row.AfiliadoId,
      interno: row.Interno,
      estado: row.Estado,
      notas: row.Notas,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt
    };
  }

  async update(data: UpdateExpedienteData, _userId?: string): Promise<Expediente> {
    // First check if exists
    const existing = await this.findByCurp(data.curp);
    if (!existing) {
      throw new Error('EXPEDIENTE_NOT_FOUND');
    }

    const updates: string[] = [];
    const request = this.mssqlPool.request();

    request.input('curp', sql.Char(18), data.curp);

    if (data.afiliadoId !== undefined) {
      updates.push('AfiliadoId = @afiliadoId');
      request.input('afiliadoId', sql.BigInt, data.afiliadoId);
    }
    if (data.interno !== undefined) {
      updates.push('Interno = @interno');
      request.input('interno', sql.Int, data.interno);
    }
    if (data.estado !== undefined) {
      updates.push('Estado = @estado');
      request.input('estado', sql.VarChar(20), data.estado);
    }
    if (data.notas !== undefined) {
      updates.push('Notas = @notas');
      request.input('notas', sql.NVarChar(300), data.notas);
    }

    updates.push('UpdatedAt = SYSUTCDATETIME()');

    const result = await request.query(`
      UPDATE doc.Expediente
      SET ${updates.join(', ')}
      OUTPUT
        INSERTED.CURP,
        INSERTED.AfiliadoId,
        INSERTED.Interno,
        INSERTED.Estado,
        INSERTED.Notas,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt
      WHERE CURP = @curp
    `);

    const row = result.recordset[0];
    return {
      curp: row.CURP,
      afiliadoId: row.AfiliadoId,
      interno: row.Interno,
      estado: row.Estado,
      notas: row.Notas,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt
    };
  }

  async delete(curp: string): Promise<void> {
    // First check if exists
    const existing = await this.findByCurp(curp);
    if (!existing) {
      throw new Error('EXPEDIENTE_NOT_FOUND');
    }

    const result = await this.mssqlPool.request()
      .input('curp', sql.Char(18), curp)
      .query(`
        DELETE FROM doc.Expediente
        WHERE CURP = @curp
      `);

    if (result.rowsAffected[0] === 0) {
      throw new Error('EXPEDIENTE_NOT_FOUND');
    }
  }
}
