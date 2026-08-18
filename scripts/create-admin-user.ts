import 'dotenv/config';
import { randomUUID } from 'crypto';
import { connectDatabase, getPool, sql } from '../src/db/mssql.js';
import { hashPassword } from '../src/modules/auth/auth.crypto.js';

async function setSessionContext(tx: sql.Transaction, key: string, value: string | null, length: number) {
  const req = new sql.Request(tx);
  req.input('value', sql.NVarChar(length), value);
  await req.batch(`EXEC sp_set_session_context @key=N'${key}', @value=@value;`);
}

async function main() {
  await connectDatabase();
  const pool = getPool();
  const tx = new sql.Transaction(pool);

  const adminPassword = 'Admin123!';
  const userSuffix = randomUUID().slice(0, 8);
  const userId = randomUUID().toUpperCase();
  const username = `admin_${userSuffix}`;
  const email = `admin.${userSuffix}@example.com`;
  const displayName = 'Administrador API';

  try {
    await tx.begin();

    // Set session context values so the audit trigger has data
    const sessionEntries = [
      { key: 'userId', value: userId },
      { key: 'userName', value: username },
      { key: 'appName', value: 'script' },
      { key: 'ip', value: '127.0.0.1' },
      { key: 'userAgent', value: 'create-admin-user-script' },
      { key: 'requestId', value: randomUUID() }
    ];

    for (const { key, value } of sessionEntries) {
      await setSessionContext(tx, key, value, 200);
    }

    const roleReq = new sql.Request(tx);
    const roleResult = await roleReq.query(`
      SELECT TOP 1 CAST(id AS NVARCHAR(50)) AS id
      FROM auth.role
      WHERE normalizedName = 'ADMIN'
    `);

    const adminRoleId = roleResult.recordset?.[0]?.id;
    if (!adminRoleId) {
      throw new Error('ADMIN role not found in auth.role');
    }

    const { hash, algo } = await hashPassword(adminPassword);

    const insertReq = new sql.Request(tx);
    insertReq.input('id', sql.UniqueIdentifier, userId);
    insertReq.input('username', sql.NVarChar(100), username);
    insertReq.input('email', sql.NVarChar(320), email);
    insertReq.input('passwordHash', sql.NVarChar(512), hash);
    insertReq.input('passwordAlgo', sql.NVarChar(50), algo);
    insertReq.input('displayName', sql.NVarChar(255), displayName);

    await insertReq.query(`
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
        @id,
        @username,
        @email,
        @passwordHash,
        @passwordAlgo,
        SYSUTCDATETIME(),
        0,
        NULL,
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
        NULL,
        NULL,
        NULL,
        NULL
      )
    `);

    const assignReq = new sql.Request(tx);
    assignReq.input('userId', sql.UniqueIdentifier, userId);
    assignReq.input('roleId', sql.UniqueIdentifier, adminRoleId);
    await assignReq.query(`
      IF NOT EXISTS (SELECT 1 FROM auth.userRole WHERE userId = @userId AND roleId = @roleId)
      INSERT INTO auth.userRole (userId, roleId) VALUES (@userId, @roleId)
    `);

    await tx.commit();

    console.log('Usuario admin creado correctamente');
    console.log(JSON.stringify({ userId, username, email, password: adminPassword }, null, 2));
  } catch (error) {
    await tx.rollback().catch(() => undefined);
    console.error('Error creando usuario admin:', error);
    process.exit(1);
  }
}

main().finally(() => process.exit(0));
