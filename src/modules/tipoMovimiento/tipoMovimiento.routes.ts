import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreateTipoMovimientoSchema, UpdateTipoMovimientoSchema } from './tipoMovimiento.schemas.js';
import {
  getAllTipoMovimientoService,
  getTipoMovimientoByIdService,
  createTipoMovimientoService,
  updateTipoMovimientoService,
  deleteTipoMovimientoService
} from './tipoMovimiento.service.js';
import { ok, fail } from '../../utils/http.js';

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
  }, async (_req, reply) => {
    try {
      const records = await getAllTipoMovimientoService();
      return reply.send(ok(records));
    } catch (error: any) {
      console.error('Error listing tipoMovimiento:', error);
      return reply.code(500).send(fail('TIPO_MOVIMIENTO_LIST_FAILED'));
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
      const record = await getTipoMovimientoByIdService(id);
      return reply.send(ok(record));
    } catch (error: any) {
      if (error.message === 'TIPO_MOVIMIENTO_NOT_FOUND') {
        return reply.code(404).send(fail('TIPO_MOVIMIENTO_NOT_FOUND'));
      }
      console.error('Error getting tipoMovimiento:', error);
      return reply.code(500).send(fail('TIPO_MOVIMIENTO_GET_FAILED'));
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
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const record = await createTipoMovimientoService({
        id: parsed.data.id,
        abreviatura: parsed.data.abreviatura ?? null,
        nombre: parsed.data.nombre
      });
      return reply.code(201).send(ok(record));
    } catch (error: any) {
      if (error.message === 'TIPO_MOVIMIENTO_EXISTS') {
        return reply.code(409).send(fail('TIPO_MOVIMIENTO_EXISTS'));
      }
      console.error('Error creating tipoMovimiento:', error);
      return reply.code(500).send(fail('TIPO_MOVIMIENTO_CREATE_FAILED'));
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
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const record = await updateTipoMovimientoService(id, parsed.data);
      return reply.send(ok(record));
    } catch (error: any) {
      if (error.message === 'TIPO_MOVIMIENTO_NOT_FOUND') {
        return reply.code(404).send(fail('TIPO_MOVIMIENTO_NOT_FOUND'));
      }
      console.error('Error updating tipoMovimiento:', error);
      return reply.code(500).send(fail('TIPO_MOVIMIENTO_UPDATE_FAILED'));
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
      await deleteTipoMovimientoService(id);
      return reply.send(ok({}));
    } catch (error: any) {
      if (error.message === 'TIPO_MOVIMIENTO_NOT_FOUND') {
        return reply.code(404).send(fail('TIPO_MOVIMIENTO_NOT_FOUND'));
      }
      console.error('Error deleting tipoMovimiento:', error);
      return reply.code(500).send(fail('TIPO_MOVIMIENTO_DELETE_FAILED'));
    }
  });
}