import { getPool, sql } from '../../db/mssql.js';
import { sql as sqlType } from '../../db/context.js';

// DocumentType operations
export async function findDocumentTypeById(documentTypeId: number) {
  const p = await getPool();
  const r = await p.request()
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
        UpdatedAt
      FROM doc.DocumentType
      WHERE DocumentTypeId = @documentTypeId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    documentTypeId: row.DocumentTypeId,
    code: row.Code,
    name: row.Name,
    required: row.Required,
    validityDays: row.ValidityDays,
    active: row.Active,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt
  };
}

export async function findDocumentTypeByCode(code: string) {
  const p = await getPool();
  const r = await p.request()
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
        UpdatedAt
      FROM doc.DocumentType
      WHERE Code = @code
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    documentTypeId: row.DocumentTypeId,
    code: row.Code,
    name: row.Name,
    required: row.Required,
    validityDays: row.ValidityDays,
    active: row.Active,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt
  };
}

export async function listDocumentTypes() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      DocumentTypeId,
      Code,
      Name,
      Required,
      ValidityDays,
      Active,
      CreatedAt,
      UpdatedAt
    FROM doc.DocumentType
    ORDER BY Name ASC
  `);
  return r.recordset.map((row: any) => ({
    documentTypeId: row.DocumentTypeId,
    code: row.Code,
    name: row.Name,
    required: row.Required,
    validityDays: row.ValidityDays,
    active: row.Active,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt
  }));
}

export async function createDocumentType(code: string, name: string, required: boolean, validityDays: number | null, active: boolean, userId?: string, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('code', sql.VarChar(30), code)
    .input('name', sql.NVarChar(120), name)
    .input('required', sql.Bit, required)
    .input('validityDays', sql.Int, validityDays)
    .input('active', sql.Bit, active)
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
  const row = r.recordset[0];
  return {
    documentTypeId: row.DocumentTypeId,
    code: row.Code,
    name: row.Name,
    required: row.Required,
    validityDays: row.ValidityDays,
    active: row.Active,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    createdBy: row.CreatedBy,
    updatedBy: row.UpdatedBy
  };
}

export async function updateDocumentType(documentTypeId: number, code?: string, name?: string, required?: boolean, validityDays?: number | null, active?: boolean, userId?: string, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('documentTypeId', sql.BigInt, documentTypeId)
    .input('code', sql.VarChar(30), code ?? null)
    .input('name', sql.NVarChar(120), name ?? null)
    .input('required', sql.Bit, required ?? null)
    .input('validityDays', sql.Int, validityDays ?? null)
    .input('active', sql.Bit, active ?? null)
    .input('updatedBy', sql.NVarChar(100), userId ?? null)
    .query(`
      UPDATE doc.DocumentType
      SET Code = @code,
          Name = @name,
          Required = @required,
          ValidityDays = @validityDays,
          Active = @active,
          UpdatedAt = SYSUTCDATETIME(),
          UpdatedBy = @updatedBy
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
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    documentTypeId: row.DocumentTypeId,
    code: row.Code,
    name: row.Name,
    required: row.Required,
    validityDays: row.ValidityDays,
    active: row.Active,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    createdBy: row.CreatedBy,
    updatedBy: row.UpdatedBy
  };
}

export async function deleteDocumentType(documentTypeId: number, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('documentTypeId', sql.BigInt, documentTypeId)
    .query(`
      DELETE FROM doc.DocumentType
      OUTPUT DELETED.DocumentTypeId
      WHERE DocumentTypeId = @documentTypeId
    `);
  return r.recordset[0]?.DocumentTypeId;
}

