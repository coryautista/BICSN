import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateModuloSchema, UpdateModuloSchema } from './modulo.schemas.js';
import { getAllModulos, getModuloById, createModuloItem, updateModuloItem, deleteModuloItem } from './modulo.service.js';
import { ok, validationError, notFound, badRequest, internalError } from '../../utils/http.js';
import { withDbContext } from '../../db/context.js';

export default async function moduloRoutes(app: FastifyInstance) {

  // Listar todos los módulos (requiere auth)
  app.get('/modulos', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all modules',
      tags: ['modulos'],
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
                  tipo: { type: 'string' },
                  icono: { type: 'string' },
                  orden: { type: 'integer' }
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
      const modulos = await getAllModulos();
      return reply.send(ok(modulos));
    } catch (error: any) {
      console.error('Error listing modulos:', error);
      return reply.code(500).send(internalError('Failed to retrieve modulos'));
    }
  });

  // Obtener módulo por ID (requiere auth)
  app.get('/modulos/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get module by ID',
      tags: ['modulos'],
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
                tipo: { type: 'string' },
                icono: { type: 'string' },
                orden: { type: 'integer' }
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
      const modulo = await getModuloById(id);
      return reply.send(ok(modulo));
    } catch (error: any) {
      if (error.message === 'MODULO_NOT_FOUND') {
        return reply.code(404).send(notFound('Modulo', id.toString()));
      }
      console.error('Error getting modulo:', error);
      return reply.code(500).send(internalError('Failed to retrieve modulo'));
    }
  });

  // Crear módulo (requiere admin)
  app.post('/modulos', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new module',
      tags: ['modulos'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre', 'tipo'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 255 },
          tipo: { type: 'string', enum: ['top', 'center', 'bottom'] },
          icono: { type: 'string', maxLength: 255 },
          orden: { type: 'integer', minimum: 0 }
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
                tipo: { type: 'string' },
                icono: { type: 'string' },
                orden: { type: 'integer' }
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
    return withDbContext(req, async (tx) => {
      const parsed = CreateModuloSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const modulo = await createModuloItem(
          parsed.data.nombre,
          parsed.data.tipo,
          parsed.data.icono,
          parsed.data.orden,
          tx
        );
        return reply.code(201).send(ok(modulo));
      } catch (error: any) {
        console.error('Error creating modulo:', error);
        return reply.code(500).send(internalError('Failed to create modulo'));
      }
    });
  });

  // Actualizar módulo (requiere admin)
  app.put('/modulos/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update module',
      tags: ['modulos'],
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
        required: ['nombre', 'tipo'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 255 },
          tipo: { type: 'string', enum: ['top', 'center', 'bottom'] },
          icono: { type: 'string', maxLength: 255 },
          orden: { type: 'integer', minimum: 0 }
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
                tipo: { type: 'string' },
                icono: { type: 'string' },
                orden: { type: 'integer' }
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
      const id = parseInt((req.params as { id: string }).id);

      // Validate parameter
      if (isNaN(id) || id <= 0) {
        return reply.code(400).send(badRequest('ID must be a positive integer'));
      }

      const parsed = UpdateModuloSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const modulo = await updateModuloItem(
          id,
          parsed.data.nombre,
          parsed.data.tipo,
          parsed.data.icono,
          parsed.data.orden,
          tx
        );
        if (!modulo) {
          return reply.code(404).send(notFound('Modulo', id.toString()));
        }
        return reply.send(ok(modulo));
      } catch (error: any) {
        if (error.message === 'MODULO_NOT_FOUND') {
          return reply.code(404).send(notFound('Modulo', id.toString()));
        }
        console.error('Error updating modulo:', error);
        return reply.code(500).send(internalError('Failed to update modulo'));
      }
    });
  });

  // Eliminar módulo (requiere admin)
  app.delete('/modulos/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete module',
      tags: ['modulos'],
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
                id: { type: 'string' }
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
      const id = parseInt((req.params as { id: string }).id);

      // Validate parameter
      if (isNaN(id) || id <= 0) {
        return reply.code(400).send(badRequest('ID must be a positive integer'));
      }

      try {
        const deletedId = await deleteModuloItem(id, tx);
        if (!deletedId) {
          return reply.code(404).send(notFound('Modulo', id.toString()));
        }
        return reply.send(ok({ id: deletedId }));
      } catch (error: any) {
        if (error.message === 'MODULO_NOT_FOUND') {
          return reply.code(404).send(notFound('Modulo', id.toString()));
        }
        console.error('Error deleting modulo:', error);
        return reply.code(500).send(internalError('Failed to delete modulo'));
      }
    });
  });
}