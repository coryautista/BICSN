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

  // GET /organica0 - List all records with optional pagination
   app.get('/organica0', {
     preHandler: [requireAuth],
     schema: {
       description: '[FIREBIRD] Listar todos los registros de ORGANICA_0 con paginación opcional',
       tags: ['organica0', 'firebird'],
       security: [{ bearerAuth: [] }],
       querystring: {
         type: 'object',
         properties: {
           limit: { type: 'integer', minimum: 1, maximum: 1000, description: 'Número máximo de registros a retornar' },
           offset: { type: 'integer', minimum: 0, description: 'Número de registros a saltar' }
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
                   claveOrganica: { type: 'string' },
                   nombreOrganica: { type: 'string' },
                   usuario: { type: ['string', 'null'] },
                   fechaRegistro: { type: 'string', format: 'date-time' },
                   fechaFin: { type: 'string', format: 'date-time' },
                   estatus: { type: 'string' }
                 }
               }
             },
             pagination: {
               type: 'object',
               properties: {
                 limit: { type: 'integer' },
                 offset: { type: 'integer' },
                 total: { type: 'integer' },
                 hasMore: { type: 'boolean' }
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
       const startTime = Date.now();
       const userInfo = {
         id: req.user?.sub,
         roles: req.user?.roles,
         isAdmin: req.user?.roles?.includes('admin')
       };
       
       console.log('[ROUTE] organica0 GET: User info:', userInfo);
       console.log('[ROUTE] organica0 GET: Query params:', req.query);
       
       // Parse query parameters with type safety
       const query = req.query as any;
       const limit = query?.limit ? parseInt(query.limit as string) : undefined;
       const offset = query?.offset ? parseInt(query.offset as string) : undefined;
       
       console.log('[ROUTE] organica0 GET: Parsed pagination - limit:', limit, 'offset:', offset);
       
       // If user is admin and no pagination specified, suggest using pagination
       if (userInfo.isAdmin && !limit && !offset) {
         console.warn('[ROUTE] organica0 GET: Admin user without pagination - this may cause timeouts');
       }
       
       // Use service directly for now to avoid query signature issues
       const { getAllOrganica0 } = await import('./organica0.service.js');
       const records = await getAllOrganica0(limit, offset);
       
       const endTime = Date.now();
       console.log(`[ROUTE] organica0 GET: Completed in ${endTime - startTime}ms, returned ${records.length} records`);
       
       // Add pagination metadata if limits were provided
       let responseData: any = records;
       let pagination: any = undefined;
       
       if (limit !== undefined || offset !== undefined) {
         // For now, just return the records with pagination metadata
         // In a real implementation, you might want to get total count separately
         pagination = {
           limit: limit || 0,
           offset: offset || 0,
           total: records.length, // This should be the actual total count
           hasMore: records.length === (limit || 0)
         };
       }
       
       if (pagination) {
         return reply.send({
           ok: true,
           data: records,
           pagination
         });
       }
       
       return reply.send(ok(records));
     } catch (error) {
       console.error('[ROUTE] organica0 GET: Error:', error);
       return handleOrganica0Error(error, reply);
     }
   });

  // GET /organica0/:claveOrganica - Get single record
  app.get('/organica0/:claveOrganica', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Obtener registro de ORGANICA_0 por claveOrganica',
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
      description: '[FIREBIRD] Crear nuevo registro de ORGANICA_0',
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
      description: '[FIREBIRD] Actualizar registro de ORGANICA_0',
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
      description: '[FIREBIRD] Eliminar registro de ORGANICA_0',
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