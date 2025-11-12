import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateModuloSchema, UpdateModuloSchema } from './modulo.schemas.js';
import { fail } from '../../utils/http.js';
import { handleModuloError } from './infrastructure/errorHandler.js';
import type { GetAllModulosQuery } from './application/queries/GetAllModulosQuery.js';
import type { GetModuloByIdQuery } from './application/queries/GetModuloByIdQuery.js';
import type { CreateModuloCommand } from './application/commands/CreateModuloCommand.js';
import type { UpdateModuloCommand } from './application/commands/UpdateModuloCommand.js';
import type { DeleteModuloCommand } from './application/commands/DeleteModuloCommand.js';

export default async function moduloRoutes(app: FastifyInstance) {

  // Listar todos los módulos (requiere auth)
  app.get('/modulos', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all modules',
      tags: ['modulos'],
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
                  tipo: { type: 'string' },
                  icono: { type: 'string' },
                  orden: { type: 'integer' }
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
      const getAllModulosQuery = req.diScope.resolve<GetAllModulosQuery>('getAllModulosQuery');
      const modulos = await getAllModulosQuery.execute();
      return reply.send({ data: modulos });
    } catch (error: any) {
      return handleModuloError(error, reply);
    }
  });

  // Obtener módulo por ID (requiere auth)
  app.get('/modulos/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get module by ID',
      tags: ['modulos'],
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
                tipo: { type: 'string' },
                icono: { type: 'string' },
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
    try {
      const getModuloByIdQuery = req.diScope.resolve<GetModuloByIdQuery>('getModuloByIdQuery');
      const modulo = await getModuloByIdQuery.execute(id);
      return reply.send({ data: modulo });
    } catch (error: any) {
      return handleModuloError(error, reply);
    }
  });

  // Crear módulo (requiere admin)
  app.post('/modulos', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new module',
      tags: ['modulos'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre', 'tipo'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 255 },
          tipo: { type: 'string', enum: ['top', 'center', 'bottom'] },
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
                tipo: { type: 'string' },
                icono: { type: 'string' },
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
    const parsed = CreateModuloSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const createModuloCommand = req.diScope.resolve<CreateModuloCommand>('createModuloCommand');
      const modulo = await createModuloCommand.execute(parsed.data);
      return reply.code(201).send({ data: modulo });
    } catch (error: any) {
      return handleModuloError(error, reply);
    }
  });

  // Actualizar módulo (requiere admin)
  app.put('/modulos/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update module',
      tags: ['modulos'],
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
        required: ['nombre', 'tipo'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 255 },
          tipo: { type: 'string', enum: ['top', 'center', 'bottom'] },
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
                tipo: { type: 'string' },
                icono: { type: 'string' },
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
    const parsed = UpdateModuloSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const updateModuloCommand = req.diScope.resolve<UpdateModuloCommand>('updateModuloCommand');
      const modulo = await updateModuloCommand.execute({
        id,
        nombre: parsed.data.nombre,
        tipo: parsed.data.tipo,
        icono: parsed.data.icono,
        orden: parsed.data.orden
      });
      return reply.send({ data: modulo });
    } catch (error: any) {
      return handleModuloError(error, reply);
    }
  });

  // Eliminar módulo (requiere admin)
  app.delete('/modulos/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete module',
      tags: ['modulos'],
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
                id: { type: 'string' }
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
      const deleteModuloCommand = req.diScope.resolve<DeleteModuloCommand>('deleteModuloCommand');
      await deleteModuloCommand.execute({ id });
      return reply.send({ data: { id } });
    } catch (error: any) {
      return handleModuloError(error, reply);
    }
  });
}