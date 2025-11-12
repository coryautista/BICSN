import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreateOrganica0Schema, UpdateOrganica0Schema } from './organica0.schemas.js';
import { ok, fail } from '../../utils/http.js';
import { handleOrganica0Error } from './infrastructure/errorHandler.js';
import type { GetAllOrganica0Query } from './application/queries/GetAllOrganica0Query.js';
import type { GetOrganica0ByIdQuery } from './application/queries/GetOrganica0ByIdQuery.js';
import type { CreateOrganica0Command } from './application/commands/CreateOrganica0Command.js';
import type { UpdateOrganica0Command } from './application/commands/UpdateOrganica0Command.js';
import type { DeleteOrganica0Command } from './application/commands/DeleteOrganica0Command.js';

// [FIREBIRD] Routes for ORGANICA_0 CRUD operations
export default async function organica0Routes(app: FastifyInstance) {

  // GET /organica0 - List all records
   app.get('/organica0', {
     preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] List all ORGANICA_0 records',
      tags: ['organica0', 'firebird'],
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
                  claveOrganica: { type: 'string' },
                  nombreOrganica: { type: 'string' },
                  usuario: { type: ['string', 'null'] },
                  fechaRegistro: { type: 'string', format: 'date-time' },
                  fechaFin: { type: 'string', format: 'date-time' },
                  estatus: { type: 'string' }
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
      console.log('User making request:', req.user?.sub, 'Roles:', req.user?.roles);
      const getAllOrganica0Query: GetAllOrganica0Query = req.diScope.resolve('getAllOrganica0Query');
      const records = await getAllOrganica0Query.execute(req.user?.sub);
      return reply.send(ok(records));
    } catch (error) {
      return handleOrganica0Error(error, reply);
    }
  });

  // GET /organica0/:claveOrganica - Get single record
  app.get('/organica0/:claveOrganica', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Get ORGANICA_0 record by claveOrganica',
      tags: ['organica0', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['claveOrganica'],
        properties: {
          claveOrganica: { type: 'string', minLength: 1, maxLength: 2 }
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
                claveOrganica: { type: 'string' },
                nombreOrganica: { type: 'string' },
                usuario: { type: ['string', 'null'] },
                fechaRegistro: { type: 'string', format: 'date-time' },
                fechaFin: { type: 'string', format: 'date-time' },
                estatus: { type: 'string' }
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
      const { claveOrganica } = req.params as { claveOrganica: string };
      const getOrganica0ByIdQuery: GetOrganica0ByIdQuery = req.diScope.resolve('getOrganica0ByIdQuery');
      const record = await getOrganica0ByIdQuery.execute(claveOrganica, req.user?.sub);
      return reply.send(ok(record));
    } catch (error) {
      return handleOrganica0Error(error, reply);
    }
  });

  // POST /organica0 - Create new record
  app.post('/organica0', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Create new ORGANICA_0 record',
      tags: ['organica0', 'firebird'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['claveOrganica', 'nombreOrganica'],
        properties: {
          claveOrganica: { type: 'string', minLength: 1, maxLength: 2 },
          nombreOrganica: { type: 'string', minLength: 1, maxLength: 72 },
          usuario: { type: 'string', maxLength: 13 },
          fechaFin: { type: ['string', 'null'], format: 'date-time' },
          estatus: { type: 'string', minLength: 1, maxLength: 1 }
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
    const parsed = CreateOrganica0Schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const createOrganica0Command: CreateOrganica0Command = req.diScope.resolve('createOrganica0Command');
      const record = await createOrganica0Command.execute(parsed.data, req.user?.sub);
      return reply.code(201).send(ok(record));
    } catch (error) {
      return handleOrganica0Error(error, reply);
    }
  });

  // PUT /organica0/:claveOrganica - Update record
  app.put('/organica0/:claveOrganica', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Update ORGANICA_0 record',
      tags: ['organica0', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['claveOrganica'],
        properties: {
          claveOrganica: { type: 'string', minLength: 1, maxLength: 2 }
        }
      },
      body: {
        type: 'object',
        properties: {
          nombreOrganica: { type: 'string', minLength: 1, maxLength: 72 },
          usuario: { type: 'string', maxLength: 13 },
          fechaFin: { type: ['string', 'null'], format: 'date-time' },
          estatus: { type: 'string', minLength: 1, maxLength: 1 }
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
    const { claveOrganica } = req.params as { claveOrganica: string };
    const parsed = UpdateOrganica0Schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const updateOrganica0Command: UpdateOrganica0Command = req.diScope.resolve('updateOrganica0Command');
      const record = await updateOrganica0Command.execute(claveOrganica, parsed.data, req.user?.sub);
      return reply.send(ok(record));
    } catch (error) {
      return handleOrganica0Error(error, reply);
    }
  });

  // DELETE /organica0/:claveOrganica - Delete record
  app.delete('/organica0/:claveOrganica', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Delete ORGANICA_0 record',
      tags: ['organica0', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['claveOrganica'],
        properties: {
          claveOrganica: { type: 'string', minLength: 1, maxLength: 2 }
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
      const { claveOrganica } = req.params as { claveOrganica: string };
      const deleteOrganica0Command: DeleteOrganica0Command = req.diScope.resolve('deleteOrganica0Command');
      const result = await deleteOrganica0Command.execute(claveOrganica, req.user?.sub);
      return reply.send(ok(result));
    } catch (error) {
      return handleOrganica0Error(error, reply);
    }
  });
}