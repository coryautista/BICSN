import { getPool, sql } from '../../db/mssql.js';
import { sql as sqlType } from '../../db/context.js';

export async function findUsuarioById(usuarioId: string) {
  if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
    throw new Error('Invalid usuarioId: must be a non-empty string');
  }
  const p = await getPool();
  const r = await p.request()
    .input('usuarioId', sql.VarChar(50), usuarioId)
    .query(`
      SELECT
        id,
        username,
        email,
        displayName,
        phoneNumber,
        isLockedOut,
        lastLoginAt,
        createdAt,
        updatedAt,
        photoPath,
        idOrganica0,
        idOrganica1,
        idOrganica2,
        idOrganica3
      FROM auth.[user]
      WHERE id = @usuarioId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    usuarioId: row.id,
    nombre: row.displayName,
    email: row.email,
    username: row.username,
    phoneNumber: row.phoneNumber,
    isLockedOut: row.isLockedOut,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    photoPath: row.photoPath,
    idOrganica0: row.idOrganica0,
    idOrganica1: row.idOrganica1,
    idOrganica2: row.idOrganica2,
    idOrganica3: row.idOrganica3
  };
}

export async function findUsuarioByUsername(username: string) {
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    throw new Error('Invalid username: must be a non-empty string');
  }
  const p = await getPool();
  const r = await p.request()
    .input('username', sql.NVarChar(100), username)
    .query(`
      SELECT
        id,
        username,
        email,
        displayName,
        phoneNumber,
        isLockedOut,
        lastLoginAt,
        createdAt,
        updatedAt,
        photoPath,
        idOrganica0,
        idOrganica1,
        idOrganica2,
        idOrganica3
      FROM auth.[user]
      WHERE username = @username OR displayName = @username
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    usuarioId: row.id,
    nombre: row.displayName,
    email: row.email,
    username: row.username,
    phoneNumber: row.phoneNumber,
    isLockedOut: row.isLockedOut,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    photoPath: row.photoPath,
    idOrganica0: row.idOrganica0,
    idOrganica1: row.idOrganica1,
    idOrganica2: row.idOrganica2,
    idOrganica3: row.idOrganica3
  };
}

export async function findUsuarioByEmail(email: string) {
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    throw new Error('Invalid email: must be a non-empty string');
  }
  const p = await getPool();
  const r = await p.request()
    .input('email', sql.VarChar(255), email)
    .query(`
      SELECT
        id,
        username,
        email,
        passwordHash,
        passwordAlgo,
        displayName,
        phoneNumber,
        isLockedOut,
        lastLoginAt,
        createdAt,
        updatedAt,
        photoPath,
        idOrganica0,
        idOrganica1,
        idOrganica2,
        idOrganica3
      FROM auth.[user]
      WHERE email = @email
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    usuarioId: row.id,
    nombre: row.displayName,
    email: row.email,
    passwordHash: row.passwordHash,
    passwordAlgo: row.passwordAlgo,
    username: row.username,
    phoneNumber: row.phoneNumber,
    isLockedOut: row.isLockedOut,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    photoPath: row.photoPath,
    idOrganica0: row.idOrganica0,
    idOrganica1: row.idOrganica1,
    idOrganica2: row.idOrganica2,
    idOrganica3: row.idOrganica3
  };
}

export async function listUsuarios() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      id,
      username,
      email,
      displayName,
      phoneNumber,
      isLockedOut,
      lastLoginAt,
      createdAt,
      updatedAt,
      photoPath,
      idOrganica0,
      idOrganica1,
      idOrganica2,
      idOrganica3
    FROM auth.[user]
    ORDER BY displayName ASC
  `);
  return r.recordset.map((row: any) => ({
    usuarioId: row.id,
    nombre: row.displayName,
    email: row.email,
    username: row.username,
    phoneNumber: row.phoneNumber,
    isLockedOut: row.isLockedOut,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    photoPath: row.photoPath,
    idOrganica0: row.idOrganica0,
    idOrganica1: row.idOrganica1,
    idOrganica2: row.idOrganica2,
    idOrganica3: row.idOrganica3
  }));
}

