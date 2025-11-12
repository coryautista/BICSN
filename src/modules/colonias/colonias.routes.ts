import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateColoniaSchema, UpdateColoniaSchema, ColoniaIdParamSchema, MunicipioIdParamSchema, CodigoPostalIdParamSchema, ColoniaQuerySchema } from './colonias.schemas.js';
import { ok, validationError } from '../../utils/http.js';
import { handleColoniasError } from './infrastructure/errorHandler.js';
import type { GetColoniaByIdQuery } from './application/queries/GetColoniaByIdQuery.js';
import type { GetColoniasByMunicipioQuery } from './application/queries/GetColoniasByMunicipioQuery.js';
import type { GetColoniasByCodigoPostalQuery } from './application/queries/GetColoniasByCodigoPostalQuery.js';
import type { SearchColoniasQuery } from './application/queries/SearchColoniasQuery.js';
import type { CreateColoniaCommand } from './application/commands/CreateColoniaCommand.js';
import type { UpdateColoniaCommand } from './application/commands/UpdateColoniaCommand.js';
import type { DeleteColoniaCommand } from './application/commands/DeleteColoniaCommand.js';

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
        required: ['nombreColonia'],
        properties: {
          nombreColonia: { type: 'string', minLength: 1 }
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
      const searchColoniasQuery = req.diScope.resolve<SearchColoniasQuery>('searchColoniasQuery');
      const colonias = await searchColoniasQuery.execute(queryValidation.data);
      return reply.send(ok(colonias));
    } catch (error: any) {
      return handleColoniasError(error, reply);
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
      const getColoniasByMunicipioQuery = req.diScope.resolve<GetColoniasByMunicipioQuery>('getColoniasByMunicipioQuery');
      const colonias = await getColoniasByMunicipioQuery.execute(paramValidation.data.municipioId);
      return reply.send(ok(colonias));
    } catch (error: any) {
      return handleColoniasError(error, reply);
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
      const getColoniasByCodigoPostalQuery = req.diScope.resolve<GetColoniasByCodigoPostalQuery>('getColoniasByCodigoPostalQuery');
      const colonias = await getColoniasByCodigoPostalQuery.execute(paramValidation.data.codigoPostalId);
      return reply.send(ok(colonias));
    } catch (error: any) {
      return handleColoniasError(error, reply);
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
      const getColoniaByIdQuery = req.diScope.resolve<GetColoniaByIdQuery>('getColoniaByIdQuery');
      const colonia = await getColoniaByIdQuery.execute(paramValidation.data.coloniaId);
      return reply.send(ok(colonia));
    } catch (error: any) {
      return handleColoniasError(error, reply);
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
    const parsed = CreateColoniaSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const userId = req.user?.sub;
      const createColoniaCommand = req.diScope.resolve<CreateColoniaCommand>('createColoniaCommand');
      const colonia = await createColoniaCommand.execute({
        municipioId: parsed.data.municipioId,
        codigoPostalId: parsed.data.codigoPostalId,
        nombreColonia: parsed.data.nombreColonia,
        tipoAsentamiento: parsed.data.tipoAsentamiento,
        esValido: parsed.data.esValido ?? false,
        userId
      });
      return reply.code(201).send(ok(colonia));
    } catch (error: any) {
      return handleColoniasError(error, reply);
    }
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
      const updateColoniaCommand = req.diScope.resolve<UpdateColoniaCommand>('updateColoniaCommand');
      const colonia = await updateColoniaCommand.execute({
        coloniaId: paramValidation.data.coloniaId,
        nombreColonia: parsed.data.nombreColonia,
        tipoAsentamiento: parsed.data.tipoAsentamiento,
        esValido: parsed.data.esValido,
        userId
      });
      return reply.send(ok(colonia));
    } catch (error: any) {
      return handleColoniasError(error, reply);
    }
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
    const { coloniaId } = req.params as { coloniaId: string };

    // Validate parameter
    const paramValidation = ColoniaIdParamSchema.safeParse({ coloniaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const deleteColoniaCommand = req.diScope.resolve<DeleteColoniaCommand>('deleteColoniaCommand');
      const deletedId = await deleteColoniaCommand.execute({ coloniaId: paramValidation.data.coloniaId });
      return reply.send(ok({ coloniaId: deletedId }));
    } catch (error: any) {
      return handleColoniasError(error, reply);
    }
  });
}