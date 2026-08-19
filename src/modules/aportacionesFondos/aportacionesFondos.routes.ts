import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import {
  AportacionesIndividualesSchema,
  AportacionesCompletasSchema,
  NumerosEmpleadoLookupSchema,
  SnapshotCalculoV2ConsultaSchema,
  SnapshotCalculoV2BandejaSchema,
  SnapshotCalculoV2DecisionParamsSchema,
  SnapshotCalculoV2DecisionSchema,
  SnapshotCalculoV2OfficialSchema
} from './aportacionesFondos.schemas.js';
import { ok, fail, unauthorized } from '../../utils/http.js';
import { normalizeClaveOrganica } from '../../utils/organica.js';
import { GetAportacionesIndividualesQuery } from './application/queries/GetAportacionesIndividualesQuery.js';
import { GetAportacionesCompletasQuery } from './application/queries/GetAportacionesCompletasQuery.js';
import { GetPrestamosQuery } from './application/queries/GetPrestamosQuery.js';
import { GetPrestamosMedianoPlazoQuery } from './application/queries/GetPrestamosMedianoPlazoQuery.js';
import { GetPrestamosHipotecariosQuery } from './application/queries/GetPrestamosHipotecariosQuery.js';
import { GetAportacionGuarderiasQuery } from './application/queries/GetAportacionGuarderiasQuery.js';
import { GetPensionNominaTransitorioQuery } from './application/queries/GetPensionNominaTransitorioQuery.js';
import { GetAguinaldoQuery } from './application/queries/GetAguinaldoQuery.js';
import { GetNumerosEmpleadoQuery } from './application/queries/GetNumerosEmpleadoQuery.js';
import { handleAportacionesFondosError } from './infrastructure/errorHandler.js';
import { GetSnapshotCalculoV2Query } from './application/queries/GetSnapshotCalculoV2Query.js';
import { env } from '../../config/env.js';
import { ListSnapshotCalculoV2Query } from './application/queries/ListSnapshotCalculoV2Query.js';
import { CreateSnapshotCalculoV2DecisionCommand } from './application/commands/CreateSnapshotCalculoV2DecisionCommand.js';
import { GetSnapshotCalculoV2OfficialQuery } from './application/queries/GetSnapshotCalculoV2OfficialQuery.js';
import { ListSnapshotCalculoV2DecisionsQuery } from './application/queries/ListSnapshotCalculoV2DecisionsQuery.js';
import { PRESTAMOS_PRECISION_POLICY, PRESTAMOS_SOURCE_SCALE, sumD6ToA2 } from './domain/entities/PrestamoMoney.js';

