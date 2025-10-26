import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateCalleSchema, UpdateCalleSchema, CalleIdParamSchema, ColoniaIdParamSchema, CalleQuerySchema } from './calles.schemas.js';
import { getCalleById, getCallesByColonia, searchCallesService, createCalleItem, updateCalleItem, deleteCalleItem } from './calles.service.js';
import { ok, validationError, notFound, internalError } from '../../utils/http.js';
import { withDbContext } from '../../db/context.js';

export default async function callesRoutes(app: FastifyInstance) {

  // Buscar calles con filtros dinámicos (requiere auth)
  app.get('/calles/search', {
    preHandler: [requireAuth],
    schema: {
      description: 'Search streets with dynamic filters',
      tags: ['calles'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          estadoId: { type: 'string', minLength: 2, maxLength: 2 },
          municipioId: { type: 'string', pattern: '^[0-9]+$' },
          coloniaId: { type: 'string', pattern: '^[0-9]+$' },
          codigoPostal: { type: 'string', minLength: 5, maxLength: 5 },
          nombreCalle: { type: 'string', minLength: 1 },
          esValido: { type: 'string', enum: ['true', 'false'] },
          limit: { type: 'string', pattern: '^[0-9]+$' },
          offset: { type: 'string', pattern: '^[0-9]+$' }
        }
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
                  calleId: { type: 'number' },
                  coloniaId: { type: 'number' },
                  nombreCalle: { type: 'string' },
                  esValido: { type: 'boolean' },
                  colonia: {
                    type: 'object',
                    properties: {
                      coloniaId: { type: 'number' },
                      nombreColonia: { type: 'string' },
                      tipoAsentamiento: { type: 'string' }
                    }
                  },
                  municipio: {
                    type: 'object',
                    properties: {
                      municipioId: { type: 'number' },
                      nombreMunicipio: { type: 'string' }
                    }
                  },
                  codigoPostal: {
                    type: 'object',
                    properties: {
                      codigoPostalId: { type: 'number' },
                      codigoPostal: { type: 'string' }
                    }
                  },
                  estado: {
                    type: 'object',
                    properties: {
                      estadoId: { type: 'string' },
                      nombreEstado: { type: 'string' }
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
    const queryValidation = CalleQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return reply.code(400).send(validationError(queryValidation.error.issues));
    }

    try {
      const calles = await searchCallesService(queryValidation.data);
      return reply.send(ok(calles));
    } catch (error: any) {
      console.error('Error searching calles:', error);
      return reply.code(500).send(internalError('Failed to search calles'));
    }
  });

  // Listar calles por colonia (requiere auth)
  app.get('/colonias/:coloniaId/calles', {
    preHandler: [requireAuth],
    schema: {
      description: 'List streets by colony',
      tags: ['calles'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          coloniaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['coloniaId']
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
                  calleId: { type: 'number' },
                  coloniaId: { type: 'number' },
                  nombreCalle: { type: 'string' },
                  esValido: { type: 'boolean' }
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
    const { coloniaId } = req.params as { coloniaId: string };

    // Validate parameter
    const paramValidation = ColoniaIdParamSchema.safeParse({ coloniaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const calles = await getCallesByColonia(paramValidation.data.coloniaId);
      return reply.send(ok(calles));
    } catch (error: any) {
      console.error('Error listing calles by colonia:', error);
      return reply.code(500).send(internalError('Failed to retrieve calles'));
    }
  });

  // Obtener calle por ID (requiere auth)
  app.get('/calles/:calleId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get street by ID',
      tags: ['calles'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          calleId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['calleId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                calleId: { type: 'number' },
                coloniaId: { type: 'number' },
                nombreCalle: { type: 'string' },
                esValido: { type: 'boolean' },
                colonia: {
                  type: 'object',
                  properties: {
                    coloniaId: { type: 'number' },
                    nombreColonia: { type: 'string' },
                    tipoAsentamiento: { type: 'string' }
                  }
                },
                municipio: {
                  type: 'object',
                  properties: {
                    municipioId: { type: 'number' },
                    nombreMunicipio: { type: 'string' }
                  }
                },
                codigoPostal: {
                  type: 'object',
                  properties: {
                    codigoPostalId: { type: 'number' },
                    codigoPostal: { type: 'string' }
                  }
                },
                estado: {
                  type: 'object',
                  properties: {
                    estadoId: { type: 'string' },
                    nombreEstado: { type: 'string' }
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
    const { calleId } = req.params as { calleId: string };

    // Validate parameter
    const paramValidation = CalleIdParamSchema.safeParse({ calleId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const calle = await getCalleById(paramValidation.data.calleId);
      return reply.send(ok(calle));
    } catch (error: any) {
      if (error.message === 'CALLE_NOT_FOUND') {
        return reply.code(404).send(notFound('Calle', calleId));
      }
      console.error('Error getting calle:', error);
      return reply.code(500).send(internalError('Failed to retrieve calle'));
    }
  });

  // Crear calle (requiere admin)
  app.post('/calles', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new street',
      tags: ['calles'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['coloniaId', 'nombreCalle'],
        properties: {
          coloniaId: { type: 'number', minimum: 1 },
          nombreCalle: { type: 'string', minLength: 1, maxLength: 150 },
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
                calleId: { type: 'number' },
                coloniaId: { type: 'number' },
                nombreCalle: { type: 'string' },
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
      const parsed = CreateCalleSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const calle = await createCalleItem(
          parsed.data.coloniaId,
          parsed.data.nombreCalle,
          parsed.data.esValido ?? false,
          userId,
          tx
        );
        return reply.code(201).send(ok(calle));
      } catch (error: any) {
        if (error.message === 'CALLE_EXISTS') {
          return reply.code(409).send({ ok: false, error: { code: 'CONFLICT', message: 'Calle already exists' } });
        }
        if (error.message === 'COLONIA_NOT_FOUND') {
          return reply.code(400).send({ ok: false, error: { code: 'BAD_REQUEST', message: 'Colonia not found' } });
        }
        console.error('Error creating calle:', error);
        return reply.code(500).send(internalError('Failed to create calle'));
      }
    });
  });

  // Actualizar calle (requiere admin)
  app.put('/calles/:calleId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update street',
      tags: ['calles'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          calleId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['calleId']
      },
      body: {
        type: 'object',
        properties: {
          nombreCalle: { type: 'string', minLength: 1, maxLength: 150 },
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
                calleId: { type: 'number' },
                coloniaId: { type: 'number' },
                nombreCalle: { type: 'string' },
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
      const { calleId } = req.params as { calleId: string };

      // Validate parameter
      const paramValidation = CalleIdParamSchema.safeParse({ calleId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateCalleSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const calle = await updateCalleItem(
          paramValidation.data.calleId,
          parsed.data.nombreCalle,
          parsed.data.esValido,
          userId,
          tx
        );
        return reply.send(ok(calle));
      } catch (error: any) {
        if (error.message === 'CALLE_NOT_FOUND') {
          return reply.code(404).send(notFound('Calle', calleId));
        }
        console.error('Error updating calle:', error);
        return reply.code(500).send(internalError('Failed to update calle'));
      }
    });
  });

  // Eliminar calle (requiere admin)
  app.delete('/calles/:calleId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete street',
      tags: ['calles'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          calleId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['calleId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                calleId: { type: 'number' }
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
      const { calleId } = req.params as { calleId: string };

      // Validate parameter
      const paramValidation = CalleIdParamSchema.safeParse({ calleId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const deletedId = await deleteCalleItem(paramValidation.data.calleId, tx);
        return reply.send(ok({ calleId: deletedId }));
      } catch (error: any) {
        if (error.message === 'CALLE_NOT_FOUND') {
          return reply.code(404).send(notFound('Calle', calleId));
        }
        console.error('Error deleting calle:', error);
        return reply.code(500).send(internalError('Failed to delete calle'));
      }
    });
  });
}