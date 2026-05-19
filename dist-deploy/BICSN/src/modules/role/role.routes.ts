import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateRoleSchema, AssignRoleSchema, UnassignRoleSchema } from './role.schemas.js';
import { ok } from '../../utils/http.js';
import { handleRoleError } from './infrastructure/errorHandler.js';
import { GetAllRolesQuery } from './application/queries/GetAllRolesQuery.js';
import { CreateRoleCommand } from './application/commands/CreateRoleCommand.js';
import { AssignRoleCommand } from './application/commands/AssignRoleCommand.js';
import { UnassignRoleCommand } from './application/commands/UnassignRoleCommand.js';

export default async function roleRoutes(app: FastifyInstance) {

  // Crear rol (requiere auth, admin para roles no sistema)
  app.post('/roles', {
    preHandler: [requireAuth, async (req: any, reply) => {
      const body = req.body as any;
      if (body?.isSystem !== true && !req.user?.roles?.includes('admin')) {
        return reply.code(403).send({ ok:false, error:{code:'FORBIDDEN', message:'Insufficient role'}});
      }
    }],
    schema: {
      description: 'Create a new role',
      tags: ['roles'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string' },
          isSystem: { type: 'boolean' },
          isEntidad: { type: 'boolean' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: { type: 'object' }
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
        403: {
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
    try {
      const parsed = CreateRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        const errorMessage = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        throw new Error(`Datos de rol inválidos: ${errorMessage}`);
      }

      const userId = req.user?.sub || 'unknown';
      const command = req.diScope.resolve<CreateRoleCommand>('createRoleCommand');
      const r = await command.execute({
        name: parsed.data.name,
        description: parsed.data.description,
        isSystem: parsed.data.isSystem,
        isEntidad: parsed.data.isEntidad
      }, userId);
      return reply.code(201).send(ok(r));
    } catch (error) {
      return handleRoleError(error, reply, req.user?.sub);
    }
  });

  // Listar roles (requiere auth)
  app.get('/roles', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all roles',
      tags: ['roles'],
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
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  isSystem: { type: 'boolean' },
                  isEntidad: { type: 'boolean' },
                  createdAt: { type: 'string' }
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
      const userId = req.user?.sub || 'unknown';
      const query = req.diScope.resolve<GetAllRolesQuery>('getAllRolesQuery');
      const roles = await query.execute(userId);
      return reply.send(ok(roles));
    } catch (error) {
      return handleRoleError(error, reply, req.user?.sub);
    }
  });

  // Asignar rol a usuario (admin)
  app.post('/roles/assign', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Assign role to user',
      tags: ['roles'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['userId', 'roleName'],
        properties: {
          userId: { type: 'string', format: 'uuid' },
          roleName: { type: 'string', minLength: 1, maxLength: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: { type: 'object' }
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
    try {
      const parsed = AssignRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        const errorMessage = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        throw new Error(`Datos de asignación de rol inválidos: ${errorMessage}`);
      }

      const userId = req.user?.sub || 'unknown';
      const command = req.diScope.resolve<AssignRoleCommand>('assignRoleToUserCommand');
      const res = await command.execute({ userId: parsed.data.userId, roleName: parsed.data.roleName }, userId);
      return reply.send(ok(res));
    } catch (error) {
      return handleRoleError(error, reply, req.user?.sub);
    }
  });

  // Quitar rol a usuario (admin)
  app.post('/roles/unassign', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Unassign role from user',
      tags: ['roles'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['userId', 'roleName'],
        properties: {
          userId: { type: 'string', format: 'uuid' },
          roleName: { type: 'string', minLength: 1, maxLength: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: { type: 'object' }
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
    try {
      const parsed = UnassignRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        const errorMessage = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        throw new Error(`Datos de desasignación de rol inválidos: ${errorMessage}`);
      }

      const userId = req.user?.sub || 'unknown';
      const command = req.diScope.resolve<UnassignRoleCommand>('unassignRoleCommand');
      const res = await command.execute({ userId: parsed.data.userId, roleName: parsed.data.roleName }, userId);
      return reply.send(ok(res));
    } catch (error) {
      return handleRoleError(error, reply, req.user?.sub);
    }
  });
}
