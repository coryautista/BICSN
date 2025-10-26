import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreateOrganica1Schema, UpdateOrganica1Schema, DynamicQuerySchema } from './organica1.schemas.js';
import { getOrganica1ById, getAllOrganica1, createOrganica1Record, updateOrganica1Record, deleteOrganica1Record, queryOrganica1Dynamic } from './organica1.service.js';
import { ok, fail, validationError, notFound, conflict, badRequest, internalError } from '../../utils/http.js';

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
  }, async (_req, reply) => {
    try {
      const records = await getAllOrganica1();
      return reply.send(ok(records));
    } catch (error: any) {
      console.error('Error listing organica1:', error);
      return reply.code(500).send(fail('ORGANICA1_LIST_FAILED'));
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

      // Validate parameter format
      if (!claveOrganica0 || claveOrganica0.length < 1 || claveOrganica0.length > 2) {
        return reply.code(400).send(badRequest('claveOrganica0 must be 1-2 characters'));
      }
      if (!claveOrganica1 || claveOrganica1.length < 1 || claveOrganica1.length > 2) {
        return reply.code(400).send(badRequest('claveOrganica1 must be 1-2 characters'));
      }

      const record = await getOrganica1ById(claveOrganica0, claveOrganica1);
      return reply.send(ok(record));
    } catch (error: any) {
      if (error.message === 'ORGANICA1_NOT_FOUND') {
        const params = req.params as { claveOrganica0: string; claveOrganica1: string };
        return reply.code(404).send(notFound('ORGANICA1 record', `${params.claveOrganica0}-${params.claveOrganica1}`));
      }
      console.error('Error getting organica1:', error);
      return reply.code(500).send(internalError('Failed to retrieve ORGANICA1 record'));
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
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const record = await createOrganica1Record(parsed.data, req);
      return reply.code(201).send(ok(record));
    } catch (error: any) {
      if (error.message === 'ORGANICA1_EXISTS') {
        return reply.code(409).send(conflict('ORGANICA1 record', 'Record with this composite key already exists'));
      }
      if (error.code === 'ER_DUP_ENTRY') {
        return reply.code(409).send(conflict('ORGANICA1 record', 'Duplicate entry detected'));
      }
      if (error.code === 'ER_NO_REFERENCED_ROW') {
        return reply.code(400).send(badRequest('Invalid reference: related ORGANICA0 record not found'));
      }
      console.error('Error creating organica1:', error);
      return reply.code(500).send(internalError('Failed to create ORGANICA1 record'));
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
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const record = await updateOrganica1Record(claveOrganica0, claveOrganica1, parsed.data, req);
      return reply.send(ok(record));
    } catch (error: any) {
      if (error.message === 'ORGANICA1_NOT_FOUND') {
        return reply.code(404).send(notFound('ORGANICA1 record', `${claveOrganica0}-${claveOrganica1}`));
      }
      if (error.code === 'ER_NO_REFERENCED_ROW') {
        return reply.code(400).send(badRequest('Invalid reference: related ORGANICA0 record not found'));
      }
      console.error('Error updating organica1:', error);
      return reply.code(500).send(internalError('Failed to update ORGANICA1 record'));
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
      const result = await deleteOrganica1Record(claveOrganica0, claveOrganica1, req);
      return reply.send(ok(result));
    } catch (error: any) {
      if (error.message === 'ORGANICA1_NOT_FOUND') {
        const params = req.params as { claveOrganica0: string; claveOrganica1: string };
        return reply.code(404).send(notFound('ORGANICA1 record', `${params.claveOrganica0}-${params.claveOrganica1}`));
      }
      if (error.code === 'ER_ROW_IS_REFERENCED') {
        return reply.code(409).send(conflict('ORGANICA1 record', 'Cannot delete: record is referenced by other tables'));
      }
      console.error('Error deleting organica1:', error);
      return reply.code(500).send(internalError('Failed to delete ORGANICA1 record'));
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
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const records = await queryOrganica1Dynamic(parsed.data);
      return reply.send(ok(records));
    } catch (error: any) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        return reply.code(400).send(badRequest('Invalid field name in query'));
      }
      if (error.code === 'ER_PARSE_ERROR') {
        return reply.code(400).send(badRequest('Invalid query syntax'));
      }
      console.error('Error querying organica1:', error);
      return reply.code(500).send(internalError('Failed to query ORGANICA1 records'));
    }
  });
}