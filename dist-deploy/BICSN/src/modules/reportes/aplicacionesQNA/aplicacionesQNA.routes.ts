import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { handleAplicacionesQNAError } from './infrastructure/errorHandler.js';
import {
  MovimientosQuincenalesParamsSchema,
  AplicacionAportacionesParamsSchema,
  AplicacionPCPParamsSchema,
  AplicacionPMPParamsSchema,
  AplicacionHIPParamsSchema,
  ConcentradoParamsSchema
} from './aplicacionesQNA.schemas.js';
import { GetMovimientosQuincenalesQuery } from './application/queries/GetMovimientosQuincenalesQuery.js';
import { GetAplicacionAportacionesQuery } from './application/queries/GetAplicacionAportacionesQuery.js';
import { GetAplicacionPCPQuery } from './application/queries/GetAplicacionPCPQuery.js';
import { GetAplicacionPMPQuery } from './application/queries/GetAplicacionPMPQuery.js';
import { GetAplicacionHIPQuery } from './application/queries/GetAplicacionHIPQuery.js';
import { GetConcentradoQuery } from './application/queries/GetConcentradoQuery.js';
import { IAplicacionesQNARepository } from './domain/repositories/IAplicacionesQNARepository.js';
import { LineaCapturaPeriodoRepository } from './infrastructure/persistence/LineaCapturaPeriodoRepository.js';
import { normalizeClaveOrganica } from '../../../utils/organica.js';
import { getMexicoTodayDateOnly } from '../../../utils/sqlServerDate.js';
import { executeSafeQuery, executeSelectableProcedure } from '../../../db/firebird.js';
import { getPool, sql } from '../../../db/mssql.js';

