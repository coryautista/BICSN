import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreateMovimientoSchema, UpdateMovimientoSchema } from './movimiento.schemas.js';
import {
  getAllMovimientosService,
  getMovimientoByIdService,
  getMovimientosByAfiliadoIdService,
  getMovimientosByTipoMovimientoIdService,
  createMovimientoService,
  updateMovimientoService,
  deleteMovimientoService
} from './movimiento.service.js';
import { ok, fail } from '../../utils/http.js';

// Routes for Movimiento CRUD operations
export default async function movimientoRoutes(app: FastifyInstance) {

  // GET /movimiento - List all records
  app.get('/movimiento', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all Movimiento records',
      tags: ['movimiento'],
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
                  quincenaId: { type: 'string', nullable: true },
                  tipoMovimientoId: { type: 'number' },
                  afiliadoId: { type: 'number' },
                  fecha: { type: 'string', nullable: true },
                  observaciones: { type: 'string', nullable: true },
                  folio: { type: 'string', nullable: true },
                  estatus: { type: 'string', nullable: true },
                  creadoPor: { type: 'number', nullable: true },
                  createdAt: { type: 'string' }
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
      const records = await getAllMovimientosService();
      return reply.send(ok(records));
    } catch (error: any) {
      console.error('Error listing movimiento:', error);
      return reply.code(500).send(fail('MOVIMIENTO_LIST_FAILED'));
    }
  });

  // GET /movimiento/:id - Get single record
  app.get('/movimiento/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get Movimiento record by id',
      tags: ['movimiento'],
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
                quincenaId: { type: 'string', nullable: true },
                tipoMovimientoId: { type: 'number' },
                afiliadoId: { type: 'number' },
                fecha: { type: 'string', nullable: true },
                observaciones: { type: 'string', nullable: true },
                folio: { type: 'string', nullable: true },
                estatus: { type: 'string', nullable: true },
                creadoPor: { type: 'number', nullable: true },
                createdAt: { type: 'string' }
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
      const record = await getMovimientoByIdService(id);
      return reply.send(ok(record));
    } catch (error: any) {
      if (error.message === 'MOVIMIENTO_NOT_FOUND') {
        return reply.code(404).send(fail('MOVIMIENTO_NOT_FOUND'));
      }
      console.error('Error getting movimiento:', error);
      return reply.code(500).send(fail('MOVIMIENTO_GET_FAILED'));
    }
  });

  // GET /movimiento/afiliado/:afiliadoId - Get records by afiliadoId
  app.get('/movimiento/afiliado/:afiliadoId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get Movimiento records by afiliadoId',
      tags: ['movimiento'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['afiliadoId'],
        properties: {
          afiliadoId: { type: 'number' }
        }
      },
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
                  quincenaId: { type: 'string', nullable: true },
                  tipoMovimientoId: { type: 'number' },
                  afiliadoId: { type: 'number' },
                  fecha: { type: 'string', nullable: true },
                  observaciones: { type: 'string', nullable: true },
                  folio: { type: 'string', nullable: true },
                  estatus: { type: 'string', nullable: true },
                  creadoPor: { type: 'number', nullable: true },
                  createdAt: { type: 'string' }
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
      const { afiliadoId } = req.params as { afiliadoId: number };
      const records = await getMovimientosByAfiliadoIdService(afiliadoId);
      return reply.send(ok(records));
    } catch (error: any) {
      console.error('Error getting movimiento by afiliadoId:', error);
      return reply.code(500).send(fail('MOVIMIENTO_GET_BY_AFILIADO_FAILED'));
    }
  });

  // GET /movimiento/tipo/:tipoMovimientoId - Get records by tipoMovimientoId
  app.get('/movimiento/tipo/:tipoMovimientoId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get Movimiento records by tipoMovimientoId',
      tags: ['movimiento'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['tipoMovimientoId'],
        properties: {
          tipoMovimientoId: { type: 'number' }
        }
      },
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
                  quincenaId: { type: 'string', nullable: true },
                  tipoMovimientoId: { type: 'number' },
                  afiliadoId: { type: 'number' },
                  fecha: { type: 'string', nullable: true },
                  observaciones: { type: 'string', nullable: true },
                  folio: { type: 'string', nullable: true },
                  estatus: { type: 'string', nullable: true },
                  creadoPor: { type: 'number', nullable: true },
                  createdAt: { type: 'string' }
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
      const { tipoMovimientoId } = req.params as { tipoMovimientoId: number };
      const records = await getMovimientosByTipoMovimientoIdService(tipoMovimientoId);
      return reply.send(ok(records));
    } catch (error: any) {
      console.error('Error getting movimiento by tipoMovimientoId:', error);
      return reply.code(500).send(fail('MOVIMIENTO_GET_BY_TIPO_FAILED'));
    }
  });

  // POST /movimiento - Create new record
  app.post('/movimiento', {
    preHandler: [requireAuth],
    schema: {
      description: 'Create new Movimiento record',
      tags: ['movimiento'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['tipoMovimientoId', 'afiliadoId'],
        properties: {
          quincenaId: { type: 'string', maxLength: 30 },
          tipoMovimientoId: { type: 'number' },
          afiliadoId: { type: 'number' },
          fecha: { type: 'string', format: 'date' },
          observaciones: { type: 'string', maxLength: 1024 },
          folio: { type: 'string', maxLength: 100 },
          estatus: { type: 'string', maxLength: 30 },
          creadoPor: { type: 'number' }
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
    const parsed = CreateMovimientoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const record = await createMovimientoService({
        quincenaId: parsed.data.quincenaId ?? null,
        tipoMovimientoId: parsed.data.tipoMovimientoId,
        afiliadoId: parsed.data.afiliadoId,
        fecha: parsed.data.fecha ?? null,
        observaciones: parsed.data.observaciones ?? null,
        folio: parsed.data.folio ?? null,
        estatus: parsed.data.estatus ?? null,
        creadoPor: parsed.data.creadoPor ?? null
      });
      return reply.code(201).send(ok(record));
    } catch (error: any) {
      console.error('Error creating movimiento:', error);
      return reply.code(500).send(fail('MOVIMIENTO_CREATE_FAILED'));
    }
  });

  // PUT /movimiento/:id - Update record
  app.put('/movimiento/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Update Movimiento record',
      tags: ['movimiento'],
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
          quincenaId: { type: 'string', maxLength: 30 },
          tipoMovimientoId: { type: 'number' },
          afiliadoId: { type: 'number' },
          fecha: { type: 'string', format: 'date' },
          observaciones: { type: 'string', maxLength: 1024 },
          folio: { type: 'string', maxLength: 100 },
          estatus: { type: 'string', maxLength: 30 },
          creadoPor: { type: 'number' }
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
    const parsed = UpdateMovimientoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const record = await updateMovimientoService(id, parsed.data);
      return reply.send(ok(record));
    } catch (error: any) {
      if (error.message === 'MOVIMIENTO_NOT_FOUND') {
        return reply.code(404).send(fail('MOVIMIENTO_NOT_FOUND'));
      }
      console.error('Error updating movimiento:', error);
      return reply.code(500).send(fail('MOVIMIENTO_UPDATE_FAILED'));
    }
  });

  // DELETE /movimiento/:id - Delete record
  app.delete('/movimiento/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Delete Movimiento record',
      tags: ['movimiento'],
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
      await deleteMovimientoService(id);
      return reply.send(ok({}));
    } catch (error: any) {
      if (error.message === 'MOVIMIENTO_NOT_FOUND') {
        return reply.code(404).send(fail('MOVIMIENTO_NOT_FOUND'));
      }
      console.error('Error deleting movimiento:', error);
      return reply.code(500).send(fail('MOVIMIENTO_DELETE_FAILED'));
    }
  });
}