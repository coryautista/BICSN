import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { CreateEjeSchema, UpdateEjeSchema, EjeIdParamSchema } from './eje.schemas.js';
import { getAllEjes, getEjeById, getEjeWithLineas, createEjeItem, updateEjeItem, deleteEjeItem } from './eje.service.js';
import { ok, validationError, notFound, internalError } from '../../../utils/http.js';
import { withDbContext } from '../../../db/context.js';

export default async function ejeRoutes(app: FastifyInstance) {

  // Listar todos los ejes (requiere auth)
  app.get('/ejes', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all strategic axes',
      tags: ['ejes'],
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
                  nombre: { type: 'string' }
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
      const ejes = await getAllEjes();
      return reply.send(ok(ejes));
    } catch (error: any) {
      console.error('Error listing ejes:', error);
      return reply.code(500).send(internalError('Failed to retrieve ejes'));
    }
  });

  // Obtener eje por ID (requiere auth)
  app.get('/ejes/:ejeId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get strategic axis by ID',
      tags: ['ejes'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          ejeId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['ejeId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                nombre: { type: 'string' }
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
    const { ejeId } = req.params as { ejeId: string };

    // Validate parameter
    const paramValidation = EjeIdParamSchema.safeParse({ ejeId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const eje = await getEjeById(paramValidation.data.ejeId);
      return reply.send(ok(eje));
    } catch (error: any) {
      if (error.message === 'EJE_NOT_FOUND') {
        return reply.code(404).send(notFound('Eje', ejeId));
      }
      console.error('Error getting eje:', error);
      return reply.code(500).send(internalError('Failed to retrieve eje'));
    }
  });

  // Obtener eje con líneas estratégicas (requiere auth)
  app.get('/ejes/:ejeId/lineas-estrategicas', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get strategic axis with strategic lines',
      tags: ['ejes'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          ejeId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['ejeId']
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
                lineasEstrategicas: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' },
                      descripcion: { type: 'string' }
                    }
                  }
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
    const { ejeId } = req.params as { ejeId: string };

    // Validate parameter
    const paramValidation = EjeIdParamSchema.safeParse({ ejeId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const eje = await getEjeWithLineas(paramValidation.data.ejeId);
      return reply.send(ok(eje));
    } catch (error: any) {
      if (error.message === 'EJE_NOT_FOUND') {
        return reply.code(404).send(notFound('Eje', ejeId));
      }
      console.error('Error getting eje with lineas:', error);
      return reply.code(500).send(internalError('Failed to retrieve eje with lineas'));
    }
  });

  // Crear eje (requiere admin)
  app.post('/ejes', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new strategic axis',
      tags: ['ejes'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 500 }
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
                nombre: { type: 'string' }
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
      const parsed = CreateEjeSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const eje = await createEjeItem(
          parsed.data.nombre,
          userId,
          tx
        );
        return reply.code(201).send(ok(eje));
      } catch (error: any) {
        console.error('Error creating eje:', error);
        return reply.code(500).send(internalError('Failed to create eje'));
      }
    });
  });

  // Actualizar eje (requiere admin)
  app.put('/ejes/:ejeId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update strategic axis',
      tags: ['ejes'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          ejeId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['ejeId']
      },
      body: {
        type: 'object',
        required: ['nombre'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 500 }
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
                nombre: { type: 'string' }
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
      const { ejeId } = req.params as { ejeId: string };

      // Validate parameter
      const paramValidation = EjeIdParamSchema.safeParse({ ejeId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateEjeSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const eje = await updateEjeItem(
          paramValidation.data.ejeId,
          parsed.data.nombre,
          userId,
          tx
        );
        return reply.send(ok(eje));
      } catch (error: any) {
        if (error.message === 'EJE_NOT_FOUND') {
          return reply.code(404).send(notFound('Eje', ejeId));
        }
        console.error('Error updating eje:', error);
        return reply.code(500).send(internalError('Failed to update eje'));
      }
    });
  });

  // Eliminar eje (requiere admin)
  app.delete('/ejes/:ejeId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete strategic axis',
      tags: ['ejes'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          ejeId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['ejeId']
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
      const { ejeId } = req.params as { ejeId: string };

      // Validate parameter
      const paramValidation = EjeIdParamSchema.safeParse({ ejeId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const deletedId = await deleteEjeItem(paramValidation.data.ejeId, tx);
        return reply.send(ok({ id: deletedId }));
      } catch (error: any) {
        if (error.message === 'EJE_NOT_FOUND') {
          return reply.code(404).send(notFound('Eje', ejeId));
        }
        console.error('Error deleting eje:', error);
        return reply.code(500).send(internalError('Failed to delete eje'));
      }
    });
  });
}