export async function createUsuario(
  usuarioId: string, 
  nombre: string, 
  email: string, 
  passwordHash: string, 
  passwordAlgo: string, 
  _roleId: string, 
  _esActivo: boolean,
  phoneNumber: string,
  idOrganica0: string,
  idOrganica1: string,
  idOrganica2?: string,
  idOrganica3?: string,
  _userId?: string, 
  tx?: sqlType.Transaction
) {
  if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0 || usuarioId.length > 50) {
    throw new Error('Invalid usuarioId: must be a non-empty string with max 50 characters');
  }
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 100) {
    throw new Error('Invalid nombre: must be a non-empty string with max 100 characters');
  }
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    throw new Error('Invalid email: must be a non-empty string');
  }
  if (!passwordHash || typeof passwordHash !== 'string' || passwordHash.trim().length === 0) {
    throw new Error('Invalid passwordHash: must be a non-empty string');
  }
  if (!passwordAlgo || typeof passwordAlgo !== 'string' || passwordAlgo.trim().length === 0) {
    throw new Error('Invalid passwordAlgo: must be a non-empty string');
  }
  if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
    throw new Error('Invalid phoneNumber: must be a non-empty string');
  }
  if (!idOrganica0 || typeof idOrganica0 !== 'string' || idOrganica0.trim().length === 0) {
    throw new Error('Invalid idOrganica0: must be a non-empty string');
  }
  if (!idOrganica1 || typeof idOrganica1 !== 'string' || idOrganica1.trim().length === 0) {
    throw new Error('Invalid idOrganica1: must be a non-empty string');
  }
  
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  
  // Insert the record with all required fields (matching create-admin-user.ts)
  await req
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('username', sql.NVarChar(100), usuarioId) // Use usuarioId as username
    .input('displayName', sql.NVarChar(255), nombre)
    .input('email', sql.NVarChar(320), email)
    .input('passwordHash', sql.NVarChar(512), passwordHash)
    .input('passwordAlgo', sql.NVarChar(50), passwordAlgo)
    .input('phoneNumber', sql.NVarChar(20), phoneNumber)
    .input('idOrganica0', sql.NVarChar(50), idOrganica0)
    .input('idOrganica1', sql.NVarChar(50), idOrganica1)
    .input('idOrganica2', sql.NVarChar(50), idOrganica2 || null)
    .input('idOrganica3', sql.NVarChar(50), idOrganica3 || null)
    .query(`
      INSERT INTO auth.[user] (
        id,
        username,
        email,
        passwordHash,
        passwordAlgo,
        passwordUpdatedAt,
        isEmailConfirmed,
        phoneNumber,
        isPhoneConfirmed,
        twoFactorEnabled,
        totpSecret,
        isLockedOut,
        lockoutEndAt,
        accessFailedCount,
        lastLoginAt,
        createdAt,
        updatedAt,
        displayName,
        photoPath,
        idOrganica0,
        idOrganica1,
        idOrganica2,
        idOrganica3
      )
      VALUES (
        @usuarioId,
        @username,
        @email,
        @passwordHash,
        @passwordAlgo,
        SYSUTCDATETIME(),
        0,
        @phoneNumber,
        0,
        0,
        NULL,
        0,
        NULL,
        0,
        NULL,
        SYSUTCDATETIME(),
        SYSUTCDATETIME(),
        @displayName,
        NULL,
        @idOrganica0,
        @idOrganica1,
        @idOrganica2,
        @idOrganica3
      )
    `);

  // Retrieve the inserted record by the unique id
  const selectReq = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await selectReq
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .query(`
      SELECT
        id,
        username,
        email,
        displayName,
        phoneNumber,
        isLockedOut,
        lastLoginAt,
        createdAt,
        updatedAt,
        photoPath,
        idOrganica0,
        idOrganica1,
        idOrganica2,
        idOrganica3
      FROM auth.[user]
      WHERE id = @usuarioId
    `);
  const row = r.recordset?.[0];
  if (!row) {
    throw new Error('Failed to retrieve inserted usuario');
  }
  return {
    usuarioId: row.id,
    nombre: row.displayName,
    email: row.email,
    username: row.username,
    phoneNumber: row.phoneNumber,
    isLockedOut: row.isLockedOut,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    photoPath: row.photoPath,
    idOrganica0: row.idOrganica0,
    idOrganica1: row.idOrganica1,
    idOrganica2: row.idOrganica2,
    idOrganica3: row.idOrganica3
  };
}

export async function updateUsuario(usuarioId: string, nombre?: string, email?: string, _roleId?: string, _esActivo?: boolean, _userId?: string, tx?: sqlType.Transaction) {
  if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
    throw new Error('Invalid usuarioId: must be a non-empty string');
  }
  if (nombre !== undefined && (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 100)) {
    throw new Error('Invalid nombre: must be a non-empty string with max 100 characters');
  }
  if (email !== undefined && (!email || typeof email !== 'string' || email.trim().length === 0)) {
    throw new Error('Invalid email: must be a non-empty string');
  }
  
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  
  // First, update the record without OUTPUT clause (triggers conflict)
  await req
    .input('usuarioId', sql.VarChar(50), usuarioId)
    .input('displayName', sql.VarChar(100), nombre ?? null)
    .input('email', sql.VarChar(255), email ?? null)
    .query(`
      UPDATE auth.[user]
      SET displayName = COALESCE(@displayName, displayName),
          email = COALESCE(@email, email),
          updatedAt = SYSUTCDATETIME()
      WHERE id = @usuarioId
    `);

  // Retrieve the updated record
  const selectReq = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await selectReq
    .input('usuarioId', sql.VarChar(50), usuarioId)
    .query(`
      SELECT
        id,
        username,
        email,
        displayName,
        phoneNumber,
        isLockedOut,
        lastLoginAt,
        createdAt,
        updatedAt,
        photoPath,
        idOrganica0,
        idOrganica1,
        idOrganica2,
        idOrganica3
      FROM auth.[user]
      WHERE id = @usuarioId
    `);
  const row = r.recordset?.[0];
  if (!row) return undefined;
  return {
    usuarioId: row.id,
    nombre: row.displayName,
    email: row.email,
    username: row.username,
    phoneNumber: row.phoneNumber,
    isLockedOut: row.isLockedOut,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    photoPath: row.photoPath,
    idOrganica0: row.idOrganica0,
    idOrganica1: row.idOrganica1,
    idOrganica2: row.idOrganica2,
    idOrganica3: row.idOrganica3
  };
}

export async function deleteUsuario(usuarioId: string, tx?: sqlType.Transaction) {
  if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
    throw new Error('Invalid usuarioId: must be a non-empty string');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  
  // First, check if user exists
  const checkReq = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const checkResult = await checkReq
    .input('usuarioId', sql.VarChar(50), usuarioId)
    .query(`SELECT id FROM auth.[user] WHERE id = @usuarioId`);
  
  if (!checkResult.recordset[0]) {
    return undefined;
  }
  
  const userId = checkResult.recordset[0].id;
  
  // Delete without OUTPUT clause (triggers conflict)
  await req
    .input('usuarioId', sql.VarChar(50), usuarioId)
    .query(`
      DELETE FROM auth.[user]
      WHERE id = @usuarioId
    `);
  
  return userId;
}