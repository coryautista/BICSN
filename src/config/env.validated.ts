import 'dotenv/config';
import { validateConfigOrThrow, ConfigurationValidator } from './validation.js';

// Validate configuration on module load
let validatedEnv: ReturnType<typeof validateConfigOrThrow>;

try {
  validatedEnv = validateConfigOrThrow();
} catch (error) {
  // Exit with error code if validation fails
  console.error('Failed to start application due to configuration errors');
  process.exit(1);
}

/**
 * Validated environment configuration
 * This is the safe, validated version of all environment variables
 */
export const env = validatedEnv;

/**
 * Legacy compatibility (deprecated - use env instead)
 * @deprecated Use the validated env object directly
 */
export const _legacyEnv = {
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
    password: process.env.FIREBIRD_PASSWORD!
  },
  ftp: {
    host: process.env.FTP_HOST ?? 'codigosingular.com',
    port: Number(process.env.FTP_PORT ?? 2222),
    user: process.env.FTP_USER ?? 'cory',
    password: process.env.FTP_PASS ?? 'Documentos123'
  }
};

/**
 * Configuration utilities
 */
export const configUtils = {
  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return env.nodeEnv === 'production';
  },

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return env.nodeEnv === 'development';
  },

  /**
   * Check if running in test environment
   */
  isTest(): boolean {
    return env.nodeEnv === 'test';
  },

  /**
   * Get database connection string for SQL Server
   */
  getConnectionString(): string {
    return `Server=${env.sql.server};Database=${env.sql.database};User Id=${env.sql.user};Password=${env.sql.password};Port=${env.sql.port};Encrypt=${env.sql.options.encrypt};TrustServerCertificate=${env.sql.options.trustServerCertificate};`;
  },

  /**
   * Get JWT configuration
   */
  getJwtConfig() {
    return {
      secret: env.jwt.accessSecret,
      expiresIn: env.jwt.accessTtl,
      issuer: env.jwt.iss,
      audience: env.jwt.aud
    };
  },

  /**
   * Get cookie configuration
   */
  getCookieConfig() {
    return {
      domain: env.cookie.domain,
      secure: env.cookie.secure,
      httpOnly: true,
      sameSite: 'lax' as const
    };
  },

  /**
   * Validate configuration at runtime
   */
  validateConfig(): ReturnType<typeof ConfigurationValidator.validate> {
    return ConfigurationValidator.validate();
  },

  /**
   * Get help for a configuration field
   */
  getConfigHelp(field: string): string | null {
    return ConfigurationValidator.getFieldHelp(field);
  },

  /**
   * Generate configuration template
   */
  generateTemplate(): string {
    return ConfigurationValidator.generateTemplate();
  }
};

// Log configuration validation results (development only)
if (configUtils.isDevelopment()) {
  const validation = ConfigurationValidator.validate();
  
  console.log('✅ Configuration validated successfully');
  
  if (validation.warnings && validation.warnings.length > 0) {
    console.log('⚠️  Configuration warnings:');
    validation.warnings.forEach(warning => {
      console.log(`   ${warning.field}: ${warning.message}`);
      if (warning.recommendation) {
        console.log(`   → ${warning.recommendation}`);
      }
    });
  }
}