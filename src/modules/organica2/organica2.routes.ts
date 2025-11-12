import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreateOrganica2Schema, UpdateOrganica2Schema, DynamicQuerySchema } from './organica2.schemas.js';
import { getOrganica2ByUserToken, queryOrganica2Dynamic } from './organica2.service.js';
import { ok, fail, validationError, badRequest, internalError } from '../../utils/http.js';
import { GetAllOrganica2Query } from './application/queries/GetAllOrganica2Query.js';
import { GetOrganica2ByIdQuery } from './application/queries/GetOrganica2ByIdQuery.js';
import { CreateOrganica2Command } from './application/commands/CreateOrganica2Command.js';
import { UpdateOrganica2Command } from './application/commands/UpdateOrganica2Command.js';
import { DeleteOrganica2Command } from './application/commands/DeleteOrganica2Command.js';
import { handleOrganica2Error } from './infrastructure/errorHandler.js';

// [FIREBIRD] Routes for ORGANICA_2 CRUD operations
export default async function organica2Routes(app: FastifyInstance) {

  // GET /organica2/my - Get organica2 records for authenticated user
  app.get('/organica2/my', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Get ORGANICA_2 records linked to authenticated user',
      tags: ['organica2', 'firebird'],
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
                  claveOrganica0: { type: 'string' },
                  claveOrganica1: { type: 'string' },
                  claveOrganica2: { type: 'string' },
                  descripcion: { type: 'string' },
                  titular: { type: 'number' },
                  fechaRegistro2: { type: 'string', format: 'date-time' },
                  fechaFin2: { type: 'string', format: 'date-time' },
                  usuario: { type: 'string' },
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
      const user = (req as any).user;
      const claveOrganica0 = user?.idOrganica0?.toString().padStart(2, '0');
      const claveOrganica1 = user?.idOrganica1?.toString().padStart(2, '0');
      
      const records = await getOrganica2ByUserToken(claveOrganica0, claveOrganica1);
      return reply.send(ok(records));
    } catch (error: any) {
      console.error('Error getting user organica2:', error);
      return reply.code(500).send(fail('ORGANICA2_USER_FAILED'));
    }
  });

  // GET /organica2 - List all records
  app.get('/organica2', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] List all ORGANICA_2 records',
      tags: ['organica2', 'firebird'],
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
                  claveOrganica0: { type: 'string' },
                  claveOrganica1: { type: 'string' },
                  claveOrganica2: { type: 'string' },
                  descripcion: { type: 'string' },
                  titular: { type: 'number' },
                  fechaRegistro2: { type: 'string', format: 'date-time' },
                  fechaFin2: { type: 'string', format: 'date-time' },
                  usuario: { type: 'string' },
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
      const user = (req as any).user;
      const getAllOrganica2Query = req.diScope.resolve<GetAllOrganica2Query>('getAllOrganica2Query');
      const records = await getAllOrganica2Query.execute(user?.id?.toString());
      return reply.send(ok(records));
    } catch (error: any) {
      return handleOrganica2Error(error, reply);
    }
  });

  // GET /organica2/:claveOrganica0/:claveOrganica1/:claveOrganica2 - Get single record
  app.get('/organica2/:claveOrganica0/:claveOrganica1/:claveOrganica2', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Get ORGANICA_2 record by composite key',
      tags: ['organica2', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1', 'claveOrganica2'],
        properties: {
          claveOrganica0: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica1: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica2: { type: 'string', minLength: 1, maxLength: 2 }
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
                claveOrganica0: { type: 'string' },
                claveOrganica1: { type: 'string' },
                claveOrganica2: { type: 'string' },
                descripcion: { type: 'string' },
                titular: { type: 'number' },
                fechaRegistro2: { type: 'string', format: 'date-time' },
                fechaFin2: { type: 'string', format: 'date-time' },
                usuario: { type: 'string' },
                estatus: { type: 'string' }
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
    try {
      const { claveOrganica0, claveOrganica1, claveOrganica2 } = req.params as { claveOrganica0: string; claveOrganica1: string; claveOrganica2: string };
      const user = (req as any).user;

      const getOrganica2ByIdQuery = req.diScope.resolve<GetOrganica2ByIdQuery>('getOrganica2ByIdQuery');
      const record = await getOrganica2ByIdQuery.execute(claveOrganica0, claveOrganica1, claveOrganica2, user?.id?.toString());
      return reply.send(ok(record));
    } catch (error: any) {
      return handleOrganica2Error(error, reply);
    }
  });

  // POST /organica2 - Create new record
  app.post('/organica2', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Create new ORGANICA_2 record',
      tags: ['organica2', 'firebird'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1', 'claveOrganica2'],
        properties: {
          claveOrganica0: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica1: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica2: { type: 'string', minLength: 1, maxLength: 2 },
          descripcion: { type: 'string', maxLength: 40 },
          titular: { type: 'number' },
          fechaFin2: { type: 'string', format: 'date-time' },
          usuario: { type: 'string', maxLength: 13 },
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
    const parsed = CreateOrganica2Schema.safeParse(req.body);
    if (!parsed.success) {
      console.error('Validation error:', parsed.error.issues);
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const user = (req as any).user;
      const createOrganica2Command = req.diScope.resolve<CreateOrganica2Command>('createOrganica2Command');
      const record = await createOrganica2Command.execute(parsed.data, user?.id?.toString());
      return reply.code(201).send(ok(record));
    } catch (error: any) {
      return handleOrganica2Error(error, reply);
    }
  });

  // PUT /organica2/:claveOrganica0/:claveOrganica1/:claveOrganica2 - Update record
  app.put('/organica2/:claveOrganica0/:claveOrganica1/:claveOrganica2', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Update ORGANICA_2 record',
      tags: ['organica2', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1', 'claveOrganica2'],
        properties: {
          claveOrganica0: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica1: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica2: { type: 'string', minLength: 1, maxLength: 2 }
        }
      },
      body: {
        type: 'object',
        properties: {
          descripcion: { type: 'string', maxLength: 40 },
          titular: { type: 'number' },
          fechaFin2: { type: 'string', format: 'date-time' },
          usuario: { type: 'string', maxLength: 13 },
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
    const { claveOrganica0, claveOrganica1, claveOrganica2 } = req.params as { claveOrganica0: string; claveOrganica1: string; claveOrganica2: string };
    const parsed = UpdateOrganica2Schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const user = (req as any).user;
      const updateOrganica2Command = req.diScope.resolve<UpdateOrganica2Command>('updateOrganica2Command');
      const record = await updateOrganica2Command.execute(claveOrganica0, claveOrganica1, claveOrganica2, parsed.data, user?.id?.toString());
      return reply.send(ok(record));
    } catch (error: any) {
      return handleOrganica2Error(error, reply);
    }
  });

  // DELETE /organica2/:claveOrganica0/:claveOrganica1/:claveOrganica2 - Delete record
  app.delete('/organica2/:claveOrganica0/:claveOrganica1/:claveOrganica2', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Delete ORGANICA_2 record',
      tags: ['organica2', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1', 'claveOrganica2'],
        properties: {
          claveOrganica0: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica1: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica2: { type: 'string', minLength: 1, maxLength: 2 }
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
    try {
      const { claveOrganica0, claveOrganica1, claveOrganica2 } = req.params as { claveOrganica0: string; claveOrganica1: string; claveOrganica2: string };
      const user = (req as any).user;
      const deleteOrganica2Command = req.diScope.resolve<DeleteOrganica2Command>('deleteOrganica2Command');
      const result = await deleteOrganica2Command.execute(claveOrganica0, claveOrganica1, claveOrganica2, user?.id?.toString());
      return reply.send(ok(result));
    } catch (error: any) {
      return handleOrganica2Error(error, reply);
    }
  });

  // POST /organica2/query - Dynamic query endpoint
  app.post('/organica2/query', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Dynamic query for ORGANICA_2 records with filters, sorting, and pagination',
      tags: ['organica2', 'firebird', 'query'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          filters: {
            type: 'object',
            additionalProperties: true
          },
          sortBy: { type: 'string' },
          sortOrder: { type: 'string', enum: ['ASC', 'DESC'] },
          limit: { type: 'number', minimum: 1, maximum: 1000 },
          offset: { type: 'number', minimum: 0 }
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
                  claveOrganica0: { type: 'string' },
                  claveOrganica1: { type: 'string' },
                  claveOrganica2: { type: 'string' },
                  descripcion: { type: 'string' },
                  titular: { type: 'number' },
                  fechaRegistro2: { type: 'string', format: 'date-time' },
                  fechaFin2: { type: 'string', format: 'date-time' },
                  usuario: { type: 'string' },
                  estatus: { type: 'string' }
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
    const parsed = DynamicQuerySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const records = await queryOrganica2Dynamic(parsed.data);
      return reply.send(ok(records));
    } catch (error: any) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        return reply.code(400).send(badRequest('Invalid field name in query'));
      }
      if (error.code === 'ER_PARSE_ERROR') {
        return reply.code(400).send(badRequest('Invalid query syntax'));
      }
      console.error('Error querying organica2:', error);
      return reply.code(500).send(internalError('Failed to query ORGANICA2 records'));
    }
  });
}