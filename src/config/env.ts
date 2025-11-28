import 'dotenv/config';

export const env = {
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  sql: {
    user: process.env.SQLSERVER_USER!,
    password: process.env.SQLSERVER_PASSWORD!,
    server: process.env.SQLSERVER_SERVER!,
    database: process.env.SQLSERVER_DB!,
    port: Number(process.env.SQLSERVER_PORT ?? 1433),
    options: {
      encrypt: process.env.SQLSERVER_ENCRYPT === 'true',
      trustServerCertificate: process.env.SQLSERVER_TRUST_CERT === 'true'
    },
    pool: { max: 10, min: 1, idleTimeoutMillis: 30000 }
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    accessTtl: process.env.JWT_ACCESS_TTL ?? '12h',
    iss: process.env.JWT_ISS ?? 'api',
    aud: process.env.JWT_AUD ?? 'api-clients'
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN ?? 'localhost',
    secure: process.env.COOKIE_SECURE === 'true',
    refreshTtlMin: Number(process.env.REFRESH_TTL_MIN ?? 10080)
  },
  firebird: {
    host: process.env.FIREBIRD_HOST!,
    port: Number(process.env.FIREBIRD_PORT ?? 3050),
    database: process.env.FIREBIRD_DATABASE!,
    user: process.env.FIREBIRD_USER!,
    password: process.env.FIREBIRD_PASSWORD!,
    charset: process.env.FIREBIRD_CHARSET ?? 'NONE' // NONE (recomendado para evitar U+FFFD), WIN1252, UTF8, ISO8859_1
  },
  ftp: {
    host: process.env.FTP_HOST ?? 'codigosingular.com',
    port: Number(process.env.FTP_PORT ?? 2222),
    user: process.env.FTP_USER ?? 'cory',
    password: process.env.FTP_PASS ?? 'Documentos123'
  }

};
