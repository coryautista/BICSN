import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import {
  CreateCategoriaPuestoOrgSchema,
  UpdateCategoriaPuestoOrgSchema,
  CategoriaPuestoOrgIdParamSchema
} from './categoriaPuestoOrg.schemas.js';
import { ok, validationError, notFound, internalError } from '../../utils/http.js';
import type { GetAllCategoriaPuestoOrgQuery } from './application/queries/GetAllCategoriaPuestoOrgQuery.js';
import type { GetCategoriaPuestoOrgByIdQuery } from './application/queries/GetCategoriaPuestoOrgByIdQuery.js';
import type { CreateCategoriaPuestoOrgCommand } from './application/commands/CreateCategoriaPuestoOrgCommand.js';
import type { UpdateCategoriaPuestoOrgCommand } from './application/commands/UpdateCategoriaPuestoOrgCommand.js';
import type { DeleteCategoriaPuestoOrgCommand } from './application/commands/DeleteCategoriaPuestoOrgCommand.js';

export default async function categoriaPuestoOrgRoutes(app: FastifyInstance) {

  // Listar todas las categorías de puesto org (requiere auth)
  app.get('/categoria-puesto-org', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all categoria puesto org',
      tags: ['categoria-puesto-org'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          nivel: { type: 'string' },
          org0: { type: 'string' },
          org1: { type: 'string' },
          org2: { type: 'string' },
          org3: { type: 'string' },
          vigenciaInicio: { type: 'string' },
          categoria: { type: 'string' }
        }
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
                  categoriaPuestoOrgId: { type: 'number' },
                  nivel: { type: 'number' },
                  org0: { type: 'string' },
                  org1: { type: 'string' },
                  org2: { type: 'string' },
                  org3: { type: 'string' },
                  categoria: { type: 'string' },
                  nombreCategoria: { type: 'string' },
                  ingresoBrutoMensual: { type: 'number' },
                  vigenciaInicio: { type: 'string' },
                  vigenciaFin: { type: 'string' }
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
      const query = req.query as any;
      const filters = {
        nivel: query.nivel ? parseInt(query.nivel) : undefined,
        org0: query.org0,
        org1: query.org1,
        org2: query.org2,
        org3: query.org3,
        vigenciaInicio: query.vigenciaInicio,
        categoria: query.categoria
      };
      const getAllCategoriaPuestoOrgQuery = req.diScope.resolve<GetAllCategoriaPuestoOrgQuery>('getAllCategoriaPuestoOrgQuery');
      const categorias = await getAllCategoriaPuestoOrgQuery.execute(filters);
      return reply.send(ok(categorias));
    } catch (error: any) {
      console.error('Error listing categoria-puesto-org:', error);
      return reply.code(500).send(internalError('Failed to retrieve categoria-puesto-org'));
    }
  });

  // Obtener categoría de puesto org por ID (requiere auth)
  app.get('/categoria-puesto-org/:categoriaPuestoOrgId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get categoria puesto org by ID',
      tags: ['categoria-puesto-org'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          categoriaPuestoOrgId: { type: 'number', minimum: 1 }
        },
        required: ['categoriaPuestoOrgId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                categoriaPuestoOrgId: { type: 'number' },
                nivel: { type: 'number' },
                org0: { type: 'string' },
                org1: { type: 'string' },
                org2: { type: 'string' },
                org3: { type: 'string' },
                categoria: { type: 'string' },
                nombreCategoria: { type: 'string' },
                ingresoBrutoMensual: { type: 'number' },
                vigenciaInicio: { type: 'string' },
                vigenciaFin: { type: 'string' }
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
    const { categoriaPuestoOrgId } = req.params as { categoriaPuestoOrgId: number };

    // Validate parameter
    const paramValidation = CategoriaPuestoOrgIdParamSchema.safeParse({ categoriaPuestoOrgId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getCategoriaPuestoOrgByIdQuery = req.diScope.resolve<GetCategoriaPuestoOrgByIdQuery>('getCategoriaPuestoOrgByIdQuery');
      const categoria = await getCategoriaPuestoOrgByIdQuery.execute(categoriaPuestoOrgId);
      return reply.send(ok(categoria));
    } catch (error: any) {
      if (error.message === 'CATEGORIA_PUESTO_ORG_NOT_FOUND') {
        return reply.code(404).send(notFound('CategoriaPuestoOrg', categoriaPuestoOrgId.toString()));
      }
      console.error('Error getting categoria-puesto-org:', error);
      return reply.code(500).send(internalError('Failed to retrieve categoria-puesto-org'));
    }
  });

  // Crear categoría de puesto org (requiere admin)
  app.post('/categoria-puesto-org', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new categoria puesto org',
      tags: ['categoria-puesto-org'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nivel', 'org0', 'org1', 'categoria', 'nombreCategoria', 'ingresoBrutoMensual', 'vigenciaInicio'],
        properties: {
          nivel: { type: 'number', minimum: 0, maximum: 3 },
          org0: { type: 'string', minLength: 2, maxLength: 2 },
          org1: { type: 'string', minLength: 2, maxLength: 2 },
          org2: { type: 'string', minLength: 2, maxLength: 2 },
          org3: { type: 'string', minLength: 2, maxLength: 2 },
          categoria: { type: 'string', maxLength: 10 },
          nombreCategoria: { type: 'string', maxLength: 80 },
          ingresoBrutoMensual: { type: 'number', minimum: 0 },
          vigenciaInicio: { type: 'string', format: 'date-time' },
          vigenciaFin: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                categoriaPuestoOrgId: { type: 'number' },
                nivel: { type: 'number' },
                org0: { type: 'string' },
                org1: { type: 'string' },
                org2: { type: 'string' },
                org3: { type: 'string' },
                categoria: { type: 'string' },
                nombreCategoria: { type: 'string' },
                ingresoBrutoMensual: { type: 'number' },
                vigenciaInicio: { type: 'string' },
                vigenciaFin: { type: 'string' }
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
    const parsed = CreateCategoriaPuestoOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const userId = req.user?.sub;
      const createCategoriaPuestoOrgCommand = req.diScope.resolve<CreateCategoriaPuestoOrgCommand>('createCategoriaPuestoOrgCommand');
      const categoria = await createCategoriaPuestoOrgCommand.execute({
        ...parsed.data,
        userId
      });
      return reply.code(201).send(ok(categoria));
    } catch (error: any) {
      if (error.message === 'CATEGORIA_PUESTO_ORG_EXISTS') {
        return reply.code(409).send({ ok: false, error: { code: 'CONFLICT', message: 'CategoriaPuestoOrg already exists' } });
      }
      console.error('Error creating categoria-puesto-org:', error);
      return reply.code(500).send(internalError('Failed to create categoria-puesto-org'));
    }
  });

  // Actualizar categoría de puesto org (requiere admin)
  app.put('/categoria-puesto-org/:categoriaPuestoOrgId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update categoria puesto org',
      tags: ['categoria-puesto-org'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          categoriaPuestoOrgId: { type: 'number', minimum: 1 }
        },
        required: ['categoriaPuestoOrgId']
      },
      body: {
        type: 'object',
        properties: {
          nombreCategoria: { type: 'string', maxLength: 80 },
          ingresoBrutoMensual: { type: 'number', minimum: 0 },
          vigenciaFin: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                categoriaPuestoOrgId: { type: 'number' },
                nivel: { type: 'number' },
                org0: { type: 'string' },
                org1: { type: 'string' },
                org2: { type: 'string' },
                org3: { type: 'string' },
                categoria: { type: 'string' },
                nombreCategoria: { type: 'string' },
                ingresoBrutoMensual: { type: 'number' },
                vigenciaInicio: { type: 'string' },
                vigenciaFin: { type: 'string' }
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
    const { categoriaPuestoOrgId } = req.params as { categoriaPuestoOrgId: number };

    // Validate parameter
    const paramValidation = CategoriaPuestoOrgIdParamSchema.safeParse({ categoriaPuestoOrgId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    const parsed = UpdateCategoriaPuestoOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const userId = req.user?.sub;
      const updateCategoriaPuestoOrgCommand = req.diScope.resolve<UpdateCategoriaPuestoOrgCommand>('updateCategoriaPuestoOrgCommand');
      const categoria = await updateCategoriaPuestoOrgCommand.execute({
        categoriaPuestoOrgId,
        ...parsed.data,
        userId
      });
      return reply.send(ok(categoria));
    } catch (error: any) {
      if (error.message === 'CATEGORIA_PUESTO_ORG_NOT_FOUND') {
        return reply.code(404).send(notFound('CategoriaPuestoOrg', categoriaPuestoOrgId.toString()));
      }
      console.error('Error updating categoria-puesto-org:', error);
      return reply.code(500).send(internalError('Failed to update categoria-puesto-org'));
    }
  });

  // Eliminar categoría de puesto org (requiere admin)
  app.delete('/categoria-puesto-org/:categoriaPuestoOrgId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete categoria puesto org',
      tags: ['categoria-puesto-org'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          categoriaPuestoOrgId: { type: 'number', minimum: 1 }
        },
        required: ['categoriaPuestoOrgId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                categoriaPuestoOrgId: { type: 'number' }
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
    const { categoriaPuestoOrgId } = req.params as { categoriaPuestoOrgId: number };

    // Validate parameter
    const paramValidation = CategoriaPuestoOrgIdParamSchema.safeParse({ categoriaPuestoOrgId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const deleteCategoriaPuestoOrgCommand = req.diScope.resolve<DeleteCategoriaPuestoOrgCommand>('deleteCategoriaPuestoOrgCommand');
      const deletedId = await deleteCategoriaPuestoOrgCommand.execute({ categoriaPuestoOrgId });
      return reply.send(ok({ categoriaPuestoOrgId: deletedId }));
    } catch (error: any) {
      if (error.message === 'CATEGORIA_PUESTO_ORG_NOT_FOUND') {
        return reply.code(404).send(notFound('CategoriaPuestoOrg', categoriaPuestoOrgId.toString()));
      }
      console.error('Error deleting categoria-puesto-org:', error);
      return reply.code(500).send(internalError('Failed to delete categoria-puesto-org'));
    }
  });
}