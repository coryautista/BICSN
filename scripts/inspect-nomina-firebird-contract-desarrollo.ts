import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const firebird = await import('../src/db/firebird.js');

try {
  const requestedProcedure = process.argv[2]?.toUpperCase();
  if (requestedProcedure) {
    const sourceStart = Number(process.argv[3] ?? 1);
    const source = await firebird.executeTechnicalQuery(`
      SELECT TRIM(RDB$PROCEDURE_NAME) AS PROCEDURE_NAME,
             CAST(SUBSTRING(RDB$PROCEDURE_SOURCE FROM ${sourceStart} FOR 8000) AS VARCHAR(8000)) AS PROCEDURE_SOURCE
      FROM RDB$PROCEDURES
      WHERE RDB$PROCEDURE_NAME = ?
    `, [requestedProcedure]);
    const parameters = await firebird.executeTechnicalQuery(`
      SELECT TRIM(RDB$PARAMETER_NAME) AS PARAM_NAME,
             RDB$PARAMETER_TYPE AS PARAM_TYPE,
             RDB$PARAMETER_NUMBER AS PARAM_NUMBER
      FROM RDB$PROCEDURE_PARAMETERS
      WHERE RDB$PROCEDURE_NAME = ?
      ORDER BY RDB$PARAMETER_TYPE, RDB$PARAMETER_NUMBER
    `, [requestedProcedure]);
    console.log(JSON.stringify({ source, parameters }, null, 2));
    process.exitCode = source.length === 1 ? 0 : 1;
  } else {
  const procedureParameters = await firebird.executeTechnicalQuery(`
    SELECT TRIM(pp.RDB$PARAMETER_NAME) AS PARAM_NAME,
           pp.RDB$PARAMETER_TYPE AS PARAM_TYPE,
           pp.RDB$PARAMETER_NUMBER AS PARAM_NUMBER,
           f.RDB$FIELD_TYPE AS FIELD_TYPE,
           f.RDB$FIELD_LENGTH AS FIELD_LENGTH,
           f.RDB$FIELD_SCALE AS FIELD_SCALE
    FROM RDB$PROCEDURE_PARAMETERS pp
    JOIN RDB$FIELDS f ON f.RDB$FIELD_NAME = pp.RDB$FIELD_SOURCE
    WHERE pp.RDB$PROCEDURE_NAME = ?
    ORDER BY pp.RDB$PARAMETER_TYPE, pp.RDB$PARAMETER_NUMBER
  `, ['AP_D_IDENTIFICA_ARCHIVOTXT']);

  const summaryColumns = await firebird.executeTechnicalQuery(`
    SELECT TRIM(rf.RDB$FIELD_NAME) AS FIELD_NAME,
           rf.RDB$FIELD_POSITION AS FIELD_POSITION,
           f.RDB$FIELD_TYPE AS FIELD_TYPE,
           f.RDB$FIELD_LENGTH AS FIELD_LENGTH,
           f.RDB$FIELD_SCALE AS FIELD_SCALE
    FROM RDB$RELATION_FIELDS rf
    JOIN RDB$FIELDS f ON f.RDB$FIELD_NAME = rf.RDB$FIELD_SOURCE
    WHERE rf.RDB$RELATION_NAME = ?
    ORDER BY rf.RDB$FIELD_POSITION
  `, ['AP_D_ORIGEN_RESUMEN']);

  const procedureSources = await firebird.executeTechnicalQuery(`
    SELECT TRIM(RDB$PROCEDURE_NAME) AS PROCEDURE_NAME,
           CAST(RDB$PROCEDURE_SOURCE AS VARCHAR(8191)) AS PROCEDURE_SOURCE
    FROM RDB$PROCEDURES
    WHERE RDB$PROCEDURE_NAME IN (
      'AP_D_IDENTIFICA_ARCHIVOTXT', 'AP_DN_TODOS', 'AP_DN_FONDOS', 'AP_DN_MINIMOS',
      'AP_DN_PCP_COBRAR', 'AP_DN_PPV_HIP', 'AP_DN_EBI', 'AP_DN_PMP'
    )
    ORDER BY RDB$PROCEDURE_NAME
  `);

  console.log(JSON.stringify({ procedureParameters, summaryColumns, procedureSources }, null, 2));
  }
} finally {
  await firebird.closeFirebirdPool();
}
