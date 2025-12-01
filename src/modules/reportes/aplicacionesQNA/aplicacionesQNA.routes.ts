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

export async function aplicacionesQNARoutes(fastify: FastifyInstance) {
  // GET /reportes/aplicaciones-qna/movimientos - HISTORIAL_MOVIMIENTOS_QUIN_IND
  fastify.get('/movimientos', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Obtiene movimientos quincenales individuales ejecutando el stored procedure HISTORIAL_MOVIMIENTOS_QUIN_IND',
      summary: 'Movimientos quincenales',
      tags: ['reportes', 'aplicaciones-qna'],
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
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 0 (2 caracteres, ej: "01")'
          },
          pOrg1: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 1 (2 caracteres, ej: "01")'
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

      // SERIALIZACIÓN INMEDIATA Y MANUAL para evitar pérdida de datos
      const responseObject = {
        success: true,
        data: movimientos,
        timestamp: new Date().toISOString()
      };

      const responseJson = JSON.stringify(responseObject);

      reply.raw.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(responseJson, 'utf8')
      });

      reply.raw.end(responseJson);
    } catch (error) {
      return handleAplicacionesQNAError(error, reply);
    }
  });

  // GET /reportes/aplicaciones-qna/aportaciones - AP_P_FONDOS
  fastify.get('/aportaciones', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Obtiene aplicación de aportaciones o fondos ejecutando el stored procedure AP_P_FONDOS',
      summary: 'Aplicación aportaciones/fondos',
      tags: ['reportes', 'aplicaciones-qna'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          pOrg0: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 0 (2 caracteres, ej: "01")'
          },
          pOrg1: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 1 (2 caracteres, ej: "01")'
          },
          periodo: {
            type: 'string',
            description: 'Período en formato específico (ej: "2125")'
          }
        },
        required: ['pOrg0', 'pOrg1', 'periodo']
      },
      response: {
        200: {
          description: 'Aportaciones obtenidas exitosamente',
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

      const { pOrg0, pOrg1, periodo } = parsed.data;
      const userId = (request as any).user?.sub;

      const query = request.diScope.resolve<GetAplicacionAportacionesQuery>('getAplicacionAportacionesQuery');
      const aportaciones = await query.execute(pOrg0, pOrg1, periodo, userId);

      // SERIALIZACIÓN INMEDIATA Y MANUAL para evitar pérdida de datos
      const responseObject = {
        success: true,
        data: aportaciones,
        timestamp: new Date().toISOString()
      };

      const responseJson = JSON.stringify(responseObject);

      reply.raw.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(responseJson, 'utf8')
      });

      reply.raw.end(responseJson);
    } catch (error) {
      return handleAplicacionesQNAError(error, reply);
    }
  });

  // GET /reportes/aplicaciones-qna/pcp - AP_S_PCP
  fastify.get('/pcp', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Obtiene aplicación PCP (Préstamos a Corto Plazo) ejecutando el stored procedure AP_S_PCP',
      summary: 'Aplicación PCP',
      tags: ['reportes', 'aplicaciones-qna'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          pOrg0: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 0 (2 caracteres, ej: "01")'
          },
          pOrg1: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 1 (2 caracteres, ej: "01")'
          },
          pPeriodo: {
            type: 'string',
            description: 'Período en formato específico (ej: "2125")'
          }
        },
        required: ['pOrg0', 'pOrg1', 'pPeriodo']
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
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
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

      const { pOrg0, pOrg1, pPeriodo } = parsed.data;
      const userId = (request as any).user?.sub;

      const query = request.diScope.resolve<GetAplicacionPCPQuery>('getAplicacionPCPQuery');
      const prestamos = await query.execute(pOrg0, pOrg1, pPeriodo, userId);

      // SERIALIZACIÓN INMEDIATA Y MANUAL para evitar pérdida de datos
      const responseObject = {
        success: true,
        data: prestamos,
        timestamp: new Date().toISOString()
      };

      const responseJson = JSON.stringify(responseObject);

      reply.raw.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(responseJson, 'utf8')
      });

      reply.raw.end(responseJson);
    } catch (error) {
      return handleAplicacionesQNAError(error, reply);
    }
  });

  // GET /reportes/aplicaciones-qna/pmp - AP_S_VIV
  fastify.get('/pmp', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Obtiene aplicación PMP (Préstamos a Mediano Plazo) ejecutando el stored procedure AP_S_VIV',
      summary: 'Aplicación PMP',
      tags: ['reportes', 'aplicaciones-qna'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          pOrg0: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 0 (2 caracteres, ej: "01")'
          },
          pOrg1: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 1 (2 caracteres, ej: "01")'
          },
          pPeriodo: {
            type: 'string',
            description: 'Período en formato específico (ej: "2125")'
          }
        },
        required: ['pOrg0', 'pOrg1', 'pPeriodo']
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
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
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

      const { pOrg0, pOrg1, pPeriodo } = parsed.data;
      const userId = (request as any).user?.sub;

      const query = request.diScope.resolve<GetAplicacionPMPQuery>('getAplicacionPMPQuery');
      const prestamos = await query.execute(pOrg0, pOrg1, pPeriodo, userId);

      // SERIALIZACIÓN INMEDIATA Y MANUAL para evitar pérdida de datos
      const responseObject = {
        success: true,
        data: prestamos,
        timestamp: new Date().toISOString()
      };

      const responseJson = JSON.stringify(responseObject);

      reply.raw.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(responseJson, 'utf8')
      });

      reply.raw.end(responseJson);
    } catch (error) {
      return handleAplicacionesQNAError(error, reply);
    }
  });

  // GET /reportes/aplicaciones-qna/hip - AP_S_HIP_QNA
  fastify.get('/hip', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Obtiene aplicación HIP (Préstamos Hipotecarios) ejecutando el stored procedure AP_S_HIP_QNA',
      summary: 'Aplicación HIP',
      tags: ['reportes', 'aplicaciones-qna'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          org0: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 0 (2 caracteres, ej: "01")'
          },
          org1: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 1 (2 caracteres, ej: "01")'
          },
          quincena: {
            type: 'string',
            description: 'Quincena en formato específico'
          }
        },
        required: ['org0', 'org1', 'quincena']
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
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
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

      const { org0, org1, quincena } = parsed.data;
      const userId = (request as any).user?.sub;

      const query = request.diScope.resolve<GetAplicacionHIPQuery>('getAplicacionHIPQuery');
      const prestamos = await query.execute(org0, org1, quincena, userId);

      // SERIALIZACIÓN INMEDIATA Y MANUAL para evitar pérdida de datos
      const responseObject = {
        success: true,
        data: prestamos,
        timestamp: new Date().toISOString()
      };

      const responseJson = JSON.stringify(responseObject);

      reply.raw.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(responseJson, 'utf8')
      });

      reply.raw.end(responseJson);
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
      tags: ['reportes', 'aplicaciones-qna'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          org0: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 0 (2 caracteres, ej: "01")'
          },
          org1: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 1 (2 caracteres, ej: "01")'
          },
          org2: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 2 (2 caracteres, ej: "01")'
          },
          org3: {
            type: 'string',
            pattern: '^[0-9]{2}$',
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

      // Serializar inmediatamente para preservar todas las propiedades
      const responseJson = JSON.stringify(responseObject);
      
      // Log del JSON serializado final para verificación
      console.log('[CONCENTRADO] JSON SERIALIZADO FINAL:', {
        jsonLength: responseJson.length,
        jsonPreview: responseJson.substring(0, 200) + '...',
        dataKeys: concentrados.length > 0 ? Object.keys(concentrados[0]) : [],
        primerObjetoKeys: concentrados.length > 0 ? JSON.stringify(concentrados[0]) : null
      });

      // ENVIAR RESPUESTA MANUAL usando reply.raw para evitar pipeline de Fastify
      reply.raw.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(responseJson, 'utf8')
      });
      
      reply.raw.end(responseJson);
      
      // NO usar reply.send() - esto evita el procesamiento asíncrono de Fastify

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
      tags: ['reportes', 'aplicaciones-qna'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          org0: {
            type: 'string',
            pattern: '^[0-9]{1,2}$',
            description: 'Clave orgánica nivel 0 (1-2 caracteres numéricos, opcional - se usa del token si no se proporciona)'
          },
          org1: {
            type: 'string',
            pattern: '^[0-9]{1,2}$',
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
                org0: { type: 'string', description: 'Clave orgánica nivel 0 utilizada' },
                org1: { type: 'string', description: 'Clave orgánica nivel 1 utilizada' },
                fechaInicio: { type: 'string', format: 'date', description: 'Fecha de inicio de la quincena (YYYY-MM-DD)' },
                fechaFin: { type: 'string', format: 'date', description: 'Fecha de fin de la quincena (YYYY-MM-DD)' }
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

      // Si no vienen en query, obtener del token
      if (!org0 && user?.idOrganica0) {
        const idOrg0 = user.idOrganica0;
        org0 = typeof idOrg0 === 'string' 
          ? idOrg0.padStart(2, '0').substring(0, 2)
          : String(idOrg0).padStart(2, '0').substring(0, 2);
      }

      if (!org1 && user?.idOrganica1) {
        const idOrg1 = user.idOrganica1;
        org1 = typeof idOrg1 === 'string'
          ? idOrg1.padStart(2, '0').substring(0, 2)
          : String(idOrg1).padStart(2, '0').substring(0, 2);
      }

      // Normalizar org0 y org1 si vienen de query params
      if (org0) {
        org0 = typeof org0 === 'string'
          ? org0.padStart(2, '0').substring(0, 2)
          : String(org0).padStart(2, '0').substring(0, 2);
      }

      if (org1) {
        org1 = typeof org1 === 'string'
          ? org1.padStart(2, '0').substring(0, 2)
          : String(org1).padStart(2, '0').substring(0, 2);
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

      // Obtener repository y ejecutar consulta
      const repository = request.diScope.resolve<IAplicacionesQNARepository>('aplicacionesQNARepo');
      const periodoData = await repository.obtenerPeriodoTrabajo(org0, org1);

      // Retornar respuesta con org0 y org1 utilizados
      return reply.send({
        success: true,
        data: {
          ...periodoData,
          org0,
          org1
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return handleAplicacionesQNAError(error, reply);
    }
  });
}

