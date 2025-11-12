import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateUserRoleSchema } from './userRole.schemas.js';
import { GetAllUserRolesQuery } from './application/queries/GetAllUserRolesQuery.js';
import { GetUserRoleByIdsQuery } from './application/queries/GetUserRoleByIdsQuery.js';
import { GetUserRolesByUsuarioQuery } from './application/queries/GetUserRolesByUsuarioQuery.js';
import { CreateUserRoleCommand } from './application/commands/CreateUserRoleCommand.js';
import { DeleteUserRoleCommand } from './application/commands/DeleteUserRoleCommand.js';
import { handleUserRoleError } from './infrastructure/errorHandler.js';

export default async function userRoleRoutes(app: FastifyInstance) {

  // Listar todas las relaciones usuario-rol (requiere admin)
  app.get('/user-roles', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'List all user-role relationships',
      tags: ['user-roles'],
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
                  usuarioId: { type: 'string' },
                  roleId: { type: 'string' },
                  esActivo: { type: 'boolean' }
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
      const query = req.diScope.resolve<GetAllUserRolesQuery>('getAllUserRolesQuery');
      const userRoles = await query.execute({}, req.user?.sub || 'anonymous');
      return reply.send({ data: userRoles });
    } catch (error: any) {
      return handleUserRoleError(error, reply);
    }
  });

  // Obtener relación usuario-rol por IDs (requiere admin)
  app.get('/user-roles/:usuarioId/:roleId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Get user-role relationship by IDs',
      tags: ['user-roles'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          usuarioId: { type: 'string', minLength: 1 },
          roleId: { type: 'string', minLength: 1 }
        },
        required: ['usuarioId', 'roleId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                usuarioId: { type: 'string' },
                roleId: { type: 'string' },
                esActivo: { type: 'boolean' }
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
    const { usuarioId, roleId } = req.params as { usuarioId: string; roleId: string };

    try {
      const query = req.diScope.resolve<GetUserRoleByIdsQuery>('getUserRoleByIdsQuery');
      const userRole = await query.execute({ usuarioId, roleId }, req.user?.sub || 'anonymous');
      return reply.send({ data: userRole });
    } catch (error: any) {
      return handleUserRoleError(error, reply);
    }
  });

  // Obtener roles de un usuario (requiere admin)
  app.get('/user-roles/user/:usuarioId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Get roles for a specific user',
      tags: ['user-roles'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          usuarioId: { type: 'string', minLength: 1 }
        },
        required: ['usuarioId']
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
                  usuarioId: { type: 'string' },
                  roleId: { type: 'string' },
                  esActivo: { type: 'boolean' }
                }
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
    const { usuarioId } = req.params as { usuarioId: string };

    try {
      const query = req.diScope.resolve<GetUserRolesByUsuarioQuery>('getUserRolesByUsuarioQuery');
      const userRoles = await query.execute({ usuarioId }, req.user?.sub || 'anonymous');
      return reply.send({ data: userRoles });
    } catch (error: any) {
      return handleUserRoleError(error, reply);
    }
  });

  // Crear relación usuario-rol (requiere admin)
  app.post('/user-roles', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new user-role relationship',
      tags: ['user-roles'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['usuarioId', 'roleId'],
        properties: {
          usuarioId: { type: 'string', minLength: 1 },
          roleId: { type: 'string', minLength: 1 },
          esActivo: { type: 'boolean' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                usuarioId: { type: 'string' },
                roleId: { type: 'string' },
                esActivo: { type: 'boolean' }
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
    const parsed = CreateUserRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Datos de entrada inválidos', details: parsed.error.issues } });
    }

    try {
      const command = req.diScope.resolve<CreateUserRoleCommand>('createUserRoleCommand');
      const userRole = await command.execute({
        usuarioId: parsed.data.usuarioId,
        roleId: parsed.data.roleId,
        esActivo: parsed.data.esActivo ?? true
      }, req.user?.sub || 'anonymous');
      return reply.code(201).send({ data: userRole });
    } catch (error: any) {
      return handleUserRoleError(error, reply);
    }
  });

  // NOTE: UPDATE not supported - userRole is a simple mapping table without updatable fields
  // To change a user's role, delete the old relationship and create a new one

  // Eliminar relación usuario-rol (requiere admin)
  app.delete('/user-roles/:usuarioId/:roleId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete user-role relationship',
      tags: ['user-roles'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          usuarioId: { type: 'string', minLength: 1 },
          roleId: { type: 'string', minLength: 1 }
        },
        required: ['usuarioId', 'roleId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                usuarioId: { type: 'string' },
                roleId: { type: 'string' }
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
    const { usuarioId, roleId } = req.params as { usuarioId: string; roleId: string };

    try {
      const command = req.diScope.resolve<DeleteUserRoleCommand>('deleteUserRoleCommand');
      const deletedIds = await command.execute({ usuarioId, roleId }, req.user?.sub || 'anonymous');
      return reply.send({ data: deletedIds });
    } catch (error: any) {
      return handleUserRoleError(error, reply);
    }
  });
}