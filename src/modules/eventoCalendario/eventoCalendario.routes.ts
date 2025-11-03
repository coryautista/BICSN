import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateEventoCalendarioSchema, UpdateEventoCalendarioSchema, QueryEventoCalendarioByDateRangeSchema } from './eventoCalendario.schemas.js';
import { getAllEventoCalendarios, getEventoCalendarioById, createEventoCalendarioItem, updateEventoCalendarioItem, deleteEventoCalendarioItem, getEventoCalendariosByDateRange } from './eventoCalendario.service.js';
import { fail } from '../../utils/http.js';
import { withDbContext } from '../../db/context.js';

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
                  tipo: { type: 'string', enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'PAGO', 'HIPOTECARIO'] },
                  anio: { type: 'integer' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  }, async (_req, reply) => {
    const eventos = await getAllEventoCalendarios();
    return reply.send({ data: eventos });
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
            enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'PAGO', 'HIPOTECARIO'],
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
                    enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'PAGO', 'HIPOTECARIO'],
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
    if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

    const { fechaInicio, fechaFin, tipo } = parsed.data;
    try {
      const eventos = await getEventoCalendariosByDateRange(fechaInicio, fechaFin, tipo);
      return reply.send({ data: eventos });
    } catch (e: any) {
      if (e.message.includes('INVALID') || e.message.includes('MISSING')) {
        return reply.code(400).send(fail(e.message));
      }
      return reply.code(500).send(fail('EVENTO_CALENDARIO_QUERY_FAILED'));
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
                tipo: { type: 'string', enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'PAGO', 'HIPOTECARIO'] },
                anio: { type: 'integer' },
                createdAt: { type: 'string', format: 'date-time' }
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
    const { id } = req.params as { id: number };
    try {
      const evento = await getEventoCalendarioById(id);
      return reply.send({ data: evento });
    } catch (e: any) {
      if (e.message === 'EVENTO_CALENDARIO_NOT_FOUND') return reply.code(404).send(fail(e.message));
      return reply.code(500).send(fail('EVENTO_CALENDARIO_FETCH_FAILED'));
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
          tipo: { type: 'string', enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'PAGO', 'HIPOTECARIO'] },
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
                tipo: { type: 'string', enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'PAGO', 'HIPOTECARIO'] },
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
    return withDbContext(req, async (tx) => {
      const parsed = CreateEventoCalendarioSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

      try {
        const evento = await createEventoCalendarioItem(
          parsed.data.fecha,
          parsed.data.tipo,
          parsed.data.anio,
          parsed.data.createdAt,
          tx
        );
        return reply.code(201).send({ data: evento });
      } catch (e: any) {
        if (e.message === 'EVENTO_CALENDARIO_ALREADY_EXISTS') {
          return reply.code(409).send(fail('EVENTO_CALENDARIO_ALREADY_EXISTS'));
        }
        return reply.code(500).send(fail('EVENTO_CALENDARIO_CREATE_FAILED'));
      }
    });
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
          tipo: { type: 'string', enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'PAGO', 'HIPOTECARIO'] },
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
                tipo: { type: 'string', enum: ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'PAGO', 'HIPOTECARIO'] },
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
    return withDbContext(req, async (tx) => {
      const { id } = req.params as { id: number };
      const parsed = UpdateEventoCalendarioSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

      try {
        const evento = await updateEventoCalendarioItem(
          id,
          parsed.data.fecha,
          parsed.data.tipo,
          parsed.data.anio,
          parsed.data.createdAt,
          tx
        );
        if (!evento) return reply.code(404).send(fail('EVENTO_CALENDARIO_NOT_FOUND'));
        return reply.send({ data: evento });
      } catch (e: any) {
        if (e.message === 'EVENTO_CALENDARIO_NOT_FOUND') return reply.code(404).send(fail(e.message));
        return reply.code(500).send(fail('EVENTO_CALENDARIO_UPDATE_FAILED'));
      }
    });
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
    return withDbContext(req, async (tx) => {
      const { id } = req.params as { id: number };
      try {
        const deletedId = await deleteEventoCalendarioItem(id, tx);
        if (!deletedId) return reply.code(404).send(fail('EVENTO_CALENDARIO_NOT_FOUND'));
        return reply.send({ data: { id: deletedId } });
      } catch (e: any) {
        if (e.message === 'EVENTO_CALENDARIO_NOT_FOUND') return reply.code(404).send(fail(e.message));
        return reply.code(500).send(fail('EVENTO_CALENDARIO_DELETE_FAILED'));
      }
    });
  });
}