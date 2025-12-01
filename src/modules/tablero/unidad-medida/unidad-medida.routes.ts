import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { CreateUnidadMedidaSchema, UpdateUnidadMedidaSchema, UnidadMedidaIdParamSchema, CategoriaParamSchema } from './unidad-medida.schemas.js';
import { ok, validationError } from '../../../utils/http.js';
import { withDbContext } from '../../../db/context.js';
import { handleUnidadMedidaError } from './infrastructure/errorHandler.js';
import { GetAllUnidadesMedidaQuery } from './application/queries/GetAllUnidadesMedidaQuery.js';
import { GetUnidadMedidaByIdQuery } from './application/queries/GetUnidadMedidaByIdQuery.js';
import { GetUnidadesMedidaByCategoriaQuery } from './application/queries/GetUnidadesMedidaByCategoriaQuery.js';
import { CreateUnidadMedidaCommand } from './application/commands/CreateUnidadMedidaCommand.js';
import { UpdateUnidadMedidaCommand } from './application/commands/UpdateUnidadMedidaCommand.js';
import { DeleteUnidadMedidaCommand } from './application/commands/DeleteUnidadMedidaCommand.js';

export default async function unidadMedidaRoutes(app: FastifyInstance) {

  // Listar todas las unidades de medida (requiere auth)
  app.get('/unidades-medida', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all measurement units',
      tags: ['unidades-medida'],
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
                  simbolo: { type: 'string' },
                  descripcion: { type: 'string' },
                  categoria: { type: 'string' },
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
      const getAllUnidadesMedidaQuery = req.diScope.resolve<GetAllUnidadesMedidaQuery>('getAllUnidadesMedidaQuery');
      const unidadesMedida = await getAllUnidadesMedidaQuery.execute();
      return reply.send(ok(unidadesMedida));
    } catch (error: any) {
      return handleUnidadMedidaError(error, reply);
    }
  });

  // Listar unidades de medida por categoria (requiere auth)
  app.get('/unidades-medida/categoria/:categoria', {
    preHandler: [requireAuth],
    schema: {
      description: 'List measurement units by category',
      tags: ['unidades-medida'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          categoria: {
            type: 'string',
            enum: ['CANTIDAD', 'PORCENTAJE', 'MONETARIA', 'TIEMPO', 'PESO', 'VOLUMEN', 'AREA', 'DISTANCIA', 'VELOCIDAD', 'TEMPERATURA']
          }
        },
        required: ['categoria']
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
                  simbolo: { type: 'string' },
                  descripcion: { type: 'string' },
                  categoria: { type: 'string' },
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
    const { categoria } = req.params as { categoria: string };

    const paramValidation = CategoriaParamSchema.safeParse({ categoria });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getUnidadesMedidaByCategoriaQuery = req.diScope.resolve<GetUnidadesMedidaByCategoriaQuery>('getUnidadesMedidaByCategoriaQuery');
      const unidadesMedida = await getUnidadesMedidaByCategoriaQuery.execute(paramValidation.data.categoria);
      return reply.send(ok(unidadesMedida));
    } catch (error: any) {
      return handleUnidadMedidaError(error, reply);
    }
  });

  // Obtener unidad de medida por ID (requiere auth)
  app.get('/unidades-medida/:unidadMedidaId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get measurement unit by ID',
      tags: ['unidades-medida'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          unidadMedidaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['unidadMedidaId']
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
                simbolo: { type: 'string' },
                descripcion: { type: 'string' },
                categoria: { type: 'string' },
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
    const { unidadMedidaId } = req.params as { unidadMedidaId: string };

    // Validate parameter
    const paramValidation = UnidadMedidaIdParamSchema.safeParse({ unidadMedidaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getUnidadMedidaByIdQuery = req.diScope.resolve<GetUnidadMedidaByIdQuery>('getUnidadMedidaByIdQuery');
      const unidadMedida = await getUnidadMedidaByIdQuery.execute(paramValidation.data.unidadMedidaId);
      return reply.send(ok(unidadMedida));
    } catch (error: any) {
      return handleUnidadMedidaError(error, reply);
    }
  });

  // Crear unidad de medida (requiere admin)
  app.post('/unidades-medida', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new measurement unit',
      tags: ['unidades-medida'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre', 'simbolo', 'descripcion', 'categoria'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 100 },
          simbolo: { type: 'string', minLength: 1, maxLength: 20 },
          descripcion: { type: 'string', minLength: 1, maxLength: 500 },
          categoria: { type: 'string', enum: ['CANTIDAD', 'PORCENTAJE', 'MONETARIA', 'TIEMPO', 'PESO', 'VOLUMEN', 'AREA', 'DISTANCIA', 'VELOCIDAD', 'TEMPERATURA'] },
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
                simbolo: { type: 'string' },
                descripcion: { type: 'string' },
                categoria: { type: 'string' },
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
      const parsed = CreateUnidadMedidaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const createUnidadMedidaCommand = req.diScope.resolve<CreateUnidadMedidaCommand>('createUnidadMedidaCommand');
        const unidadMedida = await createUnidadMedidaCommand.execute({
          nombre: parsed.data.nombre,
          simbolo: parsed.data.simbolo,
          descripcion: parsed.data.descripcion,
          categoria: parsed.data.categoria,
          esActiva: parsed.data.esActiva,
          userId
        }, tx);
        return reply.code(201).send(ok(unidadMedida));
      } catch (error: any) {
        return handleUnidadMedidaError(error, reply);
      }
    });
  });

  // Actualizar unidad de medida (requiere admin)
  app.put('/unidades-medida/:unidadMedidaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update measurement unit',
      tags: ['unidades-medida'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          unidadMedidaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['unidadMedidaId']
      },
      body: {
        type: 'object',
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 100 },
          simbolo: { type: 'string', minLength: 1, maxLength: 20 },
          descripcion: { type: 'string', minLength: 1, maxLength: 500 },
          categoria: { type: 'string', enum: ['CANTIDAD', 'PORCENTAJE', 'MONETARIA', 'TIEMPO', 'PESO', 'VOLUMEN', 'AREA', 'DISTANCIA', 'VELOCIDAD', 'TEMPERATURA'] },
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
                simbolo: { type: 'string' },
                descripcion: { type: 'string' },
                categoria: { type: 'string' },
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
      const { unidadMedidaId } = req.params as { unidadMedidaId: string };

      // Validate parameter
      const paramValidation = UnidadMedidaIdParamSchema.safeParse({ unidadMedidaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateUnidadMedidaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const updateUnidadMedidaCommand = req.diScope.resolve<UpdateUnidadMedidaCommand>('updateUnidadMedidaCommand');
        const unidadMedida = await updateUnidadMedidaCommand.execute({
          unidadMedidaId: paramValidation.data.unidadMedidaId,
          nombre: parsed.data.nombre,
          simbolo: parsed.data.simbolo,
          descripcion: parsed.data.descripcion,
          categoria: parsed.data.categoria,
          esActiva: parsed.data.esActiva,
          userId
        }, tx);
        return reply.send(ok(unidadMedida));
      } catch (error: any) {
        return handleUnidadMedidaError(error, reply);
      }
    });
  });

  // Eliminar unidad de medida (requiere admin)
  app.delete('/unidades-medida/:unidadMedidaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete measurement unit',
      tags: ['unidades-medida'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          unidadMedidaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['unidadMedidaId']
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
      const { unidadMedidaId } = req.params as { unidadMedidaId: string };

      // Validate parameter
      const paramValidation = UnidadMedidaIdParamSchema.safeParse({ unidadMedidaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const deleteUnidadMedidaCommand = req.diScope.resolve<DeleteUnidadMedidaCommand>('deleteUnidadMedidaCommand');
        const deletedId = await deleteUnidadMedidaCommand.execute({
          unidadMedidaId: paramValidation.data.unidadMedidaId
        }, tx);
        return reply.send(ok({ id: deletedId }));
      } catch (error: any) {
        return handleUnidadMedidaError(error, reply);
      }
    });
  });
}