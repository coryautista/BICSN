import { FastifyInstance } from 'fastify';
// import { container } from '../di/container.js';
import authRoutes from '../modules/auth/auth.routes.js';
import roleRoutes from '../modules/role/role.routes.js';
import menuRoutes from '../modules/menu/menu.routes.js';
import moduloRoutes from '../modules/modulo/modulo.routes.js';
import procesoRoutes from '../modules/proceso/proceso.routes.js';
import eventoCalendarioRoutes from '../modules/eventoCalendario/eventoCalendario.routes.js';
import roleMenuRoutes from '../modules/roleMenu/roleMenu.routes.js';
import infoRoutes from '../modules/info/info.routes.js';
import auditLogRoutes from '../modules/auditLog/auditLog.routes.js';
import organica0Routes from '../modules/organica0/organica0.routes.js';
import organica2Routes from '../modules/organica2/organica2.routes.js';
import organica3Routes from '../modules/organica3/organica3.routes.js';
import logRoutes from '../modules/log/log.routes.js';
import organica1Routes from '../modules/organica1/organica1.routes.js';
import estadosRoutes from '../modules/estados/estados.routes.js';
import municipiosRoutes from '../modules/municipios/municipios.routes.js';
import ejeRoutes from '../modules/tablero/eje/eje.routes.js';
import programaRoutes from '../modules/tablero/programa/programa.routes.js';
import lineaEstrategicaRoutes from '../modules/tablero/linea-estrategica/linea-estrategica.routes.js';
import indicadorRoutes from '../modules/tablero/indicador/indicador.routes.js';
import dependenciaRoutes from '../modules/tablero/dependencia/dependencia.routes.js';
import dimensionRoutes from '../modules/tablero/dimension/dimension.routes.js';
import unidadMedidaRoutes from '../modules/tablero/unidad-medida/unidad-medida.routes.js';
import indicadorAnualRoutes from '../modules/tablero/indicador-anual/indicador-anual.routes.js';
import codigosPostalesRoutes from '../modules/codigosPostales/codigosPostales.routes.js';
import coloniasRoutes from '../modules/colonias/colonias.routes.js';
import callesRoutes from '../modules/calles/calles.routes.js';
import afiliadosPersonalRoutes from '../modules/afiliadosPersonal/afiliadosPersonal.routes.js';
import tipoMovimientoRoutes from '../modules/tipoMovimiento/tipoMovimiento.routes.js';
import afiliadoRoutes from '../modules/afiliado/afiliado.routes.js';
import afiliadoOrgRoutes from '../modules/afiliadoOrg/afiliadoOrg.routes.js';
import movimientoRoutes from '../modules/movimiento/movimiento.routes.js';
import personalRoutes from '../modules/personal/personal.routes.js';
import orgPersonalRoutes from '../modules/orgPersonal/orgPersonal.routes.js';
import categoriaPuestoOrgRoutes from '../modules/categoriaPuestoOrg/categoriaPuestoOrg.routes.js';
import expedienteRoutes from '../modules/expediente/expediente.routes.js';
import usuariosRoutes from '../modules/usuarios/usuarios.routes.js';
import userRoleRoutes from '../modules/userRole/userRole.routes.js';
import { reportesRoutes } from '../modules/reportes/reportes.routes.js';
import { aplicacionesQNARoutes } from '../modules/reportes/aplicacionesQNA/aplicacionesQNA.routes.js';
import { lineaCapturaRoutes } from '../modules/reportes/aplicacionesQNA/lineaCaptura.routes.js';
import afectacionOrgRoutes from '../modules/afectacionOrg/afectacionOrg.routes.js';
import organicaCascadeRoutes from '../modules/organicaCascade/organicaCascade.routes.js';
import aportacionesFondosRoutes from '../modules/aportacionesFondos/aportacionesFondos.routes.js';

/**
 * Interface for route registration configuration
 */
interface RouteConfig {
  plugin: any;
  prefix: string;
  options?: any;
}

/**
 * Route groups for better organization
 */
const ROUTE_GROUPS = {
  AUTH: 'auth',
  CORE: 'core',
  MODULES: 'modules',
  TABLERO: 'tablero',
  ORGANICACASCADE: 'organicaCascade',
  AFILIADOS: 'afiliados',
  REPORTES: 'reportes'
} as const;

type RouteGroup = typeof ROUTE_GROUPS[keyof typeof ROUTE_GROUPS];

/**
 * Route configuration organized by groups
 */
