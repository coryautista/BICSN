import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateRoleMenuSchema, UpdateRoleMenuSchema, AssignRoleMenuSchema } from './roleMenu.schemas.js';
import { GetAllRoleMenusQuery } from './application/queries/GetAllRoleMenusQuery.js';
import { GetRoleMenuByIdQuery } from './application/queries/GetRoleMenuByIdQuery.js';
import { GetRoleMenusByRoleIdQuery } from './application/queries/GetRoleMenusByRoleIdQuery.js';
import { GetRoleMenusByTokenRolesQuery } from './application/queries/GetRoleMenusByTokenRolesQuery.js';
import { CreateRoleMenuCommand } from './application/commands/CreateRoleMenuCommand.js';
import { UpdateRoleMenuCommand } from './application/commands/UpdateRoleMenuCommand.js';
import { DeleteRoleMenuCommand } from './application/commands/DeleteRoleMenuCommand.js';
import { AssignMenuToRoleCommand } from './application/commands/AssignMenuToRoleCommand.js';
import { UnassignMenuFromRoleCommand } from './application/commands/UnassignMenuFromRoleCommand.js';
import { handleRoleMenuError } from './infrastructure/errorHandler.js';

export default async function roleMenuRoutes(app: FastifyInstance) {

  // Listar todos los role-menus (requiere auth)
  app.get('/role-menus', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all role-menus',
      tags: ['role-menus'],
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
                  roleId: { type: 'string', format: 'uuid' },
                  menuId: { type: 'integer' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    try {
      const query = req.diScope.resolve<GetAllRoleMenusQuery>('getAllRoleMenusQuery');
      const roleMenus = await query.execute({}, req.user?.sub || 'anonymous');
      return reply.send({ data: roleMenus });
    } catch (error: any) {
      return handleRoleMenuError(error, reply);
    }
  });

  // Obtener role-menu por ID (requiere auth)
  app.get('/role-menus/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get role-menu by ID',
      tags: ['role-menus'],
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
                roleId: { type: 'string', format: 'uuid' },
                menuId: { type: 'integer' },
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
      const query = req.diScope.resolve<GetRoleMenuByIdQuery>('getRoleMenuByIdQuery');
      const roleMenu = await query.execute({ id }, req.user?.sub || 'anonymous');
      return reply.send({ data: roleMenu });
    } catch (error: any) {
      return handleRoleMenuError(error, reply);
    }
  });

  // Obtener menus por roleId (requiere auth)
  app.get('/roles/:roleId/menus', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get menus assigned to a role',
      tags: ['role-menus'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          roleId: { type: 'string', format: 'uuid' }
        },
        required: ['roleId']
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
                  id: { type: 'integer' },
                  roleId: { type: 'string', format: 'uuid' },
                  menuId: { type: 'integer' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    const { roleId } = req.params as { roleId: string };
    try {
      const query = req.diScope.resolve<GetRoleMenusByRoleIdQuery>('getRoleMenusByRoleIdQuery');
      const roleMenus = await query.execute({ roleId }, req.user?.sub || 'anonymous');
      return reply.send({ data: roleMenus });
    } catch (error: any) {
      return handleRoleMenuError(error, reply);
    }
  });

  // Crear role-menu (requiere admin)
  app.post('/role-menus', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new role-menu assignment',
      tags: ['role-menus'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['roleId', 'menuId'],
        properties: {
          roleId: { type: 'string', format: 'uuid' },
          menuId: { type: 'integer' },
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
                roleId: { type: 'string', format: 'uuid' },
                menuId: { type: 'integer' },
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
    const parsed = CreateRoleMenuSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos de entrada inválidos',
          details: parsed.error.issues
        }
      });
    }

    try {
      const command = req.diScope.resolve<CreateRoleMenuCommand>('createRoleMenuCommand');
      const roleMenu = await command.execute({
        roleId: parsed.data.roleId,
        menuId: parsed.data.menuId,
        createdAt: parsed.data.createdAt
      }, req.user?.sub || 'anonymous');
      return reply.code(201).send({ data: roleMenu });
    } catch (error: any) {
      return handleRoleMenuError(error, reply);
    }
  });

  // Asignar menu a role (requiere admin)
  app.post('/roles/:roleId/menus', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Assign menu to role',
      tags: ['role-menus'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          roleId: { type: 'string', format: 'uuid' }
        },
        required: ['roleId']
      },
      body: {
        type: 'object',
        required: ['menuId'],
        properties: {
          menuId: { type: 'integer' }
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
                roleId: { type: 'string', format: 'uuid' },
                menuId: { type: 'integer' },
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
    const { roleId } = req.params as { roleId: string };
    const parsed = AssignRoleMenuSchema.safeParse({ roleId, ...(req.body as object) });
    if (!parsed.success) {
      return reply.code(400).send({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos de entrada inválidos',
          details: parsed.error.issues
        }
      });
    }

    try {
      const command = req.diScope.resolve<AssignMenuToRoleCommand>('assignMenuToRoleCommand');
      const roleMenu = await command.execute({
        roleId: parsed.data.roleId,
        menuId: parsed.data.menuId
      }, req.user?.sub || 'anonymous');
      return reply.code(201).send({ data: roleMenu });
    } catch (error: any) {
      return handleRoleMenuError(error, reply);
    }
  });

  // Actualizar role-menu (requiere admin)
  app.put('/role-menus/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update role-menu assignment',
      tags: ['role-menus'],
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
          roleId: { type: 'string', format: 'uuid' },
          menuId: { type: 'integer' },
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
                roleId: { type: 'string', format: 'uuid' },
                menuId: { type: 'integer' },
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
    const { id } = req.params as { id: number };
    const parsed = UpdateRoleMenuSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos de entrada inválidos',
          details: parsed.error.issues
        }
      });
    }

    try {
      const command = req.diScope.resolve<UpdateRoleMenuCommand>('updateRoleMenuCommand');
      const roleMenu = await command.execute({
        id,
        roleId: parsed.data.roleId,
        menuId: parsed.data.menuId,
        createdAt: parsed.data.createdAt
      }, req.user?.sub || 'anonymous');
      return reply.send({ data: roleMenu });
    } catch (error: any) {
      return handleRoleMenuError(error, reply);
    }
  });

  // Eliminar role-menu (requiere admin)
  app.delete('/role-menus/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete role-menu assignment',
      tags: ['role-menus'],
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
    const { id } = req.params as { id: number };
    try {
      const command = req.diScope.resolve<DeleteRoleMenuCommand>('deleteRoleMenuCommand');
      const result = await command.execute({ id }, req.user?.sub || 'anonymous');
      return reply.send({ data: result });
    } catch (error: any) {
      return handleRoleMenuError(error, reply);
    }
  });

  // Desasignar menu de role (requiere admin)
  app.delete('/roles/:roleId/menus/:menuId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Unassign menu from role',
      tags: ['role-menus'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          roleId: { type: 'string', format: 'uuid' },
          menuId: { type: 'integer' }
        },
        required: ['roleId', 'menuId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
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
    const { roleId, menuId } = req.params as { roleId: string; menuId: string };
    try {
      const command = req.diScope.resolve<UnassignMenuFromRoleCommand>('unassignMenuFromRoleCommand');
      const result = await command.execute({ roleId, menuId: parseInt(menuId) }, req.user?.sub || 'anonymous');
      return reply.send({ data: result });
    } catch (error: any) {
      return handleRoleMenuError(error, reply);
    }
  });

  // Obtener menus del usuario basado en sus roles del token (requiere auth)
  app.get('/me/menus', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get user menus based on token roles',
      tags: ['role-menus'],
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
                  roleId: { type: 'string', format: 'uuid' },
                  menuId: { type: 'integer' },
                  createdAt: { type: 'string', format: 'date-time' },
                  role: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' }
                    }
                  },
                  menu: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      path: { type: 'string' },
                      icon: { type: 'string' },
                      parentId: { type: 'integer' },
                      order: { type: 'integer' }
                    }
                  }
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
      const userRoles = req.user?.roles || [];
      const query = req.diScope.resolve<GetRoleMenusByTokenRolesQuery>('getRoleMenusByTokenRolesQuery');
      const roleMenus = await query.execute({ roleNames: userRoles }, req.user?.sub || 'anonymous');
      return reply.send({ data: roleMenus });
    } catch (error: any) {
      return handleRoleMenuError(error, reply);
    }
  });
}