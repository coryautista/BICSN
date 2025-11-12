import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { ExpedienteArchivo, CreateExpedienteArchivoData, UpdateExpedienteArchivoData } from '../../domain/entities/Expediente.js';
import { IExpedienteArchivoRepository } from '../../domain/repositories/IExpedienteRepository.js';

export class ExpedienteArchivoRepository implements IExpedienteArchivoRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findById(archivoId: number): Promise<ExpedienteArchivo | undefined> {
    const result = await this.mssqlPool.request()
      .input('archivoId', sql.BigInt, archivoId)
      .query(`
        SELECT
          ArchivoId,
          CURP,
          TipoCodigo,
          Titulo,
          FileName,
          MimeType,
          ByteSize,
          Sha256Hex,
          StorageProvider,
          StoragePath,
          Observaciones,
          CreatedBy,
          CreatedAt,
          UpdatedAt,
          DocumentTypeId
        FROM doc.ExpedienteArchivo
        WHERE ArchivoId = @archivoId
      `);

    const row = result.recordset[0];
    if (!row) return undefined;

    return {
      archivoId: row.ArchivoId,
      curp: row.CURP,
      tipoCodigo: row.TipoCodigo,
      titulo: row.Titulo,
      fileName: row.FileName,
      mimeType: row.MimeType,
      byteSize: row.ByteSize,
      sha256Hex: row.Sha256Hex,
      storageProvider: row.StorageProvider,
      storagePath: row.StoragePath,
      observaciones: row.Observaciones,
      createdBy: row.CreatedBy,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
      documentTypeId: row.DocumentTypeId
    };
  }

  async findByCurp(curp: string): Promise<ExpedienteArchivo[]> {
    const result = await this.mssqlPool.request()
      .input('curp', sql.Char(18), curp)
      .query(`
        SELECT
          ArchivoId,
          CURP,
          TipoCodigo,
          Titulo,
          FileName,
          MimeType,
          ByteSize,
          Sha256Hex,
          StorageProvider,
          StoragePath,
          Observaciones,
          CreatedBy,
          CreatedAt,
          UpdatedAt,
          DocumentTypeId
        FROM doc.ExpedienteArchivo
        WHERE CURP = @curp
        ORDER BY CreatedAt DESC
      `);

    return result.recordset.map((row: any) => ({
      archivoId: row.ArchivoId,
      curp: row.CURP,
      tipoCodigo: row.TipoCodigo,
      titulo: row.Titulo,
      fileName: row.FileName,
      mimeType: row.MimeType,
      byteSize: row.ByteSize,
      sha256Hex: row.Sha256Hex,
      storageProvider: row.StorageProvider,
      storagePath: row.StoragePath,
      observaciones: row.Observaciones,
      createdBy: row.CreatedBy,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
      documentTypeId: row.DocumentTypeId
    }));
  }

  async findByCurpAndSha256(curp: string, sha256Hex: string): Promise<ExpedienteArchivo | undefined> {
    const result = await this.mssqlPool.request()
      .input('curp', sql.Char(18), curp)
      .input('sha256Hex', sql.Char(64), sha256Hex)
      .query(`
        SELECT
          ArchivoId,
          CURP,
          TipoCodigo,
          Titulo,
          FileName,
          MimeType,
          ByteSize,
          Sha256Hex,
          StorageProvider,
          StoragePath,
          Observaciones,
          CreatedBy,
          CreatedAt,
          UpdatedAt,
          DocumentTypeId
        FROM doc.ExpedienteArchivo
        WHERE CURP = @curp AND Sha256Hex = @sha256Hex
      `);

    const row = result.recordset[0];
    if (!row) return undefined;

    return {
      archivoId: row.ArchivoId,
      curp: row.CURP,
      tipoCodigo: row.TipoCodigo,
      titulo: row.Titulo,
      fileName: row.FileName,
      mimeType: row.MimeType,
      byteSize: row.ByteSize,
      sha256Hex: row.Sha256Hex,
      storageProvider: row.StorageProvider,
      storagePath: row.StoragePath,
      observaciones: row.Observaciones,
      createdBy: row.CreatedBy,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
      documentTypeId: row.DocumentTypeId
    };
  }

  async create(data: CreateExpedienteArchivoData, userId?: string): Promise<ExpedienteArchivo> {
    const result = await this.mssqlPool.request()
      .input('curp', sql.Char(18), data.curp)
      .input('tipoCodigo', sql.VarChar(30), data.tipoCodigo)
      .input('titulo', sql.NVarChar(200), data.titulo)
      .input('fileName', sql.NVarChar(300), data.fileName)
      .input('mimeType', sql.VarChar(100), data.mimeType)
      .input('byteSize', sql.BigInt, data.byteSize)
      .input('sha256Hex', sql.Char(64), data.sha256Hex)
      .input('storageProvider', sql.VarChar(30), data.storageProvider)
      .input('storagePath', sql.NVarChar(500), data.storagePath)
      .input('observaciones', sql.NVarChar(300), data.observaciones)
      .input('documentTypeId', sql.BigInt, data.documentTypeId)
      .input('createdBy', sql.NVarChar(100), userId ?? null)
      .query(`
        INSERT INTO doc.ExpedienteArchivo (
          CURP, TipoCodigo, Titulo, FileName, MimeType, ByteSize,
          Sha256Hex, StorageProvider, StoragePath, Observaciones,
          DocumentTypeId, CreatedBy
        )
        OUTPUT
          INSERTED.ArchivoId,
          INSERTED.CURP,
          INSERTED.TipoCodigo,
          INSERTED.Titulo,
          INSERTED.FileName,
          INSERTED.MimeType,
          INSERTED.ByteSize,
          INSERTED.Sha256Hex,
          INSERTED.StorageProvider,
          INSERTED.StoragePath,
          INSERTED.Observaciones,
          INSERTED.CreatedBy,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt,
          INSERTED.DocumentTypeId
        VALUES (
          @curp, @tipoCodigo, @titulo, @fileName, @mimeType, @byteSize,
          @sha256Hex, @storageProvider, @storagePath, @observaciones,
          @documentTypeId, @createdBy
        )
      `);

    const row = result.recordset[0];
    return {
      archivoId: row.ArchivoId,
      curp: row.CURP,
      tipoCodigo: row.TipoCodigo,
      titulo: row.Titulo,
      fileName: row.FileName,
      mimeType: row.MimeType,
      byteSize: row.ByteSize,
      sha256Hex: row.Sha256Hex,
      storageProvider: row.StorageProvider,
      storagePath: row.StoragePath,
      observaciones: row.Observaciones,
      createdBy: row.CreatedBy,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
      documentTypeId: row.DocumentTypeId
    };
  }

  async update(data: UpdateExpedienteArchivoData, _userId?: string): Promise<ExpedienteArchivo> {
    // First check if exists
    const existing = await this.findById(data.archivoId);
    if (!existing) {
      throw new Error('EXPEDIENTE_ARCHIVO_NOT_FOUND');
    }

    const updates: string[] = [];
    const request = this.mssqlPool.request();

    request.input('archivoId', sql.BigInt, data.archivoId);

    if (data.tipoCodigo !== undefined) {
      updates.push('TipoCodigo = @tipoCodigo');
      request.input('tipoCodigo', sql.VarChar(30), data.tipoCodigo);
    }
    if (data.titulo !== undefined) {
      updates.push('Titulo = @titulo');
      request.input('titulo', sql.NVarChar(200), data.titulo);
    }
    if (data.fileName !== undefined) {
      updates.push('FileName = @fileName');
      request.input('fileName', sql.NVarChar(300), data.fileName);
    }
    if (data.mimeType !== undefined) {
      updates.push('MimeType = @mimeType');
      request.input('mimeType', sql.VarChar(100), data.mimeType);
    }
    if (data.byteSize !== undefined) {
      updates.push('ByteSize = @byteSize');
      request.input('byteSize', sql.BigInt, data.byteSize);
    }
    if (data.sha256Hex !== undefined) {
      updates.push('Sha256Hex = @sha256Hex');
      request.input('sha256Hex', sql.Char(64), data.sha256Hex);
    }
    if (data.storageProvider !== undefined) {
      updates.push('StorageProvider = @storageProvider');
      request.input('storageProvider', sql.VarChar(30), data.storageProvider);
    }
    if (data.storagePath !== undefined) {
      updates.push('StoragePath = @storagePath');
      request.input('storagePath', sql.NVarChar(500), data.storagePath);
    }
    if (data.observaciones !== undefined) {
      updates.push('Observaciones = @observaciones');
      request.input('observaciones', sql.NVarChar(300), data.observaciones);
    }
    if (data.documentTypeId !== undefined) {
      updates.push('DocumentTypeId = @documentTypeId');
      request.input('documentTypeId', sql.BigInt, data.documentTypeId);
    }

    updates.push('UpdatedAt = SYSUTCDATETIME()');

    const result = await request.query(`
      UPDATE doc.ExpedienteArchivo
      SET ${updates.join(', ')}
      OUTPUT
        INSERTED.ArchivoId,
        INSERTED.CURP,
        INSERTED.TipoCodigo,
        INSERTED.Titulo,
        INSERTED.FileName,
        INSERTED.MimeType,
        INSERTED.ByteSize,
        INSERTED.Sha256Hex,
        INSERTED.StorageProvider,
        INSERTED.StoragePath,
        INSERTED.Observaciones,
        INSERTED.CreatedBy,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt,
        INSERTED.DocumentTypeId
      WHERE ArchivoId = @archivoId
    `);

    const row = result.recordset[0];
    return {
      archivoId: row.ArchivoId,
      curp: row.CURP,
      tipoCodigo: row.TipoCodigo,
      titulo: row.Titulo,
      fileName: row.FileName,
      mimeType: row.MimeType,
      byteSize: row.ByteSize,
      sha256Hex: row.Sha256Hex,
      storageProvider: row.StorageProvider,
      storagePath: row.StoragePath,
      observaciones: row.Observaciones,
      createdBy: row.CreatedBy,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
      documentTypeId: row.DocumentTypeId
    };
  }

  async delete(archivoId: number): Promise<void> {
    // First check if exists
    const existing = await this.findById(archivoId);
    if (!existing) {
      throw new Error('EXPEDIENTE_ARCHIVO_NOT_FOUND');
    }

    const result = await this.mssqlPool.request()
      .input('archivoId', sql.BigInt, archivoId)
      .query(`
        DELETE FROM doc.ExpedienteArchivo
        WHERE ArchivoId = @archivoId
      `);

    if (result.rowsAffected[0] === 0) {
      throw new Error('EXPEDIENTE_ARCHIVO_NOT_FOUND');
    }
  }
}
