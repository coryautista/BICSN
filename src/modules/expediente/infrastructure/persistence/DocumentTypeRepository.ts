import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { DocumentType, CreateDocumentTypeData, UpdateDocumentTypeData } from '../../domain/entities/Expediente.js';
import { IDocumentTypeRepository } from '../../domain/repositories/IExpedienteRepository.js';

export class DocumentTypeRepository implements IDocumentTypeRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(): Promise<DocumentType[]> {
    const result = await this.mssqlPool.request().query(`
      SELECT
        DocumentTypeId,
        Code,
        Name,
        Required,
        ValidityDays,
        Active,
        CreatedAt,
        UpdatedAt,
        CreatedBy,
        UpdatedBy
      FROM doc.DocumentType
      ORDER BY Name ASC
    `);

    return result.recordset.map((row: any) => ({
      documentTypeId: row.DocumentTypeId,
      code: row.Code,
      name: row.Name,
      required: row.Required === 1 || row.Required === true,
      validityDays: row.ValidityDays,
      active: row.Active === 1 || row.Active === true,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
      createdBy: row.CreatedBy,
      updatedBy: row.UpdatedBy
    }));
  }

  async findById(documentTypeId: number): Promise<DocumentType | undefined> {
    const result = await this.mssqlPool.request()
      .input('documentTypeId', sql.BigInt, documentTypeId)
      .query(`
        SELECT
          DocumentTypeId,
          Code,
          Name,
          Required,
          ValidityDays,
          Active,
          CreatedAt,
          UpdatedAt,
          CreatedBy,
          UpdatedBy
        FROM doc.DocumentType
        WHERE DocumentTypeId = @documentTypeId
      `);

    const row = result.recordset[0];
    if (!row) return undefined;

    return {
      documentTypeId: row.DocumentTypeId,
      code: row.Code,
      name: row.Name,
      required: row.Required === 1 || row.Required === true,
      validityDays: row.ValidityDays,
      active: row.Active === 1 || row.Active === true,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
      createdBy: row.CreatedBy,
      updatedBy: row.UpdatedBy
    };
  }

  async findByCode(code: string): Promise<DocumentType | undefined> {
    const result = await this.mssqlPool.request()
      .input('code', sql.VarChar(30), code)
      .query(`
        SELECT
          DocumentTypeId,
          Code,
          Name,
          Required,
          ValidityDays,
          Active,
          CreatedAt,
          UpdatedAt,
          CreatedBy,
          UpdatedBy
        FROM doc.DocumentType
        WHERE Code = @code
      `);

    const row = result.recordset[0];
    if (!row) return undefined;

    return {
      documentTypeId: row.DocumentTypeId,
      code: row.Code,
      name: row.Name,
      required: row.Required === 1 || row.Required === true,
      validityDays: row.ValidityDays,
      active: row.Active === 1 || row.Active === true,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
      createdBy: row.CreatedBy,
      updatedBy: row.UpdatedBy
    };
  }

  async create(data: CreateDocumentTypeData, userId?: string): Promise<DocumentType> {
    const result = await this.mssqlPool.request()
      .input('code', sql.VarChar(30), data.code)
      .input('name', sql.NVarChar(120), data.name)
      .input('required', sql.Bit, data.required)
      .input('validityDays', sql.Int, data.validityDays)
      .input('active', sql.Bit, data.active)
      .input('createdBy', sql.NVarChar(100), userId ?? null)
      .input('updatedBy', sql.NVarChar(100), userId ?? null)
      .query(`
        INSERT INTO doc.DocumentType (Code, Name, Required, ValidityDays, Active, CreatedBy, UpdatedBy)
        OUTPUT
          INSERTED.DocumentTypeId,
          INSERTED.Code,
          INSERTED.Name,
          INSERTED.Required,
          INSERTED.ValidityDays,
          INSERTED.Active,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt,
          INSERTED.CreatedBy,
          INSERTED.UpdatedBy
        VALUES (@code, @name, @required, @validityDays, @active, @createdBy, @updatedBy)
      `);

    const row = result.recordset[0];
    return {
      documentTypeId: row.DocumentTypeId,
      code: row.Code,
      name: row.Name,
      required: row.Required === 1 || row.Required === true,
      validityDays: row.ValidityDays,
      active: row.Active === 1 || row.Active === true,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
      createdBy: row.CreatedBy,
      updatedBy: row.UpdatedBy
    };
  }

  async update(data: UpdateDocumentTypeData, userId?: string): Promise<DocumentType> {
    // First check if exists
    const existing = await this.findById(data.documentTypeId);
    if (!existing) {
      throw new Error('DOCUMENT_TYPE_NOT_FOUND');
    }

    const updates: string[] = [];
    const request = this.mssqlPool.request();

    request.input('documentTypeId', sql.BigInt, data.documentTypeId);

    if (data.code !== undefined) {
      updates.push('Code = @code');
      request.input('code', sql.VarChar(30), data.code);
    }
    if (data.name !== undefined) {
      updates.push('Name = @name');
      request.input('name', sql.NVarChar(120), data.name);
    }
    if (data.required !== undefined) {
      updates.push('Required = @required');
      request.input('required', sql.Bit, data.required);
    }
    if (data.validityDays !== undefined) {
      updates.push('ValidityDays = @validityDays');
      request.input('validityDays', sql.Int, data.validityDays);
    }
    if (data.active !== undefined) {
      updates.push('Active = @active');
      request.input('active', sql.Bit, data.active);
    }

    updates.push('UpdatedAt = SYSUTCDATETIME()');
    updates.push('UpdatedBy = @updatedBy');
    request.input('updatedBy', sql.NVarChar(100), userId ?? null);

    const result = await request.query(`
      UPDATE doc.DocumentType
      SET ${updates.join(', ')}
      OUTPUT
        INSERTED.DocumentTypeId,
        INSERTED.Code,
        INSERTED.Name,
        INSERTED.Required,
        INSERTED.ValidityDays,
        INSERTED.Active,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt,
        INSERTED.CreatedBy,
        INSERTED.UpdatedBy
      WHERE DocumentTypeId = @documentTypeId
    `);

    const row = result.recordset[0];
    return {
      documentTypeId: row.DocumentTypeId,
      code: row.Code,
      name: row.Name,
      required: row.Required === 1 || row.Required === true,
      validityDays: row.ValidityDays,
      active: row.Active === 1 || row.Active === true,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
      createdBy: row.CreatedBy,
      updatedBy: row.UpdatedBy
    };
  }

  async delete(documentTypeId: number): Promise<void> {
    // First check if exists
    const existing = await this.findById(documentTypeId);
    if (!existing) {
      throw new Error('DOCUMENT_TYPE_NOT_FOUND');
    }

    const result = await this.mssqlPool.request()
      .input('documentTypeId', sql.BigInt, documentTypeId)
      .query(`
        DELETE FROM doc.DocumentType
        WHERE DocumentTypeId = @documentTypeId
      `);

    if (result.rowsAffected[0] === 0) {
      throw new Error('DOCUMENT_TYPE_NOT_FOUND');
    }
  }
}
