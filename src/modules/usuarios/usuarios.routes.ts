import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateUsuarioSchema, UpdateUsuarioSchema } from './usuarios.schemas.js';
import type { GetAllUsuariosQuery } from './application/queries/GetAllUsuariosQuery.js';
import type { GetUsuarioByIdQuery } from './application/queries/GetUsuarioByIdQuery.js';
import type { CreateUsuarioCommand } from './application/commands/CreateUsuarioCommand.js';
import type { UpdateUsuarioCommand } from './application/commands/UpdateUsuarioCommand.js';
import type { DeleteUsuarioCommand } from './application/commands/DeleteUsuarioCommand.js';
import { handleUsuarioError } from './infrastructure/errorHandler.js';

export default async function usuariosRoutes(app: FastifyInstance) {
  // Listar todos los usuarios (requiere admin)
   app.get('/usuarios', {
     // preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'List all users',
      tags: ['usuarios'],
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
                  username: { type: 'string' },
                  email: { type: ['string', 'null'] },
                  displayName: { type: ['string', 'null'] },
                  photoPath: { type: ['string', 'null'] },
                  isLockedOut: { type: 'boolean' },
                  lockoutEndAt: { type: ['string', 'null'], format: 'date-time' },
                  accessFailedCount: { type: 'number' },
                  idOrganica0: { type: ['string', 'null'] },
                  idOrganica1: { type: ['string', 'null'] },
                  idOrganica2: { type: ['string', 'null'] },
                  idOrganica3: { type: ['string', 'null'] },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: ['string', 'null'], format: 'date-time' }
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
      const getAllUsuariosQuery = req.diScope.resolve<GetAllUsuariosQuery>('getAllUsuariosQuery');
      const usuarios = await getAllUsuariosQuery.execute(req.user?.sub || 'anonymous');
      return reply.send({ data: usuarios });
    } catch (error: any) {
      return handleUsuarioError(error, reply);
    }
  });

  // Obtener usuario por ID (requiere admin)
  app.get('/usuarios/:usuarioId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Get user by ID',
      tags: ['usuarios'],
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
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                email: { type: ['string', 'null'] },
                displayName: { type: ['string', 'null'] },
                photoPath: { type: ['string', 'null'] },
                isLockedOut: { type: 'boolean' },
                lockoutEndAt: { type: ['string', 'null'], format: 'date-time' },
                accessFailedCount: { type: 'number' },
                idOrganica0: { type: ['string', 'null'] },
                idOrganica1: { type: ['string', 'null'] },
                idOrganica2: { type: ['string', 'null'] },
                idOrganica3: { type: ['string', 'null'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: ['string', 'null'], format: 'date-time' }
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
    const { usuarioId } = req.params as { usuarioId: string };

    try {
      const getUsuarioByIdQuery = req.diScope.resolve<GetUsuarioByIdQuery>('getUsuarioByIdQuery');
      const usuario = await getUsuarioByIdQuery.execute(usuarioId, req.user?.sub || 'anonymous');
      return reply.send({ data: usuario });
    } catch (error: any) {
      return handleUsuarioError(error, reply);
    }
  });

  // Crear usuario (requiere admin)
   app.post('/usuarios', {
     preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new user',
      tags: ['usuarios'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre', 'email', 'password', 'roleId', 'phoneNumber', 'idOrganica0', 'idOrganica1'],
        properties: {
          usuarioId: { type: 'string', format: 'uuid' },
          nombre: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          roleId: { type: 'string', format: 'uuid' },
          esActivo: { type: 'boolean' },
          phoneNumber: { type: 'string' },
          idOrganica0: { type: 'string' },
          idOrganica1: { type: 'string' },
          idOrganica2: { type: 'string' },
          idOrganica3: { type: 'string' }
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
                nombre: { type: 'string' },
                email: { type: 'string' },
                username: { type: 'string' },
                phoneNumber: { type: ['string', 'null'] },
                isLockedOut: { type: 'boolean' },
                lastLoginAt: { type: ['string', 'null'], format: 'date-time' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                photoPath: { type: ['string', 'null'] },
                idOrganica0: { type: ['string', 'null'] },
                idOrganica1: { type: ['string', 'null'] },
                idOrganica2: { type: ['string', 'null'] },
                idOrganica3: { type: ['string', 'null'] }
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
    const parsed = CreateUsuarioSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Datos de entrada inválidos', details: parsed.error.issues } });
    }

    try {
      const createUsuarioCommand = req.diScope.resolve<CreateUsuarioCommand>('createUsuarioCommand');
      const usuario = await createUsuarioCommand.execute({
        username: parsed.data.nombre,
        email: parsed.data.email,
        password: parsed.data.password,
        displayName: parsed.data.nombre,
        photoPath: undefined,
        idOrganica0: parsed.data.idOrganica0 ? Number(parsed.data.idOrganica0) : undefined,
        idOrganica1: parsed.data.idOrganica1 ? Number(parsed.data.idOrganica1) : undefined,
        idOrganica2: parsed.data.idOrganica2 ? Number(parsed.data.idOrganica2) : undefined,
        idOrganica3: parsed.data.idOrganica3 ? Number(parsed.data.idOrganica3) : undefined,
        roleId: parsed.data.roleId
      }, req.user?.sub || 'anonymous');
      return reply.code(201).send({ data: usuario });
    } catch (error: any) {
      return handleUsuarioError(error, reply);
    }
  });

  // Actualizar usuario (requiere admin)
  app.put('/usuarios/:usuarioId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update user',
      tags: ['usuarios'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          usuarioId: { type: 'string', minLength: 1 }
        },
        required: ['usuarioId']
      },
      body: {
        type: 'object',
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          roleId: { type: 'string', minLength: 1 },
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
                nombre: { type: 'string' },
                email: { type: 'string' },
                username: { type: 'string' },
                phoneNumber: { type: ['string', 'null'] },
                isLockedOut: { type: 'boolean' },
                lastLoginAt: { type: ['string', 'null'], format: 'date-time' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                photoPath: { type: ['string', 'null'] },
                idOrganica0: { type: ['string', 'null'] },
                idOrganica1: { type: ['string', 'null'] },
                idOrganica2: { type: ['string', 'null'] },
                idOrganica3: { type: ['string', 'null'] }
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
    const { usuarioId } = req.params as { usuarioId: string };

    const parsed = UpdateUsuarioSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Datos de entrada inválidos', details: parsed.error.issues } });
    }

    try {
      const updateUsuarioCommand = req.diScope.resolve<UpdateUsuarioCommand>('updateUsuarioCommand');
      const usuario = await updateUsuarioCommand.execute({
        userId: usuarioId,
        email: parsed.data.email,
        displayName: parsed.data.nombre
      }, req.user?.sub || 'anonymous');
      return reply.send({ data: usuario });
    } catch (error: any) {
      return handleUsuarioError(error, reply);
    }
  });

  // Eliminar usuario (requiere admin)
  app.delete('/usuarios/:usuarioId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete user',
      tags: ['usuarios'],
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
              type: 'object',
              properties: {
                usuarioId: { type: 'string' }
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
    const { usuarioId } = req.params as { usuarioId: string };

    try {
      const deleteUsuarioCommand = req.diScope.resolve<DeleteUsuarioCommand>('deleteUsuarioCommand');
      const deleted = await deleteUsuarioCommand.execute({ userId: usuarioId }, req.user?.sub || 'anonymous');
      return reply.send({ data: { deleted, usuarioId } });
    } catch (error: any) {
      return handleUsuarioError(error, reply);
    }
  });
}