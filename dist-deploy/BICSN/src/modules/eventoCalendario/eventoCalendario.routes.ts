import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateEventoCalendarioSchema, UpdateEventoCalendarioSchema, QueryEventoCalendarioByDateRangeSchema } from './eventoCalendario.schemas.js';
import { ok, badRequest, fail, validationError } from '../../utils/http.js';
import { handleEventoCalendarioError } from './infrastructure/errorHandler.js';
import type { GetAllEventoCalendariosQuery } from './application/queries/GetAllEventoCalendariosQuery.js';
import type { GetEventoCalendarioByIdQuery } from './application/queries/GetEventoCalendarioByIdQuery.js';
import type { GetEventoCalendariosByDateRangeQuery } from './application/queries/GetEventoCalendariosByDateRangeQuery.js';
import type { CreateEventoCalendarioCommand } from './application/commands/CreateEventoCalendarioCommand.js';
import type { UpdateEventoCalendarioCommand } from './application/commands/UpdateEventoCalendarioCommand.js';
import type { DeleteEventoCalendarioCommand } from './application/commands/DeleteEventoCalendarioCommand.js';
import type { IEventoCalendarioRepository } from './domain/repositories/IEventoCalendarioRepository.js';

export default async function eventoCalendarioRoutes(app: FastifyInstance) {

  // Listar todos los eventos de calendario (requiere auth)
  app.get('/eventos-calendario', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all eventos calendario',
      tags: ['eventos-calendario'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  fecha: { type: 'string', format: 'date' },
                  tipo: { type: 'string', enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'BA_MOVIMIENTO', 'PAGO', 'HIPOTECARIO', 'INTERESES_MORATORIOS', 'REPORTES'] },
                  anio: { type: 'integer' },
                  createdAt: { type: 'string', format: 'date-time' },
                  origen: { type: 'string', enum: ['MANUAL', 'AUTOMATICO'] },
                  periodoQna: { type: 'string', nullable: true },
                  eventoHipotecarioId: { type: 'integer', nullable: true }
                }
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
      const getAllEventoCalendariosQuery = req.diScope.resolve<GetAllEventoCalendariosQuery>('getAllEventoCalendariosQuery');
      const eventos = await getAllEventoCalendariosQuery.execute();
      return reply.send(ok(eventos));
    } catch (error: any) {
      return handleEventoCalendarioError(error, reply);
    }
  });

  // Consultar eventos de calendario por rango de fechas y tipo (requiere auth)
  app.get('/eventos-calendario/rango', {
    preHandler: [requireAuth],
    schema: {
      description: 'Consultar eventos del calendario por rango de fechas y tipo opcional',
      tags: ['eventos-calendario'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['fechaInicio', 'fechaFin'],
        properties: {
          fechaInicio: { type: 'string', format: 'date', description: 'Fecha de inicio del rango (YYYY-MM-DD)' },
          fechaFin: { type: 'string', format: 'date', description: 'Fecha de fin del rango (YYYY-MM-DD)' },
          tipo: {
            type: 'string',
            enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'BA_MOVIMIENTO', 'PAGO', 'HIPOTECARIO', 'INTERESES_MORATORIOS', 'REPORTES'],
            description: 'Tipo de evento (opcional)'
          }
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
                  id: { type: 'integer', description: 'ID del evento' },
                  fecha: { type: 'string', format: 'date', description: 'Fecha del evento' },
                  tipo: {
                    type: 'string',
                    enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'BA_MOVIMIENTO', 'PAGO', 'HIPOTECARIO', 'INTERESES_MORATORIOS', 'REPORTES'],
                    description: 'Tipo de evento'
                  },
                    anio: { type: 'integer', description: 'Año del evento' },
                    createdAt: { type: 'string', format: 'date-time', description: 'Fecha de creación' },
                    origen: { type: 'string', enum: ['MANUAL', 'AUTOMATICO'] },
                    periodoQna: { type: 'string', nullable: true },
                    eventoHipotecarioId: { type: 'integer', nullable: true }
                }
              }
            }
          },
          description: 'Lista de eventos encontrados en el rango de fechas especificado'
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
          },
          description: 'Error de validación en los parámetros de consulta'
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
          },
          description: 'Error interno del servidor'
        }
      }
    }
  }, async (req, reply) => {
    const parsed = QueryEventoCalendarioByDateRangeSchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    const { fechaInicio, fechaFin, tipo } = parsed.data;
    try {
      const getEventoCalendariosByDateRangeQuery = req.diScope.resolve<GetEventoCalendariosByDateRangeQuery>('getEventoCalendariosByDateRangeQuery');
      const eventos = await getEventoCalendariosByDateRangeQuery.execute(fechaInicio, fechaFin, tipo);
      return reply.send(ok(eventos));
    } catch (error: any) {
      return handleEventoCalendarioError(error, reply);
    }
  });

  // Obtener evento de calendario por ID (requiere auth)
  app.get('/eventos-calendario/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get evento calendario by ID',
      tags: ['eventos-calendario'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                fecha: { type: 'string', format: 'date' },
                tipo: { type: 'string', enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'BA_MOVIMIENTO', 'PAGO', 'HIPOTECARIO', 'INTERESES_MORATORIOS', 'REPORTES'] },
                anio: { type: 'integer' },
                createdAt: { type: 'string', format: 'date-time' }
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
        404: {
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
    const id = parseInt((req.params as { id: string }).id);

    // Validate parameter
    if (isNaN(id) || id <= 0) {
      return reply.code(400).send(badRequest('ID must be a positive integer'));
    }

    try {
      const getEventoCalendarioByIdQuery = req.diScope.resolve<GetEventoCalendarioByIdQuery>('getEventoCalendarioByIdQuery');
      const evento = await getEventoCalendarioByIdQuery.execute(id);
      return reply.send(ok(evento));
    } catch (error: any) {
      return handleEventoCalendarioError(error, reply);
    }
  });

  // Crear evento de calendario (requiere admin)
  app.post('/eventos-calendario', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new evento calendario',
      tags: ['eventos-calendario'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['fecha', 'tipo', 'anio'],
        properties: {
          fecha: { type: 'string', format: 'date' },
          tipo: { type: 'string', enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'BA_MOVIMIENTO', 'PAGO', 'HIPOTECARIO', 'INTERESES_MORATORIOS', 'REPORTES'] },
          anio: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                fecha: { type: 'string', format: 'date' },
                tipo: { type: 'string', enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'BA_MOVIMIENTO', 'PAGO', 'HIPOTECARIO', 'INTERESES_MORATORIOS', 'REPORTES'] },
                anio: { type: 'integer' },
                createdAt: { type: 'string', format: 'date-time' }
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
        409: {
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
    const parsed = CreateEventoCalendarioSchema.safeParse(req.body);
    if (!parsed.success) {
      const validationErrorResponse = {
        ok: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Error de validación en los datos del evento de calendario',
          details: parsed.error.issues
        }
      };
      return reply.code(400).send(validationErrorResponse);
    }

    try {
      const createEventoCalendarioCommand = req.diScope.resolve<CreateEventoCalendarioCommand>('createEventoCalendarioCommand');
      const evento = await createEventoCalendarioCommand.execute(parsed.data);
      return reply.code(201).send(ok(evento));
    } catch (error: any) {
      if (error.message === 'APLICACION_QNA_NO_FINALIZADA') {
        return reply.code(409).send(fail('La QNA de la fecha seleccionada no ha sido aplicada.', 'APLICACION_QNA_NO_FINALIZADA'));
      }
      return handleEventoCalendarioError(error, reply);
    }
  });

  // Actualizar evento de calendario (requiere admin)
  app.put('/eventos-calendario/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update evento calendario',
      tags: ['eventos-calendario'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          fecha: { type: 'string', format: 'date' },
          tipo: { type: 'string', enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'BA_MOVIMIENTO', 'PAGO', 'HIPOTECARIO', 'INTERESES_MORATORIOS', 'REPORTES'] },
          anio: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          confirmarImpactoBA: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                fecha: { type: 'string', format: 'date' },
                tipo: { type: 'string', enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'BA_MOVIMIENTO', 'PAGO', 'HIPOTECARIO', 'INTERESES_MORATORIOS', 'REPORTES'] },
                anio: { type: 'integer' },
                createdAt: { type: 'string', format: 'date-time' }
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
        404: {
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
        409: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: { type: 'object' }
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
    const id = parseInt((req.params as { id: string }).id);

    // Validate parameter
    if (isNaN(id) || id <= 0) {
      return reply.code(400).send(badRequest('ID must be a positive integer'));
    }

    const parsed = UpdateEventoCalendarioSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const eventoCalendarioRepo = req.diScope.resolve<IEventoCalendarioRepository>('eventoCalendarioRepo');
      const eventoActual = await eventoCalendarioRepo.findById(id);
      if (eventoActual?.tipo === 'HIPOTECARIO') {
        const baAfectados = await eventoCalendarioRepo.countBaAutomaticosByHipotecarioId(id);
        if (baAfectados > 0 && !parsed.data.confirmarImpactoBA) {
          return reply.code(409).send(fail(
            'El cambio afecta BA Movimiento existentes. Las BA ya generadas no serán recalculadas.',
            'BA_MOVIMIENTO_AFECTADO',
            { baAfectados },
          ));
        }
      }
      const updateEventoCalendarioCommand = req.diScope.resolve<UpdateEventoCalendarioCommand>('updateEventoCalendarioCommand');
      const evento = await updateEventoCalendarioCommand.execute({ id, ...parsed.data });
      return reply.send(ok(evento));
    } catch (error: any) {
      return handleEventoCalendarioError(error, reply);
    }
  });

  // Eliminar evento de calendario (requiere admin)
  app.delete('/eventos-calendario/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete evento calendario',
      tags: ['eventos-calendario'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' }
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
        404: {
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
        409: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: { type: 'object' }
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
    const id = parseInt((req.params as { id: string }).id);

    // Validate parameter
    if (isNaN(id) || id <= 0) {
      return reply.code(400).send(badRequest('ID must be a positive integer'));
    }

    try {
      const eventoCalendarioRepo = req.diScope.resolve<IEventoCalendarioRepository>('eventoCalendarioRepo');
      const eventoActual = await eventoCalendarioRepo.findById(id);
      if (eventoActual?.tipo === 'HIPOTECARIO') {
        const confirmarImpactoBA = (req.query as { confirmarImpactoBA?: string }).confirmarImpactoBA === 'true';
        const baAfectados = await eventoCalendarioRepo.countBaAutomaticosByHipotecarioId(id);
        if (baAfectados > 0 && !confirmarImpactoBA) {
          return reply.code(409).send(fail(
            'La eliminación afecta BA Movimiento existentes. Las BA ya generadas no serán recalculadas.',
            'BA_MOVIMIENTO_AFECTADO',
            { baAfectados },
          ));
        }
      }
      const deleteEventoCalendarioCommand = req.diScope.resolve<DeleteEventoCalendarioCommand>('deleteEventoCalendarioCommand');
      const deletedId = await deleteEventoCalendarioCommand.execute({ id });
      return reply.send(ok({ id: deletedId }));
    } catch (error: any) {
      return handleEventoCalendarioError(error, reply);
    }
  });
}