// Expediente operations
export async function findExpedienteByCurp(curp: string) {
  const p = await getPool();
  const r = await p.request()
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
  const row = r.recordset[0];
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

export async function listExpedientes() {
  const p = await getPool();
  const r = await p.request().query(`
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
  return r.recordset.map((row: any) => ({
    curp: row.CURP,
    afiliadoId: row.AfiliadoId,
    interno: row.Interno,
    estado: row.Estado,
    notas: row.Notas,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt
  }));
}


export async function createExpediente(curp: string, afiliadoId: number | null, interno: number | null, estado: string, notas: string | null, _userId?: string, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('curp', sql.Char(18), curp)
    .input('afiliadoId', sql.BigInt, afiliadoId)
    .input('interno', sql.Int, interno)
    .input('estado', sql.VarChar(20), estado)
    .input('notas', sql.NVarChar(300), notas)
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
  const row = r.recordset[0];
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

export async function updateExpediente(curp: string, afiliadoId?: number | null, interno?: number | null, estado?: string, notas?: string | null, _userId?: string, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('curp', sql.Char(18), curp)
    .input('afiliadoId', sql.BigInt, afiliadoId ?? null)
    .input('interno', sql.Int, interno ?? null)
    .input('estado', sql.VarChar(20), estado ?? null)
    .input('notas', sql.NVarChar(300), notas ?? null)
    .query(`
      UPDATE doc.Expediente
      SET AfiliadoId = @afiliadoId,
          Interno = @interno,
          Estado = @estado,
          Notas = @notas,
          UpdatedAt = SYSUTCDATETIME()
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
  const row = r.recordset[0];
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

export async function deleteExpediente(curp: string, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('curp', sql.Char(18), curp)
    .query(`
      DELETE FROM doc.Expediente
      OUTPUT DELETED.CURP
      WHERE CURP = @curp
    `);
  return r.recordset[0]?.CURP;
}

// ExpedienteArchivo operations
export async function findExpedienteArchivoById(archivoId: number) {
  const p = await getPool();
  const r = await p.request()
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
  const row = r.recordset[0];
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

export async function findExpedienteArchivoByCurpAndSha256(curp: string, sha256Hex: string) {
  const p = await getPool();
  const r = await p.request()
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
  const row = r.recordset[0];
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

export async function listExpedienteArchivosByCurp(curp: string) {
  const p = await getPool();
  const r = await p.request()
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
  return r.recordset.map((row: any) => ({
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

export async function createExpedienteArchivo(curp: string, tipoCodigo: string | null, titulo: string, fileName: string, mimeType: string, byteSize: number, sha256Hex: string | null, storageProvider: string, storagePath: string, observaciones: string | null, documentTypeId: number | null, userId?: string, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  // Note: Request timeouts are configured at the connection pool level in mssql v12
  // The global requestTimeout is set to 60 seconds in mssql.ts which is sufficient for this operation
  const r = await req
    .input('curp', sql.Char(18), curp)
    .input('tipoCodigo', sql.VarChar(30), tipoCodigo)
    .input('titulo', sql.NVarChar(200), titulo)
    .input('fileName', sql.NVarChar(260), fileName)
    .input('mimeType', sql.NVarChar(120), mimeType)
    .input('byteSize', sql.BigInt, byteSize)
    .input('sha256Hex', sql.Char(64), sha256Hex)
    .input('storageProvider', sql.VarChar(20), storageProvider)
    .input('storagePath', sql.NVarChar(500), storagePath)
    .input('observaciones', sql.NVarChar(300), observaciones)
    .input('createdBy', sql.NVarChar(100), userId ?? null)
    .input('documentTypeId', sql.BigInt, documentTypeId)
    .query(`
      INSERT INTO doc.ExpedienteArchivo (CURP, TipoCodigo, Titulo, FileName, MimeType, ByteSize, Sha256Hex, StorageProvider, StoragePath, Observaciones, CreatedBy, DocumentTypeId)
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
      VALUES (@curp, @tipoCodigo, @titulo, @fileName, @mimeType, @byteSize, @sha256Hex, @storageProvider, @storagePath, @observaciones, @createdBy, @documentTypeId)
    `);
  const row = r.recordset[0];
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

export async function updateExpedienteArchivo(archivoId: number, tipoCodigo?: string | null, titulo?: string, fileName?: string, mimeType?: string, byteSize?: number, sha256Hex?: string, storageProvider?: string, storagePath?: string, observaciones?: string | null, documentTypeId?: number | null, _userId?: string, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('archivoId', sql.BigInt, archivoId)
    .input('tipoCodigo', sql.VarChar(30), tipoCodigo ?? null)
    .input('titulo', sql.NVarChar(200), titulo ?? null)
    .input('fileName', sql.NVarChar(260), fileName ?? null)
    .input('mimeType', sql.NVarChar(120), mimeType ?? null)
    .input('byteSize', sql.BigInt, byteSize ?? null)
    .input('sha256Hex', sql.Char(64), sha256Hex ?? null)
    .input('storageProvider', sql.VarChar(20), storageProvider ?? null)
    .input('storagePath', sql.NVarChar(500), storagePath ?? null)
    .input('observaciones', sql.NVarChar(300), observaciones ?? null)
    .input('documentTypeId', sql.BigInt, documentTypeId ?? null)
    .query(`
      UPDATE doc.ExpedienteArchivo
      SET TipoCodigo = @tipoCodigo,
          Titulo = @titulo,
          FileName = @fileName,
          MimeType = @mimeType,
          ByteSize = @byteSize,
          Sha256Hex = @sha256Hex,
          StorageProvider = @storageProvider,
          StoragePath = @storagePath,
          Observaciones = @observaciones,
          UpdatedAt = SYSUTCDATETIME(),
          DocumentTypeId = @documentTypeId
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
  const row = r.recordset[0];
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

export async function deleteExpedienteArchivo(archivoId: number, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('archivoId', sql.BigInt, archivoId)
    .query(`
      DELETE FROM doc.ExpedienteArchivo
      OUTPUT DELETED.ArchivoId
      WHERE ArchivoId = @archivoId
    `);
  return r.recordset[0]?.ArchivoId;
}