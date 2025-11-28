import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreateOrganica3Schema, UpdateOrganica3Schema, DynamicQuerySchema } from './organica3.schemas.js';
import { ok, validationError } from '../../utils/http.js';
import { GetOrganica3ByIdQuery } from './application/queries/GetOrganica3ByIdQuery.js';
import { Organica3Service } from './organica3.service.js';
import { CreateOrganica3Command } from './application/commands/CreateOrganica3Command.js';
import { UpdateOrganica3Command } from './application/commands/UpdateOrganica3Command.js';
import { DeleteOrganica3Command } from './application/commands/DeleteOrganica3Command.js';
import { handleOrganica3Error } from './infrastructure/errorHandler.js';

// [FIREBIRD] Routes for ORGANICA_3 CRUD operations
export default async function organica3Routes(app: FastifyInstance) {

  // GET /organica3 - List all records with optional organica0, organica1, and organica2 filters
  app.get('/organica3', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Listar todos los registros de ORGANICA_3 con filtros opcionales por organica0, organica1 y organica2',
      tags: ['organica3', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['org0', 'org1', 'org2'],
        properties: {
          org0: { type: 'string', description: 'Filtrar por organica0', pattern: '^[0-9A-Z]{1,2}$' },
          org1: { type: 'string', description: 'Filtrar por organica1', pattern: '^[0-9A-Z]{1,2}$' },
          org2: { type: 'string', description: 'Filtrar por organica2', pattern: '^[0-9A-Z]{1,2}$' }
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
    try {
      const { org0, org1, org2 } = req.query as { org0: string; org1: string; org2: string };

      // Use organica0, organica1, and organica2 filters (parameters are now required)
      const organica3Service = req.diScope.resolve<Organica3Service>('organica3Service');
      const records = await organica3Service.getOrganica3ByUserToken(org0, org1, org2);
      return reply.send(ok(records));
    } catch (error: any) {
      return handleOrganica3Error(error, reply);
    }
  });

  // GET /organica3/:claveOrganica0/:claveOrganica1/:claveOrganica2/:claveOrganica3 - Get single record
  app.get('/organica3/:claveOrganica0/:claveOrganica1/:claveOrganica2/:claveOrganica3', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Obtener registro de ORGANICA_3 por clave compuesta',
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
      const getOrganica3ByIdQuery = req.diScope.resolve<GetOrganica3ByIdQuery>('getOrganica3ByIdQuery');
      const record = await getOrganica3ByIdQuery.execute(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3, req.user?.sub?.toString());
      return reply.send(ok(record));
    } catch (error: any) {
      return handleOrganica3Error(error, reply);
    }
  });

  // POST /organica3 - Create new record
  app.post('/organica3', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Crear nuevo registro de ORGANICA_3',
      tags: ['organica3', 'firebird'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1', 'claveOrganica2', 'claveOrganica3', 'descripcion'],
        properties: {
          claveOrganica0: { type: 'string', minLength: 1, maxLength: 2, description: 'Código organizacional nivel 0 (requerido)' },
          claveOrganica1: { type: 'string', minLength: 1, maxLength: 2, description: 'Código organizacional nivel 1 (requerido)' },
          claveOrganica2: { type: 'string', minLength: 1, maxLength: 2, description: 'Código organizacional nivel 2 (requerido)' },
          claveOrganica3: { type: 'string', minLength: 1, maxLength: 2, description: 'Código organizacional nivel 3 (requerido)' },
          descripcion: { type: 'string', maxLength: 40, description: 'Descripción de la orgánica (requerido)' },
          titular: { type: 'number', description: 'ID del titular (opcional)' },
          calleNum: { type: 'string', maxLength: 40, description: 'Calle y número (opcional)' },
          fraccionamiento: { type: 'string', maxLength: 40, description: 'Fraccionamiento (opcional)' },
          codigoPostal: { type: 'string', maxLength: 5, description: 'Código postal (opcional)' },
          telefono: { type: 'string', maxLength: 15, description: 'Teléfono (opcional)' },
          fax: { type: 'string', maxLength: 15, description: 'Fax (opcional)' },
          localidad: { type: 'string', maxLength: 25, description: 'Localidad (opcional)' },
          municipio: { type: 'number', description: 'ID del municipio (opcional)' },
          estado: { type: 'number', description: 'ID del estado (opcional)' },
          fechaFin3: { type: 'string', format: 'date-time', description: 'Fecha de fin (opcional)' },
          usuario: { type: 'string', maxLength: 13, description: 'Usuario (opcional)' },
          estatus: { type: 'string', minLength: 1, maxLength: 1, default: 'A', description: 'Estatus (opcional, por defecto: A)' }
        }
      },
      response: {
        201: {
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
    // Aplicar default de estatus si no viene en el body
    const body = req.body as Record<string, unknown>;
    const bodyWithDefaults = {
      ...body,
      estatus: body.estatus ?? 'A'
    };
    
    const parsed = CreateOrganica3Schema.safeParse(bodyWithDefaults);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const createOrganica3Command = req.diScope.resolve<CreateOrganica3Command>('createOrganica3Command');
      const record = await createOrganica3Command.execute(parsed.data, req.user?.sub?.toString());
      return reply.code(201).send(ok(record));
    } catch (error: any) {
      return handleOrganica3Error(error, reply);
    }
  });

  // PUT /organica3/:claveOrganica0/:claveOrganica1/:claveOrganica2/:claveOrganica3 - Update record
  app.put('/organica3/:claveOrganica0/:claveOrganica1/:claveOrganica2/:claveOrganica3', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Actualizar registro de ORGANICA_3',
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
      description: '[FIREBIRD] Eliminar registro de ORGANICA_3',
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
      description: '[FIREBIRD] Consulta dinámica para registros de ORGANICA_3 con filtros, ordenamiento y paginación',
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
      const organica3Service = req.diScope.resolve<Organica3Service>('organica3Service');
      const records = await organica3Service.queryOrganica3Dynamic(parsed.data);
      return reply.send(ok(records));
    } catch (error: any) {
      return handleOrganica3Error(error, reply);
    }
  });

  // GET /organica3/my/:claveOrganica2 - Get organica3 filtered by user token (organica0, organica1) and claveOrganica2 param
  app.get('/organica3/my/:claveOrganica2', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Obtener registros de ORGANICA_3 filtrados por token de usuario autenticado (organica0, organica1) y parámetro claveOrganica2',
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
      // Handle both string and number types
      const idOrg0 = user?.idOrganica0;
      const idOrg1 = user?.idOrganica1;
      
      const claveOrganica0 = idOrg0 ? (typeof idOrg0 === 'string' ? idOrg0.padStart(2, '0') : idOrg0.toString().padStart(2, '0')) : null;
      const claveOrganica1 = idOrg1 ? (typeof idOrg1 === 'string' ? idOrg1.padStart(2, '0') : idOrg1.toString().padStart(2, '0')) : null;

      if (!claveOrganica0 || !claveOrganica1) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'MISSING_ORGANICA_KEYS',
            message: 'Las claves orgánicas (org0 y org1) son requeridas en el token del usuario.'
          }
        });
      }

      if (!claveOrganica2 || claveOrganica2.length !== 2) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'INVALID_CLAVE_ORGANICA2',
            message: 'El parámetro claveOrganica2 debe ser una cadena de 2 caracteres.'
          }
        });
      }

      const organica3Service = req.diScope.resolve<Organica3Service>('organica3Service');
      const records = await organica3Service.getOrganica3ByUserToken(claveOrganica0, claveOrganica1, claveOrganica2);
      return reply.send(ok(records));
    } catch (error: any) {
      return handleOrganica3Error(error, reply);
    }
  });
}