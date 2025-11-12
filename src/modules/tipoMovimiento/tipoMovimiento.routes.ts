import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreateTipoMovimientoSchema, UpdateTipoMovimientoSchema } from './tipoMovimiento.schemas.js';
import { GetAllTipoMovimientosQuery } from './application/queries/GetAllTipoMovimientosQuery.js';
import { GetTipoMovimientoByIdQuery } from './application/queries/GetTipoMovimientoByIdQuery.js';
import { CreateTipoMovimientoCommand } from './application/commands/CreateTipoMovimientoCommand.js';
import { UpdateTipoMovimientoCommand } from './application/commands/UpdateTipoMovimientoCommand.js';
import { DeleteTipoMovimientoCommand } from './application/commands/DeleteTipoMovimientoCommand.js';
import { handleTipoMovimientoError } from './infrastructure/errorHandler.js';

// Routes for TipoMovimiento CRUD operations
export default async function tipoMovimientoRoutes(app: FastifyInstance) {

  // GET /tipoMovimiento - List all records
  app.get('/tipoMovimiento', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all TipoMovimiento records',
      tags: ['tipoMovimiento'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  abreviatura: { type: 'string', nullable: true },
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
  }, async (req, reply) => {
    try {
      const getAllTipoMovimientosQuery = req.diScope.resolve<GetAllTipoMovimientosQuery>('getAllTipoMovimientosQuery');
      const records = await getAllTipoMovimientosQuery.execute(req.user?.sub || 'anonymous');
      return reply.send({ data: records });
    } catch (error: any) {
      return handleTipoMovimientoError(error, reply);
    }
  });

  // GET /tipoMovimiento/:id - Get single record
  app.get('/tipoMovimiento/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get TipoMovimiento record by id',
      tags: ['tipoMovimiento'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                abreviatura: { type: 'string', nullable: true },
                nombre: { type: 'string' }
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
    try {
      const { id } = req.params as { id: number };
      const getTipoMovimientoByIdQuery = req.diScope.resolve<GetTipoMovimientoByIdQuery>('getTipoMovimientoByIdQuery');
      const record = await getTipoMovimientoByIdQuery.execute({ id }, req.user?.sub || 'anonymous');
      return reply.send({ data: record });
    } catch (error: any) {
      return handleTipoMovimientoError(error, reply);
    }
  });

  // POST /tipoMovimiento - Create new record
  app.post('/tipoMovimiento', {
    preHandler: [requireAuth],
    schema: {
      description: 'Create new TipoMovimiento record',
      tags: ['tipoMovimiento'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['id', 'nombre'],
        properties: {
          id: { type: 'number' },
          abreviatura: { type: 'string', maxLength: 1 },
          nombre: { type: 'string', minLength: 1, maxLength: 64 }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: { type: 'object' }
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
    const parsed = CreateTipoMovimientoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Datos de entrada inválidos', details: parsed.error.issues } });
    }

    try {
      const createTipoMovimientoCommand = req.diScope.resolve<CreateTipoMovimientoCommand>('createTipoMovimientoCommand');
      const record = await createTipoMovimientoCommand.execute({
        id: parsed.data.id,
        abreviatura: parsed.data.abreviatura ?? undefined,
        nombre: parsed.data.nombre
      }, req.user?.sub || 'anonymous');
      return reply.code(201).send({ data: record });
    } catch (error: any) {
      return handleTipoMovimientoError(error, reply);
    }
  });

  // PUT /tipoMovimiento/:id - Update record
  app.put('/tipoMovimiento/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Update TipoMovimiento record',
      tags: ['tipoMovimiento'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        properties: {
          abreviatura: { type: 'string', maxLength: 1 },
          nombre: { type: 'string', minLength: 1, maxLength: 64 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: { type: 'object' }
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
    const { id } = req.params as { id: number };
    const parsed = UpdateTipoMovimientoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Datos de entrada inválidos', details: parsed.error.issues } });
    }

    try {
      const updateTipoMovimientoCommand = req.diScope.resolve<UpdateTipoMovimientoCommand>('updateTipoMovimientoCommand');
      const record = await updateTipoMovimientoCommand.execute({
        id,
        abreviatura: parsed.data.abreviatura ?? undefined,
        nombre: parsed.data.nombre
      }, req.user?.sub || 'anonymous');
      return reply.send({ data: record });
    } catch (error: any) {
      return handleTipoMovimientoError(error, reply);
    }
  });

  // DELETE /tipoMovimiento/:id - Delete record
  app.delete('/tipoMovimiento/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Delete TipoMovimiento record',
      tags: ['tipoMovimiento'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: { type: 'object' }
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
    try {
      const { id } = req.params as { id: number };
      const deleteTipoMovimientoCommand = req.diScope.resolve<DeleteTipoMovimientoCommand>('deleteTipoMovimientoCommand');
      const result = await deleteTipoMovimientoCommand.execute({ id }, req.user?.sub || 'anonymous');
      return reply.send({ data: result });
    } catch (error: any) {
      return handleTipoMovimientoError(error, reply);
    }
  });
}