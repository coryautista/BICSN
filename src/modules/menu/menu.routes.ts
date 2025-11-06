import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateMenuSchema, UpdateMenuSchema } from './menu.schemas.js';
import { getAllMenus, getMenuById, createMenuItem, updateMenuItem, deleteMenuItem, getMenuHierarchy } from './menu.service.js';
import { fail } from '../../utils/http.js';
import { withDbContext } from '../../db/context.js';

export default async function menuRoutes(app: FastifyInstance) {

  // Listar todos los menús (requiere auth)
  app.get('/menus', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all menus',
      tags: ['menus'],
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
                  componente: { type: ['string', 'null'] },
                  parentId: { type: ['integer', 'null'] },
                  icono: { type: ['string', 'null'] },
                  orden: { type: 'integer' }
                }
              }
            }
          }
        }
      }
    }
  }, async (_req, reply) => {
    const menus = await getAllMenus();
    return reply.send({ data: menus });
  });

  // Obtener menú por ID (requiere auth)
  app.get('/menus/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get menu by ID',
      tags: ['menus'],
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
                componente: { type: ['string', 'null'] },
                parentId: { type: ['integer', 'null'] },
                icono: { type: ['string', 'null'] },
                orden: { type: 'integer' }
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
      const menu = await getMenuById(id);
      return reply.send({ data: menu });
    } catch (e: any) {
      if (e.message === 'MENU_NOT_FOUND') return reply.code(404).send(fail(e.message));
      return reply.code(500).send(fail('MENU_FETCH_FAILED'));
    }
  });

  // Obtener jerarquía de menús (requiere auth)
  app.get('/menus/hierarchy', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get menu hierarchy',
      tags: ['menus'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { type: 'object' }
            }
          }
        }
      }
    }
  }, async (_req, reply) => {
    const hierarchy = await getMenuHierarchy();
    return reply.send({ data: hierarchy });
  });

  // Crear menú (requiere admin)
  app.post('/menus', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new menu item',
      tags: ['menus'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 255 },
          componente: { type: 'string', maxLength: 255 },
          parentId: { type: 'integer' },
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
                componente: { type: ['string', 'null'] },
                parentId: { type: ['integer', 'null'] },
                icono: { type: ['string', 'null'] },
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
      const parsed = CreateMenuSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

      try {
        console.log('Creating menu with data:', parsed.data);
        const menu = await createMenuItem(
          parsed.data.nombre,
          parsed.data.orden,
          parsed.data.componente,
          parsed.data.parentId,
          parsed.data.icono,
          tx
        );
        console.log('Menu created successfully:', menu);
        return reply.code(201).send({ data: menu });
      } catch (e: any) {
        console.error('Error creating menu:', e.message);
        console.error('Full error:', e);
        if (e.message === 'PARENT_MENU_NOT_FOUND') return reply.code(404).send(fail(e.message));
        return reply.code(500).send(fail(e.message || 'MENU_CREATE_FAILED'));
      }
    });
  });

  // Actualizar menú (requiere admin)
  app.put('/menus/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update menu item',
      tags: ['menus'],
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
        required: ['nombre'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 255 },
          componente: { type: 'string', maxLength: 255 },
          parentId: { type: 'integer' },
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
                componente: { type: ['string', 'null'] },
                parentId: { type: ['integer', 'null'] },
                icono: { type: ['string', 'null'] },
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
      const { id } = req.params as { id: number };
      const parsed = UpdateMenuSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

      try {
        const menu = await updateMenuItem(
          id,
          parsed.data.nombre,
          parsed.data.componente,
          parsed.data.parentId,
          parsed.data.icono,
          parsed.data.orden,
          tx
        );
        if (!menu) return reply.code(404).send(fail('MENU_NOT_FOUND'));
        return reply.send({ data: menu });
      } catch (e: any) {
        if (e.message === 'MENU_NOT_FOUND') return reply.code(404).send(fail(e.message));
        if (e.message === 'PARENT_MENU_NOT_FOUND') return reply.code(404).send(fail(e.message));
        if (e.message === 'MENU_CANNOT_BE_PARENT_OF_ITSELF') return reply.code(400).send(fail(e.message));
        return reply.code(500).send(fail('MENU_UPDATE_FAILED'));
      }
    });
  });

  // Eliminar menú (requiere admin)
  app.delete('/menus/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete menu item',
      tags: ['menus'],
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
    return withDbContext(req, async (tx) => {
      const { id } = req.params as { id: number };
      try {
        const deletedId = await deleteMenuItem(id, tx);
        if (!deletedId) return reply.code(404).send(fail('MENU_NOT_FOUND'));
        return reply.send({ data: { id: deletedId } });
      } catch (e: any) {
        if (e.message === 'MENU_NOT_FOUND') return reply.code(404).send(fail(e.message));
        if (e.message === 'CANNOT_DELETE_MENU_WITH_CHILDREN') return reply.code(400).send(fail(e.message));
        return reply.code(500).send(fail('MENU_DELETE_FAILED'));
      }
    });
  });
}