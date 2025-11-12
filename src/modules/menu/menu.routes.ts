import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateMenuSchema, UpdateMenuSchema } from './menu.schemas.js';
import { fail } from '../../utils/http.js';
import { handleMenuError } from './infrastructure/errorHandler.js';
import type { GetAllMenusQuery } from './application/queries/GetAllMenusQuery.js';
import type { GetMenuByIdQuery } from './application/queries/GetMenuByIdQuery.js';
import type { GetMenuHierarchyQuery } from './application/queries/GetMenuHierarchyQuery.js';
import type { CreateMenuCommand } from './application/commands/CreateMenuCommand.js';
import type { UpdateMenuCommand } from './application/commands/UpdateMenuCommand.js';
import type { DeleteMenuCommand } from './application/commands/DeleteMenuCommand.js';

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
  }, async (req, reply) => {
    try {
      // Resolve GetAllMenusQuery from DI container
      const getAllMenusQuery = req.diScope.resolve<GetAllMenusQuery>('getAllMenusQuery');
      const menus = await getAllMenusQuery.execute();
      return reply.send({ data: menus });
    } catch (error: any) {
      return handleMenuError(error, reply);
    }
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
      // Resolve GetMenuByIdQuery from DI container
      const getMenuByIdQuery = req.diScope.resolve<GetMenuByIdQuery>('getMenuByIdQuery');
      const menu = await getMenuByIdQuery.execute(id);
      return reply.send({ data: menu });
    } catch (error: any) {
      return handleMenuError(error, reply);
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
  }, async (req, reply) => {
    try {
      // Resolve GetMenuHierarchyQuery from DI container
      const getMenuHierarchyQuery = req.diScope.resolve<GetMenuHierarchyQuery>('getMenuHierarchyQuery');
      const hierarchy = await getMenuHierarchyQuery.execute();
      return reply.send({ data: hierarchy });
    } catch (error: any) {
      return handleMenuError(error, reply);
    }
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
    const parsed = CreateMenuSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

    try {
      // Resolve CreateMenuCommand from DI container
      const createMenuCommand = req.diScope.resolve<CreateMenuCommand>('createMenuCommand');
      const menu = await createMenuCommand.execute({
        nombre: parsed.data.nombre,
        orden: parsed.data.orden,
        componente: parsed.data.componente,
        parentId: parsed.data.parentId,
        icono: parsed.data.icono
      });

      return reply.code(201).send({ data: menu });
    } catch (error: any) {
      return handleMenuError(error, reply);
    }
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
    const { id } = req.params as { id: number };
    const parsed = UpdateMenuSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

    try {
      // Resolve UpdateMenuCommand from DI container
      const updateMenuCommand = req.diScope.resolve<UpdateMenuCommand>('updateMenuCommand');
      const menu = await updateMenuCommand.execute({
        id,
        nombre: parsed.data.nombre,
        componente: parsed.data.componente,
        parentId: parsed.data.parentId,
        icono: parsed.data.icono,
        orden: parsed.data.orden
      });
      return reply.send({ data: menu });
    } catch (error: any) {
      return handleMenuError(error, reply);
    }
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
    const { id } = req.params as { id: number };
    try {
      // Resolve DeleteMenuCommand from DI container
      const deleteMenuCommand = req.diScope.resolve<DeleteMenuCommand>('deleteMenuCommand');
      await deleteMenuCommand.execute({ id });
      return reply.send({ data: { id } });
    } catch (error: any) {
      return handleMenuError(error, reply);
    }
  });
}