import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import {
  RegisterAfectacionOrgSchema,
  AfectacionOrgQuerySchema,
  AfectacionOrgParamsSchema,
  CalculateQuincenaSchema
} from './afectacionOrg.schemas.js';
import {
  registerAfectacionOrgItem,
  getEstadosAfectacionFiltered,
  getProgresoUsuarioFiltered,
  getBitacoraAfectacionFiltered,
  getTableroAfectacionesFiltered,
  getUltimaAfectacionFiltered,
  calculateQuincenaFromDate
} from './afectacionOrg.service.js';
import { ok, validationError, internalError } from '../../utils/http.js';
import { ExpedienteCurpParamSchema } from '../expediente/expediente.schemas.js';

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
    const parsed = RegisterAfectacionOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const result = await registerAfectacionOrgItem(parsed.data);
      return reply.send(ok(result));
    } catch (error: any) {
      console.error('Error registering affectation:', error);
      return reply.code(500).send(internalError('Failed to register affectation'));
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
    const query = req.query as any;
    const parsed = AfectacionOrgQuerySchema.safeParse(query);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const estados = await getEstadosAfectacionFiltered(parsed.data);
      return reply.send(ok(estados));
    } catch (error: any) {
      console.error('Error getting affectation states:', error);
      return reply.code(500).send(internalError('Failed to retrieve affectation states'));
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
    const query = req.query as any;
    const parsed = AfectacionOrgQuerySchema.safeParse(query);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const progreso = await getProgresoUsuarioFiltered(parsed.data);
      return reply.send(ok(progreso));
    } catch (error: any) {
      console.error('Error getting user progress:', error);
      return reply.code(500).send(internalError('Failed to retrieve user progress'));
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
    const query = req.query as any;
    const parsed = AfectacionOrgQuerySchema.safeParse(query);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const logs = await getBitacoraAfectacionFiltered(parsed.data);
      return reply.send(ok(logs));
    } catch (error: any) {
      console.error('Error getting affectation logs:', error);
      return reply.code(500).send(internalError('Failed to retrieve affectation logs'));
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
    const query = req.query as any;
    const parsed = AfectacionOrgQuerySchema.safeParse(query);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const dashboard = await getTableroAfectacionesFiltered(parsed.data);
      return reply.send(ok(dashboard));
    } catch (error: any) {
      console.error('Error getting dashboard data:', error);
      return reply.code(500).send(internalError('Failed to retrieve dashboard data'));
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
    const query = req.query as any;
    const parsed = AfectacionOrgQuerySchema.safeParse(query);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const last = await getUltimaAfectacionFiltered(parsed.data);
      return reply.send(ok(last));
    } catch (error: any) {
      console.error('Error getting last affectations:', error);
      return reply.code(500).send(internalError('Failed to retrieve last affectations'));
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
    const params = req.params as any;

    // Validate parameters
    const paramValidation = AfectacionOrgParamsSchema.safeParse(params);
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const estados = await getEstadosAfectacionFiltered(paramValidation.data);
      return reply.send(ok(estados));
    } catch (error: any) {
      console.error('Error getting affectation states by params:', error);
      return reply.code(500).send(internalError('Failed to retrieve affectation states'));
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
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const result = await calculateQuincenaFromDate(parsed.data.fecha);
      return reply.send(ok(result));
    } catch (error: any) {
      console.error('Error calculating quincena:', error);
      return reply.code(500).send(internalError('Failed to calculate quincena'));
    }
  });

}