import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateProcesoSchema, UpdateProcesoSchema } from './proceso.schemas.js';
import { ok, validationError } from '../../utils/http.js';
import { GetAllProcesosQuery } from './application/queries/GetAllProcesosQuery.js';
import { GetProcesoByIdQuery } from './application/queries/GetProcesoByIdQuery.js';
import { CreateProcesoCommand } from './application/commands/CreateProcesoCommand.js';
import { UpdateProcesoCommand } from './application/commands/UpdateProcesoCommand.js';
import { DeleteProcesoCommand } from './application/commands/DeleteProcesoCommand.js';
import { handleProcesoError } from './infrastructure/errorHandler.js';

export default async function procesoRoutes(app: FastifyInstance) {

  // Listar todos los procesos (requiere auth)
  app.get('/procesos', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all procesos',
      tags: ['procesos'],
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
                  componente: { type: 'string' },
                  idModulo: { type: 'integer' },
                  orden: { type: 'integer' },
                  tipo: { type: 'string' }
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
      const query = req.diScope.resolve<GetAllProcesosQuery>('getAllProcesosQuery');
      const procesos = await query.execute({}, req.user?.sub || 'anonymous');
      return reply.send(ok(procesos));
    } catch (error: any) {
      return handleProcesoError(error, reply);
    }
  });

  // Obtener proceso por ID (requiere auth)
  app.get('/procesos/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get proceso by ID',
      tags: ['procesos'],
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
                componente: { type: 'string' },
                idModulo: { type: 'integer' },
                orden: { type: 'integer' },
                tipo: { type: 'string' }
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
      const query = req.diScope.resolve<GetProcesoByIdQuery>('getProcesoByIdQuery');
      const proceso = await query.execute({ id }, req.user?.sub || 'anonymous');
      return reply.send(ok(proceso));
    } catch (error: any) {
      return handleProcesoError(error, reply);
    }
  });

  // Crear proceso (requiere admin)
  app.post('/procesos', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new proceso item',
      tags: ['procesos'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre', 'componente', 'idModulo'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 4000 },
          componente: { type: 'string', minLength: 1, maxLength: 4000 },
          idModulo: { type: 'integer' },
          orden: { type: 'integer', minimum: 0 },
          tipo: { type: 'string', maxLength: 50 }
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
                componente: { type: 'string' },
                idModulo: { type: 'integer' },
                orden: { type: 'integer' },
                tipo: { type: 'string' }
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
    const parsed = CreateProcesoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const command = req.diScope.resolve<CreateProcesoCommand>('createProcesoCommand');
      const proceso = await command.execute({
        nombre: parsed.data.nombre,
        componente: parsed.data.componente,
        idModulo: parsed.data.idModulo,
        orden: parsed.data.orden,
        tipo: parsed.data.tipo
      }, req.user?.sub || 'anonymous');
      return reply.code(201).send(ok(proceso));
    } catch (error: any) {
      return handleProcesoError(error, reply);
    }
  });

  // Actualizar proceso (requiere admin)
  app.put('/procesos/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update proceso item',
      tags: ['procesos'],
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
          nombre: { type: 'string', minLength: 1, maxLength: 4000 },
          componente: { type: 'string', minLength: 1, maxLength: 4000 },
          idModulo: { type: 'integer' },
          orden: { type: 'integer', minimum: 0 },
          tipo: { type: 'string', maxLength: 50 }
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
                componente: { type: 'string' },
                idModulo: { type: 'integer' },
                orden: { type: 'integer' },
                tipo: { type: 'string' }
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
    const parsed = UpdateProcesoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const command = req.diScope.resolve<UpdateProcesoCommand>('updateProcesoCommand');
      const proceso = await command.execute({
        id,
        nombre: parsed.data.nombre,
        componente: parsed.data.componente,
        idModulo: parsed.data.idModulo,
        orden: parsed.data.orden,
        tipo: parsed.data.tipo
      }, req.user?.sub || 'anonymous');
      return reply.send(ok(proceso));
    } catch (error: any) {
      return handleProcesoError(error, reply);
    }
  });

  // Eliminar proceso (requiere admin)
  app.delete('/procesos/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete proceso item',
      tags: ['procesos'],
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
      const command = req.diScope.resolve<DeleteProcesoCommand>('deleteProcesoCommand');
      await command.execute({ id }, req.user?.sub || 'anonymous');
      return reply.send(ok({ id }));
    } catch (error: any) {
      return handleProcesoError(error, reply);
    }
  });
}