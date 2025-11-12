import { ConnectionPool } from 'mssql';
import { sql } from '../../../../db/mssql.js';
import { AfiliadoOrg, CreateAfiliadoOrgData, UpdateAfiliadoOrgData } from '../../domain/entities/AfiliadoOrg.js';
import { IAfiliadoOrgRepository } from '../../domain/repositories/IAfiliadoOrgRepository.js';

export class AfiliadoOrgRepository implements IAfiliadoOrgRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(): Promise<AfiliadoOrg[]> {
    const r = await this.mssqlPool.request().query(`
      SELECT
        id, afiliadoId, nivel0Id, nivel1Id, nivel2Id, nivel3Id,
        claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3,
        interno, sueldo, otrasPrestaciones, quinquenios, activo,
        fechaMovAlt, orgs1, orgs2, orgs3, orgs4, dSueldo,
        dOtrasPrestaciones, dQuinquenios, aplicar, bc, porcentaje,
        createdAt, updatedAt
      FROM afi.AfiliadoOrg
      ORDER BY id
    `);
    return r.recordset.map((row: any) => ({
      id: row.id,
      afiliadoId: row.afiliadoId,
      nivel0Id: row.nivel0Id,
      nivel1Id: row.nivel1Id,
      nivel2Id: row.nivel2Id,
      nivel3Id: row.nivel3Id,
      claveOrganica0: row.claveOrganica0,
      claveOrganica1: row.claveOrganica1,
      claveOrganica2: row.claveOrganica2,
      claveOrganica3: row.claveOrganica3,
      interno: row.interno,
      sueldo: row.sueldo,
      otrasPrestaciones: row.otrasPrestaciones,
      quinquenios: row.quinquenios,
      activo: row.activo === 1 || row.activo === true,
      fechaMovAlt: row.fechaMovAlt?.toISOString().split('T')[0] || null,
      orgs1: row.orgs1,
      orgs2: row.orgs2,
      orgs3: row.orgs3,
      orgs4: row.orgs4,
      dSueldo: row.dSueldo,
      dOtrasPrestaciones: row.dOtrasPrestaciones,
      dQuinquenios: row.dQuinquenios,
      aplicar: row.aplicar === 1 || row.aplicar === true ? true : row.aplicar === 0 || row.aplicar === false ? false : null,
      bc: row.bc,
      porcentaje: row.porcentaje,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    }));
  }

  async findById(id: number): Promise<AfiliadoOrg | undefined> {
    const r = await this.mssqlPool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT
          id, afiliadoId, nivel0Id, nivel1Id, nivel2Id, nivel3Id,
          claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3,
          interno, sueldo, otrasPrestaciones, quinquenios, activo,
          fechaMovAlt, orgs1, orgs2, orgs3, orgs4, dSueldo,
          dOtrasPrestaciones, dQuinquenios, aplicar, bc, porcentaje,
          createdAt, updatedAt
        FROM afi.AfiliadoOrg
        WHERE id = @id
      `);
    const row = r.recordset[0];
    if (!row) return undefined;
    return {
      id: row.id,
      afiliadoId: row.afiliadoId,
      nivel0Id: row.nivel0Id,
      nivel1Id: row.nivel1Id,
      nivel2Id: row.nivel2Id,
      nivel3Id: row.nivel3Id,
      claveOrganica0: row.claveOrganica0,
      claveOrganica1: row.claveOrganica1,
      claveOrganica2: row.claveOrganica2,
      claveOrganica3: row.claveOrganica3,
      interno: row.interno,
      sueldo: row.sueldo,
      otrasPrestaciones: row.otrasPrestaciones,
      quinquenios: row.quinquenios,
      activo: row.activo === 1 || row.activo === true,
      fechaMovAlt: row.fechaMovAlt?.toISOString().split('T')[0] || null,
      orgs1: row.orgs1,
      orgs2: row.orgs2,
      orgs3: row.orgs3,
      orgs4: row.orgs4,
      dSueldo: row.dSueldo,
      dOtrasPrestaciones: row.dOtrasPrestaciones,
      dQuinquenios: row.dQuinquenios,
      aplicar: row.aplicar === 1 || row.aplicar === true ? true : row.aplicar === 0 || row.aplicar === false ? false : null,
      bc: row.bc,
      porcentaje: row.porcentaje,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  async findByAfiliadoId(afiliadoId: number): Promise<AfiliadoOrg[]> {
    const r = await this.mssqlPool.request()
      .input('afiliadoId', sql.Int, afiliadoId)
      .query(`
        SELECT
          id, afiliadoId, nivel0Id, nivel1Id, nivel2Id, nivel3Id,
          claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3,
          interno, sueldo, otrasPrestaciones, quinquenios, activo,
          fechaMovAlt, orgs1, orgs2, orgs3, orgs4, dSueldo,
          dOtrasPrestaciones, dQuinquenios, aplicar, bc, porcentaje,
          createdAt, updatedAt
        FROM afi.AfiliadoOrg
        WHERE afiliadoId = @afiliadoId
        ORDER BY id
      `);
    return r.recordset.map((row: any) => ({
      id: row.id,
      afiliadoId: row.afiliadoId,
      nivel0Id: row.nivel0Id,
      nivel1Id: row.nivel1Id,
      nivel2Id: row.nivel2Id,
      nivel3Id: row.nivel3Id,
      claveOrganica0: row.claveOrganica0,
      claveOrganica1: row.claveOrganica1,
      claveOrganica2: row.claveOrganica2,
      claveOrganica3: row.claveOrganica3,
      interno: row.interno,
      sueldo: row.sueldo,
      otrasPrestaciones: row.otrasPrestaciones,
      quinquenios: row.quinquenios,
      activo: row.activo === 1 || row.activo === true,
      fechaMovAlt: row.fechaMovAlt?.toISOString().split('T')[0] || null,
      orgs1: row.orgs1,
      orgs2: row.orgs2,
      orgs3: row.orgs3,
      orgs4: row.orgs4,
      dSueldo: row.dSueldo,
      dOtrasPrestaciones: row.dOtrasPrestaciones,
      dQuinquenios: row.dQuinquenios,
      aplicar: row.aplicar === 1 || row.aplicar === true ? true : row.aplicar === 0 || row.aplicar === false ? false : null,
      bc: row.bc,
      porcentaje: row.porcentaje,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    }));
  }

  async create(data: CreateAfiliadoOrgData): Promise<AfiliadoOrg> {
    const r = await this.mssqlPool.request()
      .input('afiliadoId', sql.Int, data.afiliadoId)
      .input('nivel0Id', sql.BigInt, data.nivel0Id)
      .input('nivel1Id', sql.BigInt, data.nivel1Id)
      .input('nivel2Id', sql.BigInt, data.nivel2Id)
      .input('nivel3Id', sql.BigInt, data.nivel3Id)
      .input('claveOrganica0', sql.VarChar(30), data.claveOrganica0)
      .input('claveOrganica1', sql.VarChar(30), data.claveOrganica1)
      .input('claveOrganica2', sql.VarChar(30), data.claveOrganica2)
      .input('claveOrganica3', sql.VarChar(30), data.claveOrganica3)
      .input('interno', sql.Int, data.interno)
      .input('sueldo', sql.Decimal(12, 2), data.sueldo)
      .input('otrasPrestaciones', sql.Decimal(12, 2), data.otrasPrestaciones)
      .input('quinquenios', sql.Decimal(12, 2), data.quinquenios)
      .input('activo', sql.Bit, data.activo)
      .input('fechaMovAlt', sql.Date, data.fechaMovAlt ? new Date(data.fechaMovAlt) : null)
      .input('orgs1', sql.VarChar(200), data.orgs1)
      .input('orgs2', sql.VarChar(200), data.orgs2)
      .input('orgs3', sql.VarChar(200), data.orgs3)
      .input('orgs4', sql.VarChar(200), data.orgs4)
      .input('dSueldo', sql.VarChar(200), data.dSueldo)
      .input('dOtrasPrestaciones', sql.VarChar(200), data.dOtrasPrestaciones)
      .input('dQuinquenios', sql.VarChar(200), data.dQuinquenios)
      .input('aplicar', sql.Bit, data.aplicar)
      .input('bc', sql.VarChar(30), data.bc)
      .input('porcentaje', sql.Decimal(9, 4), data.porcentaje)
      .query(`
        INSERT INTO afi.AfiliadoOrg (
          afiliadoId, nivel0Id, nivel1Id, nivel2Id, nivel3Id,
          claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3,
          interno, sueldo, otrasPrestaciones, quinquenios, activo,
          fechaMovAlt, orgs1, orgs2, orgs3, orgs4, dSueldo,
          dOtrasPrestaciones, dQuinquenios, aplicar, bc, porcentaje
        )
        OUTPUT INSERTED.*
        VALUES (
          @afiliadoId, @nivel0Id, @nivel1Id, @nivel2Id, @nivel3Id,
          @claveOrganica0, @claveOrganica1, @claveOrganica2, @claveOrganica3,
          @interno, @sueldo, @otrasPrestaciones, @quinquenios, @activo,
          @fechaMovAlt, @orgs1, @orgs2, @orgs3, @orgs4, @dSueldo,
          @dOtrasPrestaciones, @dQuinquenios, @aplicar, @bc, @porcentaje
        )
      `);
    const row = r.recordset[0];
    return {
      id: row.id,
      afiliadoId: row.afiliadoId,
      nivel0Id: row.nivel0Id,
      nivel1Id: row.nivel1Id,
      nivel2Id: row.nivel2Id,
      nivel3Id: row.nivel3Id,
      claveOrganica0: row.claveOrganica0,
      claveOrganica1: row.claveOrganica1,
      claveOrganica2: row.claveOrganica2,
      claveOrganica3: row.claveOrganica3,
      interno: row.interno,
      sueldo: row.sueldo,
      otrasPrestaciones: row.otrasPrestaciones,
      quinquenios: row.quinquenios,
      activo: row.activo === 1 || row.activo === true,
      fechaMovAlt: row.fechaMovAlt?.toISOString().split('T')[0] || null,
      orgs1: row.orgs1,
      orgs2: row.orgs2,
      orgs3: row.orgs3,
      orgs4: row.orgs4,
      dSueldo: row.dSueldo,
      dOtrasPrestaciones: row.dOtrasPrestaciones,
      dQuinquenios: row.dQuinquenios,
      aplicar: row.aplicar === 1 || row.aplicar === true ? true : row.aplicar === 0 || row.aplicar === false ? false : null,
      bc: row.bc,
      porcentaje: row.porcentaje,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  async update(data: UpdateAfiliadoOrgData): Promise<AfiliadoOrg> {
    const updates: string[] = [];
    const request = this.mssqlPool.request().input('id', sql.BigInt, data.id);

    if (data.afiliadoId !== undefined) {
      updates.push('afiliadoId = @afiliadoId');
      request.input('afiliadoId', sql.Int, data.afiliadoId);
    }
    if (data.nivel0Id !== undefined) {
      updates.push('nivel0Id = @nivel0Id');
      request.input('nivel0Id', sql.BigInt, data.nivel0Id);
    }
    if (data.nivel1Id !== undefined) {
      updates.push('nivel1Id = @nivel1Id');
      request.input('nivel1Id', sql.BigInt, data.nivel1Id);
    }
    if (data.nivel2Id !== undefined) {
      updates.push('nivel2Id = @nivel2Id');
      request.input('nivel2Id', sql.BigInt, data.nivel2Id);
    }
    if (data.nivel3Id !== undefined) {
      updates.push('nivel3Id = @nivel3Id');
      request.input('nivel3Id', sql.BigInt, data.nivel3Id);
    }
    if (data.claveOrganica0 !== undefined) {
      updates.push('claveOrganica0 = @claveOrganica0');
      request.input('claveOrganica0', sql.VarChar(30), data.claveOrganica0);
    }
    if (data.claveOrganica1 !== undefined) {
      updates.push('claveOrganica1 = @claveOrganica1');
      request.input('claveOrganica1', sql.VarChar(30), data.claveOrganica1);
    }
    if (data.claveOrganica2 !== undefined) {
      updates.push('claveOrganica2 = @claveOrganica2');
      request.input('claveOrganica2', sql.VarChar(30), data.claveOrganica2);
    }
    if (data.claveOrganica3 !== undefined) {
      updates.push('claveOrganica3 = @claveOrganica3');
      request.input('claveOrganica3', sql.VarChar(30), data.claveOrganica3);
    }
    if (data.interno !== undefined) {
      updates.push('interno = @interno');
      request.input('interno', sql.Int, data.interno);
    }
    if (data.sueldo !== undefined) {
      updates.push('sueldo = @sueldo');
      request.input('sueldo', sql.Decimal(12, 2), data.sueldo);
    }
    if (data.otrasPrestaciones !== undefined) {
      updates.push('otrasPrestaciones = @otrasPrestaciones');
      request.input('otrasPrestaciones', sql.Decimal(12, 2), data.otrasPrestaciones);
    }
    if (data.quinquenios !== undefined) {
      updates.push('quinquenios = @quinquenios');
      request.input('quinquenios', sql.Decimal(12, 2), data.quinquenios);
    }
    if (data.activo !== undefined) {
      updates.push('activo = @activo');
      request.input('activo', sql.Bit, data.activo);
    }
    if (data.fechaMovAlt !== undefined) {
      updates.push('fechaMovAlt = @fechaMovAlt');
      request.input('fechaMovAlt', sql.Date, data.fechaMovAlt ? new Date(data.fechaMovAlt) : null);
    }
    if (data.orgs1 !== undefined) {
      updates.push('orgs1 = @orgs1');
      request.input('orgs1', sql.VarChar(200), data.orgs1);
    }
    if (data.orgs2 !== undefined) {
      updates.push('orgs2 = @orgs2');
      request.input('orgs2', sql.VarChar(200), data.orgs2);
    }
    if (data.orgs3 !== undefined) {
      updates.push('orgs3 = @orgs3');
      request.input('orgs3', sql.VarChar(200), data.orgs3);
    }
    if (data.orgs4 !== undefined) {
      updates.push('orgs4 = @orgs4');
      request.input('orgs4', sql.VarChar(200), data.orgs4);
    }
    if (data.dSueldo !== undefined) {
      updates.push('dSueldo = @dSueldo');
      request.input('dSueldo', sql.VarChar(200), data.dSueldo);
    }
    if (data.dOtrasPrestaciones !== undefined) {
      updates.push('dOtrasPrestaciones = @dOtrasPrestaciones');
      request.input('dOtrasPrestaciones', sql.VarChar(200), data.dOtrasPrestaciones);
    }
    if (data.dQuinquenios !== undefined) {
      updates.push('dQuinquenios = @dQuinquenios');
      request.input('dQuinquenios', sql.VarChar(200), data.dQuinquenios);
    }
    if (data.aplicar !== undefined) {
      updates.push('aplicar = @aplicar');
      request.input('aplicar', sql.Bit, data.aplicar);
    }
    if (data.bc !== undefined) {
      updates.push('bc = @bc');
      request.input('bc', sql.VarChar(30), data.bc);
    }
    if (data.porcentaje !== undefined) {
      updates.push('porcentaje = @porcentaje');
      request.input('porcentaje', sql.Decimal(9, 4), data.porcentaje);
    }

    updates.push('updatedAt = SYSUTCDATETIME()');

    const r = await request.query(`
      UPDATE afi.AfiliadoOrg
      SET ${updates.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
    
    const row = r.recordset[0];
    if (!row) throw new Error('AFILIADO_ORG_NOT_FOUND');
    
    return {
      id: row.id,
      afiliadoId: row.afiliadoId,
      nivel0Id: row.nivel0Id,
      nivel1Id: row.nivel1Id,
      nivel2Id: row.nivel2Id,
      nivel3Id: row.nivel3Id,
      claveOrganica0: row.claveOrganica0,
      claveOrganica1: row.claveOrganica1,
      claveOrganica2: row.claveOrganica2,
      claveOrganica3: row.claveOrganica3,
      interno: row.interno,
      sueldo: row.sueldo,
      otrasPrestaciones: row.otrasPrestaciones,
      quinquenios: row.quinquenios,
      activo: row.activo === 1 || row.activo === true,
      fechaMovAlt: row.fechaMovAlt?.toISOString().split('T')[0] || null,
      orgs1: row.orgs1,
      orgs2: row.orgs2,
      orgs3: row.orgs3,
      orgs4: row.orgs4,
      dSueldo: row.dSueldo,
      dOtrasPrestaciones: row.dOtrasPrestaciones,
      dQuinquenios: row.dQuinquenios,
      aplicar: row.aplicar === 1 || row.aplicar === true ? true : row.aplicar === 0 || row.aplicar === false ? false : null,
      bc: row.bc,
      porcentaje: row.porcentaje,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  async delete(id: number): Promise<void> {
    const r = await this.mssqlPool.request()
      .input('id', sql.BigInt, id)
      .query(`
        DELETE FROM afi.AfiliadoOrg
        WHERE id = @id
        SELECT @@ROWCOUNT as deletedCount
      `);
    if (r.recordset[0].deletedCount === 0) {
      throw new Error('AFILIADO_ORG_NOT_FOUND');
    }
  }
}
