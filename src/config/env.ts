import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  DB_SERVER: string;
  DB_DATABASE: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_PORT: number;
  DB_ENCRYPT: boolean;
  DB_TRUST_SERVER_CERTIFICATE: boolean;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  return value ? value === 'true' : defaultValue;
};

export const config: EnvConfig = {
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: getEnvNumber('PORT', 3000),
  HOST: getEnvVar('HOST', '0.0.0.0'),
  DB_SERVER: getEnvVar('DB_SERVER'),
  DB_DATABASE: getEnvVar('DB_DATABASE'),
  DB_USER: getEnvVar('DB_USER'),
  DB_PASSWORD: getEnvVar('DB_PASSWORD'),
  DB_PORT: getEnvNumber('DB_PORT', 1433),
  DB_ENCRYPT: getEnvBoolean('DB_ENCRYPT', true),
  DB_TRUST_SERVER_CERTIFICATE: getEnvBoolean('DB_TRUST_SERVER_CERTIFICATE', false),
};
