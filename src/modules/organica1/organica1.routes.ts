import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreateOrganica1Schema, UpdateOrganica1Schema, DynamicQuerySchema } from './organica1.schemas.js';
import { queryOrganica1Dynamic } from './organica1.service.js';
import { ok, fail } from '../../utils/http.js';
import { handleOrganica1Error } from './infrastructure/errorHandler.js';
import type { GetAllOrganica1Query } from './application/queries/GetAllOrganica1Query.js';
import type { GetOrganica1ByIdQuery } from './application/queries/GetOrganica1ByIdQuery.js';
import type { CreateOrganica1Command } from './application/commands/CreateOrganica1Command.js';
import type { UpdateOrganica1Command } from './application/commands/UpdateOrganica1Command.js';
import type { DeleteOrganica1Command } from './application/commands/DeleteOrganica1Command.js';

// [FIREBIRD] Routes for ORGANICA_1 CRUD operations
export default async function organica1Routes(app: FastifyInstance) {

  // GET /organica1 - List all records
  app.get('/organica1', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] List all ORGANICA_1 records',
      tags: ['organica1', 'firebird'],
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
                  descripcion: { type: 'string' },
                  titular: { type: 'number' },
                  rfc: { type: 'string' },
                  imss: { type: 'string' },
                  infonavit: { type: 'string' },
                  bancoSar: { type: 'string' },
                  cuentaSar: { type: 'string' },
                  tipoEmpresaSar: { type: 'string' },
                  pcp: { type: 'string' },
                  ph: { type: 'string' },
                  fv: { type: 'string' },
                  fg: { type: 'string' },
                  di: { type: 'string' },
                  fechaRegistro1: { type: 'string', format: 'date-time' },
                  fechaFin1: { type: 'string', format: 'date-time' },
                  usuario: { type: 'string' },
                  estatus: { type: 'string' },
                  sar: { type: 'string' }
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
      const getAllOrganica1Query: GetAllOrganica1Query = req.diScope.resolve('getAllOrganica1Query');
      const records = await getAllOrganica1Query.execute(req.user?.sub);
      return reply.send(ok(records));
    } catch (error) {
      return handleOrganica1Error(error, reply);
    }
  });

  // GET /organica1/:claveOrganica0/:claveOrganica1 - Get single record
  app.get('/organica1/:claveOrganica0/:claveOrganica1', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Get ORGANICA_1 record by composite key',
      tags: ['organica1', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1'],
        properties: {
          claveOrganica0: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica1: { type: 'string', minLength: 1, maxLength: 2 }
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
                descripcion: { type: 'string' },
                titular: { type: 'number' },
                rfc: { type: 'string' },
                imss: { type: 'string' },
                infonavit: { type: 'string' },
                bancoSar: { type: 'string' },
                cuentaSar: { type: 'string' },
                tipoEmpresaSar: { type: 'string' },
                pcp: { type: 'string' },
                ph: { type: 'string' },
                fv: { type: 'string' },
                fg: { type: 'string' },
                di: { type: 'string' },
                fechaRegistro1: { type: 'string', format: 'date-time' },
                fechaFin1: { type: 'string', format: 'date-time' },
                usuario: { type: 'string' },
                estatus: { type: 'string' },
                sar: { type: 'string' }
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
      const { claveOrganica0, claveOrganica1 } = req.params as { claveOrganica0: string; claveOrganica1: string };
      const getOrganica1ByIdQuery: GetOrganica1ByIdQuery = req.diScope.resolve('getOrganica1ByIdQuery');
      const record = await getOrganica1ByIdQuery.execute(claveOrganica0, claveOrganica1, req.user?.sub);
      return reply.send(ok(record));
    } catch (error) {
      return handleOrganica1Error(error, reply);
    }
  });

  // POST /organica1 - Create new record
  app.post('/organica1', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Create new ORGANICA_1 record',
      tags: ['organica1', 'firebird'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1'],
        properties: {
          claveOrganica0: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica1: { type: 'string', minLength: 1, maxLength: 2 },
          descripcion: { type: 'string', maxLength: 40 },
          titular: { type: 'number' },
          rfc: { type: 'string', maxLength: 13 },
          imss: { type: 'string', maxLength: 11 },
          infonavit: { type: 'string', maxLength: 10 },
          bancoSar: { type: 'string', maxLength: 4 },
          cuentaSar: { type: 'string', maxLength: 13 },
          tipoEmpresaSar: { type: 'string', maxLength: 8 },
          pcp: { type: 'string', maxLength: 8 },
          ph: { type: 'string', maxLength: 8 },
          fv: { type: 'string', maxLength: 8 },
          fg: { type: 'string', maxLength: 8 },
          di: { type: 'string', maxLength: 8 },
          fechaFin1: { type: 'string', format: 'date-time' },
          usuario: { type: 'string', maxLength: 13 },
          estatus: { type: 'string', minLength: 1, maxLength: 1 },
          sar: { type: 'string', maxLength: 12 }
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
    const parsed = CreateOrganica1Schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail('Datos de entrada inválidos'));
    }

    try {
      const createOrganica1Command: CreateOrganica1Command = req.diScope.resolve('createOrganica1Command');
      const record = await createOrganica1Command.execute(parsed.data, req.user?.sub);
      return reply.code(201).send(ok(record));
    } catch (error) {
      return handleOrganica1Error(error, reply);
    }
  });

  // PUT /organica1/:claveOrganica0/:claveOrganica1 - Update record
  app.put('/organica1/:claveOrganica0/:claveOrganica1', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Update ORGANICA_1 record',
      tags: ['organica1', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1'],
        properties: {
          claveOrganica0: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica1: { type: 'string', minLength: 1, maxLength: 2 }
        }
      },
      body: {
        type: 'object',
        properties: {
          descripcion: { type: 'string', maxLength: 40 },
          titular: { type: 'number' },
          rfc: { type: 'string', maxLength: 13 },
          imss: { type: 'string', maxLength: 11 },
          infonavit: { type: 'string', maxLength: 10 },
          bancoSar: { type: 'string', maxLength: 4 },
          cuentaSar: { type: 'string', maxLength: 13 },
          tipoEmpresaSar: { type: 'string', maxLength: 8 },
          pcp: { type: 'string', maxLength: 8 },
          ph: { type: 'string', maxLength: 8 },
          fv: { type: 'string', maxLength: 8 },
          fg: { type: 'string', maxLength: 8 },
          di: { type: 'string', maxLength: 8 },
          fechaFin1: { type: 'string', format: 'date-time' },
          usuario: { type: 'string', maxLength: 13 },
          estatus: { type: 'string', minLength: 1, maxLength: 1 },
          sar: { type: 'string', maxLength: 12 }
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
    const { claveOrganica0, claveOrganica1 } = req.params as { claveOrganica0: string; claveOrganica1: string };
    const parsed = UpdateOrganica1Schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail('Datos de entrada inválidos'));
    }

    try {
      const updateOrganica1Command: UpdateOrganica1Command = req.diScope.resolve('updateOrganica1Command');
      const record = await updateOrganica1Command.execute(claveOrganica0, claveOrganica1, parsed.data, req.user?.sub);
      return reply.send(ok(record));
    } catch (error) {
      return handleOrganica1Error(error, reply);
    }
  });

  // DELETE /organica1/:claveOrganica0/:claveOrganica1 - Delete record
  app.delete('/organica1/:claveOrganica0/:claveOrganica1', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Delete ORGANICA_1 record',
      tags: ['organica1', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1'],
        properties: {
          claveOrganica0: { type: 'string', minLength: 1, maxLength: 2 },
          claveOrganica1: { type: 'string', minLength: 1, maxLength: 2 }
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
      const { claveOrganica0, claveOrganica1 } = req.params as { claveOrganica0: string; claveOrganica1: string };
      const deleteOrganica1Command: DeleteOrganica1Command = req.diScope.resolve('deleteOrganica1Command');
      const result = await deleteOrganica1Command.execute(claveOrganica0, claveOrganica1, req.user?.sub);
      return reply.send(ok(result));
    } catch (error) {
      return handleOrganica1Error(error, reply);
    }
  });

  // POST /organica1/query - Dynamic query endpoint
  app.post('/organica1/query', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Dynamic query for ORGANICA_1 records with filters, sorting, and pagination',
      tags: ['organica1', 'firebird', 'query'],
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
                  descripcion: { type: 'string' },
                  titular: { type: 'number' },
                  rfc: { type: 'string' },
                  imss: { type: 'string' },
                  infonavit: { type: 'string' },
                  bancoSar: { type: 'string' },
                  cuentaSar: { type: 'string' },
                  tipoEmpresaSar: { type: 'string' },
                  pcp: { type: 'string' },
                  ph: { type: 'string' },
                  fv: { type: 'string' },
                  fg: { type: 'string' },
                  di: { type: 'string' },
                  fechaRegistro1: { type: 'string', format: 'date-time' },
                  fechaFin1: { type: 'string', format: 'date-time' },
                  usuario: { type: 'string' },
                  estatus: { type: 'string' },
                  sar: { type: 'string' }
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
      return reply.code(400).send(fail('Datos de entrada inválidos'));
    }

    try {
      const records = await queryOrganica1Dynamic(parsed.data);
      return reply.send(ok(records));
    } catch (error: any) {
      // Para esta ruta especial, mantenemos el manejo específico ya que usa una función diferente
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'ER_BAD_FIELD_ERROR') {
          return reply.code(400).send(fail('Nombre de campo inválido en la consulta'));
        }
        if (error.code === 'ER_PARSE_ERROR') {
          return reply.code(400).send(fail('Sintaxis de consulta inválida'));
        }
      }
      console.error('Error querying organica1:', error);
      return reply.code(500).send(fail('Error al consultar registros ORGANICA1'));
    }
  });
}