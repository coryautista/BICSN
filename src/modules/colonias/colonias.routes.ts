import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateColoniaSchema, UpdateColoniaSchema, ColoniaIdParamSchema, MunicipioIdParamSchema, CodigoPostalIdParamSchema, ColoniaQuerySchema } from './colonias.schemas.js';
import { getColoniaById, getColoniasByMunicipio, getColoniasByCodigoPostal, searchColoniasService, createColoniaItem, updateColoniaItem, deleteColoniaItem } from './colonias.service.js';
import { ok, validationError, notFound, internalError } from '../../utils/http.js';
import { withDbContext } from '../../db/context.js';

export default async function coloniasRoutes(app: FastifyInstance) {

  // Buscar colonias con filtros dinámicos (requiere auth)
  app.get('/colonias/search', {
    preHandler: [requireAuth],
    schema: {
      description: 'Search colonies with dynamic filters',
      tags: ['colonias'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          estadoId: { type: 'string', minLength: 2, maxLength: 2 },
          municipioId: { type: 'string', pattern: '^[0-9]+$' },
          codigoPostal: { type: 'string', minLength: 5, maxLength: 5 },
          nombreColonia: { type: 'string', minLength: 1 },
          tipoAsentamiento: { type: 'string', minLength: 1 },
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
                  coloniaId: { type: 'number' },
                  municipioId: { type: 'number' },
                  codigoPostalId: { type: 'number' },
                  nombreColonia: { type: 'string' },
                  tipoAsentamiento: { type: 'string' },
                  esValido: { type: 'boolean' },
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
    const queryValidation = ColoniaQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return reply.code(400).send(validationError(queryValidation.error.issues));
    }

    try {
      const colonias = await searchColoniasService(queryValidation.data);
      return reply.send(ok(colonias));
    } catch (error: any) {
      console.error('Error searching colonias:', error);
      return reply.code(500).send(internalError('Failed to search colonias'));
    }
  });

  // Listar colonias por municipio (requiere auth)
  app.get('/municipios/:municipioId/colonias', {
    preHandler: [requireAuth],
    schema: {
      description: 'List colonies by municipality',
      tags: ['colonias'],
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
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  coloniaId: { type: 'number' },
                  municipioId: { type: 'number' },
                  codigoPostalId: { type: 'number' },
                  nombreColonia: { type: 'string' },
                  tipoAsentamiento: { type: 'string' },
                  esValido: { type: 'boolean' },
                  codigoPostal: {
                    type: 'object',
                    properties: {
                      codigoPostalId: { type: 'number' },
                      codigoPostal: { type: 'string' }
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
    const { municipioId } = req.params as { municipioId: string };

    // Validate parameter
    const paramValidation = MunicipioIdParamSchema.safeParse({ municipioId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const colonias = await getColoniasByMunicipio(paramValidation.data.municipioId);
      return reply.send(ok(colonias));
    } catch (error: any) {
      console.error('Error listing colonias by municipio:', error);
      return reply.code(500).send(internalError('Failed to retrieve colonias'));
    }
  });

  // Listar colonias por código postal (requiere auth)
  app.get('/codigos-postales/:codigoPostalId/colonias', {
    preHandler: [requireAuth],
    schema: {
      description: 'List colonies by postal code',
      tags: ['colonias'],
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
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  coloniaId: { type: 'number' },
                  municipioId: { type: 'number' },
                  codigoPostalId: { type: 'number' },
                  nombreColonia: { type: 'string' },
                  tipoAsentamiento: { type: 'string' },
                  esValido: { type: 'boolean' },
                  municipio: {
                    type: 'object',
                    properties: {
                      municipioId: { type: 'number' },
                      nombreMunicipio: { type: 'string' }
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
    const { codigoPostalId } = req.params as { codigoPostalId: string };

    // Validate parameter
    const paramValidation = CodigoPostalIdParamSchema.safeParse({ codigoPostalId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const colonias = await getColoniasByCodigoPostal(paramValidation.data.codigoPostalId);
      return reply.send(ok(colonias));
    } catch (error: any) {
      console.error('Error listing colonias by codigo postal:', error);
      return reply.code(500).send(internalError('Failed to retrieve colonias'));
    }
  });

  // Obtener colonia por ID (requiere auth)
  app.get('/colonias/:coloniaId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get colony by ID',
      tags: ['colonias'],
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
              type: 'object',
              properties: {
                coloniaId: { type: 'number' },
                municipioId: { type: 'number' },
                codigoPostalId: { type: 'number' },
                nombreColonia: { type: 'string' },
                tipoAsentamiento: { type: 'string' },
                esValido: { type: 'boolean' },
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
    const { coloniaId } = req.params as { coloniaId: string };

    // Validate parameter
    const paramValidation = ColoniaIdParamSchema.safeParse({ coloniaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const colonia = await getColoniaById(paramValidation.data.coloniaId);
      return reply.send(ok(colonia));
    } catch (error: any) {
      if (error.message === 'COLONIA_NOT_FOUND') {
        return reply.code(404).send(notFound('Colonia', coloniaId));
      }
      console.error('Error getting colonia:', error);
      return reply.code(500).send(internalError('Failed to retrieve colonia'));
    }
  });

  // Crear colonia (requiere admin)
  app.post('/colonias', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new colony',
      tags: ['colonias'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['municipioId', 'codigoPostalId', 'nombreColonia'],
        properties: {
          municipioId: { type: 'number', minimum: 1 },
          codigoPostalId: { type: 'number', minimum: 1 },
          nombreColonia: { type: 'string', minLength: 1, maxLength: 100 },
          tipoAsentamiento: { type: 'string', maxLength: 50 },
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
                coloniaId: { type: 'number' },
                municipioId: { type: 'number' },
                codigoPostalId: { type: 'number' },
                nombreColonia: { type: 'string' },
                tipoAsentamiento: { type: 'string' },
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
      const parsed = CreateColoniaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const colonia = await createColoniaItem(
          parsed.data.municipioId,
          parsed.data.codigoPostalId,
          parsed.data.nombreColonia,
          parsed.data.tipoAsentamiento,
          parsed.data.esValido ?? false,
          userId,
          tx
        );
        return reply.code(201).send(ok(colonia));
      } catch (error: any) {
        if (error.message === 'COLONIA_EXISTS') {
          return reply.code(409).send({ ok: false, error: { code: 'CONFLICT', message: 'Colonia already exists' } });
        }
        if (error.message === 'MUNICIPIO_NOT_FOUND') {
          return reply.code(400).send({ ok: false, error: { code: 'BAD_REQUEST', message: 'Municipio not found' } });
        }
        if (error.message === 'CODIGO_POSTAL_NOT_FOUND') {
          return reply.code(400).send({ ok: false, error: { code: 'BAD_REQUEST', message: 'Codigo postal not found' } });
        }
        console.error('Error creating colonia:', error);
        return reply.code(500).send(internalError('Failed to create colonia'));
      }
    });
  });

  // Actualizar colonia (requiere admin)
  app.put('/colonias/:coloniaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update colony',
      tags: ['colonias'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          coloniaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['coloniaId']
      },
      body: {
        type: 'object',
        properties: {
          nombreColonia: { type: 'string', minLength: 1, maxLength: 100 },
          tipoAsentamiento: { type: 'string', maxLength: 50 },
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
                coloniaId: { type: 'number' },
                municipioId: { type: 'number' },
                codigoPostalId: { type: 'number' },
                nombreColonia: { type: 'string' },
                tipoAsentamiento: { type: 'string' },
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
      const { coloniaId } = req.params as { coloniaId: string };

      // Validate parameter
      const paramValidation = ColoniaIdParamSchema.safeParse({ coloniaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateColoniaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const colonia = await updateColoniaItem(
          paramValidation.data.coloniaId,
          parsed.data.nombreColonia,
          parsed.data.tipoAsentamiento,
          parsed.data.esValido,
          userId,
          tx
        );
        return reply.send(ok(colonia));
      } catch (error: any) {
        if (error.message === 'COLONIA_NOT_FOUND') {
          return reply.code(404).send(notFound('Colonia', coloniaId));
        }
        console.error('Error updating colonia:', error);
        return reply.code(500).send(internalError('Failed to update colonia'));
      }
    });
  });

  // Eliminar colonia (requiere admin)
  app.delete('/colonias/:coloniaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete colony',
      tags: ['colonias'],
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
              type: 'object',
              properties: {
                coloniaId: { type: 'number' }
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
      const { coloniaId } = req.params as { coloniaId: string };

      // Validate parameter
      const paramValidation = ColoniaIdParamSchema.safeParse({ coloniaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const deletedId = await deleteColoniaItem(paramValidation.data.coloniaId, tx);
        return reply.send(ok({ coloniaId: deletedId }));
      } catch (error: any) {
        if (error.message === 'COLONIA_NOT_FOUND') {
          return reply.code(404).send(notFound('Colonia', coloniaId));
        }
        console.error('Error deleting colonia:', error);
        return reply.code(500).send(internalError('Failed to delete colonia'));
      }
    });
  });
}