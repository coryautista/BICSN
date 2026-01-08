import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { handleRetencionesPorCobrarError } from './infrastructure/errorHandler.js';
import { ConsultaIntMoratorioParamsSchema, CreateRetencionesMoratorioSchema } from './retencionesPorCobrar.schemas.js';
import { GetRetencionesPorCobrarQuery } from './application/queries/GetRetencionesPorCobrarQuery.js';
import { CreateRetencionesMoratorioCommand } from './application/commands/CreateRetencionesMoratorioCommand.js';
import { findUserById } from '../auth/auth.repo.js';
import { RetencionesPorCobrarError } from './domain/errors.js';

export default async function retencionesPorCobrarRoutes(app: FastifyInstance) {
  // GET /retenciones-por-cobrar/Consulta_Int_Moratorio
  app.get('/retenciones-por-cobrar/Consulta_Int_Moratorio', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Consulta de retenciones por cobrar desde ORGANICAS_INT_MORATORIO_GEN. Valida que regresen exactamente 3 registros con tipos PPV, PMP y PCP.',
      summary: 'Consulta Int Moratorio',
      tags: ['retenciones-por-cobrar', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['QNA'],
        properties: {
          org0: {
            type: 'string',
            description: 'Clave orgánica 0 (opcional, se toma del token si no se proporciona)',
            minLength: 1,
            maxLength: 2
          },
          org1: {
            type: 'string',
            description: 'Clave orgánica 1 (opcional, se toma del token si no se proporciona)',
            minLength: 1,
            maxLength: 2
          },
          QNA: {
            type: 'string',
            description: 'Período en formato QQAA (ej: "2225")',
            minLength: 1,
            maxLength: 10
          }
        }
      },
      response: {
        200: {
          description: 'Consulta ejecutada exitosamente',
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            validado: { 
              type: 'boolean',
              description: 'true si hay exactamente 3 registros con tipos PPV, PMP y PCP'
            },
            registros: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  claveOrganica0: { type: 'string' },
                  claveOrganica1: { type: 'string' },
                  claveOrganica2: { type: 'string', nullable: true },
                  claveOrganica3: { type: 'string', nullable: true },
                  periodo: { type: 'string' },
                  fechaGeneracion: { type: 'string', format: 'date-time', nullable: true },
                  userAlta: { type: 'string', nullable: true },
                  tipo: { type: 'string' }
                }
              }
            }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const parsed = ConsultaIntMoratorioParamsSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros de consulta inválidos',
            details: parsed.error.issues,
            timestamp: new Date().toISOString()
          }
        });
      }

      const { QNA } = parsed.data;
      const user = (request as any).user;
      const userId = user?.sub;

      // Extract organica0 and organica1 from JWT token
      // Use query params if provided, otherwise use token values
      const idOrg0 = user?.idOrganica0;
      const idOrg1 = user?.idOrganica1;

      // Usar query params si se proporcionan, sino usar token
      const claveOrganica0 = parsed.data.org0 || 
        (idOrg0 ? (typeof idOrg0 === 'string' ? idOrg0.padStart(2, '0') : idOrg0.toString().padStart(2, '0')) : null);
      const claveOrganica1 = parsed.data.org1 || 
        (idOrg1 ? (typeof idOrg1 === 'string' ? idOrg1.padStart(2, '0') : idOrg1.toString().padStart(2, '0')) : null);

      if (!claveOrganica0 || !claveOrganica1) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'MISSING_ORGANICA_KEYS',
            message: 'Las claves orgánicas (org0 y org1) son requeridas. Deben estar en el token o proporcionarse como parámetros de consulta.',
            timestamp: new Date().toISOString()
          }
        });
      }

      const query = request.diScope.resolve<GetRetencionesPorCobrarQuery>('getRetencionesPorCobrarQuery');
      const result = await query.execute(claveOrganica0, claveOrganica1, QNA, userId);

      return reply.send({
        ok: true,
        validado: result.validado,
        registros: result.registros
      });
    } catch (error) {
      return handleRetencionesPorCobrarError(error, reply);
    }
  });

  // POST /retenciones-por-cobrar/Crear_Int_Moratorio
  app.post('/retenciones-por-cobrar/Crear_Int_Moratorio', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: '[FIREBIRD] Crea tres registros en ORGANICAS_INT_MORATORIO_GEN con tipos PPV, PMP y PCP. Requiere rol admin.',
      summary: 'Crear Int Moratorio',
      tags: ['retenciones-por-cobrar', 'firebird'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['org0', 'org1', 'org2', 'org3', 'periodo'],
        properties: {
          org0: {
            type: 'string',
            description: 'Clave orgánica 0',
            minLength: 1,
            maxLength: 2
          },
          org1: {
            type: 'string',
            description: 'Clave orgánica 1',
            minLength: 1,
            maxLength: 2
          },
          org2: {
            type: 'string',
            description: 'Clave orgánica 2',
            minLength: 1,
            maxLength: 2
          },
          org3: {
            type: 'string',
            description: 'Clave orgánica 3',
            minLength: 1,
            maxLength: 2
          },
          periodo: {
            type: 'string',
            description: 'Período en formato QQAA (ej: "2225")',
            minLength: 1,
            maxLength: 10
          }
        }
      },
      response: {
        201: {
          description: 'Registros creados exitosamente',
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            registros: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  claveOrganica0: { type: 'string' },
                  claveOrganica1: { type: 'string' },
                  claveOrganica2: { type: 'string', nullable: true },
                  claveOrganica3: { type: 'string', nullable: true },
                  periodo: { type: 'string' },
                  fechaGeneracion: { type: 'string', format: 'date-time', nullable: true },
                  userAlta: { type: 'string', nullable: true },
                  tipo: { type: 'string' }
                }
              }
            }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        403: { type: 'object' },
        409: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const parsed = CreateRetencionesMoratorioSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros del body inválidos',
            details: parsed.error.issues,
            timestamp: new Date().toISOString()
          }
        });
      }

      const user = (request as any).user;
      const userId = user?.sub;

      if (!userId) {
        return reply.code(401).send({
          ok: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Usuario no autenticado',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Obtener el username del usuario
      const userInfo = await findUserById(userId);
      if (!userInfo || !userInfo.username) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'No se pudo obtener la información del usuario',
            timestamp: new Date().toISOString()
          }
        });
      }

      const command = request.diScope.resolve<CreateRetencionesMoratorioCommand>('createRetencionesMoratorioCommand');
      
      try {
        const registros = await command.execute({
          org0: parsed.data.org0,
          org1: parsed.data.org1,
          org2: parsed.data.org2,
          org3: parsed.data.org3,
          periodo: parsed.data.periodo,
          userAlta: userInfo.username
        });

        return reply.code(201).send({
          ok: true,
          registros: registros.map(r => ({
            claveOrganica0: r.claveOrganica0,
            claveOrganica1: r.claveOrganica1,
            claveOrganica2: r.claveOrganica2,
            claveOrganica3: r.claveOrganica3,
            periodo: r.periodo,
            fechaGeneracion: r.fechaGeneracion ? r.fechaGeneracion.toISOString() : null,
            userAlta: r.userAlta,
            tipo: r.tipo
          }))
        });
      } catch (error: any) {
        // Log del error para debugging
        console.log('[CREATE_RETENCIONES] Error capturado:', {
          errorType: error?.constructor?.name,
          isRetencionesError: error instanceof RetencionesPorCobrarError,
          errorCode: error?.code,
          errorMessage: error?.message,
          errorName: error?.name
        });

        // Si el error es que los registros ya existen, obtener los registros existentes
        // Verificar tanto por instanceof como por código para mayor compatibilidad
        const isRecordsAlreadyExist = (error instanceof RetencionesPorCobrarError && error.code === 'RECORDS_ALREADY_EXIST') ||
                                      error?.code === 'RECORDS_ALREADY_EXIST';
        
        if (isRecordsAlreadyExist) {
          console.log('[CREATE_RETENCIONES] Detectado error RECORDS_ALREADY_EXIST, obteniendo registros existentes');
          
          try {
            const query = request.diScope.resolve<GetRetencionesPorCobrarQuery>('getRetencionesPorCobrarQuery');
            const result = await query.execute(
              parsed.data.org0,
              parsed.data.org1,
              parsed.data.periodo,
              userId
            );

            // Si hay registros, mapearlos; si no, retornar objeto vacío
            const registrosExistentes = result.registros && result.registros.length > 0
              ? result.registros.map(r => ({
                  claveOrganica0: r.claveOrganica0,
                  claveOrganica1: r.claveOrganica1,
                  claveOrganica2: r.claveOrganica2,
                  claveOrganica3: r.claveOrganica3,
                  periodo: r.periodo,
                  fechaGeneracion: r.fechaGeneracion ? r.fechaGeneracion.toISOString() : null,
                  userAlta: r.userAlta,
                  tipo: r.tipo
                }))
              : {};

            console.log('[CREATE_RETENCIONES] Retornando 409 con registros existentes:', {
              count: Array.isArray(registrosExistentes) ? registrosExistentes.length : 'objeto vacío',
              registrosExistentesType: typeof registrosExistentes,
              isArray: Array.isArray(registrosExistentes)
            });

            // SOLUCIÓN AL PROBLEMA DE SERIALIZACIÓN DE FASTIFY
            // Fastify a veces tiene problemas serializando objetos que tienen referencias circulares,
            // getters/setters, o propiedades no enumerables. La solución es crear una copia profunda
            // completamente limpia usando JSON.parse(JSON.stringify()). Esto elimina cualquier
            // getter/setter, propiedades no enumerables, o referencias problemáticas.
            // Este problema ha ocurrido constantemente en otros endpoints (HIP, Concentrado, Movimientos, etc.)
            // y esta es la solución documentada y probada.
            // Ver: docs/SOLUCION_SERIALIZACION_FASTIFY.md
            // IMPORTANTE: Aplicar también en respuestas de error (409, 500, etc.) que incluyan datos estructurados
            const cleanRegistros = JSON.parse(JSON.stringify(registrosExistentes || {}));

            const response409 = {
              ok: false,
              error: {
                code: error.code || 'RECORDS_ALREADY_EXIST',
                message: error.message || 'Ya existen registros para estas claves orgánicas y periodo',
                timestamp: new Date().toISOString()
              },
              registrosExistentes: cleanRegistros
            };

            console.log('[CREATE_RETENCIONES] Respuesta completa a enviar:', JSON.stringify(response409, null, 2));
            
            // Serializar manualmente ANTES de enviar para evitar problemas con Fastify
            const jsonString = JSON.stringify(response409);
            
            // Asegurar que el content-type sea JSON explícitamente
            reply.type('application/json');
            
            // Enviar el JSON serializado manualmente como string
            return reply.code(409).send(jsonString);
          } catch (queryError: any) {
            console.error('[CREATE_RETENCIONES] Error al obtener registros existentes:', queryError);
            // Si falla la consulta, retornar error sin registros
            const errorResponse = {
              ok: false,
              error: {
                code: error.code || 'RECORDS_ALREADY_EXIST',
                message: error.message || 'Ya existen registros para estas claves orgánicas y periodo',
                timestamp: new Date().toISOString()
              },
              registrosExistentes: {}
            };
            
            // Serializar manualmente ANTES de enviar
            const jsonString = JSON.stringify(errorResponse);
            reply.type('application/json');
            return reply.code(409).send(jsonString);
          }
        }
        throw error;
      }
    } catch (error) {
      return handleRetencionesPorCobrarError(error, reply);
    }
  });
}

