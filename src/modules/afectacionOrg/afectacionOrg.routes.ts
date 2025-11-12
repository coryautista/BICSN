import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import {
  RegisterAfectacionOrgSchema,
  AfectacionOrgQuerySchema,
  AfectacionOrgParamsSchema,
  CalculateQuincenaSchema
} from './afectacionOrg.schemas.js';
import { calculateQuincenaFromDate } from './afectacionOrg.service.js';
import { ok, validationError } from '../../utils/http.js';
import { GetBitacoraAfectacionQuery } from './application/queries/GetBitacoraAfectacionQuery.js';
import { GetEstadosAfectacionQuery } from './application/queries/GetEstadosAfectacionQuery.js';
import { GetProgresoUsuarioQuery } from './application/queries/GetProgresoUsuarioQuery.js';
import { GetTableroAfectacionQuery } from './application/queries/GetTableroAfectacionQuery.js';
import { GetUltimaAfectacionQuery } from './application/queries/GetUltimaAfectacionQuery.js';
import { GetQuincenaAltaAfectacionQuery } from './application/queries/GetQuincenaAltaAfectacionQuery.js';
import { RegistrarAfectacionCommand } from './application/commands/RegistrarAfectacionCommand.js';
import { handleAfectacionError } from './infrastructure/errorHandler.js';
import pino from 'pino';

const logger = pino({ 
  name: 'afectacionOrg-routes',
  level: process.env.LOG_LEVEL || 'info'
});

