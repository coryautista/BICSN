import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateUsuarioSchema, UpdateUsuarioSchema, UsuarioIdParamSchema, LoginSchema } from './usuarios.schemas.js';
import { getAllUsuarios, getUsuarioById, createUsuarioItem, updateUsuarioItem, deleteUsuarioItem, authenticateUsuario } from './usuarios.service.js';
import { ok, validationError, notFound, internalError } from '../../utils/http.js';
import { withDbContext } from '../../db/context.js';

export default async function usuariosRoutes(app: FastifyInstance) {

  // Login endpoint (no auth required)
  app.post('/usuarios/login', {
    schema: {
      description: 'Authenticate user',
      tags: ['usuarios'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 }
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
        401: {
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
    console.log('Login request body:', req.body);
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('Login validation error:', parsed.error.issues);
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    console.log('Login attempt for:', parsed.data.email);
    try {
      const usuario = await authenticateUsuario(parsed.data.email, parsed.data.password);
      console.log('Login successful for user:', usuario.usuarioId);
      return reply.send(ok(usuario));
    } catch (error: any) {
      console.log('Login error:', error.message);
      if (error.message === 'INVALID_CREDENTIALS') {
        return reply.code(401).send({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
      }
      console.error('Error authenticating user:', error);
      return reply.code(500).send(internalError('Authentication failed'));
    }
  });

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
      const usuarios = await getAllUsuarios();
      return reply.send(ok(usuarios));
    } catch (error: any) {
      console.error('Error listing usuarios:', error);
      return reply.code(500).send(internalError('Failed to retrieve usuarios'));
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
      const usuario = await getUsuarioById(usuarioId);
      return reply.send(ok(usuario));
    } catch (error: any) {
      if (error.message === 'USUARIO_NOT_FOUND') {
        return reply.code(404).send(notFound('Usuario', usuarioId));
      }
      console.error('Error getting usuario:', error);
      return reply.code(500).send(internalError('Failed to retrieve usuario'));
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
        required: ['usuarioId', 'nombre', 'email', 'password', 'roleId', 'phoneNumber', 'idOrganica0', 'idOrganica1'],
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
    return withDbContext(req, async (tx) => {
      const parsed = CreateUsuarioSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const usuario = await createUsuarioItem(
          parsed.data.usuarioId,
          parsed.data.nombre,
          parsed.data.email,
          parsed.data.password,
          parsed.data.roleId,
          parsed.data.esActivo ?? true,
          parsed.data.phoneNumber,
          parsed.data.idOrganica0,
          parsed.data.idOrganica1,
          parsed.data.idOrganica2,
          parsed.data.idOrganica3,
          userId,
          tx
        );
        return reply.code(201).send(ok(usuario));
      } catch (error: any) {
        if (error.message === 'USUARIO_EXISTS' || error.message === 'EMAIL_EXISTS' || error.message === 'USERNAME_EXISTS') {
          return reply.code(409).send({ ok: false, error: { code: 'CONFLICT', message: 'Usuario, email or username already exists' } });
        }
        console.error('Error creating usuario:', error);
        return reply.code(500).send(internalError('Failed to create usuario'));
      }
    });
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
    return withDbContext(req, async (tx) => {
      const { usuarioId } = req.params as { usuarioId: string };

      // Validate parameter
      const paramValidation = UsuarioIdParamSchema.safeParse({ usuarioId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateUsuarioSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const usuario = await updateUsuarioItem(
          usuarioId,
          parsed.data.nombre,
          parsed.data.email,
          parsed.data.roleId,
          parsed.data.esActivo,
          userId,
          tx
        );
        return reply.send(ok(usuario));
      } catch (error: any) {
        if (error.message === 'USUARIO_NOT_FOUND') {
          return reply.code(404).send(notFound('Usuario', usuarioId));
        }
        if (error.message === 'EMAIL_EXISTS') {
          return reply.code(409).send({ ok: false, error: { code: 'CONFLICT', message: 'Email already exists' } });
        }
        console.error('Error updating usuario:', error);
        return reply.code(500).send(internalError('Failed to update usuario'));
      }
    });
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
    return withDbContext(req, async (tx) => {
      const { usuarioId } = req.params as { usuarioId: string };

      // Validate parameter
      const paramValidation = UsuarioIdParamSchema.safeParse({ usuarioId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const deletedId = await deleteUsuarioItem(usuarioId, tx);
        return reply.send(ok({ usuarioId: deletedId }));
      } catch (error: any) {
        if (error.message === 'USUARIO_NOT_FOUND') {
          return reply.code(404).send(notFound('Usuario', usuarioId));
        }
        console.error('Error deleting usuario:', error);
        return reply.code(500).send(internalError('Failed to delete usuario'));
      }
    });
  });
}