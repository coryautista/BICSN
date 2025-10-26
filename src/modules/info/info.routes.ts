import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateInfoSchema, UpdateInfoSchema } from './info.schemas.js';
import { getAllInfos, getInfoById, createInfoItem, updateInfoItem, deleteInfoItem } from './info.service.js';
import { fail } from '../../utils/http.js';

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
                  updatedAt: { type: 'string', format: 'date-time' },
                  createdBy: { type: ['string', 'null'] },
                  updatedBy: { type: ['string', 'null'] }
                }
              }
            }
          }
        }
      }
    }
  }, async (_req, reply) => {
    const infos = await getAllInfos();
    return reply.send({ data: infos });
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

    // Validate ID parameter
    if (!id || id <= 0) {
      return reply.code(400).send(fail('INFO_INVALID_ID'));
    }

    try {
      const info = await getInfoById(id);
      return reply.send({ data: info });
    } catch (e: any) {
      if (e.message === 'INFO_NOT_FOUND') return reply.code(404).send(fail(e.message));
      return reply.code(500).send(fail('INFO_FETCH_FAILED'));
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
      const info = await createInfoItem(
        req,
        parsed.data.nombre,
        parsed.data.createdAt,
        parsed.data.updatedAt,
        parsed.data.icono,
        parsed.data.color,
        parsed.data.colorBotones,
        parsed.data.colorEncabezados,
        parsed.data.colorLetra,
        parsed.data.createdBy,
        parsed.data.updatedBy
      );
      return reply.code(201).send({ data: info });
    } catch (e: any) {
      return reply.code(500).send(fail('INFO_CREATE_FAILED'));
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

    // Validate ID parameter
    if (!id || id <= 0) {
      return reply.code(400).send(fail('INFO_INVALID_ID'));
    }

    const parsed = UpdateInfoSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

    try {
      const info = await updateInfoItem(
        req,
        id,
        parsed.data.updatedAt,
        parsed.data.nombre,
        parsed.data.icono,
        parsed.data.color,
        parsed.data.colorBotones,
        parsed.data.colorEncabezados,
        parsed.data.colorLetra,
        parsed.data.updatedBy
      );
      if (!info) return reply.code(404).send(fail('INFO_NOT_FOUND'));
      return reply.send({ data: info });
    } catch (e: any) {
      if (e.message === 'INFO_NOT_FOUND') return reply.code(404).send(fail(e.message));
      return reply.code(500).send(fail('INFO_UPDATE_FAILED'));
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

    // Validate ID parameter
    if (!id || id <= 0) {
      return reply.code(400).send(fail('INFO_INVALID_ID'));
    }

    try {
      const deletedId = await deleteInfoItem(req, id);
      if (!deletedId) return reply.code(404).send(fail('INFO_NOT_FOUND'));
      return reply.send({ data: { id: deletedId } });
    } catch (e: any) {
      if (e.message === 'INFO_NOT_FOUND') return reply.code(404).send(fail(e.message));
      return reply.code(500).send(fail('INFO_DELETE_FAILED'));
    }
  });
}