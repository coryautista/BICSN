import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'crypto';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import { hashPassword } from '../src/modules/auth/auth.crypto.js';

const execute = process.argv.includes('--execute');
const confirmed = process.argv.includes('--confirm-production=SII-ISSSSPEA-PROD');
const backupReference = (
  process.argv.find((argument) => argument.startsWith('--backup-reference='))?.split('=', 2)[1]
  ?? process.argv.slice(2).find((argument) => !argument.startsWith('--'))
)?.trim();
const production = DATABASE_ENVIRONMENTS.PRODUCCION;

if (execute && !confirmed) throw new Error('CONFIRMACION_REQUERIDA:--confirm-production=SII-ISSSSPEA-PROD');
if (execute && !backupReference) throw new Error('RESPALDO_REQUERIDO: proporcione la referencia verificable como argumento final');

const ORGANICA = { org0: '04', org1: '24', org2: '01', org3: '01' };
const SOLICITUD = [
  { username: 'ISANCHEZ', displayName: 'Isadora Sánchez Soto', email: 'isanchez@isssspea.gob.mx', roleName: 'JefeDepartamento' },
  { username: 'CMARTINEZ', displayName: 'Cynthia Lizeth Martínez Durón', email: 'cmartinez@isssspea.gob.mx', roleName: 'Capturista' },
  { username: 'KVELAZQUEZ', displayName: 'Karina Erika Velázquez Guevara', email: 'kvelazquez@isssspea.gob.mx', roleName: 'Capturista' },
] as const;

const SIMBOLOS = '@$!%*?&';
function generarPassword(): string {
  const mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const minusculas = 'abcdefghijkmnpqrstuvwxyz';
  const numeros = '23456789';
  const bytes = randomBytes(16);
  const letras = [0, 4, 8].map((offset) => mayusculas[bytes[offset] % mayusculas.length]);
  for (let i = 0; i < 5; i++) letras.push(minusculas[bytes[3 + i] % minusculas.length]);
  for (let i = 0; i < 4; i++) letras.push(numeros[bytes[8 + i] % numeros.length]);
  letras.push(SIMBOLOS[bytes[14] % SIMBOLOS.length]);
  letras.push(SIMBOLOS[bytes[15] % SIMBOLOS.length]);
  for (let i = letras.length - 1; i > 0; i--) {
    const j = bytes[i] % (i + 1);
    [letras[i], letras[j]] = [letras[j], letras[i]];
  }
  return letras.join('');
}

async function setSessionContext(tx: sql.Transaction, key: string, value: string) {
  const request = new sql.Request(tx);
  request.input('value', sql.NVarChar(200), value);
  await request.batch(`EXEC sp_set_session_context @key=N'${key}', @value=@value;`);
}

