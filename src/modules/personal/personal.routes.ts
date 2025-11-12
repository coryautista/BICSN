import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreatePersonalSchema, UpdatePersonalSchema } from './personal.schemas.js';
import { ok } from '../../utils/http.js';
import { handlePersonalError } from './infrastructure/errorHandler.js';
import { GetAllPersonalQuery } from './application/queries/GetAllPersonalQuery.js';
import { GetPersonalByIdQuery } from './application/queries/GetPersonalByIdQuery.js';
import { CreatePersonalCommand } from './application/commands/CreatePersonalCommand.js';
import { UpdatePersonalCommand } from './application/commands/UpdatePersonalCommand.js';
import { DeletePersonalCommand } from './application/commands/DeletePersonalCommand.js';

// Routes for Personal CRUD operations
export default async function personalRoutes(app: FastifyInstance) {

  // GET /personal - List all records with optional filters
  app.get('/personal', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all Personal records with optional filters by organica0 and organica1',
      tags: ['personal'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          claveOrganica0: { type: 'string', maxLength: 2 },
          claveOrganica1: { type: 'string', maxLength: 2 }
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
                  interno: { type: 'number' },
                  curp: { type: 'string', nullable: true },
                  rfc: { type: 'string', nullable: true },
                  noempleado: { type: 'string', nullable: true },
                  nombre: { type: 'string', nullable: true },
                  apellido_paterno: { type: 'string', nullable: true },
                  apellido_materno: { type: 'string', nullable: true },
                  fecha_nacimiento: { type: 'string', nullable: true },
                  seguro_social: { type: 'string', nullable: true },
                  calle_numero: { type: 'string', nullable: true },
                  fraccionamiento: { type: 'string', nullable: true },
                  codigo_postal: { type: 'string', nullable: true },
                  telefono: { type: 'string', nullable: true },
                  sexo: { type: 'string', nullable: true },
                  estado_civil: { type: 'string', nullable: true },
                  localidad: { type: 'string', nullable: true },
                  municipio: { type: 'number', nullable: true },
                  estado: { type: 'number', nullable: true },
                  pais: { type: 'number', nullable: true },
                  dependientes: { type: 'number', nullable: true },
                  posee_inmuebles: { type: 'string', nullable: true },
                  fecha_carta: { type: 'string', nullable: true },
                  email: { type: 'string', nullable: true },
                  nacionalidad: { type: 'string', nullable: true },
                  fecha_alta: { type: 'string', nullable: true },
                  celular: { type: 'string', nullable: true },
                  expediente: { type: 'string', nullable: true },
                  f_expediente: { type: 'string', nullable: true },
                  fullname: { type: 'string', nullable: true }
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
      const { claveOrganica0, claveOrganica1 } = req.query as { claveOrganica0?: string; claveOrganica1?: string };
      const userId = req.user?.sub || 'unknown';
      const getAllPersonalQuery = req.diScope.resolve<GetAllPersonalQuery>('getAllPersonalQuery');
      const records = await getAllPersonalQuery.execute(claveOrganica0, claveOrganica1, userId);
      return reply.send(ok(records));
    } catch (error) {
      return handlePersonalError(error, reply, req.user?.sub);
    }
  });

  // GET /personal/:interno - Get single record
  app.get('/personal/:interno', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get Personal record by interno',
      tags: ['personal'],
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
                curp: { type: 'string', nullable: true },
                rfc: { type: 'string', nullable: true },
                noempleado: { type: 'string', nullable: true },
                nombre: { type: 'string', nullable: true },
                apellido_paterno: { type: 'string', nullable: true },
                apellido_materno: { type: 'string', nullable: true },
                fecha_nacimiento: { type: 'string', nullable: true },
                seguro_social: { type: 'string', nullable: true },
                calle_numero: { type: 'string', nullable: true },
                fraccionamiento: { type: 'string', nullable: true },
                codigo_postal: { type: 'string', nullable: true },
                telefono: { type: 'string', nullable: true },
                sexo: { type: 'string', nullable: true },
                estado_civil: { type: 'string', nullable: true },
                localidad: { type: 'string', nullable: true },
                municipio: { type: 'number', nullable: true },
                estado: { type: 'number', nullable: true },
                pais: { type: 'number', nullable: true },
                dependientes: { type: 'number', nullable: true },
                posee_inmuebles: { type: 'string', nullable: true },
                fecha_carta: { type: 'string', nullable: true },
                email: { type: 'string', nullable: true },
                nacionalidad: { type: 'string', nullable: true },
                fecha_alta: { type: 'string', nullable: true },
                celular: { type: 'string', nullable: true },
                expediente: { type: 'string', nullable: true },
                f_expediente: { type: 'string', nullable: true },
                fullname: { type: 'string', nullable: true }
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
      const userId = req.user?.sub || 'unknown';
      const getPersonalByIdQuery = req.diScope.resolve<GetPersonalByIdQuery>('getPersonalByIdQuery');
      const record = await getPersonalByIdQuery.execute(interno, userId);
      return reply.send(ok(record));
    } catch (error) {
      return handlePersonalError(error, reply, req.user?.sub);
    }
  });

  // POST /personal - Create new record
  app.post('/personal', {
    preHandler: [requireAuth],
    schema: {
      description: 'Create new Personal record',
      tags: ['personal'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['interno'],
        properties: {
          interno: { type: 'number' },
          curp: { type: 'string', maxLength: 18 },
          rfc: { type: 'string', maxLength: 13 },
          noempleado: { type: 'string', maxLength: 10 },
          nombre: { type: 'string', maxLength: 72 },
          apellido_paterno: { type: 'string', maxLength: 20 },
          apellido_materno: { type: 'string', maxLength: 20 },
          fecha_nacimiento: { type: 'string', format: 'date' },
          seguro_social: { type: 'string', maxLength: 11 },
          calle_numero: { type: 'string', maxLength: 40 },
          fraccionamiento: { type: 'string', maxLength: 40 },
          codigo_postal: { type: 'string', maxLength: 5 },
          telefono: { type: 'string', maxLength: 15 },
          sexo: { type: 'string', maxLength: 1 },
          estado_civil: { type: 'string', maxLength: 11 },
          localidad: { type: 'string', maxLength: 25 },
          municipio: { type: 'number' },
          estado: { type: 'number' },
          pais: { type: 'number' },
          dependientes: { type: 'number' },
          posee_inmuebles: { type: 'string', maxLength: 1 },
          fecha_carta: { type: 'string', format: 'date-time' },
          email: { type: 'string', maxLength: 30 },
          nacionalidad: { type: 'string', maxLength: 1 },
          fecha_alta: { type: 'string', format: 'date-time' },
          celular: { type: 'string', maxLength: 15 },
          expediente: { type: 'string', maxLength: 1 },
          f_expediente: { type: 'string', format: 'date-time' }
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
    try {
      const parsed = CreatePersonalSchema.safeParse(req.body);
      if (!parsed.success) {
        // Los errores de validación serán manejados por las validaciones en el comando
        // pero podemos proporcionar un mensaje más específico
        const errorMessage = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        throw new Error(`Datos de personal inválidos: ${errorMessage}`);
      }

      const userId = req.user?.sub || 'unknown';
      const createPersonalCommand = req.diScope.resolve<CreatePersonalCommand>('createPersonalCommand');
      const record = await createPersonalCommand.execute({
        interno: parsed.data.interno,
        curp: parsed.data.curp ?? null,
        rfc: parsed.data.rfc ?? null,
        noempleado: parsed.data.noempleado ?? null,
        nombre: parsed.data.nombre ?? null,
        apellido_paterno: parsed.data.apellido_paterno ?? null,
        apellido_materno: parsed.data.apellido_materno ?? null,
        fecha_nacimiento: parsed.data.fecha_nacimiento ?? null,
        seguro_social: parsed.data.seguro_social ?? null,
        calle_numero: parsed.data.calle_numero ?? null,
        fraccionamiento: parsed.data.fraccionamiento ?? null,
        codigo_postal: parsed.data.codigo_postal ?? null,
        telefono: parsed.data.telefono ?? null,
        sexo: parsed.data.sexo ?? null,
        estado_civil: parsed.data.estado_civil ?? null,
        localidad: parsed.data.localidad ?? null,
        municipio: parsed.data.municipio ?? null,
        estado: parsed.data.estado ?? null,
        pais: parsed.data.pais ?? null,
        dependientes: parsed.data.dependientes ?? null,
        posee_inmuebles: parsed.data.posee_inmuebles ?? null,
        fecha_carta: parsed.data.fecha_carta ?? null,
        email: parsed.data.email ?? null,
        nacionalidad: parsed.data.nacionalidad ?? null,
        fecha_alta: parsed.data.fecha_alta ?? null,
        celular: parsed.data.celular ?? null,
        expediente: parsed.data.expediente ?? null,
        f_expediente: parsed.data.f_expediente ?? null
      }, userId);
      return reply.code(201).send(ok(record));
    } catch (error) {
      return handlePersonalError(error, reply, req.user?.sub);
    }
  });

  // PUT /personal/:interno - Update record
  app.put('/personal/:interno', {
    preHandler: [requireAuth],
    schema: {
      description: 'Update Personal record',
      tags: ['personal'],
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
          curp: { type: 'string', maxLength: 18 },
          rfc: { type: 'string', maxLength: 13 },
          noempleado: { type: 'string', maxLength: 10 },
          nombre: { type: 'string', maxLength: 72 },
          apellido_paterno: { type: 'string', maxLength: 20 },
          apellido_materno: { type: 'string', maxLength: 20 },
          fecha_nacimiento: { type: 'string', format: 'date' },
          seguro_social: { type: 'string', maxLength: 11 },
          calle_numero: { type: 'string', maxLength: 40 },
          fraccionamiento: { type: 'string', maxLength: 40 },
          codigo_postal: { type: 'string', maxLength: 5 },
          telefono: { type: 'string', maxLength: 15 },
          sexo: { type: 'string', maxLength: 1 },
          estado_civil: { type: 'string', maxLength: 11 },
          localidad: { type: 'string', maxLength: 25 },
          municipio: { type: 'number' },
          estado: { type: 'number' },
          pais: { type: 'number' },
          dependientes: { type: 'number' },
          posee_inmuebles: { type: 'string', maxLength: 1 },
          fecha_carta: { type: 'string', format: 'date-time' },
          email: { type: 'string', maxLength: 30 },
          nacionalidad: { type: 'string', maxLength: 1 },
          fecha_alta: { type: 'string', format: 'date-time' },
          celular: { type: 'string', maxLength: 15 },
          expediente: { type: 'string', maxLength: 1 },
          f_expediente: { type: 'string', format: 'date-time' }
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
    try {
      const { interno } = req.params as { interno: number };
      const parsed = UpdatePersonalSchema.safeParse(req.body);
      if (!parsed.success) {
        // Los errores de validación serán manejados por las validaciones en el comando
        const errorMessage = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        throw new Error(`Datos de actualización de personal inválidos: ${errorMessage}`);
      }

      const userId = req.user?.sub || 'unknown';
      const updatePersonalCommand = req.diScope.resolve<UpdatePersonalCommand>('updatePersonalCommand');
      const record = await updatePersonalCommand.execute(interno, parsed.data, userId);
      return reply.send(ok(record));
    } catch (error) {
      return handlePersonalError(error, reply, req.user?.sub);
    }
  });

  // DELETE /personal/:interno - Delete record
  app.delete('/personal/:interno', {
    preHandler: [requireAuth],
    schema: {
      description: 'Delete Personal record',
      tags: ['personal'],
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
      const userId = req.user?.sub || 'unknown';
      const deletePersonalCommand = req.diScope.resolve<DeletePersonalCommand>('deletePersonalCommand');
      const result = await deletePersonalCommand.execute(interno, userId);
      return reply.send(ok(result));
    } catch (error) {
      return handlePersonalError(error, reply, req.user?.sub);
    }
  });
}