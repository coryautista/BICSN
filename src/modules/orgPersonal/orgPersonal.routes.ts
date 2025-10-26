import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreateOrgPersonalSchema, UpdateOrgPersonalSchema } from './orgPersonal.schemas.js';
import {
  getAllOrgPersonalService,
  getOrgPersonalByIdService,
  createOrgPersonalService,
  updateOrgPersonalService,
  deleteOrgPersonalService
} from './orgPersonal.service.js';
import { ok, fail } from '../../utils/http.js';

// Routes for OrgPersonal CRUD operations
export default async function orgPersonalRoutes(app: FastifyInstance) {

  // GET /orgPersonal - List all records
  app.get('/orgPersonal', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all OrgPersonal records',
      tags: ['orgPersonal'],
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
                  interno: { type: 'number' },
                  clave_organica_0: { type: 'string', nullable: true },
                  clave_organica_1: { type: 'string', nullable: true },
                  clave_organica_2: { type: 'string', nullable: true },
                  clave_organica_3: { type: 'string', nullable: true },
                  sueldo: { type: 'number', nullable: true },
                  otras_prestaciones: { type: 'number', nullable: true },
                  quinquenios: { type: 'number', nullable: true },
                  activo: { type: 'string', nullable: true },
                  fecha_mov_alt: { type: 'string', nullable: true },
                  orgs1: { type: 'string', nullable: true },
                  orgs2: { type: 'string', nullable: true },
                  orgs3: { type: 'string', nullable: true },
                  orgs: { type: 'string', nullable: true },
                  dsueldo: { type: 'number', nullable: true },
                  dotras_prestaciones: { type: 'number', nullable: true },
                  daquinquenios: { type: 'number', nullable: true },
                  aplicar: { type: 'string', nullable: true },
                  bc: { type: 'string', nullable: true },
                  porcentaje: { type: 'number', nullable: true }
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
      const records = await getAllOrgPersonalService();
      return reply.send(ok(records));
    } catch (error: any) {
      console.error('Error listing orgPersonal:', error);
      return reply.code(500).send(fail('ORG_PERSONAL_LIST_FAILED'));
    }
  });

  // GET /orgPersonal/:interno - Get single record
  app.get('/orgPersonal/:interno', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get OrgPersonal record by interno',
      tags: ['orgPersonal'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['interno'],
        properties: {
          interno: { type: 'number' }
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
                interno: { type: 'number' },
                clave_organica_0: { type: 'string', nullable: true },
                clave_organica_1: { type: 'string', nullable: true },
                clave_organica_2: { type: 'string', nullable: true },
                clave_organica_3: { type: 'string', nullable: true },
                sueldo: { type: 'number', nullable: true },
                otras_prestaciones: { type: 'number', nullable: true },
                quinquenios: { type: 'number', nullable: true },
                activo: { type: 'string', nullable: true },
                fecha_mov_alt: { type: 'string', nullable: true },
                orgs1: { type: 'string', nullable: true },
                orgs2: { type: 'string', nullable: true },
                orgs3: { type: 'string', nullable: true },
                orgs: { type: 'string', nullable: true },
                dsueldo: { type: 'number', nullable: true },
                dotras_prestaciones: { type: 'number', nullable: true },
                daquinquenios: { type: 'number', nullable: true },
                aplicar: { type: 'string', nullable: true },
                bc: { type: 'string', nullable: true },
                porcentaje: { type: 'number', nullable: true }
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
      const { interno } = req.params as { interno: number };
      const record = await getOrgPersonalByIdService(interno);
      return reply.send(ok(record));
    } catch (error: any) {
      if (error.message === 'ORG_PERSONAL_NOT_FOUND') {
        return reply.code(404).send(fail('ORG_PERSONAL_NOT_FOUND'));
      }
      console.error('Error getting orgPersonal:', error);
      return reply.code(500).send(fail('ORG_PERSONAL_GET_FAILED'));
    }
  });

  // POST /orgPersonal - Create new record
  app.post('/orgPersonal', {
    preHandler: [requireAuth],
    schema: {
      description: 'Create new OrgPersonal record',
      tags: ['orgPersonal'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['interno'],
        properties: {
          interno: { type: 'number' },
          clave_organica_0: { type: 'string', maxLength: 2 },
          clave_organica_1: { type: 'string', maxLength: 2 },
          clave_organica_2: { type: 'string', maxLength: 2 },
          clave_organica_3: { type: 'string', maxLength: 2 },
          sueldo: { type: 'number' },
          otras_prestaciones: { type: 'number' },
          quinquenios: { type: 'number' },
          activo: { type: 'string', maxLength: 1 },
          fecha_mov_alt: { type: 'string', format: 'date-time' },
          dsueldo: { type: 'number' },
          dotras_prestaciones: { type: 'number' },
          daquinquenios: { type: 'number' },
          aplicar: { type: 'string', maxLength: 1 },
          bc: { type: 'string', maxLength: 1 },
          porcentaje: { type: 'number' }
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
    const parsed = CreateOrgPersonalSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const record = await createOrgPersonalService({
        interno: parsed.data.interno,
        clave_organica_0: parsed.data.clave_organica_0 ?? null,
        clave_organica_1: parsed.data.clave_organica_1 ?? null,
        clave_organica_2: parsed.data.clave_organica_2 ?? null,
        clave_organica_3: parsed.data.clave_organica_3 ?? null,
        sueldo: parsed.data.sueldo ?? null,
        otras_prestaciones: parsed.data.otras_prestaciones ?? null,
        quinquenios: parsed.data.quinquenios ?? null,
        activo: parsed.data.activo ?? null,
        fecha_mov_alt: parsed.data.fecha_mov_alt ?? null,
        dsueldo: parsed.data.dsueldo ?? null,
        dotras_prestaciones: parsed.data.dotras_prestaciones ?? null,
        daquinquenios: parsed.data.daquinquenios ?? null,
        aplicar: parsed.data.aplicar ?? null,
        bc: parsed.data.bc ?? null,
        porcentaje: parsed.data.porcentaje ?? null
      });
      return reply.code(201).send(ok(record));
    } catch (error: any) {
      console.error('Error creating orgPersonal:', error);
      return reply.code(500).send(fail('ORG_PERSONAL_CREATE_FAILED'));
    }
  });

  // PUT /orgPersonal/:interno - Update record
  app.put('/orgPersonal/:interno', {
    preHandler: [requireAuth],
    schema: {
      description: 'Update OrgPersonal record',
      tags: ['orgPersonal'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['interno'],
        properties: {
          interno: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        properties: {
          clave_organica_0: { type: 'string', maxLength: 2 },
          clave_organica_1: { type: 'string', maxLength: 2 },
          clave_organica_2: { type: 'string', maxLength: 2 },
          clave_organica_3: { type: 'string', maxLength: 2 },
          sueldo: { type: 'number' },
          otras_prestaciones: { type: 'number' },
          quinquenios: { type: 'number' },
          activo: { type: 'string', maxLength: 1 },
          fecha_mov_alt: { type: 'string', format: 'date-time' },
          dsueldo: { type: 'number' },
          dotras_prestaciones: { type: 'number' },
          daquinquenios: { type: 'number' },
          aplicar: { type: 'string', maxLength: 1 },
          bc: { type: 'string', maxLength: 1 },
          porcentaje: { type: 'number' }
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
    const { interno } = req.params as { interno: number };
    const parsed = UpdateOrgPersonalSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const record = await updateOrgPersonalService(interno, parsed.data);
      return reply.send(ok(record));
    } catch (error: any) {
      if (error.message === 'ORG_PERSONAL_NOT_FOUND') {
        return reply.code(404).send(fail('ORG_PERSONAL_NOT_FOUND'));
      }
      console.error('Error updating orgPersonal:', error);
      return reply.code(500).send(fail('ORG_PERSONAL_UPDATE_FAILED'));
    }
  });

  // DELETE /orgPersonal/:interno - Delete record
  app.delete('/orgPersonal/:interno', {
    preHandler: [requireAuth],
    schema: {
      description: 'Delete OrgPersonal record',
      tags: ['orgPersonal'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['interno'],
        properties: {
          interno: { type: 'number' }
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
      const { interno } = req.params as { interno: number };
      await deleteOrgPersonalService(interno);
      return reply.send(ok({}));
    } catch (error: any) {
      if (error.message === 'ORG_PERSONAL_NOT_FOUND') {
        return reply.code(404).send(fail('ORG_PERSONAL_NOT_FOUND'));
      }
      console.error('Error deleting orgPersonal:', error);
      return reply.code(500).send(fail('ORG_PERSONAL_DELETE_FAILED'));
    }
  });
}