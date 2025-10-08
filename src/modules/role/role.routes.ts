import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateRoleSchema, AssignRoleSchema, UnassignRoleSchema } from './role.schemas.js';
import { createRoleIfNotExists, getAllRoles, addRoleToUserByName, removeRoleFromUserByName } from './role.service.js';
import { ok, fail } from '../../utils/http.js';

export default async function roleRoutes(app: FastifyInstance) {

  // Crear rol (solo admin)
  app.post('/roles', {
    preHandler: [requireAuth, requireRole('admin')],
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
          isSystem: { type: 'boolean' }
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
    const parsed = CreateRoleSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

    try {
      const r = await createRoleIfNotExists(parsed.data.name, parsed.data.description, parsed.data.isSystem);
      return reply.code(201).send(ok(r));
    } catch (e: any) {
      // Unique constraint de normalizedName -> 409
      if (e.number === 2627 || e.code === 'EREQUEST') {
        return reply.code(409).send(fail('ROLE_EXISTS', 'CONFLICT'));
      }
      return reply.code(500).send(fail('ROLE_CREATE_FAILED'));
    }
  });

  // Listar roles (admin)
  app.get('/roles', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'List all roles',
      tags: ['roles'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'array',
              items: { type: 'object' }
            }
          }
        }
      }
    }
  }, async (_req, reply) => {
    const roles = await getAllRoles();
    return reply.send(ok(roles));
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
    const parsed = AssignRoleSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));
    try {
      const res = await addRoleToUserByName(parsed.data.userId, parsed.data.roleName);
      return reply.send(ok(res));
    } catch (e: any) {
      if (e.message === 'USER_NOT_FOUND') return reply.code(404).send(fail(e.message));
      if (e.message === 'ROLE_NOT_FOUND') return reply.code(404).send(fail(e.message));
      return reply.code(500).send(fail('ROLE_ASSIGN_FAILED'));
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
    const parsed = UnassignRoleSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));
    try {
      const res = await removeRoleFromUserByName(parsed.data.userId, parsed.data.roleName);
      return reply.send(ok(res));
    } catch (e: any) {
      if (e.message === 'USER_NOT_FOUND') return reply.code(404).send(fail(e.message));
      if (e.message === 'ROLE_NOT_FOUND') return reply.code(404).send(fail(e.message));
      return reply.code(500).send(fail('ROLE_UNASSIGN_FAILED'));
    }
  });
}
