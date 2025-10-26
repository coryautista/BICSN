import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateMunicipioSchema, UpdateMunicipioSchema, MunicipioIdParamSchema, EstadoIdParamSchema } from './municipios.schemas.js';
import { getAllMunicipios, getMunicipiosByEstado, getMunicipioById, createMunicipioItem, updateMunicipioItem, deleteMunicipioItem } from './municipios.service.js';
import { ok, validationError, notFound, internalError } from '../../utils/http.js';
import { withDbContext } from '../../db/context.js';

export default async function municipiosRoutes(app: FastifyInstance) {

  // Listar todos los municipios (requiere auth)
  app.get('/municipios', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all municipalities',
      tags: ['municipios'],
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
                  municipioId: { type: 'number' },
                  estadoId: { type: 'string' },
                  claveMunicipio: { type: 'string' },
                  nombreMunicipio: { type: 'string' },
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
      const municipios = await getAllMunicipios();
      return reply.send(ok(municipios));
    } catch (error: any) {
      console.error('Error listing municipios:', error);
      return reply.code(500).send(internalError('Failed to retrieve municipios'));
    }
  });

  // Listar municipios por estado (requiere auth)
  app.get('/estados/:estadoId/municipios', {
    preHandler: [requireAuth],
    schema: {
      description: 'List municipalities by state',
      tags: ['municipios'],
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
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  municipioId: { type: 'number' },
                  estadoId: { type: 'string' },
                  claveMunicipio: { type: 'string' },
                  nombreMunicipio: { type: 'string' },
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
    const { estadoId } = req.params as { estadoId: string };

    // Validate parameter
    const paramValidation = EstadoIdParamSchema.safeParse({ estadoId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const municipios = await getMunicipiosByEstado(estadoId);
      return reply.send(ok(municipios));
    } catch (error: any) {
      console.error('Error listing municipios by estado:', error);
      return reply.code(500).send(internalError('Failed to retrieve municipios'));
    }
  });

  // Obtener municipio por ID (requiere auth)
  app.get('/municipios/:municipioId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get municipality by ID',
      tags: ['municipios'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          municipioId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['municipioId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                municipioId: { type: 'number' },
                estadoId: { type: 'string' },
                claveMunicipio: { type: 'string' },
                nombreMunicipio: { type: 'string' },
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
    const { municipioId } = req.params as { municipioId: string };

    // Validate parameter
    const paramValidation = MunicipioIdParamSchema.safeParse({ municipioId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const municipio = await getMunicipioById(paramValidation.data.municipioId);
      return reply.send(ok(municipio));
    } catch (error: any) {
      if (error.message === 'MUNICIPIO_NOT_FOUND') {
        return reply.code(404).send(notFound('Municipio', municipioId));
      }
      console.error('Error getting municipio:', error);
      return reply.code(500).send(internalError('Failed to retrieve municipio'));
    }
  });

  // Crear municipio (requiere admin)
  app.post('/municipios', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new municipality',
      tags: ['municipios'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['estadoId', 'claveMunicipio', 'nombreMunicipio'],
        properties: {
          estadoId: { type: 'string', minLength: 2, maxLength: 2 },
          claveMunicipio: { type: 'string', minLength: 3, maxLength: 3 },
          nombreMunicipio: { type: 'string', minLength: 1, maxLength: 100 },
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
                municipioId: { type: 'number' },
                estadoId: { type: 'string' },
                claveMunicipio: { type: 'string' },
                nombreMunicipio: { type: 'string' },
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
      const parsed = CreateMunicipioSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const municipio = await createMunicipioItem(
          parsed.data.estadoId,
          parsed.data.claveMunicipio,
          parsed.data.nombreMunicipio,
          parsed.data.esValido ?? false,
          userId,
          tx
        );
        return reply.code(201).send(ok(municipio));
      } catch (error: any) {
        if (error.message === 'MUNICIPIO_EXISTS') {
          return reply.code(409).send({ ok: false, error: { code: 'CONFLICT', message: 'Municipio already exists' } });
        }
        if (error.message === 'ESTADO_NOT_FOUND') {
          return reply.code(400).send({ ok: false, error: { code: 'BAD_REQUEST', message: 'Estado not found' } });
        }
        console.error('Error creating municipio:', error);
        return reply.code(500).send(internalError('Failed to create municipio'));
      }
    });
  });

  // Actualizar municipio (requiere admin)
  app.put('/municipios/:municipioId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update municipality',
      tags: ['municipios'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          municipioId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['municipioId']
      },
      body: {
        type: 'object',
        properties: {
          nombreMunicipio: { type: 'string', minLength: 1, maxLength: 100 },
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
                municipioId: { type: 'number' },
                estadoId: { type: 'string' },
                claveMunicipio: { type: 'string' },
                nombreMunicipio: { type: 'string' },
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
      const { municipioId } = req.params as { municipioId: string };

      // Validate parameter
      const paramValidation = MunicipioIdParamSchema.safeParse({ municipioId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateMunicipioSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const municipio = await updateMunicipioItem(
          paramValidation.data.municipioId,
          parsed.data.nombreMunicipio,
          parsed.data.esValido,
          userId,
          tx
        );
        return reply.send(ok(municipio));
      } catch (error: any) {
        if (error.message === 'MUNICIPIO_NOT_FOUND') {
          return reply.code(404).send(notFound('Municipio', municipioId));
        }
        console.error('Error updating municipio:', error);
        return reply.code(500).send(internalError('Failed to update municipio'));
      }
    });
  });

  // Eliminar municipio (requiere admin)
  app.delete('/municipios/:municipioId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete municipality',
      tags: ['municipios'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          municipioId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['municipioId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                municipioId: { type: 'number' }
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
      const { municipioId } = req.params as { municipioId: string };

      // Validate parameter
      const paramValidation = MunicipioIdParamSchema.safeParse({ municipioId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const deletedId = await deleteMunicipioItem(paramValidation.data.municipioId, tx);
        return reply.send(ok({ municipioId: deletedId }));
      } catch (error: any) {
        if (error.message === 'MUNICIPIO_NOT_FOUND') {
          return reply.code(404).send(notFound('Municipio', municipioId));
        }
        console.error('Error deleting municipio:', error);
        return reply.code(500).send(internalError('Failed to delete municipio'));
      }
    });
  });
}