export async function aplicacionesQNARoutes(fastify: FastifyInstance) {
  // GET /reportes/aplicaciones-qna/movimientos - HISTORIAL_MOVIMIENTOS_QUIN_IND
  fastify.get('/movimientos', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Obtiene movimientos quincenales individuales ejecutando el stored procedure HISTORIAL_MOVIMIENTOS_QUIN_IND',
      summary: 'Movimientos quincenales',
      tags: ['reportes', 'aplicaciones-qna', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          periodo: {
            type: 'string',
            description: 'Período en formato específico (ej: "2125")'
          },
          pOrg0: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{2}$',
            description: 'Clave orgánica nivel 0 (2 caracteres alfanuméricos, ej: "04")'
          },
          pOrg1: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{2}$',
            description: 'Clave orgánica nivel 1 (2 caracteres alfanuméricos, ej: "24" o "A2")'
          }
        },
        required: ['periodo', 'pOrg0', 'pOrg1']
      },
      response: {
        200: {
          description: 'Movimientos obtenidos exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
            timestamp: { type: 'string' }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        403: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const parsed = MovimientosQuincenalesParamsSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros de consulta inválidos',
            details: parsed.error.issues,
            timestamp: new Date().toISOString()
          }
        });
      }

      const { periodo, pOrg0, pOrg1 } = parsed.data;
      const userId = (request as any).user?.sub;

      const query = request.diScope.resolve<GetMovimientosQuincenalesQuery>('getAplicacionesQNAMovimientosQuincenalesQuery');
      const movimientos = await query.execute(periodo, pOrg0, pOrg1, userId);

      // SOLUCIÓN AL PROBLEMA DE SERIALIZACIÓN DE FASTIFY
      // Fastify a veces tiene problemas serializando objetos que tienen referencias circulares,
      // getters/setters, o propiedades no enumerables. La solución es crear una copia profunda
      // completamente limpia usando JSON.parse(JSON.stringify()). Esto elimina cualquier
      // getter/setter, propiedades no enumerables, o referencias problemáticas.
      // Este problema ha ocurrido constantemente en otros endpoints (HIP, Concentrado, etc.)
      // y esta es la solución documentada y probada.
      const cleanData = JSON.parse(JSON.stringify(movimientos));

      const responseObject = {
        success: true,
        data: cleanData,
        timestamp: new Date().toISOString()
      };

      // Serializar manualmente ANTES de enviar
      // Esto evita que Fastify procese el objeto y pierda datos
      const jsonString = JSON.stringify(responseObject);
      
      
      // Asegurar que el content-type sea JSON explícitamente
      reply.type('application/json');
      
      // Enviar el JSON serializado manualmente como string
      // Fastify no lo volverá a serializar si ya es un string
      return reply.code(200).send(jsonString);
    } catch (error) {
      return handleAplicacionesQNAError(error, reply);
    }
  });

  // GET /reportes/aplicaciones-qna/aportaciones - AP_P_FONDOS
  fastify.get('/aportaciones', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtiene aplicación de aportaciones o fondos ejecutando el stored procedure AP_P_FONDOS. Los usuarios admin pueden consultar cualquier clave orgánica. Los usuarios no admin solo pueden consultar sus propias claves orgánicas del token.',
      summary: 'Aplicación aportaciones/fondos',
      tags: ['reportes', 'aplicaciones-qna', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          pOrg0: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{2}$',
            description: 'Clave orgánica nivel 0 (2 caracteres, ej: "01"). Requerido para admin, opcional para otros usuarios (se usa la del token)'
          },
          pOrg1: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{2}$',
            description: 'Clave orgánica nivel 1 (2 caracteres, ej: "01"). Requerido para admin, opcional para otros usuarios (se usa la del token)'
          },
          periodo: {
            type: 'string',
            description: 'Período en formato específico (ej: "2125")'
          }
        },
        required: ['periodo']
      },
      response: {
        200: {
          description: 'Aportaciones obtenidas exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  interno: { type: 'number' },
                  nombre: { type: 'string' },
                  sueldom: { type: 'number' },
                  otrasPrestaciones: { type: 'number' },
                  quinquenios: { type: 'number' },
                  sueldoq: { type: 'number' },
                  opq: { type: 'number' },
                  qq: { type: 'number' },
                  sare: { type: 'number' },
                  fra: { type: 'number' },
                  fre: { type: 'number' },
                  fhe: { type: 'number' },
                  fve: { type: 'number' },
                  faa: { type: 'number' },
                  fae: { type: 'number' },
                  fat: { type: 'number' },
                  fai: { type: 'number' },
                  sFra: { type: 'number' },
                  sFre: { type: 'number' },
                  sFhe: { type: 'number' },
                  sFve: { type: 'number' },
                  sFaa: { type: 'number' },
                  sFae: { type: 'number' },
                  sFat: { type: 'number' },
                  sFai: { type: 'number' },
                  tFra: { type: 'number' },
                  tFre: { type: 'number' },
                  tFhe: { type: 'number' },
                  tFve: { type: 'number' },
                  tFaa: { type: 'number' },
                  tFae: { type: 'number' },
                  tFat: { type: 'number' },
                  tFai: { type: 'number' },
                  org0: { type: 'string' },
                  org1: { type: 'string' },
                  rfc: { type: 'string' },
                  sueldoBase: { type: 'number', description: 'Sueldo base calculado' },
                  aportacionAhorro: { type: 'number', description: 'Total aportación ahorro (AFAA + AFAE)' },
                  aportacionAhorroPatron: { type: 'number', description: 'AFAE - Patrón 2.5%' },
                  aportacionAhorroEmpleado: { type: 'number', description: 'AFAA - Empleado 5.0%' },
                  aportacionVivienda: { type: 'number', description: 'AFE - Patrón 1.75%' },
                  aportacionPrestaciones: { type: 'number', description: 'Total aportación prestaciones (AFPE + AFPA)' },
                  aportacionPrestacionesPatron: { type: 'number', description: 'AFPE - Patrón 22.25%' },
                  aportacionPrestacionesEmpleado: { type: 'number', description: 'AFPA - Empleado 4.5%' },
                  aportacionCair: { type: 'number', description: 'AFE - Patrón 2.0%' },
                  totalAportaciones: { type: 'number', description: 'Suma de todas las aportaciones calculadas' }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        403: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      if (!user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Usuario no autenticado',
            timestamp: new Date().toISOString()
          }
        });
      }

      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true;
      // Normalize org keys to 2 digits
      const userClave0 = normalizeClaveOrganica(user.idOrganica0) || '';
      const userClave1 = normalizeClaveOrganica(user.idOrganica1) || '';

      // Validar y determinar las claves orgánicas a usar
      let pOrg0: string;
      let pOrg1: string;

      if (isEntidad) {
        // Usuario entidad: usar las claves del token
        if (!userClave0 || !userClave1) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'No se encontraron claves orgánicas en el token del usuario',
              timestamp: new Date().toISOString()
            }
          });
        }

        pOrg0 = userClave0;
        pOrg1 = userClave1;
      } else {
        // Usuario no entidad: debe proporcionar pOrg0 y pOrg1 en parámetros
        const parsed = AplicacionAportacionesParamsSchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Parámetros de consulta inválidos',
              details: parsed.error.issues,
              timestamp: new Date().toISOString()
            }
          });
        }

        if (!parsed.data.pOrg0 || !parsed.data.pOrg1) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'pOrg0 y pOrg1 son requeridos para usuarios no entidad',
              timestamp: new Date().toISOString()
            }
          });
        }

        pOrg0 = parsed.data.pOrg0;
        pOrg1 = parsed.data.pOrg1;
      }

      // Validar período
      const queryParams = request.query as any;
      const periodo = queryParams.periodo;
      if (!periodo) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El parámetro periodo es requerido',
            timestamp: new Date().toISOString()
          }
        });
      }

      const userId = user.sub;

      const query = request.diScope.resolve<GetAplicacionAportacionesQuery>('getAplicacionAportacionesQuery');
      const aportaciones = await query.execute(pOrg0, pOrg1, periodo, userId);

      const responseObject = {
        success: true,
        data: aportaciones,
        timestamp: new Date().toISOString()
      };

      // Usar reply.send() para que Fastify maneje automáticamente los headers de CORS
      return reply.code(200).send(responseObject);
    } catch (error) {
      return handleAplicacionesQNAError(error, reply);
    }
  });

  // GET /reportes/aplicaciones-qna/pcp - AP_S_PCP
  fastify.get('/pcp', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtiene aplicación PCP (Préstamos a Corto Plazo) ejecutando el stored procedure AP_S_PCP. Los usuarios admin pueden consultar cualquier clave orgánica. Los usuarios no admin solo pueden consultar sus propias claves orgánicas del token.',
      summary: 'Aplicación PCP',
      tags: ['reportes', 'aplicaciones-qna', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          pOrg0: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{2}$',
            description: 'Clave orgánica nivel 0 (2 caracteres, ej: "01"). Requerido para admin, opcional para otros usuarios (se usa la del token)'
          },
          pOrg1: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{2}$',
            description: 'Clave orgánica nivel 1 (2 caracteres, ej: "01"). Requerido para admin, opcional para otros usuarios (se usa la del token)'
          },
          pPeriodo: {
            type: 'string',
            description: 'Período en formato específico (ej: "2125")'
          }
        },
        required: ['pPeriodo']
      },
      response: {
        200: {
          description: 'Préstamos PCP obtenidos exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
            timestamp: { type: 'string' }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        403: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      if (!user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Usuario no autenticado',
            timestamp: new Date().toISOString()
          }
        });
      }

      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true;
      // Normalize org keys to 2 digits
      const userClave0 = normalizeClaveOrganica(user.idOrganica0) || '';
      const userClave1 = normalizeClaveOrganica(user.idOrganica1) || '';

      // Validar y determinar las claves orgánicas a usar
      let pOrg0: string;
      let pOrg1: string;

      if (isEntidad) {
        // Usuario entidad: usar las claves del token
        if (!userClave0 || !userClave1) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'No se encontraron claves orgánicas en el token del usuario',
              timestamp: new Date().toISOString()
            }
          });
        }

        pOrg0 = userClave0;
        pOrg1 = userClave1;
      } else {
        // Usuario no entidad: debe proporcionar pOrg0 y pOrg1 en parámetros
        const parsed = AplicacionPCPParamsSchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Parámetros de consulta inválidos',
              details: parsed.error.issues,
              timestamp: new Date().toISOString()
            }
          });
        }

        if (!parsed.data.pOrg0 || !parsed.data.pOrg1) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'pOrg0 y pOrg1 son requeridos para usuarios no entidad',
              timestamp: new Date().toISOString()
            }
          });
        }

        pOrg0 = parsed.data.pOrg0;
        pOrg1 = parsed.data.pOrg1;
      }

      // Validar período
      const queryParams = request.query as any;
      const pPeriodo = queryParams.pPeriodo;
      if (!pPeriodo) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El parámetro pPeriodo es requerido',
            timestamp: new Date().toISOString()
          }
        });
      }

      const userId = user.sub;

      const query = request.diScope.resolve<GetAplicacionPCPQuery>('getAplicacionPCPQuery');
      const prestamos = await query.execute(pOrg0, pOrg1, pPeriodo, userId);

      // Crear una copia profunda completamente limpia usando JSON
      // Esto elimina cualquier getter/setter, propiedades no enumerables, o referencias problemáticas
      const cleanData = JSON.parse(JSON.stringify(prestamos));

      const responseObject = {
        success: true,
        data: cleanData,
        timestamp: new Date().toISOString()
      };

      // Serializar manualmente ANTES de enviar
      // Esto evita que Fastify procese el objeto y pierda datos
      const jsonString = JSON.stringify(responseObject);
      
      
      // Asegurar que el content-type sea JSON explícitamente
      reply.type('application/json');
      
      // Enviar el JSON serializado manualmente como string
      // Fastify no lo volverá a serializar si ya es un string
      return reply.code(200).send(jsonString);
    } catch (error) {
      return handleAplicacionesQNAError(error, reply);
    }
  });

  // GET /reportes/aplicaciones-qna/pmp - AP_S_VIV
  fastify.get('/pmp', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtiene aplicación PMP (Préstamos a Mediano Plazo) ejecutando el stored procedure AP_S_VIV. Los usuarios admin pueden consultar cualquier clave orgánica. Los usuarios no admin solo pueden consultar sus propias claves orgánicas del token.',
      summary: 'Aplicación PMP',
      tags: ['reportes', 'aplicaciones-qna', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          pOrg0: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{2}$',
            description: 'Clave orgánica nivel 0 (2 caracteres, ej: "01"). Requerido para admin, opcional para otros usuarios (se usa la del token)'
          },
          pOrg1: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{2}$',
            description: 'Clave orgánica nivel 1 (2 caracteres, ej: "01"). Requerido para admin, opcional para otros usuarios (se usa la del token)'
          },
          pPeriodo: {
            type: 'string',
            description: 'Período en formato específico (ej: "2125")'
          }
        },
        required: ['pPeriodo']
      },
      response: {
        200: {
          description: 'Préstamos PMP obtenidos exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
            timestamp: { type: 'string' }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        403: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      if (!user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Usuario no autenticado',
            timestamp: new Date().toISOString()
          }
        });
      }

      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true;
      // Normalize org keys to 2 digits
      const userClave0 = normalizeClaveOrganica(user.idOrganica0) || '';
      const userClave1 = normalizeClaveOrganica(user.idOrganica1) || '';

      // Validar y determinar las claves orgánicas a usar
      let pOrg0: string;
      let pOrg1: string;

      if (isEntidad) {
        // Usuario entidad: usar las claves del token
        if (!userClave0 || !userClave1) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'No se encontraron claves orgánicas en el token del usuario',
              timestamp: new Date().toISOString()
            }
          });
        }

        pOrg0 = userClave0;
        pOrg1 = userClave1;
      } else {
        // Usuario no entidad: debe proporcionar pOrg0 y pOrg1 en parámetros
        const parsed = AplicacionPMPParamsSchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Parámetros de consulta inválidos',
              details: parsed.error.issues,
              timestamp: new Date().toISOString()
            }
          });
        }

        if (!parsed.data.pOrg0 || !parsed.data.pOrg1) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'pOrg0 y pOrg1 son requeridos para usuarios no entidad',
              timestamp: new Date().toISOString()
            }
          });
        }

        pOrg0 = parsed.data.pOrg0;
        pOrg1 = parsed.data.pOrg1;
      }

      // Validar período
      const queryParams = request.query as any;
      const pPeriodo = queryParams.pPeriodo;
      if (!pPeriodo) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El parámetro pPeriodo es requerido',
            timestamp: new Date().toISOString()
          }
        });
      }

      const userId = user.sub;

      const query = request.diScope.resolve<GetAplicacionPMPQuery>('getAplicacionPMPQuery');
      const prestamos = await query.execute(pOrg0, pOrg1, pPeriodo, userId);

      // Crear una copia profunda completamente limpia usando JSON
      // Esto elimina cualquier getter/setter, propiedades no enumerables, o referencias problemáticas
      const cleanData = JSON.parse(JSON.stringify(prestamos));

      const responseObject = {
        success: true,
        data: cleanData,
        timestamp: new Date().toISOString()
      };

      // Serializar manualmente ANTES de enviar
      // Esto evita que Fastify procese el objeto y pierda datos
      const jsonString = JSON.stringify(responseObject);
      
      
      // Asegurar que el content-type sea JSON explícitamente
      reply.type('application/json');
      
      // Enviar el JSON serializado manualmente como string
      // Fastify no lo volverá a serializar si ya es un string
      return reply.code(200).send(jsonString);
    } catch (error) {
      return handleAplicacionesQNAError(error, reply);
    }
  });

  // GET /reportes/aplicaciones-qna/hip - AP_S_HIP_QNA
  fastify.get('/hip', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtiene aplicación HIP (Préstamos Hipotecarios) ejecutando el stored procedure AP_S_HIP_QNA. Los usuarios admin pueden consultar cualquier clave orgánica. Los usuarios no admin solo pueden consultar sus propias claves orgánicas del token.',
      summary: 'Aplicación HIP',
      tags: ['reportes', 'aplicaciones-qna', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          org0: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{2}$',
            description: 'Clave orgánica nivel 0 (2 caracteres, ej: "01"). Requerido para admin, opcional para otros usuarios (se usa la del token)'
          },
          org1: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{2}$',
            description: 'Clave orgánica nivel 1 (2 caracteres, ej: "01"). Requerido para admin, opcional para otros usuarios (se usa la del token)'
          },
          quincena: {
            type: 'string',
            description: 'Quincena en formato específico'
          }
        },
        required: ['quincena']
      },
      response: {
        200: {
          description: 'Préstamos hipotecarios obtenidos exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
            timestamp: { type: 'string' }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        403: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      if (!user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Usuario no autenticado',
            timestamp: new Date().toISOString()
          }
        });
      }

      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true;
      // Normalize org keys to 2 digits
      const userClave0 = normalizeClaveOrganica(user.idOrganica0) || '';
      const userClave1 = normalizeClaveOrganica(user.idOrganica1) || '';

      // Validar y determinar las claves orgánicas a usar
      let org0: string;
      let org1: string;

      if (isEntidad) {
        // Usuario entidad: usar las claves del token
        if (!userClave0 || !userClave1) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'No se encontraron claves orgánicas en el token del usuario',
              timestamp: new Date().toISOString()
            }
          });
        }

        org0 = userClave0;
        org1 = userClave1;
      } else {
        // Usuario no entidad: debe proporcionar org0 y org1 en parámetros
        const parsed = AplicacionHIPParamsSchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Parámetros de consulta inválidos',
              details: parsed.error.issues,
              timestamp: new Date().toISOString()
            }
          });
        }

        if (!parsed.data.org0 || !parsed.data.org1) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'org0 y org1 son requeridos para usuarios no entidad',
              timestamp: new Date().toISOString()
            }
          });
        }

        org0 = parsed.data.org0;
        org1 = parsed.data.org1;
      }

      // Validar quincena
      const queryParams = request.query as any;
      const quincena = queryParams.quincena;
      if (!quincena) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El parámetro quincena es requerido',
            timestamp: new Date().toISOString()
          }
        });
      }

      const userId = user.sub;

      const query = request.diScope.resolve<GetAplicacionHIPQuery>('getAplicacionHIPQuery');
      const prestamos = await query.execute(org0, org1, quincena, userId);

      // Crear una copia profunda completamente limpia usando JSON
      // Esto elimina cualquier getter/setter, propiedades no enumerables, o referencias problemáticas
      const cleanData = JSON.parse(JSON.stringify(prestamos));

      const responseObject = {
        success: true,
        data: cleanData,
        timestamp: new Date().toISOString()
      };

      // Serializar manualmente ANTES de enviar
      // Esto evita que Fastify procese el objeto y pierda datos
      const jsonString = JSON.stringify(responseObject);
      
      
      // Asegurar que el content-type sea JSON explícitamente
      reply.type('application/json');
      
      // Enviar el JSON serializado manualmente como string
      // Fastify no lo volverá a serializar si ya es un string
      return reply.code(200).send(jsonString);
    } catch (error) {
      return handleAplicacionesQNAError(error, reply);
    }
  });

  // GET /reportes/aplicaciones-qna/concentrado - ADEUDO_ORGANICA_LAYOUT
  fastify.get('/concentrado', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Obtiene concentrado de adeudos ejecutando el stored procedure ADEUDO_ORGANICA_LAYOUT',
      summary: 'Concentrado de adeudos',
      tags: ['reportes', 'aplicaciones-qna', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          org0: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{2}$',
            description: 'Clave orgánica nivel 0 (2 caracteres, ej: "01")'
          },
          org1: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{2}$',
            description: 'Clave orgánica nivel 1 (2 caracteres, ej: "01")'
          },
          org2: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{2}$',
            description: 'Clave orgánica nivel 2 (2 caracteres, ej: "01")'
          },
          org3: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{2}$',
            description: 'Clave orgánica nivel 3 (2 caracteres, ej: "01")'
          },
          periodo: {
            type: 'string',
            description: 'Período en formato específico (ej: "2125")'
          }
        },
        required: ['org0', 'org1', 'org2', 'org3', 'periodo']
      },
      response: {
        200: {
          description: 'Concentrado obtenido exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
            timestamp: { type: 'string' }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const parsed = ConcentradoParamsSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros de consulta inválidos',
            details: parsed.error.issues,
            timestamp: new Date().toISOString()
          }
        });
      }

      const { org0, org1, org2, org3, periodo } = parsed.data;
      const userId = (request as any).user?.sub;

      const query = request.diScope.resolve<GetConcentradoQuery>('getConcentradoQuery');
      const concentrados = await query.execute(org0, org1, org2, org3, periodo, userId);

      // SERIALIZACIÓN INMEDIATA Y MANUAL para evitar pérdida de datos
      // Crear el objeto de respuesta completo y serializarlo inmediatamente
      const responseObject = {
        success: true,
        data: concentrados,
        timestamp: new Date().toISOString()
      };

      // Usar reply.send() para que Fastify maneje automáticamente los headers de CORS
      return reply.code(200).send(responseObject);

    } catch (error) {
      return handleAplicacionesQNAError(error, reply);
    }
  });

  // POST /aplicaciones-qna/sincronizar-periodo-trabajo - Sincroniza la QNA Firebird con la bitácora SQL Server.
  fastify.post('/sincronizar-periodo-trabajo', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtiene la QNA actual desde Firebird y crea su bitácora si aún no existe. Solo cierra registros APLICAR de periodos anteriores.',
      summary: 'Sincronizar período de trabajo',
      tags: ['reportes', 'aplicaciones-qna', 'firebird'],
      security: [{ bearerAuth: [] }],
      response: {
        200: { type: 'object' },
        400: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const org0 = normalizeClaveOrganica(user?.idOrganica0);
      const org1 = normalizeClaveOrganica(user?.idOrganica1);

      if (!org0 || !org1) {
        return reply.code(400).send({
          success: false,
          error: { code: 'MISSING_ORGANICA_KEYS', message: 'No fue posible resolver org0/org1 desde el usuario autenticado.' }
        });
      }

      const rows = await executeSelectableProcedure('AP_G_APLICADO_TIPO', [org0, org1, '01', '01'], {
        alias: 'p',
        columns: ['p.QUINCENA']
      });
      const qnaFirebird = String(rows[0]?.QUINCENA ?? '').padStart(4, '0');
      if (!/^([0-1]\d|2[0-4])\d{2}$/.test(qnaFirebird) || Number(qnaFirebird.slice(0, 2)) < 1) {
        throw new Error('AP_G_APLICADO_TIPO no devolvió una QNA válida');
      }

      const quincena = Number(qnaFirebird.slice(0, 2));
      const anio = 2000 + Number(qnaFirebird.slice(2));
      const pool = await getPool();
      const transaction = new sql.Transaction(pool);
      await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

      try {
        const current = await new sql.Request(transaction)
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.TinyInt, quincena)
          .input('anio', sql.SmallInt, anio)
          .query(`
            SELECT TOP 1 AfectacionId
            FROM afec.BitacoraAfectacionOrg WITH (UPDLOCK, HOLDLOCK)
            WHERE Entidad = 'AFILIADOS'
              AND Org0 = @org0
              AND Org1 = @org1
              AND Quincena = @quincena
              AND Anio = @anio
            ORDER BY CreatedAt DESC
          `);

        let created = false;
        if (current.recordset.length === 0) {
          await new sql.Request(transaction)
            .input('org0', sql.Char(2), org0)
            .input('org1', sql.Char(2), org1)
            .input('quincena', sql.TinyInt, quincena)
            .input('anio', sql.SmallInt, anio)
            .query(`
              UPDATE afec.BitacoraAfectacionOrg
              SET Accion = 'TERMINADO'
              WHERE Entidad = 'AFILIADOS'
                AND Org0 = @org0
                AND Org1 = @org1
                AND UPPER(Accion) = 'APLICAR'
                AND (Anio < @anio OR (Anio = @anio AND Quincena < @quincena))
            `);

          await new sql.Request(transaction)
            .input('Entidad', sql.NVarChar(128), 'AFILIADOS')
            .input('Anio', sql.SmallInt, anio)
            .input('Quincena', sql.TinyInt, quincena)
            .input('OrgNivel', sql.TinyInt, 3)
            .input('Org0', sql.Char(2), org0)
            .input('Org1', sql.Char(2), org1)
            .input('Org2', sql.Char(2), '01')
            .input('Org3', sql.Char(2), '01')
            .input('Accion', sql.VarChar(20), 'APLICAR')
            .input('Resultado', sql.VarChar(10), 'OK')
            .input('Mensaje', sql.NVarChar(4000), `QNA ${qnaFirebird} sincronizada desde Firebird`)
            .input('Usuario', sql.NVarChar(100), String(user?.sub ?? 'Sistema'))
            .input('AppName', sql.NVarChar(100), 'BICSN-API')
            .input('Ip', sql.NVarChar(64), request.ip)
            .execute('afec.usp_RegistrarAfectacionOrg');
          created = true;
        }

        await transaction.commit();
        return reply.send({ success: true, data: { periodo: qnaFirebird, quincena, anio, created }, timestamp: new Date().toISOString() });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      return handleAplicacionesQNAError(error, reply);
    }
  });

  // GET /aplicaciones-qna/periodo-trabajo - Obtiene período de trabajo desde BitacoraAfectacionOrg
  fastify.get('/periodo-trabajo', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtiene el período de trabajo desde BitacoraAfectacionOrg usando org0 y org1 del token o parámetros opcionales. Incluye quincena, año, período formateado y fechas de inicio y fin de la quincena',
      summary: 'Período de trabajo',
      tags: ['reportes', 'aplicaciones-qna', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          org0: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{1,2}$',
            description: 'Clave orgánica nivel 0 (1-2 caracteres numéricos, opcional - se usa del token si no se proporciona)'
          },
          org1: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{1,2}$',
            description: 'Clave orgánica nivel 1 (1-2 caracteres numéricos, opcional - se usa del token si no se proporciona)'
          }
        },
        required: []
      },
      response: {
        200: {
          description: 'Período de trabajo obtenido exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                periodo: { type: 'string', description: 'Período en formato QQAA (ej: "1925")' },
                quincena: { type: 'number', description: 'Número de quincena (1-24)' },
                anio: { type: 'number', description: 'Año completo (ej: 2025)' },
                accion: { type: 'string', description: 'Acción del registro en BitacoraAfectacionOrg (APLICAR o TERMINADO)' },
                org0: { type: 'string', description: 'Clave orgánica nivel 0 utilizada' },
                org1: { type: 'string', description: 'Clave orgánica nivel 1 utilizada' },
                dependencia: { type: 'string', nullable: true, description: 'Nombre de la dependencia asociada a las claves orgánicas del usuario' },
                fechaInicio: { type: 'string', format: 'date', description: 'Fecha de inicio de la quincena (YYYY-MM-DD)' },
                fechaFin: { type: 'string', format: 'date', description: 'Fecha de fin de la quincena (YYYY-MM-DD)' },
                lineaCapturaVigente: {
                  oneOf: [
                    { type: 'null' },
                    {
                      type: 'object',
                      properties: {
                        lineaCapturaPeriodoId: { type: 'number' },
                        periodo: { type: 'string' },
                        quincena: { type: 'number' },
                        anio: { type: 'number' },
                        importe: { type: 'number' },
                        lineaCaptura: { type: 'string' },
                        referencia4: { type: 'string' },
                        fechaLimite: { type: 'string', format: 'date' },
                        fechaFinVigencia: { type: 'string', format: 'date' },
                        estatus: { type: 'string' },
                        digitoVerificador: { type: 'string' }
                      }
                    }
                  ]
                }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        404: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const query = request.query as { org0?: string; org1?: string };

      // Obtener org0 y org1: primero de query params, si no del token
      let org0: string | undefined = query.org0;
      let org1: string | undefined = query.org1;

      // Normalize org keys: from query params first, fallback to token
      if (!org0 && user?.idOrganica0) {
        org0 = normalizeClaveOrganica(user.idOrganica0) || undefined;
      }

      if (!org1 && user?.idOrganica1) {
        org1 = normalizeClaveOrganica(user.idOrganica1) || undefined;
      }

      // Normalize org keys from query params
      if (org0) {
        org0 = normalizeClaveOrganica(org0) || undefined;
      }

      if (org1) {
        org1 = normalizeClaveOrganica(org1) || undefined;
      }

      // Validar que existan org0 y org1
      if (!org0 || !org1) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_ORGANICA_KEYS',
            message: 'org0 y org1 son requeridos. Deben proporcionarse en query string o estar disponibles en el token del usuario.',
            timestamp: new Date().toISOString()
          }
        });
      }

      const lineaCapturaPeriodoRepo = request.diScope.resolve<LineaCapturaPeriodoRepository>('lineaCapturaPeriodoRepo');
      const fechaMexicoHoy = getMexicoTodayDateOnly();
      const lineaVigente = await lineaCapturaPeriodoRepo.findVigenteActiva(org0, org1, fechaMexicoHoy);
      const lineaCapturaVigente = lineaVigente
        ? {
            lineaCapturaPeriodoId: lineaVigente.lineaCapturaPeriodoId,
            periodo: lineaVigente.periodo,
            quincena: lineaVigente.quincena,
            anio: lineaVigente.anio,
            importe: lineaVigente.importe,
            lineaCaptura: lineaVigente.lineaCaptura,
            referencia4: lineaVigente.referencia4,
            fechaLimite: lineaVigente.fechaLimite,
            fechaFinVigencia: lineaVigente.fechaFinVigencia,
            estatus: lineaVigente.estatus,
            digitoVerificador: lineaVigente.digitoVerificador
          }
        : null;

      const dependenciaRows = await executeSafeQuery(
        'SELECT DESCRIPCION FROM ORGANICA_1 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ?',
        [org0, org1]
      );
      const dependencia = String(dependenciaRows[0]?.DESCRIPCION ?? '').trim() || null;

      // Obtener repository y ejecutar consulta
      const repository = request.diScope.resolve<IAplicacionesQNARepository>('aplicacionesQNARepo');
      const periodoData = await repository.obtenerPeriodoTrabajo(org0, org1);

      // Retornar respuesta con org0 y org1 utilizados
      return reply.send({
        success: true,
        data: {
          ...periodoData,
          org0,
          org1,
          dependencia,
          lineaCapturaVigente
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return handleAplicacionesQNAError(error, reply);
    }
  });
}
