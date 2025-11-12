import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreateAfiliadoOrgSchema, UpdateAfiliadoOrgSchema } from './afiliadoOrg.schemas.js';
import { ok, fail } from '../../utils/http.js';
import { GetAllAfiliadoOrgQuery } from './application/queries/GetAllAfiliadoOrgQuery.js';
import { GetAfiliadoOrgByIdQuery } from './application/queries/GetAfiliadoOrgByIdQuery.js';
import { GetAfiliadoOrgByAfiliadoIdQuery } from './application/queries/GetAfiliadoOrgByAfiliadoIdQuery.js';
import { CreateAfiliadoOrgCommand } from './application/commands/CreateAfiliadoOrgCommand.js';
import { UpdateAfiliadoOrgCommand } from './application/commands/UpdateAfiliadoOrgCommand.js';
import { DeleteAfiliadoOrgCommand } from './application/commands/DeleteAfiliadoOrgCommand.js';
import { handleAfiliadoOrgError } from './infrastructure/errorHandler.js';

// Routes for AfiliadoOrg CRUD operations
export default async function afiliadoOrgRoutes(app: FastifyInstance) {
  // Resolve dependencies from DI container
  const getAllAfiliadoOrgQuery = app.diContainer.resolve<GetAllAfiliadoOrgQuery>('getAllAfiliadoOrgQuery');
  const getAfiliadoOrgByIdQuery = app.diContainer.resolve<GetAfiliadoOrgByIdQuery>('getAfiliadoOrgByIdQuery');
  const getAfiliadoOrgByAfiliadoIdQuery = app.diContainer.resolve<GetAfiliadoOrgByAfiliadoIdQuery>('getAfiliadoOrgByAfiliadoIdQuery');
  const createAfiliadoOrgCommand = app.diContainer.resolve<CreateAfiliadoOrgCommand>('createAfiliadoOrgCommand');
  const updateAfiliadoOrgCommand = app.diContainer.resolve<UpdateAfiliadoOrgCommand>('updateAfiliadoOrgCommand');
  const deleteAfiliadoOrgCommand = app.diContainer.resolve<DeleteAfiliadoOrgCommand>('deleteAfiliadoOrgCommand');

  // GET /afiliadoOrg - List all records
  app.get('/afiliadoOrg', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all AfiliadoOrg records',
      tags: ['afiliadoOrg'],
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
                  id: { type: 'number' },
                  afiliadoId: { type: 'number' },
                  nivel0Id: { type: 'number', nullable: true },
                  nivel1Id: { type: 'number', nullable: true },
                  nivel2Id: { type: 'number', nullable: true },
                  nivel3Id: { type: 'number', nullable: true },
                  claveOrganica0: { type: 'string', nullable: true },
                  claveOrganica1: { type: 'string', nullable: true },
                  claveOrganica2: { type: 'string', nullable: true },
                  claveOrganica3: { type: 'string', nullable: true },
                  interno: { type: 'number', nullable: true },
                  sueldo: { type: 'number', nullable: true },
                  otrasPrestaciones: { type: 'number', nullable: true },
                  quinquenios: { type: 'number', nullable: true },
                  activo: { type: 'boolean' },
                  fechaMovAlt: { type: 'string', nullable: true },
                  orgs1: { type: 'string', nullable: true },
                  orgs2: { type: 'string', nullable: true },
                  orgs3: { type: 'string', nullable: true },
                  orgs4: { type: 'string', nullable: true },
                  dSueldo: { type: 'string', nullable: true },
                  dOtrasPrestaciones: { type: 'string', nullable: true },
                  dQuinquenios: { type: 'string', nullable: true },
                  aplicar: { type: 'boolean', nullable: true },
                  bc: { type: 'string', nullable: true },
                  porcentaje: { type: 'number', nullable: true },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
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
      const records = await getAllAfiliadoOrgQuery.execute();
      return reply.send(ok(records));
    } catch (error: any) {
      return handleAfiliadoOrgError(error, reply);
    }
  });

  // GET /afiliadoOrg/:id - Get single record
  app.get('/afiliadoOrg/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get AfiliadoOrg record by id',
      tags: ['afiliadoOrg'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
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
                id: { type: 'number' },
                afiliadoId: { type: 'number' },
                nivel0Id: { type: 'number', nullable: true },
                nivel1Id: { type: 'number', nullable: true },
                nivel2Id: { type: 'number', nullable: true },
                nivel3Id: { type: 'number', nullable: true },
                claveOrganica0: { type: 'string', nullable: true },
                claveOrganica1: { type: 'string', nullable: true },
                claveOrganica2: { type: 'string', nullable: true },
                claveOrganica3: { type: 'string', nullable: true },
                interno: { type: 'number', nullable: true },
                sueldo: { type: 'number', nullable: true },
                otrasPrestaciones: { type: 'number', nullable: true },
                quinquenios: { type: 'number', nullable: true },
                activo: { type: 'boolean' },
                fechaMovAlt: { type: 'string', nullable: true },
                orgs1: { type: 'string', nullable: true },
                orgs2: { type: 'string', nullable: true },
                orgs3: { type: 'string', nullable: true },
                orgs4: { type: 'string', nullable: true },
                dSueldo: { type: 'string', nullable: true },
                dOtrasPrestaciones: { type: 'string', nullable: true },
                dQuinquenios: { type: 'string', nullable: true },
                aplicar: { type: 'boolean', nullable: true },
                bc: { type: 'string', nullable: true },
                porcentaje: { type: 'number', nullable: true },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
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
      const { id } = req.params as { id: number };
      const record = await getAfiliadoOrgByIdQuery.execute(id);
      return reply.send(ok(record));
    } catch (error: any) {
      return handleAfiliadoOrgError(error, reply);
    }
  });

  // GET /afiliadoOrg/afiliado/:afiliadoId - Get records by afiliadoId
  app.get('/afiliadoOrg/afiliado/:afiliadoId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get AfiliadoOrg records by afiliadoId',
      tags: ['afiliadoOrg'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['afiliadoId'],
        properties: {
          afiliadoId: { type: 'number' }
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
                  id: { type: 'number' },
                  afiliadoId: { type: 'number' },
                  nivel0Id: { type: 'number', nullable: true },
                  nivel1Id: { type: 'number', nullable: true },
                  nivel2Id: { type: 'number', nullable: true },
                  nivel3Id: { type: 'number', nullable: true },
                  claveOrganica0: { type: 'string', nullable: true },
                  claveOrganica1: { type: 'string', nullable: true },
                  claveOrganica2: { type: 'string', nullable: true },
                  claveOrganica3: { type: 'string', nullable: true },
                  interno: { type: 'number', nullable: true },
                  sueldo: { type: 'number', nullable: true },
                  otrasPrestaciones: { type: 'number', nullable: true },
                  quinquenios: { type: 'number', nullable: true },
                  activo: { type: 'boolean' },
                  fechaMovAlt: { type: 'string', nullable: true },
                  orgs1: { type: 'string', nullable: true },
                  orgs2: { type: 'string', nullable: true },
                  orgs3: { type: 'string', nullable: true },
                  orgs4: { type: 'string', nullable: true },
                  dSueldo: { type: 'string', nullable: true },
                  dOtrasPrestaciones: { type: 'string', nullable: true },
                  dQuinquenios: { type: 'string', nullable: true },
                  aplicar: { type: 'boolean', nullable: true },
                  bc: { type: 'string', nullable: true },
                  porcentaje: { type: 'number', nullable: true },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
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
      const { afiliadoId } = req.params as { afiliadoId: number };
      const records = await getAfiliadoOrgByAfiliadoIdQuery.execute(afiliadoId);
      return reply.send(ok(records));
    } catch (error: any) {
      return handleAfiliadoOrgError(error, reply);
    }
  });

  // POST /afiliadoOrg - Create new record
  app.post('/afiliadoOrg', {
    preHandler: [requireAuth],
    schema: {
      description: 'Create new AfiliadoOrg record',
      tags: ['afiliadoOrg'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['afiliadoId'],
        properties: {
          afiliadoId: { type: 'number' },
          nivel0Id: { type: 'number' },
          nivel1Id: { type: 'number' },
          nivel2Id: { type: 'number' },
          nivel3Id: { type: 'number' },
          claveOrganica0: { type: 'string', maxLength: 30 },
          claveOrganica1: { type: 'string', maxLength: 30 },
          claveOrganica2: { type: 'string', maxLength: 30 },
          claveOrganica3: { type: 'string', maxLength: 30 },
          interno: { type: 'number' },
          sueldo: { type: 'number' },
          otrasPrestaciones: { type: 'number' },
          quinquenios: { type: 'number' },
          activo: { type: 'boolean' },
          fechaMovAlt: { type: 'string', format: 'date' },
          orgs1: { type: 'string', maxLength: 200 },
          orgs2: { type: 'string', maxLength: 200 },
          orgs3: { type: 'string', maxLength: 200 },
          orgs4: { type: 'string', maxLength: 200 },
          dSueldo: { type: 'string', maxLength: 200 },
          dOtrasPrestaciones: { type: 'string', maxLength: 200 },
          dQuinquenios: { type: 'string', maxLength: 200 },
          aplicar: { type: 'boolean' },
          bc: { type: 'string', maxLength: 30 },
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
    const parsed = CreateAfiliadoOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const record = await createAfiliadoOrgCommand.execute({
        afiliadoId: parsed.data.afiliadoId,
        nivel0Id: parsed.data.nivel0Id ?? null,
        nivel1Id: parsed.data.nivel1Id ?? null,
        nivel2Id: parsed.data.nivel2Id ?? null,
        nivel3Id: parsed.data.nivel3Id ?? null,
        claveOrganica0: parsed.data.claveOrganica0 ?? null,
        claveOrganica1: parsed.data.claveOrganica1 ?? null,
        claveOrganica2: parsed.data.claveOrganica2 ?? null,
        claveOrganica3: parsed.data.claveOrganica3 ?? null,
        interno: parsed.data.interno ?? null,
        sueldo: parsed.data.sueldo ?? null,
        otrasPrestaciones: parsed.data.otrasPrestaciones ?? null,
        quinquenios: parsed.data.quinquenios ?? null,
        activo: parsed.data.activo,
        fechaMovAlt: parsed.data.fechaMovAlt ?? null,
        orgs1: parsed.data.orgs1 ?? null,
        orgs2: parsed.data.orgs2 ?? null,
        orgs3: parsed.data.orgs3 ?? null,
        orgs4: parsed.data.orgs4 ?? null,
        dSueldo: parsed.data.dSueldo ?? null,
        dOtrasPrestaciones: parsed.data.dOtrasPrestaciones ?? null,
        dQuinquenios: parsed.data.dQuinquenios ?? null,
        aplicar: parsed.data.aplicar ?? null,
        bc: parsed.data.bc ?? null,
        porcentaje: parsed.data.porcentaje ?? null
      });
      return reply.code(201).send(ok(record));
    } catch (error: any) {
      return handleAfiliadoOrgError(error, reply);
    }
  });

  // PUT /afiliadoOrg/:id - Update record
  app.put('/afiliadoOrg/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Update AfiliadoOrg record',
      tags: ['afiliadoOrg'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        properties: {
          nivel0Id: { type: 'number' },
          nivel1Id: { type: 'number' },
          nivel2Id: { type: 'number' },
          nivel3Id: { type: 'number' },
          claveOrganica0: { type: 'string', maxLength: 30 },
          claveOrganica1: { type: 'string', maxLength: 30 },
          claveOrganica2: { type: 'string', maxLength: 30 },
          claveOrganica3: { type: 'string', maxLength: 30 },
          interno: { type: 'number' },
          sueldo: { type: 'number' },
          otrasPrestaciones: { type: 'number' },
          quinquenios: { type: 'number' },
          activo: { type: 'boolean' },
          fechaMovAlt: { type: 'string', format: 'date' },
          orgs1: { type: 'string', maxLength: 200 },
          orgs2: { type: 'string', maxLength: 200 },
          orgs3: { type: 'string', maxLength: 200 },
          orgs4: { type: 'string', maxLength: 200 },
          dSueldo: { type: 'string', maxLength: 200 },
          dOtrasPrestaciones: { type: 'string', maxLength: 200 },
          dQuinquenios: { type: 'string', maxLength: 200 },
          aplicar: { type: 'boolean' },
          bc: { type: 'string', maxLength: 30 },
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
    const { id } = req.params as { id: number };
    const parsed = UpdateAfiliadoOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const record = await updateAfiliadoOrgCommand.execute({ id, ...parsed.data });
      return reply.send(ok(record));
    } catch (error: any) {
      return handleAfiliadoOrgError(error, reply);
    }
  });

  // DELETE /afiliadoOrg/:id - Delete record
  app.delete('/afiliadoOrg/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Delete AfiliadoOrg record',
      tags: ['afiliadoOrg'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
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
      const { id } = req.params as { id: number };
      await deleteAfiliadoOrgCommand.execute(id);
      return reply.send(ok({}));
    } catch (error: any) {
      return handleAfiliadoOrgError(error, reply);
    }
  });
}