// Routes for fund contributions operations
export default async function aportacionesFondosRoutes(app: FastifyInstance) {

  app.get('/aportacionesFondos/snapshots/v2/oficial', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: '[SQL SERVER] Lectura agregada oficial: usa el Snapshot V2 solicitado si esta completo, cerrado y aprobado; en otro caso usa historicos.',
      tags: ['aportacionesFondos', 'sql-server', 'admin'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object', additionalProperties: false,
        required: ['entidadId', 'anio', 'quincena', 'organica0', 'organica1', 'organica2', 'organica3', 'fuente', 'revision'],
        properties: {
          entidadId: { type: 'string' }, anio: { type: 'string' }, quincena: { type: 'string' },
          organica0: { type: 'string', minLength: 2, maxLength: 2 },
          organica1: { type: 'string', minLength: 2, maxLength: 2 },
          organica2: { type: 'string', minLength: 2, maxLength: 2 },
          organica3: { type: 'string', minLength: 2, maxLength: 2 },
          fuente: { type: 'string', enum: ['LIQUIDACION_V2', 'HISTORICO_SQL'] },
          revision: { type: 'string' }
        }
      }
    }
  }, async (req, reply) => {
    try {
      if (!env.features.snapshotCalculoV2OfficialReadEnabled) {
        return reply.code(404).send(fail('Lectura oficial Snapshot V2 no habilitada', 'SNAPSHOT_V2_OFFICIAL_READ_DISABLED'));
      }
      const parsed = SnapshotCalculoV2OfficialSchema.safeParse(req.query);
      if (!parsed.success) return reply.code(400).send(fail('Parametros de consulta invalidos', 'PARAMETRO_INVALIDO'));
      const query = req.diScope.resolve<GetSnapshotCalculoV2OfficialQuery>('getSnapshotCalculoV2OfficialQuery');
      const result = await query.execute(parsed.data);
      if (!result) return reply.code(404).send(fail('No existe Snapshot V2 elegible ni historico para fallback', 'LECTURA_OFICIAL_NO_DISPONIBLE'));
      return reply.send(ok(result));
    } catch (error: any) {
      return handleAportacionesFondosError(error, reply);
    }
  });

  app.get('/aportacionesFondos/snapshots/v2', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: '[SQL SERVER] Bandeja administrativa paginada de conciliacion Snapshot V2.',
      tags: ['aportacionesFondos', 'sql-server', 'admin'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object', additionalProperties: false,
        properties: {
          pagina: { type: 'string', default: '1' }, tamanio: { type: 'string', default: '20' },
          anio: { type: 'string' }, quincena: { type: 'string' }, entidadId: { type: 'string' },
          organica0: { type: 'string', minLength: 2, maxLength: 2 },
          organica1: { type: 'string', minLength: 2, maxLength: 2 },
          fuente: { type: 'string', enum: ['LIQUIDACION_V2', 'HISTORICO_SQL'] },
          estado: { type: 'string', enum: ['COMPLETO', 'AGREGADO_LEGADO', 'INCOMPLETO'] }
        }
      }
    }
  }, async (req, reply) => {
    try {
      if (!env.features.snapshotCalculoV2ReadEnabled) {
        return reply.code(404).send(fail('Lectura Snapshot V2 no habilitada', 'SNAPSHOT_V2_READ_DISABLED'));
      }
      const parsed = SnapshotCalculoV2BandejaSchema.safeParse(req.query);
      if (!parsed.success) return reply.code(400).send(fail('Parametros de consulta invalidos', 'PARAMETRO_INVALIDO'));
      const query = req.diScope.resolve<ListSnapshotCalculoV2Query>('listSnapshotCalculoV2Query');
      return reply.send(ok(await query.execute(parsed.data)));
    } catch (error: any) {
      return handleAportacionesFondosError(error, reply);
    }
  });

  app.get('/aportacionesFondos/snapshots/v2/:snapshotId/decisiones', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: '[SQL SERVER] Historial administrativo inmutable de decisiones de un Snapshot V2.',
      tags: ['aportacionesFondos', 'sql-server', 'admin'],
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['snapshotId'], properties: { snapshotId: { type: 'string', pattern: '^\\d+$' } } }
    }
  }, async (req, reply) => {
    try {
      if (!env.features.snapshotCalculoV2ReadEnabled) {
        return reply.code(404).send(fail('Lectura Snapshot V2 no habilitada', 'SNAPSHOT_V2_READ_DISABLED'));
      }
      const parsed = SnapshotCalculoV2DecisionParamsSchema.safeParse(req.params);
      if (!parsed.success) return reply.code(400).send(fail('Snapshot invalido', 'PARAMETRO_INVALIDO'));
      const query = req.diScope.resolve<ListSnapshotCalculoV2DecisionsQuery>('listSnapshotCalculoV2DecisionsQuery');
      const result = await query.execute(parsed.data.snapshotId);
      if (!result) return reply.code(404).send(fail('Snapshot V2 no encontrado', 'SNAPSHOT_V2_NO_ENCONTRADO'));
      return reply.send(ok(result));
    } catch (error: any) {
      return handleAportacionesFondosError(error, reply);
    }
  });

  app.post('/aportacionesFondos/snapshots/v2/:snapshotId/decision', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: '[SQL SERVER] Registra una decision administrativa inmutable para un Snapshot V2.',
      tags: ['aportacionesFondos', 'sql-server', 'admin'],
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['snapshotId'], properties: { snapshotId: { type: 'string', pattern: '^\\d+$' } } },
      body: {
        type: 'object', additionalProperties: false, required: ['decision'],
        properties: {
          decision: { type: 'string', enum: ['APROBADO', 'OBSERVADO'] },
          comentario: { type: ['string', 'null'], maxLength: 500 }
        }
      }
    }
  }, async (req, reply) => {
    try {
      if (!env.features.snapshotCalculoV2ReadEnabled) {
        return reply.code(404).send(fail('Lectura Snapshot V2 no habilitada', 'SNAPSHOT_V2_READ_DISABLED'));
      }
      const params = SnapshotCalculoV2DecisionParamsSchema.safeParse(req.params);
      const body = SnapshotCalculoV2DecisionSchema.safeParse(req.body);
      if (!params.success || !body.success) return reply.code(400).send(fail('Decision invalida', 'PARAMETRO_INVALIDO'));
      const command = req.diScope.resolve<CreateSnapshotCalculoV2DecisionCommand>('createSnapshotCalculoV2DecisionCommand');
      const result = await command.execute(params.data.snapshotId, body.data.decision, body.data.comentario, String(req.user!.sub));
      return reply.code(201).send(ok(result));
    } catch (error: any) {
      return handleAportacionesFondosError(error, reply);
    }
  });

  app.get('/aportacionesFondos/snapshots/v2/comparacion', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: '[SQL SERVER] Consulta administrativa en sombra de Snapshot V2 y compara contra REVISA e historicos.',
      tags: ['aportacionesFondos', 'sql-server', 'admin'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        additionalProperties: false,
        required: ['entidadId', 'anio', 'quincena', 'organica0', 'organica1', 'organica2', 'organica3'],
        properties: {
          entidadId: { type: 'string' },
          anio: { type: 'string' },
          quincena: { type: 'string' },
          organica0: { type: 'string', minLength: 2, maxLength: 2 },
          organica1: { type: 'string', minLength: 2, maxLength: 2 },
          organica2: { type: 'string', minLength: 2, maxLength: 2 },
          organica3: { type: 'string', minLength: 2, maxLength: 2 },
          fuente: { type: 'string', enum: ['LIQUIDACION_V2', 'HISTORICO_SQL'], default: 'LIQUIDACION_V2' },
          revision: { type: 'string' },
          incluirDetalles: { type: 'string', enum: ['0', '1'], default: '0' }
        }
      }
    }
  }, async (req, reply) => {
    try {
      if (!env.features.snapshotCalculoV2ReadEnabled) {
        return reply.code(404).send(fail('Lectura Snapshot V2 no habilitada', 'SNAPSHOT_V2_READ_DISABLED'));
      }
      const parsed = SnapshotCalculoV2ConsultaSchema.safeParse(req.query);
      if (!parsed.success) {
        return reply.code(400).send(fail('Parametros de consulta invalidos', 'PARAMETRO_INVALIDO'));
      }
      const query = req.diScope.resolve<GetSnapshotCalculoV2Query>('getSnapshotCalculoV2Query');
      const result = await query.execute(parsed.data);
      if (!result) return reply.code(404).send(fail('Snapshot V2 no encontrado', 'SNAPSHOT_V2_NO_ENCONTRADO'));
      return reply.send(ok(result));
    } catch (error: any) {
      return handleAportacionesFondosError(error, reply);
    }
  });

  app.post('/aportacionesFondos/no-empleados', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtiene números de empleado desde PERSONAL para cruces de retenciones',
      tags: ['aportacionesFondos', 'firebird'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        additionalProperties: false,
        properties: {
          internos: { type: 'array', maxItems: 1000, items: { type: 'integer', minimum: 1 } },
          rfcs: { type: 'array', maxItems: 1000, items: { type: 'string', minLength: 1, maxLength: 13 } }
        }
      }
    }
  }, async (req, reply) => {
    try {
      if (!req.user) {
        return reply.code(401).send(unauthorized('Usuario no autenticado'));
      }

      const parsed = NumerosEmpleadoLookupSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(fail('Parámetros de consulta inválidos', 'PARAMETRO_INVALIDO'));
      }

      const query = req.diScope.resolve<GetNumerosEmpleadoQuery>('getNumerosEmpleadoQuery');
      return reply.send(ok(await query.execute(parsed.data.internos, parsed.data.rfcs)));
    } catch (error: any) {
      return handleAportacionesFondosError(error, reply);
    }
  });

  // GET /aportacionesFondos/individuales/:tipo - Get individual fund contributions
  app.get('/aportacionesFondos/individuales/:tipo', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get individual fund contributions by type',
      tags: ['aportacionesFondos', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['tipo'],
        properties: {
          tipo: { 
            type: 'string',
            enum: ['ahorro', 'vivienda', 'prestaciones', 'cair']
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          clave_organica_0: { type: 'string', maxLength: 2 },
          clave_organica_1: { type: 'string', maxLength: 2 },
          usarDiasLaboradosNomina: { type: 'string' },
          periodo: { type: 'string', minLength: 4, maxLength: 4 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                tipo: { type: 'string' },
                clave_organica_0: { type: 'string' },
                clave_organica_1: { type: 'string' },
                datos: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      interno: { type: 'number' },
                      nombre: { type: 'string', nullable: true },
                      sueldo: { type: 'number', nullable: true },
                      quinquenios: { type: 'number', nullable: true },
                      otras_prestaciones: { type: 'number', nullable: true },
                      sueldo_proporcional: { type: 'number' },
                      sueldo_base: { type: 'number' },
                      afae: { type: 'number' },
                      afaa: { type: 'number' },
                      afe: { type: 'number' },
                      afpe: { type: 'number' },
                      afpa: { type: 'number' },
                      total: { type: 'number' },
                      tipo: { type: 'string' },
                      dias_laborados: { type: 'number' },
                      dias_laborados_origen: { type: 'string', enum: ['nomina', 'movimiento', 'default', 'nomina_sin_coincidencia', 'historico_snapshot', 'historico_sin_dias'] },
                      base_cotizacion_quinquenios: { type: 'number', nullable: true },
                      quinquenios_aplicado: { type: 'number', nullable: true },
                      base_cotizacion_quinquenios_d6: { type: 'string', nullable: true },
                      quinquenios_aplicado_d6: { type: 'string', nullable: true },
                      sueldo_d6: { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{6}$' },
                      quinquenios_d6: { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{6}$' },
                      otras_prestaciones_d6: { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{6}$' },
                      sueldo_proporcional_d6: { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{6}$' },
                      sueldo_base_d6: { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{6}$' },
                      afae_d6: { type: 'string' },
                      afaa_d6: { type: 'string' },
                      afe_d6: { type: 'string' },
                      fh_d6: { type: 'string' },
                      fv_d6: { type: 'string' },
                      afpe_d6: { type: 'string' },
                      afpa_d6: { type: 'string' },
                      total_d6: { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{6}$' }
                    }
                  }
                },
                resumen: {
                  type: 'object',
                  properties: {
                    total_empleados: { type: 'number' },
                    total_contribucion: { type: 'number' },
                    total_sueldo_base: { type: 'number' },
                    total_contribucion_a2: { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{2}$' },
                    total_sueldo_base_a2: { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{2}$' },
                    componentes_a2: {
                      type: 'object',
                      additionalProperties: false,
                      properties: {
                        afae: { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{2}$' },
                        afaa: { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{2}$' },
                        afe: { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{2}$' },
                        afpe: { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{2}$' },
                        afpa: { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{2}$' }
                      }
                    }
                  }
                },
                precision_policy: { type: 'string' },
                formula_version_id: { type: 'string' },
                fuente_datos: { type: 'string', enum: ['CALCULO_VIVO', 'HISTORICO_SQL'] }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    try {
      const { tipo } = req.params as { tipo: string };
      
      // Parse and validate query parameters
      const parsed = AportacionesIndividualesSchema.safeParse({
        tipo,
        clave_organica_0: (req.query as any)?.clave_organica_0,
        clave_organica_1: (req.query as any)?.clave_organica_1
      });

      if (!parsed.success) {
        return reply.code(400).send(fail(parsed.error.message));
      }

      // Get user information from token
      const user = req.user;
      if (!user) {
        return reply.send(unauthorized('Usuario no autenticado'));
      }

      // Extract user organica keys and entity status (normalized to 2 digits)
      const userClave0 = normalizeClaveOrganica((user as any).idOrganica0) || '';
      const userClave1 = normalizeClaveOrganica((user as any).idOrganica1) || '';
      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true; // Check first role's isEntidad status

      const getAportacionesIndividualesQuery = req.diScope.resolve<GetAportacionesIndividualesQuery>('getAportacionesIndividualesQuery');
      
      const result = await getAportacionesIndividualesQuery.execute(
        parsed.data.tipo as any,
        userClave0,
        userClave1,
        isEntidad,
        parsed.data.clave_organica_0,
        parsed.data.clave_organica_1,
        user.sub?.toString(),
        String((req.query as any)?.usarDiasLaboradosNomina || '') === '1',
        (req.query as any)?.periodo
      );

      return reply.send(ok(result));
    } catch (error: any) {
      return handleAportacionesFondosError(error, reply);
    }
  });

  // GET /aportacionesFondos/completas - Get all fund contributions combined
  app.get('/aportacionesFondos/completas', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get all fund contributions combined',
      tags: ['aportacionesFondos', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          clave_organica_0: { type: 'string', maxLength: 2 },
          clave_organica_1: { type: 'string', maxLength: 2 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                clave_organica_0: { type: 'string' },
                clave_organica_1: { type: 'string' },
                ahorro: { type: 'object' },
                vivienda: { type: 'object' },
                prestaciones: { type: 'object' },
                cair: { type: 'object' },
                resumen_general: {
                  type: 'object',
                  properties: {
                    total_empleados: { type: 'number' },
                    total_contribucion_general: { type: 'number' },
                    total_sueldo_base_general: { type: 'number' },
                    total_contribucion_general_a2: { type: 'string' },
                    total_sueldo_base_general_a2: { type: 'string' },
                    fondos_incluidos: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                },
                precision_policy: { type: 'string' },
                formula_version_id: { type: 'string' },
                fuente_datos: { type: 'string', enum: ['CALCULO_VIVO'] }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    try {
      // Parse and validate query parameters
      const parsed = AportacionesCompletasSchema.safeParse(req.query);

      if (!parsed.success) {
        return reply.code(400).send(fail(parsed.error.message));
      }

      // Get user information from token
      const user = req.user;
      if (!user) {
        return reply.send(unauthorized('Usuario no autenticado'));
      }

      // Extract user organica keys and entity status (normalized to 2 digits)
      const userClave0 = normalizeClaveOrganica((user as any).idOrganica0) || '';
      const userClave1 = normalizeClaveOrganica((user as any).idOrganica1) || '';
      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true; // Check first role's isEntidad status

      const getAportacionesCompletasQuery = req.diScope.resolve<GetAportacionesCompletasQuery>('getAportacionesCompletasQuery');
      
      const result = await getAportacionesCompletasQuery.execute(
        userClave0,
        userClave1,
        isEntidad,
        parsed.data.clave_organica_0,
        parsed.data.clave_organica_1,
        user.sub?.toString()
      );

      return reply.send(ok(result));
    } catch (error: any) {
      return handleAportacionesFondosError(error, reply);
    }
  });

  // GET /aportacionesFondos/individuales/prestamos-corto-plazo - Get short-term loans (préstamos a corto plazo)
  app.get('/aportacionesFondos/individuales/prestamos-corto-plazo', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get short-term loans (préstamos a corto plazo) by executing AP_S_PCP stored procedure',
      tags: ['aportacionesFondos', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          clave_organica_0: { type: 'string', maxLength: 2 },
          clave_organica_1: { type: 'string', maxLength: 2 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                clave_organica_0: { type: 'string' },
                clave_organica_1: { type: 'string' },
                periodo: { type: 'string' },
                accion: { type: 'string' },
                prestamos: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      interno: { type: 'number' },
                      rfc: { type: 'string', nullable: true },
                      nombre: { type: 'string', nullable: true },
                      prestamo: { type: 'number', nullable: true },
                      letra: { type: 'number', nullable: true },
                      plazo: { type: 'number', nullable: true },
                      periodo_c: { type: 'string', nullable: true },
                      fecha_c: { type: 'string', nullable: true },
                      capital: { type: 'number', nullable: true },
                      capital_d6: { type: 'string', nullable: true },
                      interes: { type: 'number', nullable: true },
                      interes_d6: { type: 'string', nullable: true },
                      monto: { type: 'number', nullable: true },
                      monto_d6: { type: 'string', nullable: true },
                      moratorios: { type: 'number', nullable: true },
                      moratorios_d6: { type: 'string', nullable: true },
                      total: { type: 'number', nullable: true },
                      total_d6: { type: 'string', nullable: true },
                      resultado: { type: 'string', nullable: true },
                      td: { type: 'string', nullable: true },
                      org0: { type: 'string', nullable: true },
                      org1: { type: 'string', nullable: true },
                      org2: { type: 'string', nullable: true },
                      org3: { type: 'string', nullable: true },
                      norg0: { type: 'string', nullable: true },
                      norg1: { type: 'string', nullable: true },
                      norg2: { type: 'string', nullable: true },
                      norg3: { type: 'string', nullable: true }
                    }
                  }
                },
                total_pcp_a2: { type: 'string' },
                source_scale: { type: 'integer', enum: [2] },
                precision_policy: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Iniciando solicitud préstamos corto plazo`, {
        method: req.method,
        url: req.url,
        ip: req.ip
      });

      // Get user information from token
      const user = req.user;
      if (!user) {
        console.warn(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Usuario no autenticado`);
        return reply.send(unauthorized('Usuario no autenticado'));
      }

      // Extract user organica keys and entity status (normalized to 2 digits)
      const userClave0 = normalizeClaveOrganica((user as any).idOrganica0) || '';
      const userClave1 = normalizeClaveOrganica((user as any).idOrganica1) || '';
      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true; // Check first role's isEntidad status

      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Usuario autenticado`, {
        userId: user.sub,
        userClave0,
        userClave1,
        isEntidad,
        queryParams: req.query
      });

      const getPrestamosQuery = req.diScope.resolve<GetPrestamosQuery>('getPrestamosQuery');
      
      const result = await getPrestamosQuery.execute(
        userClave0,
        userClave1,
        isEntidad,
        (req.query as any)?.clave_organica_0,
        (req.query as any)?.clave_organica_1,
        user.sub?.toString(),
        (req.query as any)?.periodo
      );

      const duration = Date.now() - startTime;
      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Solicitud completada exitosamente`, {
        totalPrestamos: result.prestamos.length,
        duracionMs: duration
      });

      return reply.send(ok({
        ...result,
        total_pcp_a2: sumD6ToA2(result.prestamos.map(p => p.total_d6)),
        source_scale: PRESTAMOS_SOURCE_SCALE,
        precision_policy: PRESTAMOS_PRECISION_POLICY
      }));
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Error en solicitud`, {
        error: error.message || String(error),
        errorCode: error.code,
        duracionMs: duration
      });
      return handleAportacionesFondosError(error, reply);
    }
  });

  // GET /aportacionesFondos/individuales/prestamos-mediano-plazo - Get medium-term loans (préstamos a mediano plazo)
  app.get('/aportacionesFondos/individuales/prestamos-mediano-plazo', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get medium-term loans (préstamos a mediano plazo) by executing AP_S_VIV stored procedure',
      tags: ['aportacionesFondos', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          clave_organica_0: { type: 'string', maxLength: 2 },
          clave_organica_1: { type: 'string', maxLength: 2 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                clave_organica_0: { type: 'string' },
                clave_organica_1: { type: 'string' },
                periodo: { type: 'string' },
                accion: { type: 'string' },
                prestamos: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      interno: { type: 'number' },
                      rfc: { type: 'string', nullable: true },
                      nombre: { type: 'string', nullable: true },
                      prestamo: { type: 'number', nullable: true },
                      letra: { type: 'number', nullable: true },
                      plazo: { type: 'number', nullable: true },
                      periodo_c: { type: 'string', nullable: true },
                      fecha_c: { type: 'string', nullable: true },
                      capital: { type: 'number', nullable: true },
                      capital_d6: { type: 'string', nullable: true },
                      moratorios: { type: 'number', nullable: true },
                      moratorios_d6: { type: 'string', nullable: true },
                      interes: { type: 'number', nullable: true },
                      interes_d6: { type: 'string', nullable: true },
                      seguro: { type: 'number', nullable: true },
                      seguro_d6: { type: 'string', nullable: true },
                      total: { type: 'number', nullable: true },
                      total_d6: { type: 'string', nullable: true },
                      resultado: { type: 'string', nullable: true },
                      clase: { type: 'string', nullable: true },
                      org0: { type: 'string', nullable: true },
                      org1: { type: 'string', nullable: true },
                      org2: { type: 'string', nullable: true },
                      org3: { type: 'string', nullable: true },
                      norg0: { type: 'string', nullable: true },
                      norg1: { type: 'string', nullable: true },
                      norg2: { type: 'string', nullable: true },
                      norg3: { type: 'string', nullable: true },
                      desc_clase: { type: 'string', nullable: true },
                      desc_prestamo: { type: 'string', nullable: true },
                      clave_p: { type: 'string', nullable: true },
                      noemple: { type: 'string', nullable: true },
                      folio: { type: 'number', nullable: true },
                      anio: { type: 'number', nullable: true },
                      po: { type: 'string', nullable: true },
                      fecha_origen: { type: 'string', nullable: true }
                    }
                  }
                },
                total_pmp_a2: { type: 'string' },
                source_scale: { type: 'integer', enum: [2] },
                precision_policy: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Iniciando solicitud préstamos mediano plazo`, {
        method: req.method,
        url: req.url,
        ip: req.ip
      });

      // Get user information from token
      const user = req.user;
      if (!user) {
        console.warn(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Usuario no autenticado`);
        return reply.send(unauthorized('Usuario no autenticado'));
      }

      // Extract user organica keys and entity status (normalized to 2 digits)
      const userClave0 = normalizeClaveOrganica((user as any).idOrganica0) || '';
      const userClave1 = normalizeClaveOrganica((user as any).idOrganica1) || '';
      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true; // Check first role's isEntidad status

      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Usuario autenticado`, {
        userId: user.sub,
        userClave0,
        userClave1,
        isEntidad,
        queryParams: req.query
      });

      const getPrestamosMedianoPlazoQuery = req.diScope.resolve<GetPrestamosMedianoPlazoQuery>('getPrestamosMedianoPlazoQuery');
      
      const result = await getPrestamosMedianoPlazoQuery.execute(
        userClave0,
        userClave1,
        isEntidad,
        (req.query as any)?.clave_organica_0,
        (req.query as any)?.clave_organica_1,
        user.sub?.toString(),
        (req.query as any)?.periodo
      );

      const duration = Date.now() - startTime;
      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Solicitud completada exitosamente`, {
        totalPrestamos: result.prestamos.length,
        duracionMs: duration
      });

      return reply.send(ok({
        ...result,
        total_pmp_a2: sumD6ToA2(result.prestamos.map(p => p.total_d6)),
        source_scale: PRESTAMOS_SOURCE_SCALE,
        precision_policy: PRESTAMOS_PRECISION_POLICY
      }));
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Error en solicitud`, {
        error: error.message || String(error),
        errorCode: error.code,
        duracionMs: duration
      });
      return handleAportacionesFondosError(error, reply);
    }
  });

  // GET /aportacionesFondos/individuales/prestamos-hipotecarios - Get mortgage loans (préstamos hipotecarios)
  app.get('/aportacionesFondos/individuales/prestamos-hipotecarios', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get mortgage loans (préstamos hipotecarios) by executing AP_S_HIP_QNA or AP_S_COMP_QNA stored procedure',
      tags: ['aportacionesFondos', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          clave_organica_0: { type: 'string', maxLength: 2 },
          clave_organica_1: { type: 'string', maxLength: 2 },
          computadora_antigua: { type: 'boolean', default: false }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                clave_organica_0: { type: 'string' },
                clave_organica_1: { type: 'string' },
                periodo: { type: 'string' },
                accion: { type: 'string' },
                computadora_antigua: { type: 'boolean' },
                prestamos: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      interno: { type: 'number' },
                      nombre: { type: 'string', nullable: true },
                      noempleado: { type: 'string', nullable: true },
                      cantidad: { type: 'number', nullable: true },
                      cantidad_d6: { type: 'string', nullable: true },
                      status: { type: 'string', nullable: true },
                      referencia_1: { type: 'string', nullable: true },
                      referencia_2: { type: 'string', nullable: true },
                      capital_pagar: { type: 'number', nullable: true },
                      capital_pagar_d6: { type: 'string', nullable: true },
                      interes_pagar: { type: 'number', nullable: true },
                      interes_pagar_d6: { type: 'string', nullable: true },
                      interes_diferido_pagar: { type: 'number', nullable: true },
                      interes_diferido_pagar_d6: { type: 'string', nullable: true },
                      seguro_pagar: { type: 'number', nullable: true },
                      seguro_pagar_d6: { type: 'string', nullable: true },
                      moratorio_pagar: { type: 'number', nullable: true },
                      moratorio_pagar_d6: { type: 'string', nullable: true },
                      pno_solicitud: { type: 'number', nullable: true },
                      pano: { type: 'number', nullable: true },
                      pclave_clase_prestamo: { type: 'string', nullable: true },
                      pdescripcion: { type: 'string', nullable: true },
                      rfc: { type: 'string', nullable: true },
                      org0: { type: 'string', nullable: true },
                      org1: { type: 'string', nullable: true },
                      org2: { type: 'string', nullable: true },
                      org3: { type: 'string', nullable: true },
                      norg0: { type: 'string', nullable: true },
                      norg1: { type: 'string', nullable: true },
                      norg2: { type: 'string', nullable: true },
                      norg3: { type: 'string', nullable: true },
                      pclave_prestamo: { type: 'string', nullable: true },
                      prestamo_desc: { type: 'string', nullable: true },
                      tipo: { type: 'string', nullable: true },
                      periodo_c: { type: 'string', nullable: true },
                      descto: { type: 'number', nullable: true },
                      descto_d6: { type: 'string', nullable: true },
                      fecha_c: { type: 'string', nullable: true },
                      resultado: { type: 'string', nullable: true },
                      po: { type: 'string', nullable: true },
                      fecha_origen: { type: 'string', nullable: true },
                      plazo: { type: 'number', nullable: true }
                    }
                  }
                },
                total_hipotecario_a2: { type: 'string' },
                source_scale: { type: 'integer', enum: [2] },
                precision_policy: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Iniciando solicitud préstamos hipotecarios`, {
        method: req.method,
        url: req.url,
        ip: req.ip,
        queryParams: req.query
      });

      // Get user information from token
      const user = req.user;
      if (!user) {
        console.warn(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Usuario no autenticado`);
        return reply.send(unauthorized('Usuario no autenticado'));
      }

      // Extract user organica keys and entity status (normalized to 2 digits)
      const userClave0 = normalizeClaveOrganica((user as any).idOrganica0) || '';
      const userClave1 = normalizeClaveOrganica((user as any).idOrganica1) || '';
      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true; // Check first role's isEntidad status

      // Get computadoraAntigua parameter (default: false)
      const computadoraAntiguaParam = (req.query as any)?.computadora_antigua;
      let computadoraAntigua = false;
      
      if (computadoraAntiguaParam !== undefined && computadoraAntiguaParam !== null) {
        if (typeof computadoraAntiguaParam === 'boolean') {
          computadoraAntigua = computadoraAntiguaParam;
        } else if (typeof computadoraAntiguaParam === 'string') {
          computadoraAntigua = computadoraAntiguaParam.toLowerCase() === 'true';
        } else {
          console.warn(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Parámetro computadora_antigua inválido, usando default false`, {
            recibido: computadoraAntiguaParam,
            tipo: typeof computadoraAntiguaParam
          });
        }
      }

      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Usuario autenticado`, {
        userId: user.sub,
        userClave0,
        userClave1,
        isEntidad,
        computadoraAntigua,
        queryParams: req.query
      });

      const getPrestamosHipotecariosQuery = req.diScope.resolve<GetPrestamosHipotecariosQuery>('getPrestamosHipotecariosQuery');
      
      const result = await getPrestamosHipotecariosQuery.execute(
        userClave0,
        userClave1,
        isEntidad,
        computadoraAntigua,
        (req.query as any)?.clave_organica_0,
        (req.query as any)?.clave_organica_1,
        user.sub?.toString(),
        (req.query as any)?.periodo
      );

      const duration = Date.now() - startTime;
      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Solicitud completada exitosamente`, {
        totalPrestamos: result.prestamos.length,
        computadoraAntigua: result.computadora_antigua,
        duracionMs: duration
      });

      return reply.send(ok({
        ...result,
        total_hipotecario_a2: sumD6ToA2(result.prestamos.map(p => p.cantidad_d6)),
        source_scale: PRESTAMOS_SOURCE_SCALE,
        precision_policy: PRESTAMOS_PRECISION_POLICY
      }));
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Error en solicitud`, {
        error: error.message || String(error),
        errorCode: error.code,
        duracionMs: duration
      });
      return handleAportacionesFondosError(error, reply);
    }
  });

  // GET /aportacionesFondos/aportacion-guarderias - Get aportación guarderías
  app.get('/aportacionesFondos/aportacion-guarderias', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get aportación guarderías by executing EBI2_RECIBOS_IMPRIMIR function',
      tags: ['aportacionesFondos', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          clave_organica_0: { type: 'string', maxLength: 2 },
          clave_organica_1: { type: 'string', maxLength: 2 },
          usarDiasLaboradosNomina: { type: 'string' },
          periodo: { type: 'string', minLength: 4, maxLength: 4 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                clave_organica_0: { type: 'string' },
                clave_organica_1: { type: 'string' },
                periodo: { type: 'string' },
                accion: { type: 'string' },
                aportaciones: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      titular_nombre: { type: 'string', nullable: true },
                      titular_no_empleado: { type: 'string', nullable: true },
                      titular_monto: { type: 'number', nullable: true },
                      titular_rfc: { type: 'string', nullable: true },
                      titular_monto_texto: { type: 'string', nullable: true },
                      titular_org0: { type: 'string', nullable: true },
                      titular_org0_nombre: { type: 'string', nullable: true },
                      titular_org1: { type: 'string', nullable: true },
                      titular_org1_nombre: { type: 'string', nullable: true },
                      titular_org2: { type: 'string', nullable: true },
                      titular_org2_nombre: { type: 'string', nullable: true },
                      titular_org3: { type: 'string', nullable: true },
                      titular_org3_nombre: { type: 'string', nullable: true },
                      entidad_monto: { type: 'number', nullable: true },
                      recibo_ajuste: { type: 'number', nullable: true },
                      recibo_total: { type: 'number', nullable: true },
                      recibo_mes_ano: { type: 'string', nullable: true },
                      recibo_fecha_venc: { type: 'string', nullable: true },
                      recibo_folio: { type: 'string', nullable: true },
                      menor_id: { type: 'number', nullable: true },
                      menor_nombre: { type: 'string', nullable: true },
                      menor_rfc: { type: 'string', nullable: true },
                      menor_nivel: { type: 'string', nullable: true },
                      menor_sala: { type: 'string', nullable: true },
                      estatus: { type: 'string', nullable: true },
                      dias_laborados: { type: 'number' },
                      dias_laborados_origen: { type: 'string', enum: ['nomina', 'default', 'nomina_sin_coincidencia'] }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Iniciando solicitud aportación guarderías`, {
        method: req.method,
        url: req.url,
        ip: req.ip
      });

      // Get user information from token
      const user = req.user;
      if (!user) {
        console.warn(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Usuario no autenticado`);
        return reply.send(unauthorized('Usuario no autenticado'));
      }

      // Extract user organica keys and entity status (normalized to 2 digits)
      const userClave0 = normalizeClaveOrganica((user as any).idOrganica0) || '';
      const userClave1 = normalizeClaveOrganica((user as any).idOrganica1) || '';
      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true; // Check first role's isEntidad status

      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Usuario autenticado`, {
        userId: user.sub,
        userClave0,
        userClave1,
        isEntidad,
        queryParams: req.query
      });

      const getAportacionGuarderiasQuery = req.diScope.resolve<GetAportacionGuarderiasQuery>('getAportacionGuarderiasQuery');
      
      const result = await getAportacionGuarderiasQuery.execute(
        userClave0,
        userClave1,
        isEntidad,
        (req.query as any)?.clave_organica_0,
        (req.query as any)?.clave_organica_1,
        user.sub?.toString(),
        String((req.query as any)?.usarDiasLaboradosNomina || '') === '1',
        (req.query as any)?.periodo
      );

      const duration = Date.now() - startTime;
      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Solicitud completada exitosamente`, {
        totalAportaciones: result.aportaciones.length,
        periodo: result.periodo,
        duracionMs: duration
      });

      return reply.send(ok(result));
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Error en solicitud`, {
        error: error.message || String(error),
        errorCode: error.code,
        duracionMs: duration
      });
      return handleAportacionesFondosError(error, reply);
    }
  });

  // GET /aportacionesFondos/pension-nomina-transitorio - Get pensión nómina transitorio
  app.get('/aportacionesFondos/pension-nomina-transitorio', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get pensión nómina transitorio by executing PENSION_NOMINA_QNAL_TRANSITORIO function',
      tags: ['aportacionesFondos', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          clave_organica_0: { type: 'string', maxLength: 2 },
          clave_organica_1: { type: 'string', maxLength: 2 },
          usarDiasLaboradosNomina: { type: 'string' },
          periodo: { type: 'string', minLength: 4, maxLength: 4 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                clave_organica_0: { type: 'string' },
                clave_organica_1: { type: 'string' },
                periodo: { type: 'string' },
                accion: { type: 'string' },
                registros: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      fpension: { type: 'number', nullable: true },
                      interno: { type: 'number', nullable: true },
                      nombres: { type: 'string', nullable: true },
                      nonombre: { type: 'string', nullable: true },
                      rfc: { type: 'string', nullable: true },
                      norfc: { type: 'string', nullable: true },
                      org0: { type: 'string', nullable: true },
                      org1: { type: 'string', nullable: true },
                      org2: { type: 'string', nullable: true },
                      org3: { type: 'string', nullable: true },
                      sueldo: { type: 'number', nullable: true },
                      oprestaciones: { type: 'number', nullable: true },
                      quinquenios: { type: 'number', nullable: true },
                      sdo: { type: 'number', nullable: true },
                      oprest: { type: 'number', nullable: true },
                      quinq: { type: 'number', nullable: true },
                      tpension: { type: 'number', nullable: true },
                      transitorio: { type: 'number', nullable: true },
                      norg0: { type: 'string', nullable: true },
                      norg1: { type: 'string', nullable: true },
                      norg2: { type: 'string', nullable: true },
                      norg3: { type: 'string', nullable: true },
                      cconcepto: { type: 'string', nullable: true },
                      descripcion: { type: 'string', nullable: true },
                      importe: { type: 'number', nullable: true },
                      defuncion: { type: 'string', nullable: true },
                      pcp: { type: 'number', nullable: true },
                      palimenticia: { type: 'number', nullable: true },
                      retroactivo: { type: 'number', nullable: true },
                      payudaecon: { type: 'number', nullable: true },
                      otrosp1: { type: 'number', nullable: true },
                      otrosp2: { type: 'number', nullable: true },
                      otrosp3: { type: 'number', nullable: true },
                      otrosp4: { type: 'number', nullable: true },
                      otrosp5: { type: 'number', nullable: true },
                      terreno: { type: 'number', nullable: true },
                      hipviv: { type: 'number', nullable: true },
                      prodental: { type: 'number', nullable: true },
                      otrod1: { type: 'number', nullable: true },
                      otrod2: { type: 'number', nullable: true },
                      otrod3: { type: 'number', nullable: true },
                      otrod4: { type: 'number', nullable: true },
                      otrod5: { type: 'number', nullable: true },
                      otrod6: { type: 'number', nullable: true },
                      tpercep: { type: 'number', nullable: true },
                      tdeduc: { type: 'number', nullable: true },
                      total: { type: 'number', nullable: true },
                      fin: { type: 'string', nullable: true },
                      inicio: { type: 'string', nullable: true },
                      anio: { type: 'number', nullable: true },
                      sihay: { type: 'string', nullable: true },
                      porcentaje: { type: 'number', nullable: true },
                      sdoporc: { type: 'number', nullable: true },
                      ayudporc: { type: 'number', nullable: true },
                      quinqporc: { type: 'number', nullable: true },
                      transorg0: { type: 'string', nullable: true },
                      transorg1: { type: 'string', nullable: true },
                      transnorg0: { type: 'string', nullable: true },
                      transnorg1: { type: 'string', nullable: true },
                      dias_laborados: { type: 'number' },
                      dias_laborados_origen: { type: 'string', enum: ['nomina', 'default', 'nomina_sin_coincidencia'] }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Iniciando solicitud pensión nómina transitorio`, {
        method: req.method,
        url: req.url,
        ip: req.ip
      });

      // Get user information from token
      const user = req.user;
      if (!user) {
        console.warn(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Usuario no autenticado`);
        return reply.send(unauthorized('Usuario no autenticado'));
      }

      // Extract user organica keys and entity status (normalized to 2 digits)
      const userClave0 = normalizeClaveOrganica((user as any).idOrganica0) || '';
      const userClave1 = normalizeClaveOrganica((user as any).idOrganica1) || '';
      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true; // Check first role's isEntidad status

      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Usuario autenticado`, {
        userId: user.sub,
        userClave0,
        userClave1,
        isEntidad,
        queryParams: req.query
      });

      const getPensionNominaTransitorioQuery = req.diScope.resolve<GetPensionNominaTransitorioQuery>('getPensionNominaTransitorioQuery');
      
      const result = await getPensionNominaTransitorioQuery.execute(
        userClave0,
        userClave1,
        isEntidad,
        (req.query as any)?.clave_organica_0,
        (req.query as any)?.clave_organica_1,
        user.sub?.toString(),
        String((req.query as any)?.usarDiasLaboradosNomina || '') === '1',
        (req.query as any)?.periodo
      );

      const duration = Date.now() - startTime;
      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Solicitud completada exitosamente`, {
        totalRegistros: result.registros.length,
        periodo: result.periodo,
        duracionMs: duration
      });

      return reply.send(ok(result));
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Error en solicitud`, {
        error: error.message || String(error),
        errorCode: error.code,
        duracionMs: duration
      });
      return handleAportacionesFondosError(error, reply);
    }
  });

  // GET /aportacionesFondos/individuales/aguinaldo - Get aguinaldo (bonus payment)
  app.get('/aportacionesFondos/individuales/aguinaldo', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get aguinaldo by executing AGUINALDO_ORGANICAS function',
      tags: ['aportacionesFondos', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          clave_organica_0: { type: 'string', maxLength: 2 },
          clave_organica_1: { type: 'string', maxLength: 2 },
          usarDiasLaboradosNomina: { type: 'string' },
          periodo: { type: 'string', minLength: 4, maxLength: 4 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                clave_organica_0: { type: 'string' },
                clave_organica_1: { type: 'string' },
                periodo: { type: 'string' },
                accion: { type: 'string' },
                aguinaldos: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      interno: { type: 'number', nullable: true },
                      org0: { type: 'string', nullable: true },
                      org1: { type: 'string', nullable: true },
                      org2: { type: 'string', nullable: true },
                      org3: { type: 'string', nullable: true },
                      movimiento: { type: 'string', nullable: true },
                      noempleado: { type: 'string', nullable: true },
                      tipomovimiento: { type: 'string', nullable: true },
                      nombres: { type: 'string', nullable: true },
                      rfc: { type: 'string', nullable: true },
                      curp: { type: 'string', nullable: true },
                      fecha: { type: 'string', nullable: true },
                      dias_aguinaldo: { type: 'number', nullable: true },
                      cuantos: { type: 'number', nullable: true },
                      cuantos_ori: { type: 'number', nullable: true },
                      nocontar: { type: 'string', nullable: true },
                      sdo: { type: 'number', nullable: true },
                      op: { type: 'number', nullable: true },
                      q: { type: 'number', nullable: true },
                      activo: { type: 'string', nullable: true },
                      nom_activo: { type: 'string', nullable: true },
                      qna_a: { type: 'number', nullable: true },
                      porcentaje_a: { type: 'number', nullable: true },
                      diario: { type: 'number', nullable: true },
                      general: { type: 'number', nullable: true },
                      porcentaje: { type: 'number', nullable: true },
                      proporcion: { type: 'number', nullable: true },
                      mensaje: { type: 'string', nullable: true },
                      dias_gral_agui: { type: 'number', nullable: true },
                      fecha_lf: { type: 'string', nullable: true },
                      fecha_li: { type: 'string', nullable: true },
                      f_inicio: { type: 'string', nullable: true },
                      f_fin: { type: 'string', nullable: true },
                      norg0: { type: 'string', nullable: true },
                      norg1: { type: 'string', nullable: true },
                      norg2: { type: 'string', nullable: true },
                      norg3: { type: 'string', nullable: true },
                      dias_laborados: { type: 'number' },
                      dias_laborados_origen: { type: 'string', enum: ['nomina', 'default', 'nomina_sin_coincidencia'] }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Iniciando solicitud aguinaldo`, {
        method: req.method,
        url: req.url,
        ip: req.ip
      });

      // Get user information from token
      const user = req.user;
      if (!user) {
        console.warn(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Usuario no autenticado`);
        return reply.send(unauthorized('Usuario no autenticado'));
      }

      // Extract user organica keys and entity status (normalized to 2 digits)
      const userClave0 = normalizeClaveOrganica((user as any).idOrganica0) || '';
      const userClave1 = normalizeClaveOrganica((user as any).idOrganica1) || '';
      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true; // Check first role's isEntidad status

      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Usuario autenticado`, {
        userId: user.sub,
        userClave0,
        userClave1,
        isEntidad,
        queryParams: req.query
      });

      const getAguinaldoQuery = req.diScope.resolve<GetAguinaldoQuery>('getAguinaldoQuery');
      
      const result = await getAguinaldoQuery.execute(
        userClave0,
        userClave1,
        isEntidad,
        (req.query as any)?.clave_organica_0,
        (req.query as any)?.clave_organica_1,
        user.sub?.toString(),
        String((req.query as any)?.usarDiasLaboradosNomina || '') === '1',
        (req.query as any)?.periodo
      );

      const duration = Date.now() - startTime;
      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Solicitud completada exitosamente`, {
        totalAguinaldos: result.aguinaldos.length,
        periodo: result.periodo,
        duracionMs: duration
      });

      return reply.send(ok(result));
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Error en solicitud`, {
        error: error.message || String(error),
        errorCode: error.code,
        duracionMs: duration
      });
      return handleAportacionesFondosError(error, reply);
    }
  });
}
