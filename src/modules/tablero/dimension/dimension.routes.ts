import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { CreateDimensionSchema, UpdateDimensionSchema, DimensionIdParamSchema, TipoDimensionParamSchema } from './dimension.schemas.js';
import { ok, validationError } from '../../../utils/http.js';
import { withDbContext } from '../../../db/context.js';
import { handleDimensionError } from './infrastructure/errorHandler.js';
import { GetAllDimensionesQuery } from './application/queries/GetAllDimensionesQuery.js';
import { GetDimensionByIdQuery } from './application/queries/GetDimensionByIdQuery.js';
import { GetDimensionesByTipoQuery } from './application/queries/GetDimensionesByTipoQuery.js';
import { CreateDimensionCommand } from './application/commands/CreateDimensionCommand.js';
import { UpdateDimensionCommand } from './application/commands/UpdateDimensionCommand.js';
import { DeleteDimensionCommand } from './application/commands/DeleteDimensionCommand.js';

export default async function dimensionRoutes(app: FastifyInstance) {

  // Listar todas las dimensiones (requiere auth)
  app.get('/dimensiones', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all dimensions',
      tags: ['dimensiones'],
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
                  id: { type: 'number' },
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  tipoDimension: { type: 'string' },
                  esActiva: { type: 'boolean' }
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
      const getAllDimensionesQuery = req.diScope.resolve<GetAllDimensionesQuery>('getAllDimensionesQuery');
      const dimensiones = await getAllDimensionesQuery.execute();
      return reply.send(ok(dimensiones));
    } catch (error: any) {
      return handleDimensionError(error, reply);
    }
  });

  // Listar dimensiones por tipo (requiere auth)
  app.get('/dimensiones/tipo/:tipoDimension', {
    preHandler: [requireAuth],
    schema: {
      description: 'List dimensions by type',
      tags: ['dimensiones'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          tipoDimension: {
            type: 'string',
            enum: ['GEOGRAFICA', 'TEMPORAL', 'DEMOGRAFICA', 'ECONOMICA', 'SOCIAL', 'AMBIENTAL', 'INSTITUCIONAL']
          }
        },
        required: ['tipoDimension']
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
                  id: { type: 'number' },
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  tipoDimension: { type: 'string' },
                  esActiva: { type: 'boolean' }
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
    const { tipoDimension } = req.params as { tipoDimension: string };

    const paramValidation = TipoDimensionParamSchema.safeParse({ tipoDimension });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getDimensionesByTipoQuery = req.diScope.resolve<GetDimensionesByTipoQuery>('getDimensionesByTipoQuery');
      const dimensiones = await getDimensionesByTipoQuery.execute(paramValidation.data.tipoDimension);
      return reply.send(ok(dimensiones));
    } catch (error: any) {
      return handleDimensionError(error, reply);
    }
  });

  // Obtener dimension por ID (requiere auth)
  app.get('/dimensiones/:dimensionId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get dimension by ID',
      tags: ['dimensiones'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dimensionId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['dimensionId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                tipoDimension: { type: 'string' },
                esActiva: { type: 'boolean' }
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
    const { dimensionId } = req.params as { dimensionId: string };

    // Validate parameter
    const paramValidation = DimensionIdParamSchema.safeParse({ dimensionId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getDimensionByIdQuery = req.diScope.resolve<GetDimensionByIdQuery>('getDimensionByIdQuery');
      const dimension = await getDimensionByIdQuery.execute(paramValidation.data.dimensionId);
      return reply.send(ok(dimension));
    } catch (error: any) {
      return handleDimensionError(error, reply);
    }
  });

  // Crear dimension (requiere admin)
  app.post('/dimensiones', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new dimension',
      tags: ['dimensiones'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre', 'descripcion', 'tipoDimension'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 200 },
          descripcion: { type: 'string', minLength: 1, maxLength: 1000 },
          tipoDimension: { type: 'string', enum: ['GEOGRAFICA', 'TEMPORAL', 'DEMOGRAFICA', 'ECONOMICA', 'SOCIAL', 'AMBIENTAL', 'INSTITUCIONAL'] },
          esActiva: { type: 'boolean' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                tipoDimension: { type: 'string' },
                esActiva: { type: 'boolean' }
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
    return withDbContext(req, async (tx) => {
      const parsed = CreateDimensionSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const createDimensionCommand = req.diScope.resolve<CreateDimensionCommand>('createDimensionCommand');
        const dimension = await createDimensionCommand.execute({
          nombre: parsed.data.nombre,
          descripcion: parsed.data.descripcion,
          tipoDimension: parsed.data.tipoDimension,
          esActiva: parsed.data.esActiva,
          userId
        }, tx);
        return reply.code(201).send(ok(dimension));
      } catch (error: any) {
        return handleDimensionError(error, reply);
      }
    });
  });

  // Actualizar dimension (requiere admin)
  app.put('/dimensiones/:dimensionId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update dimension',
      tags: ['dimensiones'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dimensionId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['dimensionId']
      },
      body: {
        type: 'object',
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 200 },
          descripcion: { type: 'string', minLength: 1, maxLength: 1000 },
          tipoDimension: { type: 'string', enum: ['GEOGRAFICA', 'TEMPORAL', 'DEMOGRAFICA', 'ECONOMICA', 'SOCIAL', 'AMBIENTAL', 'INSTITUCIONAL'] },
          esActiva: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                tipoDimension: { type: 'string' },
                esActiva: { type: 'boolean' }
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
      const { dimensionId } = req.params as { dimensionId: string };

      // Validate parameter
      const paramValidation = DimensionIdParamSchema.safeParse({ dimensionId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateDimensionSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const updateDimensionCommand = req.diScope.resolve<UpdateDimensionCommand>('updateDimensionCommand');
        const dimension = await updateDimensionCommand.execute({
          dimensionId: paramValidation.data.dimensionId,
          nombre: parsed.data.nombre,
          descripcion: parsed.data.descripcion,
          tipoDimension: parsed.data.tipoDimension,
          esActiva: parsed.data.esActiva,
          userId
        }, tx);
        return reply.send(ok(dimension));
      } catch (error: any) {
        return handleDimensionError(error, reply);
      }
    });
  });

  // Eliminar dimension (requiere admin)
  app.delete('/dimensiones/:dimensionId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete dimension',
      tags: ['dimensiones'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dimensionId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['dimensionId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' }
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
      const { dimensionId } = req.params as { dimensionId: string };

      // Validate parameter
      const paramValidation = DimensionIdParamSchema.safeParse({ dimensionId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const deleteDimensionCommand = req.diScope.resolve<DeleteDimensionCommand>('deleteDimensionCommand');
        const deletedId = await deleteDimensionCommand.execute({
          dimensionId: paramValidation.data.dimensionId
        }, tx);
        return reply.send(ok({ id: deletedId }));
      } catch (error: any) {
        return handleDimensionError(error, reply);
      }
    });
  });
}