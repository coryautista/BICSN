import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { CreateUnidadMedidaSchema, UpdateUnidadMedidaSchema, UnidadMedidaIdParamSchema } from './unidad-medida.schemas.js';
import { getAllUnidadesMedida, getUnidadesMedidaByCategoria, getUnidadMedidaById, createUnidadMedidaItem, updateUnidadMedidaItem, deleteUnidadMedidaItem } from './unidad-medida.service.js';
import { ok, validationError, notFound, internalError } from '../../../utils/http.js';
import { withDbContext } from '../../../db/context.js';

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
  }, async (_req, reply) => {
    try {
      const unidadesMedida = await getAllUnidadesMedida();
      return reply.send(ok(unidadesMedida));
    } catch (error: any) {
      console.error('Error listing unidades-medida:', error);
      return reply.code(500).send(internalError('Failed to retrieve unidades-medida'));
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

    try {
      const unidadesMedida = await getUnidadesMedidaByCategoria(categoria);
      return reply.send(ok(unidadesMedida));
    } catch (error: any) {
      console.error('Error listing unidades-medida by categoria:', error);
      return reply.code(500).send(internalError('Failed to retrieve unidades-medida'));
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
      const unidadMedida = await getUnidadMedidaById(paramValidation.data.unidadMedidaId);
      return reply.send(ok(unidadMedida));
    } catch (error: any) {
      if (error.message === 'UNIDAD_MEDIDA_NOT_FOUND') {
        return reply.code(404).send(notFound('UnidadMedida', unidadMedidaId));
      }
      console.error('Error getting unidad-medida:', error);
      return reply.code(500).send(internalError('Failed to retrieve unidad-medida'));
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
        const unidadMedida = await createUnidadMedidaItem(
          parsed.data.nombre,
          parsed.data.simbolo,
          parsed.data.descripcion,
          parsed.data.categoria,
          parsed.data.esActiva,
          userId,
          tx
        );
        return reply.code(201).send(ok(unidadMedida));
      } catch (error: any) {
        console.error('Error creating unidad-medida:', error);
        return reply.code(500).send(internalError('Failed to create unidad-medida'));
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
        const unidadMedida = await updateUnidadMedidaItem(
          paramValidation.data.unidadMedidaId,
          parsed.data.nombre,
          parsed.data.simbolo,
          parsed.data.descripcion,
          parsed.data.categoria,
          parsed.data.esActiva,
          userId,
          tx
        );
        return reply.send(ok(unidadMedida));
      } catch (error: any) {
        if (error.message === 'UNIDAD_MEDIDA_NOT_FOUND') {
          return reply.code(404).send(notFound('UnidadMedida', unidadMedidaId));
        }
        console.error('Error updating unidad-medida:', error);
        return reply.code(500).send(internalError('Failed to update unidad-medida'));
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
        const deletedId = await deleteUnidadMedidaItem(paramValidation.data.unidadMedidaId, tx);
        return reply.send(ok({ id: deletedId }));
      } catch (error: any) {
        if (error.message === 'UNIDAD_MEDIDA_NOT_FOUND') {
          return reply.code(404).send(notFound('UnidadMedida', unidadMedidaId));
        }
        console.error('Error deleting unidad-medida:', error);
        return reply.code(500).send(internalError('Failed to delete unidad-medida'));
      }
    });
  });
}