const ROUTE_CONFIGS: RouteConfig[] = [
  // Auth routes (always first for security)
  {
    plugin: authRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AUTH }
  },
  
  // Core system routes
  {
    plugin: infoRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.CORE }
  },
  {
    plugin: auditLogRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.CORE }
  },
  {
    plugin: logRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.CORE }
  },
  
  // Authorization & User Management
  {
    plugin: roleRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AUTH }
  },
  {
    plugin: menuRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AUTH }
  },
  {
    plugin: usuariosRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AUTH }
  },
  {
    plugin: userRoleRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AUTH }
  },
  {
    plugin: roleMenuRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AUTH }
  },
  
  // Business modules
  {
    plugin: moduloRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.MODULES }
  },
  {
    plugin: procesoRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.MODULES }
  },
  {
    plugin: eventoCalendarioRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.MODULES }
  },
  {
    plugin: expedienteRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.MODULES }
  },
  
  // Organizational structure
  {
    plugin: organica0Routes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.MODULES }
  },
  {
    plugin: organica1Routes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.MODULES }
  },
  {
    plugin: organica2Routes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.MODULES }
  },
  {
    plugin: organica3Routes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.MODULES }
  },
  {
    plugin: organicaCascadeRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.ORGANICACASCADE }
  },
  {
    plugin: afectacionOrgRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.MODULES }
  },
  
  // Location data
  {
    plugin: estadosRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.MODULES }
  },
  {
    plugin: municipiosRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.MODULES }
  },
  {
    plugin: codigosPostalesRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.MODULES }
  },
  {
    plugin: coloniasRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.MODULES }
  },
  {
    plugin: callesRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.MODULES }
  },
  {
    plugin: categoriaPuestoOrgRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.MODULES }
  },
  
  // Dashboard/Reporting modules
  {
    plugin: ejeRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.TABLERO }
  },
  {
    plugin: programaRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.TABLERO }
  },
  {
    plugin: lineaEstrategicaRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.TABLERO }
  },
  {
    plugin: indicadorRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.TABLERO }
  },
  {
    plugin: dependenciaRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.TABLERO }
  },
  {
    plugin: dimensionRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.TABLERO }
  },
  {
    plugin: unidadMedidaRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.TABLERO }
  },
  {
    plugin: indicadorAnualRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.TABLERO }
  },
  
  // Member management
  {
    plugin: afiliadosPersonalRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AFILIADOS }
  },
  {
    plugin: tipoMovimientoRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AFILIADOS }
  },
  {
    plugin: afiliadoRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AFILIADOS }
  },
  {
    plugin: afiliadoOrgRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AFILIADOS }
  },
  {
    plugin: movimientoRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AFILIADOS }
  },
  {
    plugin: personalRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AFILIADOS }
  },
  {
    plugin: orgPersonalRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AFILIADOS }
  },
  
  // Financial contributions
  {
    plugin: aportacionesFondosRoutes,
    prefix: '/v1',
    options: { group: ROUTE_GROUPS.AFILIADOS }
  },
  
  // Aplicaciones QNA (direct routing - also available under /reportes)
  {
    plugin: aplicacionesQNARoutes,
    prefix: '/v1/aplicaciones-qna',
    options: { group: ROUTE_GROUPS.REPORTES }
  },
  
  // Línea de Captura (solo disponible en /v1/aplicaciones-qna, no en /reportes)
  {
    plugin: lineaCapturaRoutes,
    prefix: '/v1/aplicaciones-qna',
    options: { group: ROUTE_GROUPS.REPORTES }
  },
  
  // Reports (special routing)
  {
    plugin: reportesRoutes,
    prefix: '/v1/reportes',
    options: { group: ROUTE_GROUPS.REPORTES }
  }
];

/**
 * Route Registrar - Manages all route registrations
 */
export class RouteRegistrar {
  private app: FastifyInstance;
  private registeredGroups = new Set<RouteGroup>();

  constructor(app: FastifyInstance) {
    this.app = app;
  }

  /**
   * Register all routes
   */
  async registerAllRoutes(): Promise<void> {
    this.app.log.info('Starting route registration...');

    // Log route registration plan
    const groups = this.getRouteGroups();
    this.app.log.info(`Registering routes for groups: ${groups.join(', ')}`);

    // Register routes in order
    for (const config of ROUTE_CONFIGS) {
      await this.registerRoute(config);
    }

    this.app.log.info(`Route registration completed. Total groups: ${this.registeredGroups.size}`);
  }

  /**
   * Register a single route
   */
  private async registerRoute(config: RouteConfig): Promise<void> {
    const { plugin, prefix, options = {} } = config;
    const group = options.group as RouteGroup;

    try {
      this.app.log.debug(`Registering ${group} routes with prefix: ${prefix}`);
      
      await this.app.register(plugin, { prefix });
      
      if (group) {
        this.registeredGroups.add(group);
      }

      this.app.log.info(`✓ Registered ${group} routes on ${prefix}`);
    } catch (error) {
      this.app.log.error({ error }, `Failed to register ${group} routes`);
      throw error;
    }
  }

  /**
   * Register routes by group
   */
  async registerRoutesByGroup(groups: RouteGroup[]): Promise<void> {
    this.app.log.info(`Registering specific route groups: ${groups.join(', ')}`);

    const configs = ROUTE_CONFIGS.filter(config => {
      const group = config.options?.group;
      return groups.includes(group);
    });

    for (const config of configs) {
      await this.registerRoute(config);
    }
  }

  /**
   * Register routes with prefix
   */
  async registerRoutesByPrefix(prefix: string): Promise<void> {
    this.app.log.info(`Registering routes with prefix: ${prefix}`);

    const configs = ROUTE_CONFIGS.filter(config => config.prefix === prefix);

    for (const config of configs) {
      await this.registerRoute(config);
    }
  }

  /**
   * Get all route groups
   */
  private getRouteGroups(): RouteGroup[] {
    const groups = ROUTE_CONFIGS
      .map(config => config.options?.group)
      .filter((group): group is RouteGroup => group !== undefined);
    
    return Array.from(new Set(groups));
  }

  /**
   * Get registration status
   */
  getStatus() {
    return {
      totalGroups: this.registeredGroups.size,
      registeredGroups: Array.from(this.registeredGroups),
      totalRoutes: ROUTE_CONFIGS.length
    };
  }

  /**
   * Health check for route registration
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    const status = this.getStatus();
    
    return {
      status: status.totalGroups > 0 ? 'healthy' : 'degraded',
      details: status
    };
  }
}

/**
 * Main function to register all routes
 */
export async function registerAllRoutes(app: FastifyInstance): Promise<RouteRegistrar> {
  const registrar = new RouteRegistrar(app);
  await registrar.registerAllRoutes();
  return registrar;
}

/**
 * Factory function for creating route registrar
 */
export function createRouteRegistrar(app: FastifyInstance): RouteRegistrar {
  return new RouteRegistrar(app);
}