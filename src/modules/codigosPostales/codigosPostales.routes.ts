import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateCodigoPostalSchema, UpdateCodigoPostalSchema, CodigoPostalIdParamSchema } from './codigosPostales.schemas.js';
import { getAllCodigosPostales, getCodigoPostalById, getCodigoPostalByCode, createCodigoPostalItem, updateCodigoPostalItem, deleteCodigoPostalItem } from './codigosPostales.service.js';
import { ok, validationError, notFound, internalError } from '../../utils/http.js';
import { withDbContext } from '../../db/context.js';

export default async function codigosPostalesRoutes(app: FastifyInstance) {

  // Listar todos los códigos postales (requiere auth)
  app.get('/codigos-postales', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all postal codes',
      tags: ['codigos-postales'],
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
                  codigoPostalId: { type: 'number' },
                  codigoPostal: { type: 'string' },
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
  }, async (_req, reply) => {
    try {
      const codigosPostales = await getAllCodigosPostales();
      return reply.send(ok(codigosPostales));
    } catch (error: any) {
      console.error('Error listing codigos postales:', error);
      return reply.code(500).send(internalError('Failed to retrieve codigos postales'));
    }
  });

  // Obtener código postal por ID (requiere auth)
  app.get('/codigos-postales/:codigoPostalId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get postal code by ID',
      tags: ['codigos-postales'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          codigoPostalId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['codigoPostalId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                codigoPostalId: { type: 'number' },
                codigoPostal: { type: 'string' },
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
    const { codigoPostalId } = req.params as { codigoPostalId: string };

    // Validate parameter
    const paramValidation = CodigoPostalIdParamSchema.safeParse({ codigoPostalId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const codigoPostal = await getCodigoPostalById(paramValidation.data.codigoPostalId);
      return reply.send(ok(codigoPostal));
    } catch (error: any) {
      if (error.message === 'CODIGO_POSTAL_NOT_FOUND') {
        return reply.code(404).send(notFound('CodigoPostal', codigoPostalId));
      }
      console.error('Error getting codigo postal:', error);
      return reply.code(500).send(internalError('Failed to retrieve codigo postal'));
    }
  });

  // Obtener código postal por código (requiere auth)
  app.get('/codigos-postales/codigo/:codigoPostal', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get postal code by code',
      tags: ['codigos-postales'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          codigoPostal: { type: 'string', minLength: 5, maxLength: 5 }
        },
        required: ['codigoPostal']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                codigoPostalId: { type: 'number' },
                codigoPostal: { type: 'string' },
                esValido: { type: 'boolean' }
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
    const { codigoPostal } = req.params as { codigoPostal: string };

    try {
      const cp = await getCodigoPostalByCode(codigoPostal);
      return reply.send(ok(cp));
    } catch (error: any) {
      if (error.message === 'CODIGO_POSTAL_NOT_FOUND') {
        return reply.code(404).send(notFound('CodigoPostal', codigoPostal));
      }
      console.error('Error getting codigo postal by code:', error);
      return reply.code(500).send(internalError('Failed to retrieve codigo postal'));
    }
  });

  // Crear código postal (requiere admin)
  app.post('/codigos-postales', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new postal code',
      tags: ['codigos-postales'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['codigoPostal'],
        properties: {
          codigoPostal: { type: 'string', minLength: 5, maxLength: 5 },
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
                codigoPostalId: { type: 'number' },
                codigoPostal: { type: 'string' },
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
    return withDbContext(req, async (tx) => {
      const parsed = CreateCodigoPostalSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const codigoPostal = await createCodigoPostalItem(
          parsed.data.codigoPostal,
          parsed.data.esValido ?? false,
          userId,
          tx
        );
        return reply.code(201).send(ok(codigoPostal));
      } catch (error: any) {
        if (error.message === 'CODIGO_POSTAL_EXISTS') {
          return reply.code(409).send({ ok: false, error: { code: 'CONFLICT', message: 'Codigo postal already exists' } });
        }
        console.error('Error creating codigo postal:', error);
        return reply.code(500).send(internalError('Failed to create codigo postal'));
      }
    });
  });

  // Actualizar código postal (requiere admin)
  app.put('/codigos-postales/:codigoPostalId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update postal code',
      tags: ['codigos-postales'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          codigoPostalId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['codigoPostalId']
      },
      body: {
        type: 'object',
        properties: {
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
                codigoPostalId: { type: 'number' },
                codigoPostal: { type: 'string' },
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
    return withDbContext(req, async (tx) => {
      const { codigoPostalId } = req.params as { codigoPostalId: string };

      // Validate parameter
      const paramValidation = CodigoPostalIdParamSchema.safeParse({ codigoPostalId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateCodigoPostalSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const codigoPostal = await updateCodigoPostalItem(
          paramValidation.data.codigoPostalId,
          parsed.data.esValido,
          userId,
          tx
        );
        return reply.send(ok(codigoPostal));
      } catch (error: any) {
        if (error.message === 'CODIGO_POSTAL_NOT_FOUND') {
          return reply.code(404).send(notFound('CodigoPostal', codigoPostalId));
        }
        console.error('Error updating codigo postal:', error);
        return reply.code(500).send(internalError('Failed to update codigo postal'));
      }
    });
  });

  // Eliminar código postal (requiere admin)
  app.delete('/codigos-postales/:codigoPostalId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete postal code',
      tags: ['codigos-postales'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          codigoPostalId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['codigoPostalId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                codigoPostalId: { type: 'number' }
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
      const { codigoPostalId } = req.params as { codigoPostalId: string };

      // Validate parameter
      const paramValidation = CodigoPostalIdParamSchema.safeParse({ codigoPostalId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const deletedId = await deleteCodigoPostalItem(paramValidation.data.codigoPostalId, tx);
        return reply.send(ok({ codigoPostalId: deletedId }));
      } catch (error: any) {
        if (error.message === 'CODIGO_POSTAL_NOT_FOUND') {
          return reply.code(404).send(notFound('CodigoPostal', codigoPostalId));
        }
        console.error('Error deleting codigo postal:', error);
        return reply.code(500).send(internalError('Failed to delete codigo postal'));
      }
    });
  });
}