process.env.SQLSERVER_DB = production.sqlDatabase;
process.env.FIREBIRD_DATABASE = production.firebirdDatabase;
assertDatabaseEnvironment('PRODUCCION', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();

try {
  const actualDatabase = String((await pool.request().query('SELECT DB_NAME() AS BaseDatos')).recordset[0]?.BaseDatos ?? '');
  if (actualDatabase !== production.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${actualDatabase}`);

  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  const credenciales: { username: string; email: string; password: string }[] = [];

  try {
    const request = new sql.Request(transaction)
      .input('Org0', sql.NVarChar(2), ORGANICA.org0)
      .input('Org1', sql.NVarChar(2), ORGANICA.org1)
      .input('Org2', sql.NVarChar(2), ORGANICA.org2)
      .input('Org3', sql.NVarChar(2), ORGANICA.org3)
      .input('LockResource', sql.NVarChar(255), 'BICSN_PRODUCCION_CREATE_USUARIOS_AFILIACION');

    const preflight = await request.query(`
      SET NOCOUNT ON;
      DECLARE @LockResult INT;
      EXEC @LockResult=sys.sp_getapplock
        @Resource=@LockResource,
        @LockMode=N'Exclusive',@LockOwner=N'Transaction',@LockTimeout=0;
      IF @LockResult<0 THROW 51901,'USUARIOS_AFILIACION_LOCK_UNAVAILABLE',1;

      SELECT name, normalizedName, CAST(id AS NVARCHAR(50)) AS id
      FROM auth.role
      WHERE normalizedName IN ('JEFEDEPARTAMENTO','CAPTURISTA');

      SELECT normalizedUsername, username, email, normalizedEmail,
             idOrganica0, idOrganica1, idOrganica2, idOrganica3, isLockedOut
      FROM auth.[user]
      WHERE normalizedUsername IN ('ISANCHEZ','CMARTINEZ','KVELAZQUEZ')
         OR normalizedEmail IN ('ISANCHEZ@ISSSSPEA.GOB.MX','CMARTINEZ@ISSSSPEA.GOB.MX','KVELAZQUEZ@ISSSSPEA.GOB.MX');
    `);

    const roles = preflight.recordsets[0] as { name: string; normalizedName: string; id: string }[];
    const rolJefe = roles.find((rol) => rol.normalizedName === 'JEFEDEPARTAMENTO');
    const rolCapturista = roles.find((rol) => rol.normalizedName === 'CAPTURISTA');
    assert.ok(rolJefe, 'ROL_JEFEDEPARTAMENTO_INEXISTENTE');
    assert.ok(rolCapturista, 'ROL_CAPTURISTA_INEXISTENTE');

    const existentes = (preflight.recordsets[1] ?? []) as {
      normalizedUsername: string; username: string; email: string; normalizedEmail: string;
      idOrganica0: string; idOrganica1: string; idOrganica2: string; idOrganica3: string; isLockedOut: boolean;
    }[];
    if (existentes.length > 0) {
      for (const existente of existentes) {
        const objetivo = SOLICITUD.find((usuario) => usuario.username === existente.normalizedUsername);
        const correoCoincide = SOLICITUD.some((usuario) => `${usuario.email}@`.toUpperCase() === `${existente.normalizedEmail}@`.toUpperCase() || usuario.email.toUpperCase() === existente.normalizedEmail);
        assert.ok(objetivo && correoCoincide, `USUARIO_O_CORREO_EN_CONFLICTO:${existente.normalizedUsername || existente.normalizedEmail}`);
        assert.equal(`${existente.idOrganica0}/${existente.idOrganica1}/${existente.idOrganica2}/${existente.idOrganica3}`, `${ORGANICA.org0}/${ORGANICA.org1}/${ORGANICA.org2}/${ORGANICA.org3}`, `ORGANICA_EN_CONFLICTO:${existente.normalizedUsername}`);
      }
    }

    for (const usuario of SOLICITUD) {
      const existente = existentes.find((fila) => fila.normalizedUsername === usuario.username);
      let usuarioId: string;
      if (existente) {
        usuarioId = (await new sql.Request(transaction)
          .input('Username', sql.NVarChar(100), usuario.username)
          .query(`SELECT CAST(id AS NVARCHAR(50)) AS id FROM auth.[user] WHERE normalizedUsername=@Username`)).recordset[0].id;
      } else {
        const password = generarPassword();
        const { hash, algo } = await hashPassword(password);
        credenciales.push({ username: usuario.username, email: usuario.email, password });
        const inserto = new sql.Request(transaction)
          .input('Id', sql.UniqueIdentifier, randomUUID().toUpperCase())
          .input('Username', sql.NVarChar(100), usuario.username)
          .input('Email', sql.NVarChar(320), usuario.email)
          .input('PasswordHash', sql.NVarChar(512), hash)
          .input('PasswordAlgo', sql.NVarChar(50), algo)
          .input('DisplayName', sql.NVarChar(255), usuario.displayName)
          .input('Org0', sql.NVarChar(2), ORGANICA.org0)
          .input('Org1', sql.NVarChar(2), ORGANICA.org1)
          .input('Org2', sql.NVarChar(2), ORGANICA.org2)
          .input('Org3', sql.NVarChar(2), ORGANICA.org3);
        const insertado = await inserto.query(`
          INSERT INTO auth.[user] (
            id, username, email, passwordHash, passwordAlgo,
            passwordUpdatedAt, isEmailConfirmed, phoneNumber, isPhoneConfirmed,
            twoFactorEnabled, totpSecret, isLockedOut, lockoutEndAt, accessFailedCount,
            lastLoginAt, createdAt, updatedAt,
            displayName, photoPath, idOrganica0, idOrganica1, idOrganica2, idOrganica3
          )
          VALUES (
            @Id, @Username, @Email, @PasswordHash, @PasswordAlgo,
            SYSUTCDATETIME(), 0, NULL, 0,
            0, NULL, 0, NULL, 0,
            NULL, SYSUTCDATETIME(), SYSUTCDATETIME(),
            @DisplayName, NULL, @Org0, @Org1, @Org2, @Org3
          );
          SELECT CAST(@Id AS NVARCHAR(50)) AS id;
        `);
        usuarioId = String(insertado.recordset[0].id);
      }

      const roleId = usuario.roleName === 'JefeDepartamento' ? rolJefe.id : rolCapturista.id;
      await new sql.Request(transaction)
        .input('UserId', sql.UniqueIdentifier, usuarioId)
        .input('RoleId', sql.UniqueIdentifier, roleId)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM auth.userRole WHERE userId=@UserId AND roleId=@RoleId)
          INSERT INTO auth.userRole (userId, roleId) VALUES (@UserId, @RoleId);
        `);
    }

    const verificacion = await new sql.Request(transaction).query(`
      SELECT u.normalizedUsername, u.email, u.normalizedEmail, u.passwordAlgo, u.isLockedOut,
             u.idOrganica0, u.idOrganica1, u.idOrganica2, u.idOrganica3,
             r.normalizedName AS Rol
      FROM auth.[user] u
      LEFT JOIN auth.userRole ur ON ur.userId=u.id
      LEFT JOIN auth.role r ON r.id=ur.roleId
      WHERE u.normalizedUsername IN ('ISANCHEZ','CMARTINEZ','KVELAZQUEZ')
      ORDER BY u.normalizedUsername;
    `);

    const filas = verificacion.recordset as { normalizedUsername: string; Rol: string | null }[];
    assert.equal(filas.length, 3, 'VERIFICACION_USUARIOS_INCOMPLETA');
    for (const usuario of SOLICITUD) {
      const fila = filas.find((registro) => registro.normalizedUsername === usuario.username);
      assert.ok(fila, `USUARIO_FALTANTE:${usuario.username}`);
      assert.equal(fila.Rol, usuario.roleName.toUpperCase(), `ROL_INCORRECTO:${usuario.username}`);
    }

    const evidencia = {
      check: 'CREATE_USUARIOS_AFILIACION_PRODUCCION',
      environment: 'PRODUCCION',
      sqlDatabase: production.sqlDatabase,
      firebirdModified: false,
      execute,
      backupReference: backupReference ?? null,
      organica: '04/24/01/01',
      usuarios: filas,
    };

    if (execute) {
      await transaction.commit();
      console.log(JSON.stringify(evidencia, null, 2));
      console.log('CREATE_USUARIOS_AFILIACION_PRODUCCION_OK');
      for (const credencial of credenciales) {
        console.log(`CREDENCIAL ${credencial.username} ${credencial.email} ${credencial.password}`);
      }
    } else {
      await transaction.rollback();
      console.log(JSON.stringify(evidencia, null, 2));
      console.log('CREATE_USUARIOS_AFILIACION_PRODUCCION_DRY_RUN_OK');
    }
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    throw error;
  }
} finally {
  await closeDatabaseConnection();
}
