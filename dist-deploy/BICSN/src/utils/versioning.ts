/**
 * Utilidad para manejar versionado de rutas en Fastify
 * Permite múltiples versiones de endpoints usando el header Accept-Version
 */

export interface VersionConstraint {
  version?: string;
}

/**
 * Define las opciones de versionado para una ruta
 * @param version - Versión de la ruta (ej: "1.0.0", "2.0.0")
 */
export function withVersion(version: string): { constraints: VersionConstraint } {
  return {
    constraints: {
      version
    }
  };
}

/**
 * Define múltiples versiones para una misma ruta
 * @param versions - Array de versiones soportadas (ej: ["1.0.0", "2.0.0"])
 */
export function withVersions(versions: string[]): { constraints: VersionConstraint }[] {
  return versions.map(version => withVersion(version));
}

/**
 * Versiones de API disponibles
 */
export const API_VERSIONS = {
  V1: '1.0.0',
  V2: '2.0.0',
} as const;

export type ApiVersion = typeof API_VERSIONS[keyof typeof API_VERSIONS];
