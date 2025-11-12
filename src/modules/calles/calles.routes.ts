import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateCalleSchema, UpdateCalleSchema, CalleIdParamSchema, ColoniaIdParamSchema, CalleQuerySchema } from './calles.schemas.js';
import { ok, validationError, notFound, internalError } from '../../utils/http.js';
import type { GetCalleByIdQuery } from './application/queries/GetCalleByIdQuery.js';
import type { GetCallesByColoniaQuery } from './application/queries/GetCallesByColoniaQuery.js';
import type { SearchCallesQuery } from './application/queries/SearchCallesQuery.js';
import type { CreateCalleCommand } from './application/commands/CreateCalleCommand.js';
import type { UpdateCalleCommand } from './application/commands/UpdateCalleCommand.js';
import type { DeleteCalleCommand } from './application/commands/DeleteCalleCommand.js';
import { handleCalleError } from './infrastructure/errorHandler.js';

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
      const searchCallesQuery = req.diScope.resolve<SearchCallesQuery>('searchCallesQuery');
      const calles = await searchCallesQuery.execute(queryValidation.data);
      return reply.send(ok(calles));
    } catch (error) {
      return handleCalleError(error, reply);
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
      const getCallesByColoniaQuery = req.diScope.resolve<GetCallesByColoniaQuery>('getCallesByColoniaQuery');
      const calles = await getCallesByColoniaQuery.execute(paramValidation.data.coloniaId);
      return reply.send(ok(calles));
    } catch (error) {
      return handleCalleError(error, reply);
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
      const getCalleByIdQuery = req.diScope.resolve<GetCalleByIdQuery>('getCalleByIdQuery');
      const calle = await getCalleByIdQuery.execute(paramValidation.data.calleId);
      return reply.send(ok(calle));
    } catch (error) {
      return handleCalleError(error, reply);
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
    const parsed = CreateCalleSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const userId = req.user?.sub;
      const createCalleCommand = req.diScope.resolve<CreateCalleCommand>('createCalleCommand');
      const calle = await createCalleCommand.execute({
        coloniaId: parsed.data.coloniaId,
        nombreCalle: parsed.data.nombreCalle,
        esValido: parsed.data.esValido ?? false,
        userId
      });
      return reply.code(201).send(ok(calle));
    } catch (error) {
      return handleCalleError(error, reply);
    }
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
      const updateCalleCommand = req.diScope.resolve<UpdateCalleCommand>('updateCalleCommand');
      const calle = await updateCalleCommand.execute({
        calleId: paramValidation.data.calleId,
        nombreCalle: parsed.data.nombreCalle,
        esValido: parsed.data.esValido,
        userId
      });
      return reply.send(ok(calle));
    } catch (error) {
      return handleCalleError(error, reply);
    }
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
    const { calleId } = req.params as { calleId: string };

    // Validate parameter
    const paramValidation = CalleIdParamSchema.safeParse({ calleId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const deleteCalleCommand = req.diScope.resolve<DeleteCalleCommand>('deleteCalleCommand');
      const deletedId = await deleteCalleCommand.execute({ calleId: paramValidation.data.calleId });
      return reply.send(ok({ calleId: deletedId }));
    } catch (error) {
      return handleCalleError(error, reply);
    }
  });
}