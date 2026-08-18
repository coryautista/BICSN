import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { ok, fail } from '../../utils/http.js';
import { GetAllMovimientosQuery } from './application/queries/GetAllMovimientosQuery.js';
import { GetMovimientoByIdQuery } from './application/queries/GetMovimientoByIdQuery.js';
import { GetMovimientosByAfiliadoIdQuery } from './application/queries/GetMovimientosByAfiliadoIdQuery.js';
import { GetMovimientosByTipoMovimientoIdQuery } from './application/queries/GetMovimientosByTipoMovimientoIdQuery.js';
import { handleMovimientoError } from './infrastructure/errorHandler.js';

// Routes for Movimiento CRUD operations
export default async function movimientoRoutes(app: FastifyInstance) {
  // Resolve dependencies from DI container
  const getAllMovimientosQuery = app.diContainer.resolve<GetAllMovimientosQuery>('getAllMovimientosQuery');
  const getMovimientoByIdQuery = app.diContainer.resolve<GetMovimientoByIdQuery>('getMovimientoByIdQuery');
  const getMovimientosByAfiliadoIdQuery = app.diContainer.resolve<GetMovimientosByAfiliadoIdQuery>('getMovimientosByAfiliadoIdQuery');
  const getMovimientosByTipoMovimientoIdQuery = app.diContainer.resolve<GetMovimientosByTipoMovimientoIdQuery>('getMovimientosByTipoMovimientoIdQuery');

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
                  fechaMovimiento: { type: 'string', nullable: true },
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
      const userId = req.user?.sub;
      const records = await getAllMovimientosQuery.execute(userId);
      return reply.send(ok(records));
    } catch (error: any) {
      return handleMovimientoError(error, reply);
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
                fechaMovimiento: { type: 'string', nullable: true },
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
      const userId = req.user?.sub;
      const record = await getMovimientoByIdQuery.execute(id, userId);
      return reply.send(ok(record));
    } catch (error: any) {
      return handleMovimientoError(error, reply);
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
                  fechaMovimiento: { type: 'string', nullable: true },
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
      const userId = req.user?.sub;
      const records = await getMovimientosByAfiliadoIdQuery.execute(afiliadoId, userId);
      return reply.send(ok(records));
    } catch (error: any) {
      return handleMovimientoError(error, reply);
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
                  fechaMovimiento: { type: 'string', nullable: true },
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
      const userId = req.user?.sub;
      const records = await getMovimientosByTipoMovimientoIdQuery.execute(tipoMovimientoId, userId);
      return reply.send(ok(records));
    } catch (error: any) {
      return handleMovimientoError(error, reply);
    }
  });

  // POST /movimiento - Create new record
  app.post('/movimiento', {
    preHandler: [requireAuth],
    schema: {
      description: 'Ruta de escritura deshabilitada; use la ruta especializada del tipo de movimiento',
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
          fechaMovimiento: { type: 'string', format: 'date', nullable: true },
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
  }, async (_req, reply) => {
    return reply.code(400).send(fail(
      'Use la ruta especializada correspondiente al tipo de movimiento',
      'MOVIMIENTO_RUTA_GENERICA_DESHABILITADA'
    ));
  });

  // PUT /movimiento/:id - Update record
  app.put('/movimiento/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Ruta de escritura deshabilitada; los movimientos se modifican mediante su flujo especializado',
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
          fechaMovimiento: { type: 'string', format: 'date', nullable: true },
          observaciones: { type: 'string', maxLength: 1024 },
          entregaRendimiento: { type: 'string', enum: ['Si', 'No'], nullable: true },
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
  }, async (_req, reply) => {
    return reply.code(400).send(fail(
      'Los movimientos solo pueden modificarse mediante su flujo especializado',
      'MOVIMIENTO_RUTA_GENERICA_DESHABILITADA'
    ));
  });

  // DELETE /movimiento/:id - Delete record
  app.delete('/movimiento/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Ruta de escritura deshabilitada; los movimientos se administran mediante su flujo especializado',
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
  }, async (_req, reply) => {
    return reply.code(400).send(fail(
      'Los movimientos no pueden eliminarse mediante la ruta genérica',
      'MOVIMIENTO_RUTA_GENERICA_DESHABILITADA'
    ));
  });
}