export default async function afectacionOrgRoutes(app: FastifyInstance) {
  // Register affectation
  app.post('/afectacion-org/register', {
    preHandler: [requireAuth],
    schema: {
      description: 'Register an organizational affectation',
      tags: ['afectacion-org'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['entidad', 'anio', 'quincena', 'orgNivel', 'org0', 'accion', 'resultado', 'usuario', 'appName', 'ip'],
        properties: {
          entidad: { type: 'string' },
          anio: { type: 'number', minimum: 2000, maximum: 2100 },
          quincena: { type: 'number', minimum: 1, maximum: 24 },
          orgNivel: { type: 'number', minimum: 0, maximum: 3 },
          org0: { type: 'string', minLength: 2, maxLength: 2 },
          org1: { type: 'string', minLength: 2, maxLength: 2 },
          org2: { type: 'string', minLength: 2, maxLength: 2 },
          org3: { type: 'string', minLength: 2, maxLength: 2 },
          accion: { type: 'string' },
          resultado: { type: 'string' },
          mensaje: { type: 'string' },
          usuario: { type: 'string' },
          appName: { type: 'string' },
          ip: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                success: { type: 'boolean' }
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
    const registrarAfectacionCommand = app.diContainer.resolve<RegistrarAfectacionCommand>('registrarAfectacionCommand');
    
    const parsed = RegisterAfectacionOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.issues }, 'Error de validación en registro de afectación');
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      logger.info({ data: parsed.data }, 'Registrando afectación');
      const result = await registrarAfectacionCommand.execute(parsed.data);
      return reply.send(ok(result));
    } catch (error: any) {
      return handleAfectacionError(error, reply, { operation: 'register', body: parsed.data });
    }
  });

  // Get affectation states
  app.get('/afectacion-org/states', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get affectation states',
      tags: ['afectacion-org'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          entidad: { type: 'string' },
          anio: { type: 'number' },
          orgNivel: { type: 'number' },
          org0: { type: 'string' },
          org1: { type: 'string' },
          org2: { type: 'string' },
          org3: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  entidad: { type: 'string' },
                  anio: { type: 'number' },
                  orgNivel: { type: 'number' },
                  org0: { type: 'string' },
                  org1: { type: 'string' },
                  org2: { type: 'string' },
                  org3: { type: 'string' },
                  quincenaActual: { type: 'number' },
                  ultimaFecha: { type: 'string', format: 'date-time' },
                  ultimoUsuario: { type: 'string' }
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
    const getEstadosAfectacionQuery = app.diContainer.resolve<GetEstadosAfectacionQuery>('getEstadosAfectacionQuery');
    
    const query = req.query as any;
    const parsed = AfectacionOrgQuerySchema.safeParse(query);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.issues }, 'Error de validación en obtener estados');
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const estados = await getEstadosAfectacionQuery.execute(parsed.data);
      return reply.send(ok(estados));
    } catch (error: any) {
      return handleAfectacionError(error, reply, { operation: 'getEstados', query: parsed.data });
    }
  });

  // Get user progress
  app.get('/afectacion-org/progress', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get user progress',
      tags: ['afectacion-org'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          entidad: { type: 'string' },
          anio: { type: 'number' },
          orgNivel: { type: 'number' },
          org0: { type: 'string' },
          org1: { type: 'string' },
          org2: { type: 'string' },
          org3: { type: 'string' },
          usuario: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  entidad: { type: 'string' },
                  anio: { type: 'number' },
                  orgNivel: { type: 'number' },
                  org0: { type: 'string' },
                  org1: { type: 'string' },
                  org2: { type: 'string' },
                  org3: { type: 'string' },
                  usuario: { type: 'string' },
                  quincenaUltima: { type: 'number' },
                  fechaUltima: { type: 'string', format: 'date-time' }
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
    const getProgresoUsuarioQuery = app.diContainer.resolve<GetProgresoUsuarioQuery>('getProgresoUsuarioQuery');
    
    const query = req.query as any;
    const parsed = AfectacionOrgQuerySchema.safeParse(query);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.issues }, 'Error de validación en obtener progreso');
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const progreso = await getProgresoUsuarioQuery.execute(parsed.data);
      return reply.send(ok(progreso));
    } catch (error: any) {
      return handleAfectacionError(error, reply, { operation: 'getProgreso', query: parsed.data });
    }
  });

  // Get affectation logs
  app.get('/afectacion-org/logs', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get affectation logs',
      tags: ['afectacion-org'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          entidad: { type: 'string' },
          anio: { type: 'number' },
          quincena: { type: 'number' },
          orgNivel: { type: 'number' },
          org0: { type: 'string' },
          org1: { type: 'string' },
          org2: { type: 'string' },
          org3: { type: 'string' },
          usuario: { type: 'string' },
          accion: { type: 'string' },
          resultado: { type: 'string' },
          limit: { type: 'number', minimum: 1, maximum: 1000 },
          offset: { type: 'number', minimum: 0 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  afectacionId: { type: 'number' },
                  orgNivel: { type: 'number' },
                  org0: { type: 'string' },
                  org1: { type: 'string' },
                  org2: { type: 'string' },
                  org3: { type: 'string' },
                  entidad: { type: 'string' },
                  entidadId: { type: 'string' },
                  anio: { type: 'number' },
                  quincena: { type: 'number' },
                  accion: { type: 'string' },
                  resultado: { type: 'string' },
                  mensaje: { type: 'string' },
                  usuario: { type: 'string' },
                  userId: { type: 'string' },
                  appName: { type: 'string' },
                  ip: { type: 'string' },
                  userAgent: { type: 'string' },
                  requestId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }
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
    const getBitacoraAfectacionQuery = app.diContainer.resolve<GetBitacoraAfectacionQuery>('getBitacoraAfectacionQuery');
    
    const query = req.query as any;
    const parsed = AfectacionOrgQuerySchema.safeParse(query);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.issues }, 'Error de validación en obtener bitácora');
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const logs = await getBitacoraAfectacionQuery.execute(parsed.data);
      return reply.send(ok(logs));
    } catch (error: any) {
      return handleAfectacionError(error, reply, { operation: 'getBitacora', query: parsed.data });
    }
  });

  // Get dashboard data
  app.get('/afectacion-org/dashboard', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get dashboard affectations',
      tags: ['afectacion-org'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          entidad: { type: 'string' },
          anio: { type: 'number' },
          orgNivel: { type: 'number' },
          org0: { type: 'string' },
          org1: { type: 'string' },
          org2: { type: 'string' },
          org3: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  entidad: { type: 'string' },
                  anio: { type: 'number' },
                  orgNivel: { type: 'number' },
                  org0: { type: 'string' },
                  org1: { type: 'string' },
                  org2: { type: 'string' },
                  org3: { type: 'string' },
                  quincenaActual: { type: 'number' },
                  ultimaFecha: { type: 'string', format: 'date-time' },
                  ultimoUsuario: { type: 'string' },
                  accion: { type: 'string' },
                  resultado: { type: 'string' },
                  mensaje: { type: 'string' }
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
    const getTableroAfectacionQuery = app.diContainer.resolve<GetTableroAfectacionQuery>('getTableroAfectacionQuery');
    
    const query = req.query as any;
    const parsed = AfectacionOrgQuerySchema.safeParse(query);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.issues }, 'Error de validación en obtener tablero');
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const dashboard = await getTableroAfectacionQuery.execute(parsed.data);
      return reply.send(ok(dashboard));
    } catch (error: any) {
      return handleAfectacionError(error, reply, { operation: 'getTablero', query: parsed.data });
    }
  });

  // Get last affectations
  app.get('/afectacion-org/last', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get last affectations',
      tags: ['afectacion-org'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          entidad: { type: 'string' },
          anio: { type: 'number' },
          orgNivel: { type: 'number' },
          org0: { type: 'string' },
          org1: { type: 'string' },
          org2: { type: 'string' },
          org3: { type: 'string' },
          usuario: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  entidad: { type: 'string' },
                  anio: { type: 'number' },
                  orgNivel: { type: 'number' },
                  org0: { type: 'string' },
                  org1: { type: 'string' },
                  org2: { type: 'string' },
                  org3: { type: 'string' },
                  quincena: { type: 'number' },
                  accion: { type: 'string' },
                  resultado: { type: 'string' },
                  usuario: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  mensaje: { type: 'string' }
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
    const getUltimaAfectacionQuery = app.diContainer.resolve<GetUltimaAfectacionQuery>('getUltimaAfectacionQuery');
    
    const query = req.query as any;
    const parsed = AfectacionOrgQuerySchema.safeParse(query);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.issues }, 'Error de validación en obtener última afectación');
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const last = await getUltimaAfectacionQuery.execute(parsed.data);
      return reply.send(ok(last));
    } catch (error: any) {
      return handleAfectacionError(error, reply, { operation: 'getUltima', query: parsed.data });
    }
  });

  // Get affectation states by params (using path params)
  app.get('/afectacion-org/states/:entidad/:anio/:orgNivel/:org0/:org1/:org2/:org3', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get affectation states by path parameters',
      tags: ['afectacion-org'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          entidad: { type: 'string' },
          anio: { type: 'string' },
          orgNivel: { type: 'string' },
          org0: { type: 'string' },
          org1: { type: 'string' },
          org2: { type: 'string' },
          org3: { type: 'string' }
        },
        required: ['entidad', 'anio', 'orgNivel', 'org0']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  entidad: { type: 'string' },
                  anio: { type: 'number' },
                  orgNivel: { type: 'number' },
                  org0: { type: 'string' },
                  org1: { type: 'string' },
                  org2: { type: 'string' },
                  org3: { type: 'string' },
                  quincenaActual: { type: 'number' },
                  ultimaFecha: { type: 'string', format: 'date-time' },
                  ultimoUsuario: { type: 'string' }
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
    const getEstadosAfectacionQuery = app.diContainer.resolve<GetEstadosAfectacionQuery>('getEstadosAfectacionQuery');
    
    const params = req.params as any;

    // Validate parameters
    const paramValidation = AfectacionOrgParamsSchema.safeParse(params);
    if (!paramValidation.success) {
      logger.warn({ errors: paramValidation.error.issues }, 'Error de validación en obtener estados por parámetros');
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const estados = await getEstadosAfectacionQuery.execute(paramValidation.data);
      return reply.send(ok(estados));
    } catch (error: any) {
      return handleAfectacionError(error, reply, { operation: 'getEstadosByParams', params: paramValidation.data });
    }
  });

  // Calculate quincena from date
  app.get('/afectacion-org/calculate-quincena', {
    preHandler: [requireAuth],
    schema: {
      description: 'Calculate quincena number from date',
      tags: ['afectacion-org'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['fecha'],
        properties: {
          fecha: { type: 'string', format: 'date' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                fecha: { type: 'string' },
                anio: { type: 'number' },
                mes: { type: 'number' },
                dia: { type: 'number' },
                quincena: { type: 'number' },
                quincenaEnMes: { type: 'number' },
                descripcion: { type: 'string' }
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
    const query = req.query as any;
    const parsed = CalculateQuincenaSchema.safeParse(query);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.issues }, 'Error de validación en calcular quincena');
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const result = await calculateQuincenaFromDate(parsed.data.fecha);
      return reply.send(ok(result));
    } catch (error: any) {
      return handleAfectacionError(error, reply, { operation: 'calculateQuincena', fecha: parsed.data.fecha });
    }
  });

  // GET /afectacion-org/quincena-alta-afectacion - Get current pay period for alta afectacion
  app.get('/afectacion-org/quincena-alta-afectacion', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener la quincena actual siguiendo la regla de alta afectación',
      tags: ['afectacion-org'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                anio: { type: 'number' },
                mes: { type: 'number' },
                quincena: { type: 'number' },
                fechaActual: { type: 'string' },
                descripcion: { type: 'string' },
                esNueva: { type: 'boolean' }
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
    const getQuincenaAltaAfectacionQuery = app.diContainer.resolve<GetQuincenaAltaAfectacionQuery>('getQuincenaAltaAfectacionQuery');
    
    try {
      // Get organica information from JWT token
      const entidad = 'AFECTACION_ORG'; // Fixed entity for affectation operations
      const org0 = req.user?.idOrganica0;
      const org1 = req.user?.idOrganica1;
      const org2 = req.user?.idOrganica2;
      const org3 = req.user?.idOrganica3;

      const result = await getQuincenaAltaAfectacionQuery.execute({ entidad, org0, org1, org2, org3 });
      return reply.send(ok(result));
    } catch (error: any) {
      return handleAfectacionError(error, reply, { operation: 'getQuincenaAlta', user: req.user?.sub });
    }
  });

}