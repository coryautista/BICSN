import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateInfoSchema, UpdateInfoSchema } from './info.schemas.js';
import { ok, fail } from '../../utils/http.js';
import { handleInfoError } from './infrastructure/errorHandler.js';
import type { GetAllInfosQuery } from './application/queries/GetAllInfosQuery.js';
import type { GetInfoByIdQuery } from './application/queries/GetInfoByIdQuery.js';
import type { CreateInfoCommand } from './application/commands/CreateInfoCommand.js';
import type { UpdateInfoCommand } from './application/commands/UpdateInfoCommand.js';
import type { DeleteInfoCommand } from './application/commands/DeleteInfoCommand.js';

export default async function infoRoutes(app: FastifyInstance) {

  // Listar todos los infos (requiere auth)
  app.get('/infos', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all infos',
      tags: ['infos'],
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
                  id: { type: 'integer' },
                  nombre: { type: 'string' },
                  icono: { type: ['string', 'null'] },
                  color: { type: ['string', 'null'] },
                  colorBotones: { type: ['string', 'null'] },
                  colorEncabezados: { type: ['string', 'null'] },
                  colorLetra: { type: ['string', 'null'] },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: ['string', 'null'], format: 'date-time' },
                  createdBy: { type: ['string', 'null'] },
                  updatedBy: { type: ['string', 'null'] }
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
      const getAllInfosQuery = req.diScope.resolve<GetAllInfosQuery>('getAllInfosQuery');
      const userId = req.user?.sub;
      const infos = await getAllInfosQuery.execute(userId);
      return reply.send(ok(infos));
    } catch (error: any) {
      return handleInfoError(error, reply);
    }
  });

  // Obtener info por ID (requiere auth)
  app.get('/infos/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get info by ID',
      tags: ['infos'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                nombre: { type: 'string' },
                icono: { type: ['string', 'null'] },
                color: { type: ['string', 'null'] },
                colorBotones: { type: ['string', 'null'] },
                colorEncabezados: { type: ['string', 'null'] },
                colorLetra: { type: ['string', 'null'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                createdBy: { type: ['string', 'null'] },
                updatedBy: { type: ['string', 'null'] }
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
    const { id } = req.params as { id: number };

    try {
      const getInfoByIdQuery = req.diScope.resolve<GetInfoByIdQuery>('getInfoByIdQuery');
      const userId = req.user?.sub;
      const info = await getInfoByIdQuery.execute({ id }, userId);
      return reply.send(ok(info));
    } catch (error: any) {
      return handleInfoError(error, reply);
    }
  });

  // Crear info (requiere admin)
  app.post('/infos', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new info item',
      tags: ['infos'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 255 },
          icono: { type: 'string', maxLength: 255 },
          color: { type: 'string', maxLength: 50 },
          colorBotones: { type: 'string', maxLength: 50 },
          colorEncabezados: { type: 'string', maxLength: 50 },
          colorLetra: { type: 'string', maxLength: 50 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
          updatedBy: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                nombre: { type: 'string' },
                icono: { type: ['string', 'null'] },
                color: { type: ['string', 'null'] },
                colorBotones: { type: ['string', 'null'] },
                colorEncabezados: { type: ['string', 'null'] },
                colorLetra: { type: ['string', 'null'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                createdBy: { type: ['string', 'null'] },
                updatedBy: { type: ['string', 'null'] }
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
    const parsed = CreateInfoSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

    try {
      const createInfoCommand = req.diScope.resolve<CreateInfoCommand>('createInfoCommand');
      const userId = req.user?.sub;
      const info = await createInfoCommand.execute({
        nombre: parsed.data.nombre,
        icono: parsed.data.icono,
        color: parsed.data.color,
        colorBotones: parsed.data.colorBotones,
        colorEncabezados: parsed.data.colorEncabezados,
        colorLetra: parsed.data.colorLetra,
        createdAt: parsed.data.createdAt,
        updatedAt: parsed.data.updatedAt,
        createdBy: parsed.data.createdBy,
        updatedBy: parsed.data.updatedBy
      }, userId);
      return reply.code(201).send(ok(info));
    } catch (error: any) {
      return handleInfoError(error, reply);
    }
  });

  // Actualizar info (requiere admin)
  app.put('/infos/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update info item',
      tags: ['infos'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 255 },
          icono: { type: 'string', maxLength: 255 },
          color: { type: 'string', maxLength: 50 },
          colorBotones: { type: 'string', maxLength: 50 },
          colorEncabezados: { type: 'string', maxLength: 50 },
          colorLetra: { type: 'string', maxLength: 50 },
          updatedAt: { type: 'string', format: 'date-time' },
          updatedBy: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                nombre: { type: 'string' },
                icono: { type: ['string', 'null'] },
                color: { type: ['string', 'null'] },
                colorBotones: { type: ['string', 'null'] },
                colorEncabezados: { type: ['string', 'null'] },
                colorLetra: { type: ['string', 'null'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                createdBy: { type: ['string', 'null'] },
                updatedBy: { type: ['string', 'null'] }
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
    const { id } = req.params as { id: number };
    const parsed = UpdateInfoSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

    try {
      const updateInfoCommand = req.diScope.resolve<UpdateInfoCommand>('updateInfoCommand');
      const userId = req.user?.sub;
      const info = await updateInfoCommand.execute({
        id,
        nombre: parsed.data.nombre,
        icono: parsed.data.icono,
        color: parsed.data.color,
        colorBotones: parsed.data.colorBotones,
        colorEncabezados: parsed.data.colorEncabezados,
        colorLetra: parsed.data.colorLetra,
        updatedAt: parsed.data.updatedAt,
        updatedBy: parsed.data.updatedBy
      }, userId);
      return reply.send(ok(info));
    } catch (error: any) {
      return handleInfoError(error, reply);
    }
  });

  // Eliminar info (requiere admin)
  app.delete('/infos/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete info item',
      tags: ['infos'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' }
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
    const { id } = req.params as { id: number };

    try {
      const deleteInfoCommand = req.diScope.resolve<DeleteInfoCommand>('deleteInfoCommand');
      const userId = req.user?.sub;
      await deleteInfoCommand.execute({ id }, userId);
      return reply.send(ok({ id }));
    } catch (error: any) {
      return handleInfoError(error, reply);
    }
  });
}