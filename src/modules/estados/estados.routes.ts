import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateEstadoSchema, UpdateEstadoSchema, EstadoIdParamSchema } from './estados.schemas.js';
import { getAllEstados, getEstadoById, createEstadoItem, updateEstadoItem, deleteEstadoItem } from './estados.service.js';
import { ok, validationError, notFound, internalError } from '../../utils/http.js';
import { withDbContext } from '../../db/context.js';

export default async function estadosRoutes(app: FastifyInstance) {

  // Listar todos los estados (requiere auth)
  app.get('/estados', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all states',
      tags: ['estados'],
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
                  estadoId: { type: 'string' },
                  nombreEstado: { type: 'string' },
                  esValido: { type: 'boolean' }
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
  }, async (_req, reply) => {
    try {
      const estados = await getAllEstados();
      return reply.send(ok(estados));
    } catch (error: any) {
      console.error('Error listing estados:', error);
      return reply.code(500).send(internalError('Failed to retrieve estados'));
    }
  });

  // Obtener estado por ID (requiere auth)
  app.get('/estados/:estadoId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get state by ID',
      tags: ['estados'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          estadoId: { type: 'string', minLength: 2, maxLength: 2 }
        },
        required: ['estadoId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                estadoId: { type: 'string' },
                nombreEstado: { type: 'string' },
                esValido: { type: 'boolean' }
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
    const { estadoId } = req.params as { estadoId: string };

    // Validate parameter
    const paramValidation = EstadoIdParamSchema.safeParse({ estadoId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const estado = await getEstadoById(estadoId);
      return reply.send(ok(estado));
    } catch (error: any) {
      if (error.message === 'ESTADO_NOT_FOUND') {
        return reply.code(404).send(notFound('Estado', estadoId));
      }
      console.error('Error getting estado:', error);
      return reply.code(500).send(internalError('Failed to retrieve estado'));
    }
  });

  // Crear estado (requiere admin)
  app.post('/estados', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new state',
      tags: ['estados'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['estadoId', 'nombreEstado'],
        properties: {
          estadoId: { type: 'string', minLength: 2, maxLength: 2 },
          nombreEstado: { type: 'string', minLength: 1, maxLength: 50 },
          esValido: { type: 'boolean' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                estadoId: { type: 'string' },
                nombreEstado: { type: 'string' },
                esValido: { type: 'boolean' }
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
      const parsed = CreateEstadoSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const estado = await createEstadoItem(
          parsed.data.estadoId,
          parsed.data.nombreEstado,
          parsed.data.esValido ?? false,
          userId,
          tx
        );
        return reply.code(201).send(ok(estado));
      } catch (error: any) {
        if (error.message === 'ESTADO_EXISTS') {
          return reply.code(409).send({ ok: false, error: { code: 'CONFLICT', message: 'Estado already exists' } });
        }
        console.error('Error creating estado:', error);
        return reply.code(500).send(internalError('Failed to create estado'));
      }
    });
  });

  // Actualizar estado (requiere admin)
  app.put('/estados/:estadoId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update state',
      tags: ['estados'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          estadoId: { type: 'string', minLength: 2, maxLength: 2 }
        },
        required: ['estadoId']
      },
      body: {
        type: 'object',
        properties: {
          nombreEstado: { type: 'string', minLength: 1, maxLength: 50 },
          esValido: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                estadoId: { type: 'string' },
                nombreEstado: { type: 'string' },
                esValido: { type: 'boolean' }
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
      const { estadoId } = req.params as { estadoId: string };

      // Validate parameter
      const paramValidation = EstadoIdParamSchema.safeParse({ estadoId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateEstadoSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const estado = await updateEstadoItem(
          estadoId,
          parsed.data.nombreEstado,
          parsed.data.esValido,
          userId,
          tx
        );
        return reply.send(ok(estado));
      } catch (error: any) {
        if (error.message === 'ESTADO_NOT_FOUND') {
          return reply.code(404).send(notFound('Estado', estadoId));
        }
        console.error('Error updating estado:', error);
        return reply.code(500).send(internalError('Failed to update estado'));
      }
    });
  });

  // Eliminar estado (requiere admin)
  app.delete('/estados/:estadoId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete state',
      tags: ['estados'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          estadoId: { type: 'string', minLength: 2, maxLength: 2 }
        },
        required: ['estadoId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                estadoId: { type: 'string' }
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
      const { estadoId } = req.params as { estadoId: string };

      // Validate parameter
      const paramValidation = EstadoIdParamSchema.safeParse({ estadoId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const deletedId = await deleteEstadoItem(estadoId, tx);
        return reply.send(ok({ estadoId: deletedId }));
      } catch (error: any) {
        if (error.message === 'ESTADO_NOT_FOUND') {
          return reply.code(404).send(notFound('Estado', estadoId));
        }
        console.error('Error deleting estado:', error);
        return reply.code(500).send(internalError('Failed to delete estado'));
      }
    });
  });
}