import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import {
  RegisterAfectacionOrgSchema,
  AfectacionOrgQuerySchema,
  AfectacionOrgParamsSchema,
  CalculateQuincenaSchema
} from './afectacionOrg.schemas.js';
import { AfectacionOrgService } from './afectacionOrg.service.js';
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
    preHandler: [
      requireAuth,
      async (req: any, reply: any) => {
        // Normalizar body: asegurar que siempre sea un objeto
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
          req.body = {};
        }
      }
    ],
    schema: {
      description: 'Register an organizational affectation',
      tags: ['afectacion-org'],
      security: [{ bearerAuth: [] }],
      // No validamos el body aquí, lo hacemos con Zod en el handler para mayor flexibilidad
      body: false,
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                afectacionId: { type: 'number' },
                message: { type: 'string' },
                quincena: { type: 'number', description: 'Número de quincena (1-24)' },
                anio: { type: 'number', description: 'Año de la quincena' },
                periodo: { type: 'string', description: 'Período de trabajo en formato QQAA (ej: 0225 para quincena 2 del año 2025)' },
                accion: { type: 'string', description: 'Acción del registro (ej: APLICAR, TERMINADO)' }
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
    const afectacionOrgService = req.diScope.resolve<AfectacionOrgService>('afectacionOrgService');
    
    const user = (req as any).user;
    const body = req.body as any;
    
    try {
      // 1. Obtener org0, org1, org2, org3 del token si no están en el body (sin verificar orgNivel primero)
      if (!body.org0 && user?.idOrganica0) {
        const idOrg0 = user.idOrganica0;
        body.org0 = typeof idOrg0 === 'string' ? idOrg0.padStart(2, '0') : idOrg0.toString().padStart(2, '0');
      }
      
      if (!body.org1 && user?.idOrganica1) {
        const idOrg1 = user.idOrganica1;
        body.org1 = typeof idOrg1 === 'string' ? idOrg1.padStart(2, '0') : idOrg1.toString().padStart(2, '0');
      }
      
      if (!body.org2 && user?.idOrganica2) {
        const idOrg2 = user.idOrganica2;
        body.org2 = typeof idOrg2 === 'string' ? idOrg2.padStart(2, '0') : idOrg2.toString().padStart(2, '0');
      }
      
      if (!body.org3 && user?.idOrganica3) {
        const idOrg3 = user.idOrganica3;
        body.org3 = typeof idOrg3 === 'string' ? idOrg3.padStart(2, '0') : idOrg3.toString().padStart(2, '0');
      }
      
      // 2. Validar que org0 y org1 estén disponibles (del token o del body)
      if (!body.org0 || !body.org1) {
        return reply.code(400).send(validationError([{ 
          message: 'org0 y org1 son requeridos. Deben estar en el body o disponibles en el token del usuario.' 
        }]));
      }
      
      // 3. Normalizar org2 y org3: si son null/undefined/vacío, usar "01" por defecto
      const org2Final = (!body.org2 || (typeof body.org2 === 'string' && body.org2.trim() === '')) ? '01' : String(body.org2);
      const org3Final = (!body.org3 || (typeof body.org3 === 'string' && body.org3.trim() === '')) ? '01' : String(body.org3);
      
      // 4. Obtener quincena y año desde Firebird AP_G_APLICADO_TIPO
      const quincenaData = await afectacionOrgService.getQuincenaFromFirebird(
        body.org0,
        body.org1,
        org2Final,
        org3Final
      );
      body.anio = quincenaData.anio;
      body.quincena = quincenaData.quincena;
      body.org2 = org2Final;
      body.org3 = org3Final;
      
      // 5. Establecer valores por defecto si no están en el body
      if (!body.entidad) {
        body.entidad = 'AFILIADOS';
      }
      if (!body.accion) {
        body.accion = 'APLICAR';
      }
      if (!body.resultado) {
        body.resultado = 'OK';
      }
      
      // 3. Obtener datos del token y request si no están en el body
      if (!body.usuario && user?.sub) {
        body.usuario = user.sub;
      }
      
      if (!body.ip) {
        body.ip = req.ip || '127.0.0.1';
      }
      
      if (!body.appName) {
        body.appName = 'BICSN-API';
      }
      
      // 6. Determinar orgNivel basado en qué orgs están disponibles si no se proporcionó
      if (body.orgNivel === undefined || body.orgNivel === null) {
        if (body.org3) {
          body.orgNivel = 3;
        } else if (body.org2) {
          body.orgNivel = 2;
        } else if (body.org1) {
          body.orgNivel = 1;
        } else {
          body.orgNivel = 0;
        }
      }
      
      // 7. Normalizar todos los valores org a 2 caracteres con padding
      if (body.org0) {
        body.org0 = typeof body.org0 === 'string' 
          ? body.org0.padStart(2, '0').substring(0, 2)
          : body.org0.toString().padStart(2, '0').substring(0, 2);
      }
      if (body.org1) {
        body.org1 = typeof body.org1 === 'string' 
          ? body.org1.padStart(2, '0').substring(0, 2)
          : body.org1.toString().padStart(2, '0').substring(0, 2);
      }
      // org2 y org3 ya están normalizados arriba, pero asegurar formato de 2 caracteres
      body.org2 = typeof body.org2 === 'string' 
        ? body.org2.padStart(2, '0').substring(0, 2)
        : body.org2.toString().padStart(2, '0').substring(0, 2);
      body.org3 = typeof body.org3 === 'string' 
        ? body.org3.padStart(2, '0').substring(0, 2)
        : body.org3.toString().padStart(2, '0').substring(0, 2);
      
      // 8. Validar con Zod schema
      const parsed = RegisterAfectacionOrgSchema.safeParse(body);
      if (!parsed.success) {
        logger.warn({ errors: parsed.error.issues }, 'Error de validación en registro de afectación');
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      logger.info({ data: parsed.data }, 'Registrando afectación');
      const result = await registrarAfectacionCommand.execute(parsed.data);
      return reply.send(ok(result));
    } catch (error: any) {
      // Manejar errores de obtención de quincena desde Firebird
      if (error.message?.includes('Firebird') || error.message?.includes('AP_G_APLICADO_TIPO') || error.message?.includes('quincena')) {
        return handleAfectacionError(error, reply, { operation: 'register', org0: body.org0, org1: body.org1 });
      }
      return handleAfectacionError(error, reply, { operation: 'register', body });
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
    
    const user = (req as any).user;
    const query = req.query as any;
    
    // Si no se proporcionan org0 y org1 en los query params, obtenerlos del token del usuario
    if (!query.org0 && user?.idOrganica0) {
      const idOrg0 = user.idOrganica0;
      query.org0 = typeof idOrg0 === 'string' ? idOrg0.padStart(2, '0') : idOrg0.toString().padStart(2, '0');
    }
    
    if (!query.org1 && user?.idOrganica1) {
      const idOrg1 = user.idOrganica1;
      query.org1 = typeof idOrg1 === 'string' ? idOrg1.padStart(2, '0') : idOrg1.toString().padStart(2, '0');
    }
    
    // Asegurar que org0 y org1 tengan formato de 2 caracteres si están presentes
    if (query.org0 && query.org0.length === 1) {
      query.org0 = query.org0.padStart(2, '0');
    }
    if (query.org1 && query.org1.length === 1) {
      query.org1 = query.org1.padStart(2, '0');
    }
    
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
      const afectacionOrgService = req.diScope.resolve<AfectacionOrgService>('afectacionOrgService');
      const result = await afectacionOrgService.calculateQuincenaFromDate(parsed.data.fecha);
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