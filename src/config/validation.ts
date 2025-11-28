import { z } from 'zod';
import 'dotenv/config';

/**
 * Database configuration schema
 */
const databaseSchema = z.object({
  user: z.string().min(1, 'SQLSERVER_USER is required'),
  password: z.string().min(1, 'SQLSERVER_PASSWORD is required'),
  server: z.string().min(1, 'SQLSERVER_SERVER is required'),
  database: z.string().min(1, 'SQLSERVER_DB is required'),
  port: z.number().int().min(1).max(65535).default(1433),
  options: z.object({
    encrypt: z.boolean().default(false),
    trustServerCertificate: z.boolean().default(false)
  }),
  pool: z.object({
    max: z.number().int().min(1).max(100).default(10),
    min: z.number().int().min(0).max(10).default(1),
    idleTimeoutMillis: z.number().int().min(1000).default(30000)
  })
});

/**
 * JWT configuration schema
 */
const jwtSchema = z.object({
  accessSecret: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  accessTtl: z.string().regex(/^\d+[smhd]$/, 'JWT_ACCESS_TTL must be in format like "15m", "1h", "2d"'),
  iss: z.string().min(1, 'JWT_ISS is required'),
  aud: z.string().min(1, 'JWT_AUD is required')
});

/**
 * Cookie configuration schema
 */
const cookieSchema = z.object({
  domain: z.string().min(1, 'COOKIE_DOMAIN is required'),
  secure: z.boolean().default(false),
  refreshTtlMin: z.number().int().min(1).max(10080).default(10080)
});

/**
 * Firebird configuration schema
 */
const firebirdSchema = z.object({
  host: z.string().min(1, 'FIREBIRD_HOST is required'),
  port: z.number().int().min(1).max(65535).default(3050),
  database: z.string().min(1, 'FIREBIRD_DATABASE is required'),
  user: z.string().min(1, 'FIREBIRD_USER is required'),
  password: z.string().min(1, 'FIREBIRD_PASSWORD is required')
});

/**
 * FTP configuration schema
 */
const ftpSchema = z.object({
  host: z.string().min(1).default('codigosingular.com'),
  port: z.number().int().min(1).max(65535).default(2222),
  user: z.string().min(1).default('cory'),
  password: z.string().min(1).default('Documentos123')
});

/**
 * Main environment configuration schema
 */
