import Firebird from 'node-firebird';
import { env as config } from '../config/env.js';

const firebirdConfig: Firebird.Options = {
  host: config.firebird.host,
  port: config.firebird.port,
  database: config.firebird.database,
  user: config.firebird.user,
  password: config.firebird.password,
  lowercase_keys: false,
  role: undefined,
  pageSize: 4096,
  retryConnectionInterval: 1000
};

let database: Firebird.Database | null = null;

export const connectFirebirdDatabase = async (): Promise<Firebird.Database> => {
  if (database) {
    return database;
  }

  console.log('Attempting to connect to Firebird database with config:', {
    host: firebirdConfig.host,
    port: firebirdConfig.port,
    database: firebirdConfig.database,
    user: firebirdConfig.user,
    // password: firebirdConfig.password, // Don't log password
  });

  return new Promise((resolve, reject) => {
    Firebird.attach(firebirdConfig, (err, db) => {
      if (err) {
        console.error('Error connecting to Firebird database:', err);
        reject(err);
        return;
      }
      database = db;
      console.log('Connected to Firebird database');
      resolve(db);
    });
  });
};

export const closeFirebirdConnection = async (): Promise<void> => {
  if (database) {
    database.detach();
    database = null;
    console.log('Firebird database connection closed');
  }
};

export const getFirebirdDb = (): Firebird.Database => {
  if (!database) {
    throw new Error('Firebird database not initialized. Call connectFirebirdDatabase() first.');
  }
  return database;
};

export const testFirebirdConnection = async (): Promise<boolean> => {
  try {
    if (!database) {
      await connectFirebirdDatabase();
    }
    return database !== null;
  } catch (error) {
    console.error('Firebird connection test failed:', error);
    return false;
  }
};

export const pingFirebird = async (): Promise<boolean> => {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    db.query('SELECT 1 FROM RDB$DATABASE', [], (err: any, _result: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

export { Firebird };