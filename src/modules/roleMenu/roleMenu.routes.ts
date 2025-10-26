import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateRoleMenuSchema, UpdateRoleMenuSchema, AssignRoleMenuSchema } from './roleMenu.schemas.js';
import { getAllRoleMenus, getRoleMenuById, getRoleMenusByRoleId, createRoleMenuItem, updateRoleMenuItem, deleteRoleMenuItem, assignMenuToRole, unassignMenuFromRole, getRoleMenusByTokenRoles } from './roleMenu.service.js';
import { fail } from '../../utils/http.js';

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
  }, async (_req, reply) => {
    const roleMenus = await getAllRoleMenus();
    return reply.send({ data: roleMenus });
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
      const roleMenu = await getRoleMenuById(id);
      return reply.send({ data: roleMenu });
    } catch (e: any) {
      if (e.message === 'ROLE_MENU_NOT_FOUND') return reply.code(404).send(fail(e.message));
      return reply.code(500).send(fail('ROLE_MENU_FETCH_FAILED'));
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
    const roleMenus = await getRoleMenusByRoleId(roleId);
    return reply.send({ data: roleMenus });
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
    if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

    try {
      const roleMenu = await createRoleMenuItem(
        parsed.data.roleId,
        parsed.data.menuId,
        parsed.data.createdAt
      );
      return reply.code(201).send({ data: roleMenu });
    } catch (e: any) {
      if (e.message === 'ROLE_NOT_FOUND') return reply.code(404).send(fail(e.message));
      if (e.message === 'MENU_NOT_FOUND') return reply.code(404).send(fail(e.message));
      if (e.message === 'ROLE_MENU_ALREADY_EXISTS') return reply.code(400).send(fail(e.message));
      return reply.code(500).send(fail('ROLE_MENU_CREATE_FAILED'));
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
    if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

    try {
      const roleMenu = await assignMenuToRole(
        parsed.data.roleId,
        parsed.data.menuId
      );
      return reply.code(201).send({ data: roleMenu });
    } catch (e: any) {
      if (e.message === 'MENU_NOT_FOUND') return reply.code(404).send(fail(e.message));
      if (e.message === 'ROLE_MENU_ALREADY_EXISTS') return reply.code(400).send(fail(e.message));
      return reply.code(500).send(fail('ROLE_MENU_ASSIGN_FAILED'));
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
    if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

    try {
      const roleMenu = await updateRoleMenuItem(
        id,
        parsed.data.roleId,
        parsed.data.menuId,
        parsed.data.createdAt
      );
      if (!roleMenu) return reply.code(404).send(fail('ROLE_MENU_NOT_FOUND'));
      return reply.send({ data: roleMenu });
    } catch (e: any) {
      if (e.message === 'ROLE_MENU_NOT_FOUND') return reply.code(404).send(fail(e.message));
      if (e.message === 'ROLE_MENU_ALREADY_EXISTS') return reply.code(400).send(fail(e.message));
      if (e.message === 'MENU_NOT_FOUND') return reply.code(404).send(fail(e.message));
      return reply.code(500).send(fail('ROLE_MENU_UPDATE_FAILED'));
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
      const deletedId = await deleteRoleMenuItem(id);
      if (!deletedId) return reply.code(404).send(fail('ROLE_MENU_NOT_FOUND'));
      return reply.send({ data: { id: deletedId } });
    } catch (e: any) {
      if (e.message === 'ROLE_MENU_NOT_FOUND') return reply.code(404).send(fail(e.message));
      return reply.code(500).send(fail('ROLE_MENU_DELETE_FAILED'));
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
      await unassignMenuFromRole(roleId, parseInt(menuId));
      return reply.send({ data: { message: 'Menu unassigned from role' } });
    } catch (e: any) {
      return reply.code(500).send(fail('ROLE_MENU_UNASSIGN_FAILED'));
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
      const roleMenus = await getRoleMenusByTokenRoles(userRoles);
      return reply.send({ data: roleMenus });
    } catch (e: any) {
      console.error('Error in /me/menus:', e);
      return reply.code(500).send(fail('USER_MENUS_FETCH_FAILED'));
    }
  });
}