import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreateOrganica3Schema, UpdateOrganica3Schema, DynamicQuerySchema } from './organica3.schemas.js';
import { getOrganica3ByUserToken, queryOrganica3Dynamic } from './organica3.service.js';
import { ok, validationError } from '../../utils/http.js';
import { GetAllOrganica3Query } from './application/queries/GetAllOrganica3Query.js';
import { GetOrganica3ByIdQuery } from './application/queries/GetOrganica3ByIdQuery.js';
import { CreateOrganica3Command } from './application/commands/CreateOrganica3Command.js';
import { UpdateOrganica3Command } from './application/commands/UpdateOrganica3Command.js';
import { DeleteOrganica3Command } from './application/commands/DeleteOrganica3Command.js';
import { handleOrganica3Error } from './infrastructure/errorHandler.js';

// [FIREBIRD] Routes for ORGANICA_3 CRUD operations
export default async function organica3Routes(app: FastifyInstance) {

  // GET /organica3 - List all records
  app.get('/organica3', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] List all ORGANICA_3 records',
      tags: ['organica3', 'firebird'],
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
                  claveOrganica3: { type: 'string' },
                  descripcion: { type: 'string' },
                  titular: { type: 'number' },
                  calleNum: { type: 'string' },
                  fraccionamiento: { type: 'string' },
                  codigoPostal: { type: 'string' },
                  telefono: { type: 'string' },
                  fax: { type: 'string' },
                  localidad: { type: 'string' },
                  municipio: { type: 'number' },
                  estado: { type: 'number' },
                  fechaRegistro3: { type: 'string', format: 'date-time' },
                  fechaFin3: { type: 'string', format: 'date-time' },
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
      const getAllOrganica3Query = req.diScope.resolve<GetAllOrganica3Query>('getAllOrganica3Query');
      const records = await getAllOrganica3Query.execute(user?.id?.toString());
      return reply.send(ok(records));
    } catch (error: any) {
      return handleOrganica3Error(error, reply);
    }
  });

  // GET /organica3/:claveOrganica0/:claveOrganica1/:claveOrganica2/:claveOrganica3 - Get single record
  app.get('/organica3/:claveOrganica0/:claveOrganica1/:claveOrganica2/:claveOrganica3', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Get ORGANICA_3 record by composite key',
      tags: ['organica3', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1', 'claveOrganica2', 'claveOrganica3'],
        properties: {
          claveOrganica0: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica1: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica2: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica3: { type: 'string', minLength: 1, maxLength: 2 }
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
                claveOrganica3: { type: 'string' },
                descripcion: { type: 'string' },
                titular: { type: 'number' },
                calleNum: { type: 'string' },
                fraccionamiento: { type: 'string' },
                codigoPostal: { type: 'string' },
                telefono: { type: 'string' },
                fax: { type: 'string' },
                localidad: { type: 'string' },
                municipio: { type: 'number' },
                estado: { type: 'number' },
                fechaRegistro3: { type: 'string', format: 'date-time' },
                fechaFin3: { type: 'string', format: 'date-time' },
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
      const { claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3 } = req.params as { claveOrganica0: string; claveOrganica1: string; claveOrganica2: string; claveOrganica3: string };
      const user = (req as any).user;
      const getOrganica3ByIdQuery = req.diScope.resolve<GetOrganica3ByIdQuery>('getOrganica3ByIdQuery');
      const record = await getOrganica3ByIdQuery.execute(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3, user?.id?.toString());
      return reply.send(ok(record));
    } catch (error: any) {
      return handleOrganica3Error(error, reply);
    }
  });

  // POST /organica3 - Create new record
  app.post('/organica3', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Create new ORGANICA_3 record',
      tags: ['organica3', 'firebird'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1', 'claveOrganica2', 'claveOrganica3'],
        properties: {
          claveOrganica0: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica1: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica2: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica3: { type: 'string', minLength: 1, maxLength: 2 },
          descripcion: { type: 'string', maxLength: 40 },
          titular: { type: 'number' },
          calleNum: { type: 'string', maxLength: 40 },
          fraccionamiento: { type: 'string', maxLength: 40 },
          codigoPostal: { type: 'string', maxLength: 5 },
          telefono: { type: 'string', maxLength: 15 },
          fax: { type: 'string', maxLength: 15 },
          localidad: { type: 'string', maxLength: 25 },
          municipio: { type: 'number' },
          estado: { type: 'number' },
          fechaFin3: { type: 'string', format: 'date-time' },
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
    const parsed = CreateOrganica3Schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const user = (req as any).user;
      const createOrganica3Command = req.diScope.resolve<CreateOrganica3Command>('createOrganica3Command');
      const record = await createOrganica3Command.execute(parsed.data, user?.id?.toString());
      return reply.code(201).send(ok(record));
    } catch (error: any) {
      return handleOrganica3Error(error, reply);
    }
  });

  // PUT /organica3/:claveOrganica0/:claveOrganica1/:claveOrganica2/:claveOrganica3 - Update record
  app.put('/organica3/:claveOrganica0/:claveOrganica1/:claveOrganica2/:claveOrganica3', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Update ORGANICA_3 record',
      tags: ['organica3', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1', 'claveOrganica2', 'claveOrganica3'],
        properties: {
          claveOrganica0: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica1: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica2: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica3: { type: 'string', minLength: 1, maxLength: 2 }
        }
      },
      body: {
        type: 'object',
        properties: {
          descripcion: { type: 'string', maxLength: 40 },
          titular: { type: 'number' },
          calleNum: { type: 'string', maxLength: 40 },
          fraccionamiento: { type: 'string', maxLength: 40 },
          codigoPostal: { type: 'string', maxLength: 5 },
          telefono: { type: 'string', maxLength: 15 },
          fax: { type: 'string', maxLength: 15 },
          localidad: { type: 'string', maxLength: 25 },
          municipio: { type: 'number' },
          estado: { type: 'number' },
          fechaFin3: { type: 'string', format: 'date-time' },
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
    const { claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3 } = req.params as { claveOrganica0: string; claveOrganica1: string; claveOrganica2: string; claveOrganica3: string };
    const parsed = UpdateOrganica3Schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const updateOrganica3Command = req.diScope.resolve<UpdateOrganica3Command>('updateOrganica3Command');
      const record = await updateOrganica3Command.execute(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3, parsed.data, req.user?.sub?.toString());
      return reply.send(ok(record));
    } catch (error: any) {
      return handleOrganica3Error(error, reply);
    }
  });

  // DELETE /organica3/:claveOrganica0/:claveOrganica1/:claveOrganica2/:claveOrganica3 - Delete record
  app.delete('/organica3/:claveOrganica0/:claveOrganica1/:claveOrganica2/:claveOrganica3', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Delete ORGANICA_3 record',
      tags: ['organica3', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1', 'claveOrganica2', 'claveOrganica3'],
        properties: {
          claveOrganica0: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica1: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica2: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica3: { type: 'string', minLength: 1, maxLength: 2 }
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
      const { claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3 } = req.params as { claveOrganica0: string; claveOrganica1: string; claveOrganica2: string; claveOrganica3: string };
      const deleteOrganica3Command = req.diScope.resolve<DeleteOrganica3Command>('deleteOrganica3Command');
      const result = await deleteOrganica3Command.execute(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3, req.user?.sub?.toString());
      return reply.send(ok(result));
    } catch (error: any) {
      return handleOrganica3Error(error, reply);
    }
  });

  // POST /organica3/query - Dynamic query endpoint
  app.post('/organica3/query', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Dynamic query for ORGANICA_3 records with filters, sorting, and pagination',
      tags: ['organica3', 'firebird', 'query'],
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
                  claveOrganica3: { type: 'string' },
                  descripcion: { type: 'string' },
                  titular: { type: 'number' },
                  calleNum: { type: 'string' },
                  fraccionamiento: { type: 'string' },
                  codigoPostal: { type: 'string' },
                  telefono: { type: 'string' },
                  fax: { type: 'string' },
                  localidad: { type: 'string' },
                  municipio: { type: 'number' },
                  estado: { type: 'number' },
                  fechaRegistro3: { type: 'string', format: 'date-time' },
                  fechaFin3: { type: 'string', format: 'date-time' },
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
      const records = await queryOrganica3Dynamic(parsed.data);
      return reply.send(ok(records));
    } catch (error: any) {
      return handleOrganica3Error(error, reply);
    }
  });

  // GET /organica3/my/:claveOrganica2 - Get organica3 filtered by user token (organica0, organica1) and claveOrganica2 param
  app.get('/organica3/my/:claveOrganica2', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Get ORGANICA_3 records filtered by authenticated user token (organica0, organica1) and claveOrganica2 parameter',
      tags: ['organica3', 'firebird', 'user'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          claveOrganica2: { type: 'string', pattern: '^[0-9]{2}$' }
        },
        required: ['claveOrganica2']
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
                  claveOrganica3: { type: 'string' },
                  descripcion: { type: 'string' },
                  titular: { type: 'number' },
                  calleNum: { type: 'string' },
                  fraccionamiento: { type: 'string' },
                  codigoPostal: { type: 'string' },
                  telefono: { type: 'string' },
                  fax: { type: 'string' },
                  localidad: { type: 'string' },
                  municipio: { type: 'number' },
                  estado: { type: 'number' },
                  fechaRegistro3: { type: 'string', format: 'date-time' },
                  fechaFin3: { type: 'string', format: 'date-time' },
                  usuario: { type: 'string' },
                  estatus: { type: 'string' }
                }
              }
            }
          }
        },
        401: {
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
      const user = (req as any).user;
      const { claveOrganica2 } = req.params as { claveOrganica2: string };

      // Extract organica0 and organica1 from JWT token
      const claveOrganica0 = user?.idOrganica0?.toString().padStart(2, '0');
      const claveOrganica1 = user?.idOrganica1?.toString().padStart(2, '0');

      const records = await getOrganica3ByUserToken(claveOrganica0, claveOrganica1, claveOrganica2);
      return reply.send(ok(records));
    } catch (error: any) {
      return handleOrganica3Error(error, reply);
    }
  });
}