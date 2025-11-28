import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreateOrganica2Schema, UpdateOrganica2Schema, DynamicQuerySchema } from './organica2.schemas.js';
import { ok, validationError } from '../../utils/http.js';
import { GetOrganica2ByIdQuery } from './application/queries/GetOrganica2ByIdQuery.js';
import { Organica2Service } from './organica2.service.js';
import { CreateOrganica2Command } from './application/commands/CreateOrganica2Command.js';
import { handleOrganica2Error } from './infrastructure/errorHandler.js';

// [FIREBIRD] Routes for ORGANICA_2 CRUD operations
export default async function organica2Routes(app: FastifyInstance) {

  // GET /organica2/my - Get organica2 records for authenticated user
  app.get('/organica2/my', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Obtener registros de ORGANICA_2 vinculados al usuario autenticado',
      tags: ['organica2', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          org0: { type: 'string', description: 'Filtro por organica0' },
          org1: { type: 'string', description: 'Filtro por organica1' }
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
  }, async (req: any, reply) => {
    try {
      const user = req.user;
      
      // Extract organica0 and organica1 from JWT token
      // Use query params if provided, otherwise use token values
      const claveOrganica0 = (req.query as any)?.org0 || user?.idOrganica0?.toString().padStart(2, '0');
      const claveOrganica1 = (req.query as any)?.org1 || user?.idOrganica1?.toString().padStart(2, '0');
      
      if (!claveOrganica0 || !claveOrganica1) {
        return reply.code(400).send(validationError([{ 
          message: 'Las claves orgánicas (org0 y org1) son requeridas. Deben estar en el token o proporcionarse como parámetros de consulta.' 
        }]));
      }
      
      const organica2Service = req.diScope?.resolve('organica2Service') as Organica2Service;
      if (!organica2Service) {
        return reply.code(500).send(validationError([{ message: 'Internal server error' }]));
      }
      const records = await organica2Service.getOrganica2ByUserToken(claveOrganica0, claveOrganica1);
      return reply.send(ok(records));
    } catch (error) {
      console.error('Error in get organica2 my:', error);
      return reply.code(500).send(validationError([{ message: 'Internal server error' }]));
    }
  });

  // GET /organica2 - List all records with optional organica0 and organica1 filters
  app.get('/organica2', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] List all ORGANICA_2 records with optional organica0 and organica1 filters',
      tags: ['organica2', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          org0: { type: 'string', description: 'Filtro por organica0' },
          org1: { type: 'string', description: 'Filtro por organica1' }
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
  }, async (req: any, reply) => {
    try {
      // Default to organica0='01' and organica1='01' if not provided
      const { org0 = '01', org1 = '01' } = req.query as { org0?: string; org1?: string };

      // Use organica0 and organica1 filters (parameters are now required)
      const organica2Service = req.diScope?.resolve('organica2Service') as Organica2Service;
      if (!organica2Service) {
        return reply.code(500).send(validationError([{ message: 'Internal server error' }]));
      }
      const records = await organica2Service.getOrganica2ByUserToken(org0, org1);
      return reply.send(ok(records));
    } catch (error) {
      console.error('Error in get organica2:', error);
      return reply.code(500).send(validationError([{ message: 'Internal server error' }]));
    }
  });

  // GET /organica2/:claveOrganica0/:claveOrganica1/:claveOrganica2 - Get single record
  app.get('/organica2/:claveOrganica0/:claveOrganica1/:claveOrganica2', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Obtener registro de ORGANICA_2 por clave compuesta',
      tags: ['organica2', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1', 'claveOrganica2'],
        properties: {
          claveOrganica0: { type: 'string' },
          claveOrganica1: { type: 'string' },
          claveOrganica2: { type: 'string' }
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
  }, async (req: any, reply) => {
    try {
      const { claveOrganica0, claveOrganica1, claveOrganica2 } = req.params as any;
      const query = req.diScope?.resolve('getOrganica2ByIdQuery') as GetOrganica2ByIdQuery;
      if (!query) {
        return reply.code(500).send(validationError([{ message: 'Internal server error' }]));
      }
      const record = await query.execute(claveOrganica0, claveOrganica1, claveOrganica2);
      return reply.send(ok(record));
    } catch (error) {
      console.error('Error in get organica2 by id:', error);
      return reply.code(500).send(validationError([{ message: 'Internal server error' }]));
    }
  });

  // POST /organica2 - Create new record
  app.post('/organica2', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Crear nuevo registro de ORGANICA_2',
      tags: ['organica2', 'firebird'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1', 'claveOrganica2', 'descripcion'],
        properties: {
          claveOrganica0: { type: 'string', minLength: 1, maxLength: 2, description: 'Código organizacional nivel 0 (requerido)' },
          claveOrganica1: { type: 'string', minLength: 1, maxLength: 2, description: 'Código organizacional nivel 1 (requerido)' },
          claveOrganica2: { type: 'string', minLength: 1, maxLength: 2, description: 'Código organizacional nivel 2 (requerido)' },
          descripcion: { type: 'string', maxLength: 40, description: 'Descripción de la orgánica (requerido)' },
          titular: { type: 'number', description: 'ID del titular (opcional)' },
          fechaFin2: { type: 'string', format: 'date-time', description: 'Fecha de fin (opcional)' },
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
  }, async (req: any, reply) => {
    // Aplicar default de estatus si no viene en el body
    const body = req.body as Record<string, unknown>;
    const bodyWithDefaults = {
      ...body,
      estatus: body.estatus ?? 'A'
    };
    
    const parsed = CreateOrganica2Schema.safeParse(bodyWithDefaults);
    if (!parsed.success) {
      console.error('Validation error:', parsed.error.issues);
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const createOrganica2Command = req.diScope?.resolve('createOrganica2Command') as CreateOrganica2Command;
      if (!createOrganica2Command) {
        return reply.code(500).send(validationError([{ message: 'Internal server error' }]));
      }
      const record = await createOrganica2Command.execute(parsed.data, req.user?.sub?.toString());
      return reply.code(201).send(ok(record));
    } catch (error: any) {
      return handleOrganica2Error(error, reply);
    }
  });

  // PUT /organica2/:claveOrganica0/:claveOrganica1/:claveOrganica2 - Update record
  app.put('/organica2/:claveOrganica0/:claveOrganica1/:claveOrganica2', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Actualizar registro de ORGANICA_2',
      tags: ['organica2', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1', 'claveOrganica2'],
        properties: {
          claveOrganica0: { type: 'string' },
          claveOrganica1: { type: 'string' },
          claveOrganica2: { type: 'string' }
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
  }, async (req: any, reply) => {
    const parsed = UpdateOrganica2Schema.safeParse(req.body);
    if (!parsed.success) {
      console.error('Validation error:', parsed.error.issues);
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const { claveOrganica0, claveOrganica1, claveOrganica2 } = req.params as any;
      const organica2Service = req.diScope?.resolve('organica2Service') as Organica2Service;
      if (!organica2Service) {
        return reply.code(500).send(validationError([{ message: 'Internal server error' }]));
      }
      const record = await organica2Service.updateOrganica2Record(claveOrganica0, claveOrganica1, claveOrganica2, parsed.data, req);
      return reply.send(ok(record));
    } catch (error) {
      console.error('Error in update organica2:', error);
      return reply.code(500).send(validationError([{ message: 'Internal server error' }]));
    }
  });

  // DELETE /organica2/:claveOrganica0/:claveOrganica1/:claveOrganica2 - Delete record
  app.delete('/organica2/:claveOrganica0/:claveOrganica1/:claveOrganica2', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Eliminar registro de ORGANICA_2',
      tags: ['organica2', 'firebird'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['claveOrganica0', 'claveOrganica1', 'claveOrganica2'],
        properties: {
          claveOrganica0: { type: 'string' },
          claveOrganica1: { type: 'string' },
          claveOrganica2: { type: 'string' }
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
  }, async (req: any, reply) => {
    try {
      const { claveOrganica0, claveOrganica1, claveOrganica2 } = req.params as any;
      const organica2Service = req.diScope?.resolve('organica2Service') as Organica2Service;
      if (!organica2Service) {
        return reply.code(500).send(validationError([{ message: 'Internal server error' }]));
      }
      await organica2Service.deleteOrganica2Record(claveOrganica0, claveOrganica1, claveOrganica2, req);
      return reply.send(ok({}));
    } catch (error) {
      console.error('Error in delete organica2:', error);
      return reply.code(500).send(validationError([{ message: 'Internal server error' }]));
    }
  });

  // POST /organica2/query - Dynamic query endpoint
  app.post('/organica2/query', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Consulta dinámica para registros de ORGANICA_2 con filtros, ordenamiento y paginación',
      tags: ['organica2', 'firebird', 'query'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          filters: {
            type: 'object',
            additionalProperties: true,
            description: 'Filtros aplicados a la consulta'
          },
          sortBy: {
            type: 'string',
            description: 'Campo por el cual ordenar'
          },
          sortOrder: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            description: 'Dirección del ordenamiento'
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 1000,
            description: 'Número máximo de registros a retornar'
          },
          offset: {
            type: 'integer',
            minimum: 0,
            description: 'Número de registros a omitir'
          }
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
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                limit: { type: 'integer' },
                offset: { type: 'integer' }
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
  }, async (req: any, reply) => {
    const parsed = DynamicQuerySchema.safeParse(req.body);
    if (!parsed.success) {
      console.error('Validation error:', parsed.error.issues);
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const organica2Service = req.diScope?.resolve('organica2Service') as Organica2Service;
      if (!organica2Service) {
        return reply.code(500).send(validationError([{ message: 'Internal server error' }]));
      }
      const records = await organica2Service.queryOrganica2Dynamic(parsed.data);
      return reply.send(ok(records));
    } catch (error) {
      console.error('Error in query organica2:', error);
      return reply.code(500).send(validationError([{ message: 'Internal server error' }]));
    }
  });
}