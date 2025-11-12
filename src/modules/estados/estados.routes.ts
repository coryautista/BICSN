import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateEstadoSchema, UpdateEstadoSchema, EstadoIdParamSchema } from './estados.schemas.js';
import { ok, validationError } from '../../utils/http.js';
import { handleEstadosError } from './infrastructure/errorHandler.js';
import type { GetAllEstadosQuery } from './application/queries/GetAllEstadosQuery.js';
import type { GetEstadoByIdQuery } from './application/queries/GetEstadoByIdQuery.js';
import type { CreateEstadoCommand } from './application/commands/CreateEstadoCommand.js';
import type { UpdateEstadoCommand } from './application/commands/UpdateEstadoCommand.js';
import type { DeleteEstadoCommand } from './application/commands/DeleteEstadoCommand.js';

export default async function estadosRoutes(app: FastifyInstance) {

  // Listar todos los estados (requiere auth)
  app.get('/estados', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all states',
      tags: ['estados'],
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
                  estadoId: { type: 'string' },
                  nombreEstado: { type: 'string' },
                  esValido: { type: 'boolean' }
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
      const getAllEstadosQuery = req.diScope.resolve<GetAllEstadosQuery>('getAllEstadosQuery');
      const estados = await getAllEstadosQuery.execute();
      return reply.send(ok(estados));
    } catch (error: any) {
      return handleEstadosError(error, reply);
    }
  });

  // Obtener estado por ID (requiere auth)
  app.get('/estados/:estadoId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get state by ID',
      tags: ['estados'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          estadoId: { type: 'string', minLength: 2, maxLength: 2 }
        },
        required: ['estadoId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                estadoId: { type: 'string' },
                nombreEstado: { type: 'string' },
                esValido: { type: 'boolean' }
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
    const { estadoId } = req.params as { estadoId: string };

    // Validate parameter
    const paramValidation = EstadoIdParamSchema.safeParse({ estadoId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getEstadoByIdQuery = req.diScope.resolve<GetEstadoByIdQuery>('getEstadoByIdQuery');
      const estado = await getEstadoByIdQuery.execute(estadoId);
      return reply.send(ok(estado));
    } catch (error: any) {
      return handleEstadosError(error, reply);
    }
  });

  // Crear estado (requiere admin)
  app.post('/estados', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new state',
      tags: ['estados'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['estadoId', 'nombreEstado'],
        properties: {
          estadoId: { type: 'string', minLength: 2, maxLength: 2 },
          nombreEstado: { type: 'string', minLength: 1, maxLength: 50 },
          esValido: { type: 'boolean' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                estadoId: { type: 'string' },
                nombreEstado: { type: 'string' },
                esValido: { type: 'boolean' }
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
    const parsed = CreateEstadoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const userId = req.user?.sub;
      const createEstadoCommand = req.diScope.resolve<CreateEstadoCommand>('createEstadoCommand');
      const estado = await createEstadoCommand.execute({
        estadoId: parsed.data.estadoId,
        nombreEstado: parsed.data.nombreEstado,
        esValido: parsed.data.esValido ?? false,
        userId
      });
      return reply.code(201).send(ok(estado));
    } catch (error: any) {
      return handleEstadosError(error, reply);
    }
  });

  // Actualizar estado (requiere admin)
  app.put('/estados/:estadoId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update state',
      tags: ['estados'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          estadoId: { type: 'string', minLength: 2, maxLength: 2 }
        },
        required: ['estadoId']
      },
      body: {
        type: 'object',
        properties: {
          nombreEstado: { type: 'string', minLength: 1, maxLength: 50 },
          esValido: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                estadoId: { type: 'string' },
                nombreEstado: { type: 'string' },
                esValido: { type: 'boolean' }
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
    const { estadoId } = req.params as { estadoId: string };

    // Validate parameter
    const paramValidation = EstadoIdParamSchema.safeParse({ estadoId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    const parsed = UpdateEstadoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const userId = req.user?.sub;
      const updateEstadoCommand = req.diScope.resolve<UpdateEstadoCommand>('updateEstadoCommand');
      const estado = await updateEstadoCommand.execute({
        estadoId,
        nombreEstado: parsed.data.nombreEstado,
        esValido: parsed.data.esValido,
        userId
      });
      return reply.send(ok(estado));
    } catch (error: any) {
      return handleEstadosError(error, reply);
    }
  });

  // Eliminar estado (requiere admin)
  app.delete('/estados/:estadoId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete state',
      tags: ['estados'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          estadoId: { type: 'string', minLength: 2, maxLength: 2 }
        },
        required: ['estadoId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                estadoId: { type: 'string' }
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
    const { estadoId } = req.params as { estadoId: string };

    // Validate parameter
    const paramValidation = EstadoIdParamSchema.safeParse({ estadoId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const deleteEstadoCommand = req.diScope.resolve<DeleteEstadoCommand>('deleteEstadoCommand');
      const deletedId = await deleteEstadoCommand.execute({ estadoId });
      return reply.send(ok({ estadoId: deletedId }));
    } catch (error: any) {
      return handleEstadosError(error, reply);
    }
  });
}