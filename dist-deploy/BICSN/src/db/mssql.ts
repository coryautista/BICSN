import sql, { config as SqlConfig } from 'mssql';
import { env as config } from '../config/env.js';

const sqlConfig: SqlConfig = {
  server: config.sql.server,
  database: config.sql.database,
  user: config.sql.user,
  password: config.sql.password,
  port: config.sql.port,
  options: {
    encrypt: config.sql.options.encrypt,
    trustServerCertificate: config.sql.options.trustServerCertificate,
    requestTimeout: 60000, // 60 seconds timeout for requests
    connectTimeout: 30000, // 30 seconds timeout for connection
  },
  pool: config.sql.pool,
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

export const ping = async (): Promise<boolean> => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDatabase() first.');
  }
  try {
    await pool.request().query('SELECT 1');
    return true;
  } catch (error) {
    throw error;
  }
};

export { sql };
