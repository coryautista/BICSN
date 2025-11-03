import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateUserRoleSchema, UpdateUserRoleSchema, UserRoleIdParamSchema, UsuarioIdParamSchema } from './userRole.schemas.js';
import { getAllUserRoles, getUserRoleByIds, getUserRolesByUsuario, createUserRoleItem, updateUserRoleItem, deleteUserRoleItem } from './userRole.service.js';
import { ok, validationError, notFound, internalError } from '../../utils/http.js';
import { withDbContext } from '../../db/context.js';

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
  }, async (_req, reply) => {
    try {
      const userRoles = await getAllUserRoles();
      return reply.send(ok(userRoles));
    } catch (error: any) {
      console.error('Error listing user-roles:', error);
      return reply.code(500).send(internalError('Failed to retrieve user-roles'));
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

    // Validate parameters
    const paramValidation = UserRoleIdParamSchema.safeParse({ usuarioId, roleId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const userRole = await getUserRoleByIds(usuarioId, roleId);
      return reply.send(ok(userRole));
    } catch (error: any) {
      if (error.message === 'USER_ROLE_NOT_FOUND') {
        return reply.code(404).send(notFound('User-Role relationship', `${usuarioId}-${roleId}`));
      }
      console.error('Error getting user-role:', error);
      return reply.code(500).send(internalError('Failed to retrieve user-role'));
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

    // Validate parameter
    const paramValidation = UsuarioIdParamSchema.safeParse({ usuarioId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const userRoles = await getUserRolesByUsuario(usuarioId);
      return reply.send(ok(userRoles));
    } catch (error: any) {
      console.error('Error getting user roles:', error);
      return reply.code(500).send(internalError('Failed to retrieve user roles'));
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
    return withDbContext(req, async (tx) => {
      const parsed = CreateUserRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const userRole = await createUserRoleItem(
          parsed.data.usuarioId,
          parsed.data.roleId,
          parsed.data.esActivo ?? true,
          userId,
          tx
        );
        return reply.code(201).send(ok(userRole));
      } catch (error: any) {
        if (error.message === 'USER_ROLE_EXISTS') {
          return reply.code(409).send({ ok: false, error: { code: 'CONFLICT', message: 'User-Role relationship already exists' } });
        }
        console.error('Error creating user-role:', error);
        return reply.code(500).send(internalError('Failed to create user-role'));
      }
    });
  });

  // Actualizar relación usuario-rol (requiere admin)
  app.put('/user-roles/:usuarioId/:roleId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update user-role relationship',
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
      body: {
        type: 'object',
        properties: {
          esActivo: { type: 'boolean' }
        }
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
    return withDbContext(req, async (tx) => {
      const { usuarioId, roleId } = req.params as { usuarioId: string; roleId: string };

      // Validate parameters
      const paramValidation = UserRoleIdParamSchema.safeParse({ usuarioId, roleId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateUserRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const userRole = await updateUserRoleItem(
          usuarioId,
          roleId,
          parsed.data.esActivo,
          userId,
          tx
        );
        return reply.send(ok(userRole));
      } catch (error: any) {
        if (error.message === 'USER_ROLE_NOT_FOUND') {
          return reply.code(404).send(notFound('User-Role relationship', `${usuarioId}-${roleId}`));
        }
        console.error('Error updating user-role:', error);
        return reply.code(500).send(internalError('Failed to update user-role'));
      }
    });
  });

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
    return withDbContext(req, async (tx) => {
      const { usuarioId, roleId } = req.params as { usuarioId: string; roleId: string };

      // Validate parameters
      const paramValidation = UserRoleIdParamSchema.safeParse({ usuarioId, roleId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const deletedIds = await deleteUserRoleItem(usuarioId, roleId, tx);
        return reply.send(ok(deletedIds));
      } catch (error: any) {
        if (error.message === 'USER_ROLE_NOT_FOUND') {
          return reply.code(404).send(notFound('User-Role relationship', `${usuarioId}-${roleId}`));
        }
        console.error('Error deleting user-role:', error);
        return reply.code(500).send(internalError('Failed to delete user-role'));
      }
    });
  });
}