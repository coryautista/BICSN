import sql, { config as SqlConfig } from 'mssql';
import { config } from '../config/env';

const sqlConfig: SqlConfig = {
  server: config.DB_SERVER,
  database: config.DB_DATABASE,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  port: config.DB_PORT,
  options: {
    encrypt: config.DB_ENCRYPT,
    trustServerCertificate: config.DB_TRUST_SERVER_CERTIFICATE,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export const connectDatabase = async (): Promise<sql.ConnectionPool> => {
  if (pool) {
    return pool;
  }

  try {
    pool = await sql.connect(sqlConfig);
    console.log('Connected to SQL Server database');
    return pool;
  } catch (error) {
    console.error('Error connecting to SQL Server:', error);
    throw error;
  }
};

export const closeDatabaseConnection = async (): Promise<void> => {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Database connection closed');
  }
};

export const getPool = (): sql.ConnectionPool => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDatabase() first.');
  }
  return pool;
};

export { sql };
