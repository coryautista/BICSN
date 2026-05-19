import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateMunicipioSchema, UpdateMunicipioSchema, MunicipioIdParamSchema, EstadoIdParamSchema } from './municipios.schemas.js';
import { ok, validationError } from '../../utils/http.js';
import { GetAllMunicipiosQuery } from './application/queries/GetAllMunicipiosQuery.js';
import { GetMunicipiosByEstadoQuery } from './application/queries/GetMunicipiosByEstadoQuery.js';
import { GetMunicipioByIdQuery } from './application/queries/GetMunicipioByIdQuery.js';
import { CreateMunicipioCommand } from './application/commands/CreateMunicipioCommand.js';
import { UpdateMunicipioCommand } from './application/commands/UpdateMunicipioCommand.js';
import { DeleteMunicipioCommand } from './application/commands/DeleteMunicipioCommand.js';
import { handleMunicipioError } from './infrastructure/errorHandler.js';

export default async function municipiosRoutes(app: FastifyInstance) {

  // Listar todos los municipios (requiere auth)
  app.get('/municipios', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all municipalities',
      tags: ['municipios'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  municipioId: { type: 'number' },
                  estadoId: { type: 'string' },
                  claveMunicipio: { type: 'string' },
                  nombreMunicipio: { type: 'string' },
                  esValido: { type: 'boolean' }
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
      const query = req.diScope.resolve<GetAllMunicipiosQuery>('getAllMunicipiosQuery');
      const userId = req.user?.sub;
      const municipios = await query.execute(userId);
      return reply.send(ok(municipios));
    } catch (error: any) {
      return handleMunicipioError(error, reply);
    }
  });

  // Listar municipios por estado (requiere auth)
  app.get('/estados/:estadoId/municipios', {
    preHandler: [requireAuth],
    schema: {
      description: 'List municipalities by state',
      tags: ['municipios'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          estadoId: { type: 'string', minLength: 2, maxLength: 2 }
        },
        required: ['estadoId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  municipioId: { type: 'number' },
                  estadoId: { type: 'string' },
                  claveMunicipio: { type: 'string' },
                  nombreMunicipio: { type: 'string' },
                  esValido: { type: 'boolean' }
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
    const { estadoId } = req.params as { estadoId: string };

    // Validate parameter
    const paramValidation = EstadoIdParamSchema.safeParse({ estadoId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const query = req.diScope.resolve<GetMunicipiosByEstadoQuery>('getMunicipiosByEstadoQuery');
      const userId = req.user?.sub;
      const municipios = await query.execute({ estadoId }, userId);
      return reply.send(ok(municipios));
    } catch (error: any) {
      return handleMunicipioError(error, reply);
    }
  });

  // Obtener municipio por ID (requiere auth)
  app.get('/municipios/:municipioId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get municipality by ID',
      tags: ['municipios'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          municipioId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['municipioId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                municipioId: { type: 'number' },
                estadoId: { type: 'string' },
                claveMunicipio: { type: 'string' },
                nombreMunicipio: { type: 'string' },
                esValido: { type: 'boolean' }
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
    const { municipioId } = req.params as { municipioId: string };

    // Validate parameter
    const paramValidation = MunicipioIdParamSchema.safeParse({ municipioId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const query = req.diScope.resolve<GetMunicipioByIdQuery>('getMunicipioByIdQuery');
      const userId = req.user?.sub;
      const municipio = await query.execute({ municipioId: paramValidation.data.municipioId }, userId);
      return reply.send(ok(municipio));
    } catch (error: any) {
      return handleMunicipioError(error, reply);
    }
  });

  // Crear municipio (requiere admin)
  app.post('/municipios', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new municipality',
      tags: ['municipios'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['estadoId', 'claveMunicipio', 'nombreMunicipio'],
        properties: {
          estadoId: { type: 'string', minLength: 2, maxLength: 2 },
          claveMunicipio: { type: 'string', minLength: 3, maxLength: 3 },
          nombreMunicipio: { type: 'string', minLength: 1, maxLength: 100 },
          esValido: { type: 'boolean' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                municipioId: { type: 'number' },
                estadoId: { type: 'string' },
                claveMunicipio: { type: 'string' },
                nombreMunicipio: { type: 'string' },
                esValido: { type: 'boolean' }
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
    const parsed = CreateMunicipioSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const command = req.diScope.resolve<CreateMunicipioCommand>('createMunicipioCommand');
      const userId = req.user?.sub;
      
      const municipio = await command.execute({
        estadoId: parsed.data.estadoId,
        claveMunicipio: parsed.data.claveMunicipio,
        nombreMunicipio: parsed.data.nombreMunicipio,
        esValido: parsed.data.esValido ?? false,
        userId
      });

      return reply.code(201).send(ok(municipio));
    } catch (error: any) {
      return handleMunicipioError(error, reply);
    }
  });

  // Actualizar municipio (requiere admin)
  app.put('/municipios/:municipioId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update municipality',
      tags: ['municipios'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          municipioId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['municipioId']
      },
      body: {
        type: 'object',
        properties: {
          nombreMunicipio: { type: 'string', minLength: 1, maxLength: 100 },
          esValido: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                municipioId: { type: 'number' },
                estadoId: { type: 'string' },
                claveMunicipio: { type: 'string' },
                nombreMunicipio: { type: 'string' },
                esValido: { type: 'boolean' }
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
    const { municipioId } = req.params as { municipioId: string };

    // Validate parameter
    const paramValidation = MunicipioIdParamSchema.safeParse({ municipioId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    const parsed = UpdateMunicipioSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const command = req.diScope.resolve<UpdateMunicipioCommand>('updateMunicipioCommand');
      const userId = req.user?.sub;
      
      const municipio = await command.execute({
        municipioId: paramValidation.data.municipioId,
        nombreMunicipio: parsed.data.nombreMunicipio,
        esValido: parsed.data.esValido,
        userId
      });

      return reply.send(ok(municipio));
    } catch (error: any) {
      return handleMunicipioError(error, reply);
    }
  });

  // Eliminar municipio (requiere admin)
  app.delete('/municipios/:municipioId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete municipality',
      tags: ['municipios'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          municipioId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['municipioId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                municipioId: { type: 'number' }
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
    const { municipioId } = req.params as { municipioId: string };

    // Validate parameter
    const paramValidation = MunicipioIdParamSchema.safeParse({ municipioId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const command = req.diScope.resolve<DeleteMunicipioCommand>('deleteMunicipioCommand');
      const userId = req.user?.sub;
      await command.execute({ municipioId: paramValidation.data.municipioId }, userId);
      return reply.send(ok({ municipioId: paramValidation.data.municipioId }));
    } catch (error: any) {
      return handleMunicipioError(error, reply);
    }
  });
}