import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { AportacionesIndividualesSchema, AportacionesCompletasSchema } from './aportacionesFondos.schemas.js';
import { ok, fail, unauthorized } from '../../utils/http.js';
import { GetAportacionesIndividualesQuery } from './application/queries/GetAportacionesIndividualesQuery.js';
import { GetAportacionesCompletasQuery } from './application/queries/GetAportacionesCompletasQuery.js';
import { GetPrestamosQuery } from './application/queries/GetPrestamosQuery.js';
import { GetPrestamosMedianoPlazoQuery } from './application/queries/GetPrestamosMedianoPlazoQuery.js';
import { GetPrestamosHipotecariosQuery } from './application/queries/GetPrestamosHipotecariosQuery.js';
import { GetAportacionGuarderiasQuery } from './application/queries/GetAportacionGuarderiasQuery.js';
import { GetPensionNominaTransitorioQuery } from './application/queries/GetPensionNominaTransitorioQuery.js';
import { handleAportacionesFondosError } from './infrastructure/errorHandler.js';

// Routes for fund contributions operations
export default async function aportacionesFondosRoutes(app: FastifyInstance) {

  // GET /aportacionesFondos/individuales/:tipo - Get individual fund contributions
  app.get('/aportacionesFondos/individuales/:tipo', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get individual fund contributions by type',
      tags: ['aportacionesFondos'],
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
                      sueldo_base: { type: 'number' },
                      afae: { type: 'number' },
                      afaa: { type: 'number' },
                      afe: { type: 'number' },
                      afpe: { type: 'number' },
                      afpa: { type: 'number' },
                      total: { type: 'number' },
                      tipo: { type: 'string' }
                    }
                  }
                },
                resumen: {
                  type: 'object',
                  properties: {
                    total_empleados: { type: 'number' },
                    total_contribucion: { type: 'number' },
                    total_sueldo_base: { type: 'number' }
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

      // Extract user organica keys and entity status
      const userClave0 = (user as any).idOrganica0 || '';
      const userClave1 = (user as any).idOrganica1 || '';
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
        user.sub?.toString()
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
      tags: ['aportacionesFondos'],
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
                    fondos_incluidos: {
                      type: 'array',
                      items: { type: 'string' }
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

      // Extract user organica keys and entity status
      const userClave0 = (user as any).idOrganica0 || '';
      const userClave1 = (user as any).idOrganica1 || '';
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
      tags: ['aportacionesFondos'],
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
                      interes: { type: 'number', nullable: true },
                      monto: { type: 'number', nullable: true },
                      moratorios: { type: 'number', nullable: true },
                      total: { type: 'number', nullable: true },
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

      // Extract user organica keys and entity status
      const userClave0 = (user as any).idOrganica0 || '';
      const userClave1 = (user as any).idOrganica1 || '';
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
        user.sub?.toString()
      );

      const duration = Date.now() - startTime;
      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Solicitud completada exitosamente`, {
        totalPrestamos: result.prestamos.length,
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

  // GET /aportacionesFondos/individuales/prestamos-mediano-plazo - Get medium-term loans (préstamos a mediano plazo)
  app.get('/aportacionesFondos/individuales/prestamos-mediano-plazo', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get medium-term loans (préstamos a mediano plazo) by executing AP_S_VIV stored procedure',
      tags: ['aportacionesFondos'],
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
                      moratorios: { type: 'number', nullable: true },
                      interes: { type: 'number', nullable: true },
                      seguro: { type: 'number', nullable: true },
                      total: { type: 'number', nullable: true },
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

      // Extract user organica keys and entity status
      const userClave0 = (user as any).idOrganica0 || '';
      const userClave1 = (user as any).idOrganica1 || '';
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
        user.sub?.toString()
      );

      const duration = Date.now() - startTime;
      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Solicitud completada exitosamente`, {
        totalPrestamos: result.prestamos.length,
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

  // GET /aportacionesFondos/individuales/prestamos-hipotecarios - Get mortgage loans (préstamos hipotecarios)
  app.get('/aportacionesFondos/individuales/prestamos-hipotecarios', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get mortgage loans (préstamos hipotecarios) by executing AP_S_HIP_QNA or AP_S_COMP_QNA stored procedure',
      tags: ['aportacionesFondos'],
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
                      status: { type: 'string', nullable: true },
                      referencia_1: { type: 'string', nullable: true },
                      referencia_2: { type: 'string', nullable: true },
                      capital_pagar: { type: 'number', nullable: true },
                      interes_pagar: { type: 'number', nullable: true },
                      interes_diferido_pagar: { type: 'number', nullable: true },
                      seguro_pagar: { type: 'number', nullable: true },
                      moratorio_pagar: { type: 'number', nullable: true },
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
                      fecha_c: { type: 'string', nullable: true },
                      resultado: { type: 'string', nullable: true },
                      po: { type: 'string', nullable: true },
                      fecha_origen: { type: 'string', nullable: true },
                      plazo: { type: 'number', nullable: true }
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

      // Extract user organica keys and entity status
      const userClave0 = (user as any).idOrganica0 || '';
      const userClave1 = (user as any).idOrganica1 || '';
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
        user.sub?.toString()
      );

      const duration = Date.now() - startTime;
      console.log(`[APORTACIONES_FONDOS] [ROUTE] [${requestId}] Solicitud completada exitosamente`, {
        totalPrestamos: result.prestamos.length,
        computadoraAntigua: result.computadora_antigua,
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

  // GET /aportacionesFondos/aportacion-guarderias - Get aportación guarderías
  app.get('/aportacionesFondos/aportacion-guarderias', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get aportación guarderías by executing EBI2_RECIBOS_IMPRIMIR function',
      tags: ['aportacionesFondos'],
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
                      estatus: { type: 'string', nullable: true }
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

      // Extract user organica keys and entity status
      const userClave0 = (user as any).idOrganica0 || '';
      const userClave1 = (user as any).idOrganica1 || '';
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
        user.sub?.toString()
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
      tags: ['aportacionesFondos'],
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
                      transnorg1: { type: 'string', nullable: true }
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

      // Extract user organica keys and entity status
      const userClave0 = (user as any).idOrganica0 || '';
      const userClave1 = (user as any).idOrganica1 || '';
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
        user.sub?.toString()
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
}