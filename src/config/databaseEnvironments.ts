export const DATABASE_ENVIRONMENTS = {
  DESARROLLO: {
    sqlDatabase: 'SII-ISSSSPEA-DES',
    firebirdDatabase: '/db/db/dbRestaura.fdb'
  },
  CALIDAD: {
    sqlDatabase: 'SII-ISSSSPEA',
    firebirdDatabase: '/db/db/dbQna1426.fdb'
  },
  PRODUCCION: {
    sqlDatabase: 'SII-ISSSSPEA-PROD',
    firebirdDatabase: '/db/db/dbQna1326.fdb'
  }
} as const;

export type DatabaseEnvironment = keyof typeof DATABASE_ENVIRONMENTS;

export function resolveDatabaseEnvironment(
  sqlDatabase: string,
  firebirdDatabase: string
): DatabaseEnvironment | null {
  const match = Object.entries(DATABASE_ENVIRONMENTS).find(([, databases]) =>
    databases.sqlDatabase === sqlDatabase && databases.firebirdDatabase === firebirdDatabase
  );
  return (match?.[0] as DatabaseEnvironment | undefined) ?? null;
}

export function resolveSqlDatabaseEnvironment(sqlDatabase: string): DatabaseEnvironment | null {
  const match = Object.entries(DATABASE_ENVIRONMENTS).find(([, databases]) =>
    databases.sqlDatabase === sqlDatabase
  );
  return (match?.[0] as DatabaseEnvironment | undefined) ?? null;
}

export function assertDatabaseEnvironment(
  environment: DatabaseEnvironment,
  sqlDatabase: string,
  firebirdDatabase: string
): void {
  const expected = DATABASE_ENVIRONMENTS[environment];
  if (sqlDatabase !== expected.sqlDatabase || firebirdDatabase !== expected.firebirdDatabase) {
    throw new Error(
      `DATABASE_ENVIRONMENT_MISMATCH: ${environment} requiere SQL=${expected.sqlDatabase} y Firebird=${expected.firebirdDatabase}`
    );
  }
}
