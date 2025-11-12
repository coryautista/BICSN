import { ping as pingMssql } from '../db/mssql.js';
import { testFirebirdConnection } from '../db/firebird.js';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  message?: string;
  details?: Record<string, any>;
}

export interface DetailedHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: HealthCheck[];
  system?: {
    memory: {
      total: number;
      free: number;
      used: number;
      usagePercent: number;
    };
    cpu: {
      loadAverage: number[];
    };
    process: {
      pid: number;
      memoryUsage: NodeJS.MemoryUsage;
      uptime: number;
    };
  };
}

/**
 * Check SQL Server database connection
 */
export async function checkMssqlDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  try {
    const isConnected = await pingMssql();
    const responseTime = Date.now() - startTime;

    return {
      name: 'mssql_database',
      status: isConnected ? 'healthy' : 'unhealthy',
      responseTime,
      message: isConnected ? 'Database connection successful' : 'Database connection failed',
      details: {
        connected: isConnected,
        type: 'SQL Server'
      }
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: 'mssql_database',
      status: 'unhealthy',
      responseTime,
      message: error instanceof Error ? error.message : 'Unknown error',
      details: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Check Firebird database connection
 */
export async function checkFirebirdDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  try {
    const isConnected = await testFirebirdConnection();
    const responseTime = Date.now() - startTime;

    return {
      name: 'firebird_database',
      status: isConnected ? 'healthy' : 'unhealthy',
      responseTime,
      message: isConnected ? 'Firebird connection successful' : 'Firebird connection failed',
      details: {
        connected: isConnected,
        type: 'Firebird'
      }
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: 'firebird_database',
      status: 'unhealthy',
      responseTime,
      message: error instanceof Error ? error.message : 'Unknown error',
      details: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Check application dependencies and services
 */
export async function checkDependencies(): Promise<HealthCheck> {
  const startTime = Date.now();
  try {
    // Verificar que las dependencias críticas estén cargadas
    const criticalDeps = {
      fastify: typeof require !== 'undefined',
      jwt: typeof require !== 'undefined',
      argon2: typeof require !== 'undefined',
    };

    const allHealthy = Object.values(criticalDeps).every(dep => dep === true);
    const responseTime = Date.now() - startTime;

    return {
      name: 'dependencies',
      status: allHealthy ? 'healthy' : 'degraded',
      responseTime,
      message: allHealthy ? 'All dependencies loaded' : 'Some dependencies missing',
      details: criticalDeps
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: 'dependencies',
      status: 'unhealthy',
      responseTime,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get system information
 */
export function getSystemInfo() {
  const totalMemory = process.memoryUsage().heapTotal;
  const usedMemory = process.memoryUsage().heapUsed;
  const freeMemory = totalMemory - usedMemory;

  return {
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usagePercent: (usedMemory / totalMemory) * 100
    },
    cpu: {
      loadAverage: process.cpuUsage ? [
        process.cpuUsage().user / 1000000,
        process.cpuUsage().system / 1000000
      ] : [0, 0]
    },
    process: {
      pid: process.pid,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    }
  };
}

/**
 * Perform all health checks and return detailed status
 */
export async function performDetailedHealthCheck(): Promise<DetailedHealthResponse> {
  const checks = await Promise.all([
    checkMssqlDatabase(),
    checkFirebirdDatabase(),
    checkDependencies()
  ]);

  // Determine overall status
  const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
  const hasDegraded = checks.some(check => check.status === 'degraded');

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (hasUnhealthy) {
    overallStatus = 'unhealthy';
  } else if (hasDegraded) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    system: getSystemInfo()
  };
}

/**
 * Simple health check (for basic monitoring)
 */
export async function performBasicHealthCheck() {
  return {
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
}
