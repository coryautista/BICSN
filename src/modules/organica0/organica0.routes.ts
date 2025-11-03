import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreateOrganica0Schema, UpdateOrganica0Schema } from './organica0.schemas.js';
import { getOrganica0ById, getAllOrganica0, createOrganica0Record, updateOrganica0Record, deleteOrganica0Record } from './organica0.service.js';
import { ok, fail } from '../../utils/http.js';

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
  }, async (_req, reply) => {
    try {
      const records = await getAllOrganica0();     
      return reply.send(ok(records));
    } catch (error: any) {
      console.error('Error listing organica0:', error);
      return reply.code(500).send(fail('ORGANICA0_LIST_FAILED'));
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
      const record = await getOrganica0ById(claveOrganica);
      return reply.send(ok(record));
    } catch (error: any) {
      if (error.message === 'ORGANICA0_NOT_FOUND') {
        return reply.code(404).send(fail('ORGANICA0_NOT_FOUND'));
      }
      console.error('Error getting organica0:', error);
      return reply.code(500).send(fail('ORGANICA0_GET_FAILED'));
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
      const record = await createOrganica0Record(parsed.data);
      return reply.code(201).send(ok(record));
    } catch (error: any) {
      if (error.message === 'ORGANICA0_EXISTS') {
        return reply.code(409).send(fail('ORGANICA0_EXISTS'));
      }
      console.error('Error creating organica0:', error);
      return reply.code(500).send(fail('ORGANICA0_CREATE_FAILED'));
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
      const record = await updateOrganica0Record(claveOrganica, parsed.data);
      return reply.send(ok(record));
    } catch (error: any) {
      if (error.message === 'ORGANICA0_NOT_FOUND') {
        return reply.code(404).send(fail('ORGANICA0_NOT_FOUND'));
      }
      console.error('Error updating organica0:', error);
      return reply.code(500).send(fail('ORGANICA0_UPDATE_FAILED'));
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
      const result = await deleteOrganica0Record(claveOrganica);
      return reply.send(ok(result));
    } catch (error: any) {
      if (error.message === 'ORGANICA0_NOT_FOUND') {
        return reply.code(404).send(fail('ORGANICA0_NOT_FOUND'));
      }
      console.error('Error deleting organica0:', error);
      return reply.code(500).send(fail('ORGANICA0_DELETE_FAILED'));
    }
  });
}