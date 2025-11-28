import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { CreateDimensionSchema, UpdateDimensionSchema, DimensionIdParamSchema } from './dimension.schemas.js';
import { DimensionService } from './dimension.service.js';
import { ok, validationError, notFound, internalError } from '../../../utils/http.js';
import { withDbContext } from '../../../db/context.js';

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
      const dimensionService = req.diScope.resolve<DimensionService>('dimensionService');
      const dimensiones = await dimensionService.getAllDimensiones();
      return reply.send(ok(dimensiones));
    } catch (error: any) {
      console.error('Error listing dimensiones:', error);
      return reply.code(500).send(internalError('Failed to retrieve dimensiones'));
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

    try {
      const dimensionService = req.diScope.resolve<DimensionService>('dimensionService');
      const dimensiones = await dimensionService.getDimensionesByTipo(tipoDimension);
      return reply.send(ok(dimensiones));
    } catch (error: any) {
      console.error('Error listing dimensiones by tipo:', error);
      return reply.code(500).send(internalError('Failed to retrieve dimensiones'));
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
      const dimensionService = req.diScope.resolve<DimensionService>('dimensionService');
      const dimension = await dimensionService.getDimensionById(paramValidation.data.dimensionId);
      return reply.send(ok(dimension));
    } catch (error: any) {
      if (error.message === 'DIMENSION_NOT_FOUND') {
        return reply.code(404).send(notFound('Dimension', dimensionId));
      }
      console.error('Error getting dimension:', error);
      return reply.code(500).send(internalError('Failed to retrieve dimension'));
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
        const dimensionService = req.diScope.resolve<DimensionService>('dimensionService');
        const dimension = await dimensionService.createDimensionItem(
          parsed.data.nombre,
          parsed.data.descripcion,
          parsed.data.tipoDimension,
          parsed.data.esActiva,
          userId,
          tx
        );
        return reply.code(201).send(ok(dimension));
      } catch (error: any) {
        console.error('Error creating dimension:', error);
        return reply.code(500).send(internalError('Failed to create dimension'));
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
        const dimensionService = req.diScope.resolve<DimensionService>('dimensionService');
        const dimension = await dimensionService.updateDimensionItem(
          paramValidation.data.dimensionId,
          parsed.data.nombre,
          parsed.data.descripcion,
          parsed.data.tipoDimension,
          parsed.data.esActiva,
          userId,
          tx
        );
        return reply.send(ok(dimension));
      } catch (error: any) {
        if (error.message === 'DIMENSION_NOT_FOUND') {
          return reply.code(404).send(notFound('Dimension', dimensionId));
        }
        console.error('Error updating dimension:', error);
        return reply.code(500).send(internalError('Failed to update dimension'));
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
        const dimensionService = req.diScope.resolve<DimensionService>('dimensionService');
        const deletedId = await dimensionService.deleteDimensionItem(paramValidation.data.dimensionId, tx);
        return reply.send(ok({ id: deletedId }));
      } catch (error: any) {
        if (error.message === 'DIMENSION_NOT_FOUND') {
          return reply.code(404).send(notFound('Dimension', dimensionId));
        }
        console.error('Error deleting dimension:', error);
        return reply.code(500).send(internalError('Failed to delete dimension'));
      }
    });
  });
}