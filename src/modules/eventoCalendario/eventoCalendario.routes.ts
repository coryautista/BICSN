import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateEventoCalendarioSchema, UpdateEventoCalendarioSchema, QueryEventoCalendarioByDateRangeSchema } from './eventoCalendario.schemas.js';
import { ok, badRequest, validationError } from '../../utils/http.js';
import { handleEventoCalendarioError } from './infrastructure/errorHandler.js';
import type { GetAllEventoCalendariosQuery } from './application/queries/GetAllEventoCalendariosQuery.js';
import type { GetEventoCalendarioByIdQuery } from './application/queries/GetEventoCalendarioByIdQuery.js';
import type { GetEventoCalendariosByDateRangeQuery } from './application/queries/GetEventoCalendariosByDateRangeQuery.js';
import type { CreateEventoCalendarioCommand } from './application/commands/CreateEventoCalendarioCommand.js';
import type { UpdateEventoCalendarioCommand } from './application/commands/UpdateEventoCalendarioCommand.js';
import type { DeleteEventoCalendarioCommand } from './application/commands/DeleteEventoCalendarioCommand.js';

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
                  tipo: { type: 'string', enum: ['FERIADO', 'VACACIONES', 'EVENTO_ESPECIAL', 'DIA_NO_LABORABLE'] },
                  anio: { type: 'integer' },
                  createdAt: { type: 'string', format: 'date-time' }
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
            enum: ['FERIADO', 'VACACIONES', 'EVENTO_ESPECIAL', 'DIA_NO_LABORABLE'],
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
                    enum: ['FERIADO', 'VACACIONES', 'EVENTO_ESPECIAL', 'DIA_NO_LABORABLE'],
                    description: 'Tipo de evento'
                  },
                  anio: { type: 'integer', description: 'Año del evento' },
                  createdAt: { type: 'string', format: 'date-time', description: 'Fecha de creación' }
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
                tipo: { type: 'string', enum: ['FERIADO', 'VACACIONES', 'EVENTO_ESPECIAL', 'DIA_NO_LABORABLE', 'HIPOTECARIO'] },
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
          tipo: { type: 'string', enum: ['FERIADO', 'VACACIONES', 'EVENTO_ESPECIAL', 'DIA_NO_LABORABLE', 'HIPOTECARIO'] },
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
                tipo: { type: 'string', enum: ['FERIADO', 'VACACIONES', 'EVENTO_ESPECIAL', 'DIA_NO_LABORABLE', 'HIPOTECARIO'] },
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
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const createEventoCalendarioCommand = req.diScope.resolve<CreateEventoCalendarioCommand>('createEventoCalendarioCommand');
      const evento = await createEventoCalendarioCommand.execute(parsed.data);
      return reply.code(201).send(ok(evento));
    } catch (error: any) {
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
          tipo: { type: 'string', enum: ['FERIADO', 'VACACIONES', 'EVENTO_ESPECIAL', 'DIA_NO_LABORABLE', 'HIPOTECARIO'] },
          anio: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' }
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
                tipo: { type: 'string', enum: ['FERIADO', 'VACACIONES', 'EVENTO_ESPECIAL', 'DIA_NO_LABORABLE', 'HIPOTECARIO'] },
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

    const parsed = UpdateEventoCalendarioSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
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
      const deleteEventoCalendarioCommand = req.diScope.resolve<DeleteEventoCalendarioCommand>('deleteEventoCalendarioCommand');
      const deletedId = await deleteEventoCalendarioCommand.execute({ id });
      return reply.send(ok({ id: deletedId }));
    } catch (error: any) {
      return handleEventoCalendarioError(error, reply);
    }
  });
}
