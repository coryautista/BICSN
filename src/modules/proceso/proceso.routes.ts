import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateProcesoSchema, UpdateProcesoSchema } from './proceso.schemas.js';
import { getAllProcesos, getProcesoById, createProcesoItem, updateProcesoItem, deleteProcesoItem } from './proceso.service.js';
import { fail } from '../../utils/http.js';
import { withDbContext } from '../../db/context.js';

export default async function procesoRoutes(app: FastifyInstance) {

  // Listar todos los procesos (requiere auth)
  app.get('/procesos', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all procesos',
      tags: ['procesos'],
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
                  nombre: { type: 'string' },
                  componente: { type: 'string' },
                  idModulo: { type: 'integer' },
                  orden: { type: 'integer' },
                  tipo: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (_req, reply) => {
    const procesos = await getAllProcesos();
    return reply.send({ data: procesos });
  });

  // Obtener proceso por ID (requiere auth)
  app.get('/procesos/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get proceso by ID',
      tags: ['procesos'],
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
                nombre: { type: 'string' },
                componente: { type: 'string' },
                idModulo: { type: 'integer' },
                orden: { type: 'integer' },
                tipo: { type: 'string' }
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
      const proceso = await getProcesoById(id);
      return reply.send({ data: proceso });
    } catch (e: any) {
      if (e.message === 'PROCESO_NOT_FOUND') return reply.code(404).send(fail(e.message));
      return reply.code(500).send(fail('PROCESO_FETCH_FAILED'));
    }
  });

  // Crear proceso (requiere admin)
  app.post('/procesos', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new proceso item',
      tags: ['procesos'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre', 'componente', 'idModulo'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 4000 },
          componente: { type: 'string', minLength: 1, maxLength: 4000 },
          idModulo: { type: 'integer' },
          orden: { type: 'integer', minimum: 0 },
          tipo: { type: 'string', maxLength: 50 }
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
                nombre: { type: 'string' },
                componente: { type: 'string' },
                idModulo: { type: 'integer' },
                orden: { type: 'integer' },
                tipo: { type: 'string' }
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
      const parsed = CreateProcesoSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

      try {
        const proceso = await createProcesoItem(
          parsed.data.nombre,
          parsed.data.componente,
          parsed.data.idModulo,
          parsed.data.orden,
          parsed.data.tipo,
          tx
        );
        return reply.code(201).send({ data: proceso });
      } catch (e: any) {
        if (e.message === 'MODULO_NOT_FOUND') return reply.code(404).send(fail(e.message));
        return reply.code(500).send(fail('PROCESO_CREATE_FAILED'));
      }
    });
  });

  // Actualizar proceso (requiere admin)
  app.put('/procesos/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update proceso item',
      tags: ['procesos'],
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
          nombre: { type: 'string', minLength: 1, maxLength: 4000 },
          componente: { type: 'string', minLength: 1, maxLength: 4000 },
          idModulo: { type: 'integer' },
          orden: { type: 'integer', minimum: 0 },
          tipo: { type: 'string', maxLength: 50 }
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
                nombre: { type: 'string' },
                componente: { type: 'string' },
                idModulo: { type: 'integer' },
                orden: { type: 'integer' },
                tipo: { type: 'string' }
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
      const parsed = UpdateProcesoSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

      try {
        const proceso = await updateProcesoItem(
          id,
          parsed.data.nombre,
          parsed.data.componente,
          parsed.data.idModulo,
          parsed.data.orden,
          parsed.data.tipo,
          tx
        );
        if (!proceso) return reply.code(404).send(fail('PROCESO_NOT_FOUND'));
        return reply.send({ data: proceso });
      } catch (e: any) {
        if (e.message === 'PROCESO_NOT_FOUND') return reply.code(404).send(fail(e.message));
        if (e.message === 'MODULO_NOT_FOUND') return reply.code(404).send(fail(e.message));
        return reply.code(500).send(fail('PROCESO_UPDATE_FAILED'));
      }
    });
  });

  // Eliminar proceso (requiere admin)
  app.delete('/procesos/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete proceso item',
      tags: ['procesos'],
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
        const deletedId = await deleteProcesoItem(id, tx);
        if (!deletedId) return reply.code(404).send(fail('PROCESO_NOT_FOUND'));
        return reply.send({ data: { id: deletedId } });
      } catch (e: any) {
        if (e.message === 'PROCESO_NOT_FOUND') return reply.code(404).send(fail(e.message));
        return reply.code(500).send(fail('PROCESO_DELETE_FAILED'));
      }
    });
  });
}