const envSchema = z.object({
  port: z.number().int().min(1).max(65535).default(4000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Database configurations
  sql: databaseSchema,
  jwt: jwtSchema,
  cookie: cookieSchema,
  firebird: firebirdSchema,
  ftp: ftpSchema
});

/**
 * Configuration validation result
 */
export interface ValidatedConfig {
  isValid: boolean;
  data?: z.infer<typeof envSchema>;
  errors?: {
    field: string;
    message: string;
    value?: any;
  }[];
  warnings?: {
    field: string;
    message: string;
    recommendation?: string;
  }[];
}

/**
 * Configuration validator class
 */
export class ConfigurationValidator {
  /**
   * Validate environment configuration
   */
  static validate(): ValidatedConfig {
    try {
      // Parse and validate the configuration
      const result = envSchema.safeParse(process.env);
      
      if (!result.success) {
        // Format Zod errors into our error structure
        const errors = result.error.issues.map(error => ({
          field: error.path.join('.'),
          message: error.message,
          value: this.getValueAtPath(process.env, error.path as string[])
        }));

        return {
          isValid: false,
          errors,
          warnings: this.generateWarnings(result.data as any)
        };
      }

      const validatedData = result.data;
      const warnings = this.generateWarnings(validatedData);

      return {
        isValid: true,
        data: validatedData,
        warnings
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            field: 'unknown',
            message: error instanceof Error ? error.message : 'Unknown validation error'
          }
        ]
      };
    }
  }

  /**
   * Get value at path from object
   */
  private static getValueAtPath(obj: any, path: string[]): any {
    return path.reduce((current, key) => current?.[key], obj);
  }

  /**
   * Generate configuration warnings
   */
  private static generateWarnings(data: z.infer<typeof envSchema>): Array<{
    field: string;
    message: string;
    recommendation?: string;
  }> {
    const warnings = [];

    // Check for development-specific warnings
    if (data.nodeEnv === 'development') {
      if (data.sql.options.encrypt && !data.sql.options.trustServerCertificate) {
        warnings.push({
          field: 'sql.options.encrypt',
          message: 'Encryption is enabled but trustServerCertificate is false',
          recommendation: 'Consider enabling trustServerCertificate for development or disable encryption'
        });
      }

      if (!data.cookie.secure) {
        warnings.push({
          field: 'cookie.secure',
          message: 'Cookies are not secure in development',
          recommendation: 'This is expected for development, but enable secure cookies in production'
        });
      }

      if (data.logLevel === 'debug') {
        warnings.push({
          field: 'logLevel',
          message: 'Debug logging is enabled',
          recommendation: 'Consider using info level logging in production for better performance'
        });
      }
    }

    // Check password strength warnings
    if (data.jwt.accessSecret.length < 64) {
      warnings.push({
        field: 'jwt.accessSecret',
        message: 'JWT secret is shorter than recommended 64 characters',
        recommendation: 'Use a longer, more secure secret for better security'
      });
    }

    // Check connection pool settings
    if (data.sql.pool.max > 50) {
      warnings.push({
        field: 'sql.pool.max',
        message: 'Connection pool max is set very high',
        recommendation: 'Consider reducing max connections for better resource management'
      });
    }

    return warnings;
  }

  /**
   * Validate specific configuration section
   */
  static validateSection(section: keyof z.infer<typeof envSchema>): {
    isValid: boolean;
    data?: any;
    errors?: any[];
  } {
    try {
      const schemas = {
        sql: databaseSchema,
        jwt: jwtSchema,
        cookie: cookieSchema,
        firebird: firebirdSchema,
        ftp: ftpSchema
      };

      const schema = schemas[section as keyof typeof schemas];
      if (!schema) {
        return {
          isValid: false,
          errors: [{ message: `Unknown configuration section: ${section}` }]
        };
      }

      const result = schema.safeParse(process.env);
      
      if (!result.success) {
        return {
          isValid: false,
          errors: result.error.issues.map(error => ({
            field: error.path.join('.'),
            message: error.message
          }))
        };
      }

      return {
        isValid: true,
        data: result.data
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [{ message: error instanceof Error ? error.message : 'Validation error' }]
      };
    }
  }

  /**
   * Get configuration help for a specific field
   */
  static getFieldHelp(field: string): string | null {
    const helpText: Record<string, string> = {
      'SQLSERVER_USER': 'Database username for SQL Server connection',
      'SQLSERVER_PASSWORD': 'Database password (ensure it meets security requirements)',
      'SQLSERVER_SERVER': 'SQL Server hostname or IP address',
      'SQLSERVER_DB': 'Database name to connect to',
      'SQLSERVER_PORT': 'SQL Server port (default: 1433)',
      'JWT_ACCESS_SECRET': 'Secret key for JWT token signing (minimum 32 characters)',
      'JWT_ACCESS_TTL': 'Access token expiration time (e.g., "15m", "1h", "24h")',
      'COOKIE_DOMAIN': 'Domain for cookie settings (e.g., "localhost" or "yourdomain.com")',
      'COOKIE_SECURE': 'Whether cookies should be secure (true for HTTPS, false for HTTP)',
      'FIREBIRD_HOST': 'Firebird database server hostname or IP',
      'FIREBIRD_DATABASE': 'Path to Firebird database file'
    };

    return helpText[field] || null;
  }

  /**
   * Generate configuration template
   */
  static generateTemplate(): string {
    return `# BICSN Configuration Template
# Copy this to .env and fill in your values

# Server Configuration
PORT=4000
NODE_ENV=development
LOG_LEVEL=info

# SQL Server Database
SQLSERVER_USER=your_username
SQLSERVER_PASSWORD=your_secure_password
SQLSERVER_SERVER=localhost
SQLSERVER_DB=your_database
SQLSERVER_ENCRYPT=false
SQLSERVER_TRUST_CERT=true

# JWT Configuration
JWT_ACCESS_SECRET=your_very_long_secret_key_minimum_32_characters
JWT_ACCESS_TTL=15m
JWT_ISS=api
JWT_AUD=api-clients

# Cookie Configuration
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false
REFRESH_TTL_MIN=10080

# Firebird Database (if used)
FIREBIRD_HOST=your_firebird_host
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=/path/to/your/database.fdb
FIREBIRD_USER=SYSDBA
FIREBIRD_PASSWORD=your_firebird_password
`;
  }
}

/**
 * Quick validation function for development
 */
export function validateConfigOrThrow(): z.infer<typeof envSchema> {
  const validation = ConfigurationValidator.validate();
  
  if (!validation.isValid) {
    const errorMessages = validation.errors?.map(error => 
      `${error.field}: ${error.message}`
    ).join('\n') || 'Unknown configuration error';
    
    throw new Error(`Configuration validation failed:\n${errorMessages}`);
  }

  if (validation.warnings && validation.warnings.length > 0) {
    console.warn('\n⚠️  Configuration Warnings:');
    validation.warnings.forEach(warning => {
      console.warn(`  ${warning.field}: ${warning.message}`);
      if (warning.recommendation) {
        console.warn(`    → ${warning.recommendation}`);
      }
    });
    console.warn('');
  }

  return validation.data!;
}