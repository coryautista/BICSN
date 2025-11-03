import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreateAfiliadoSchema, UpdateAfiliadoSchema, CreateAfiliadoAfiliadoOrgMovimientoSchema } from './afiliado.schemas.js';
import {
  getAllAfiliadosService,
  getAfiliadoByIdService,
  createAfiliadoService,
  updateAfiliadoService,
  deleteAfiliadoService,
  createAfiliadoAfiliadoOrgMovimientoService
} from './afiliado.service.js';
import { ok, fail } from '../../utils/http.js';

// Routes for Afiliado CRUD operations
export default async function afiliadoRoutes(app: FastifyInstance) {

  // GET /afiliado - List all records
  app.get('/afiliado', {
    preHandler: [requireAuth],
    schema: {
      description: 'Listar todos los registros de Afiliado',
      tags: ['afiliado'],
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
                  folio: { type: 'number' },
                  apellidoPaterno: { type: 'string', nullable: true },
                  apellidoMaterno: { type: 'string', nullable: true },
                  nombre: { type: 'string', nullable: true },
                  curp: { type: 'string', nullable: true },
                  rfc: { type: 'string', nullable: true },
                  numeroSeguroSocial: { type: 'string', nullable: true },
                  fechaNacimiento: { type: 'string', nullable: true },
                  entidadFederativaNacId: { type: 'number', nullable: true },
                  domicilioCalle: { type: 'string', nullable: true },
                  domicilioNumeroExterior: { type: 'string', nullable: true },
                  domicilioNumeroInterior: { type: 'string', nullable: true },
                  domicilioEntreCalle1: { type: 'string', nullable: true },
                  domicilioEntreCalle2: { type: 'string', nullable: true },
                  domicilioColonia: { type: 'string', nullable: true },
                  domicilioCodigoPostal: { type: 'number', nullable: true },
                  telefono: { type: 'string', nullable: true },
                  estadoCivilId: { type: 'number', nullable: true },
                  sexo: { type: 'string', nullable: true },
                  correoElectronico: { type: 'string', nullable: true },
                  estatus: { type: 'boolean' },
                  interno: { type: 'number', nullable: true },
                  noEmpleado: { type: 'string', nullable: true },
                  localidad: { type: 'string', nullable: true },
                  municipio: { type: 'string', nullable: true },
                  estado: { type: 'string', nullable: true },
                  pais: { type: 'string', nullable: true },
                  dependientes: { type: 'number', nullable: true },
                  poseeInmuebles: { type: 'boolean', nullable: true },
                  fechaCarta: { type: 'string', nullable: true },
                  nacionalidad: { type: 'string', nullable: true },
                  fechaAlta: { type: 'string', nullable: true },
                  celular: { type: 'string', nullable: true },
                  expediente: { type: 'string', nullable: true },
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
      const records = await getAllAfiliadosService();
      return reply.send(ok(records));
    } catch (error: any) {
      console.error('Error listing afiliado:', error);
      return reply.code(500).send(fail('AFILIADO_LIST_FAILED'));
    }
  });

  // GET /afiliado/:id - Get single record
  app.get('/afiliado/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener registro de Afiliado por id',
      tags: ['afiliado'],
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
                folio: { type: 'number' },
                apellidoPaterno: { type: 'string', nullable: true },
                apellidoMaterno: { type: 'string', nullable: true },
                nombre: { type: 'string', nullable: true },
                curp: { type: 'string', nullable: true },
                rfc: { type: 'string', nullable: true },
                numeroSeguroSocial: { type: 'string', nullable: true },
                fechaNacimiento: { type: 'string', nullable: true },
                entidadFederativaNacId: { type: 'number', nullable: true },
                domicilioCalle: { type: 'string', nullable: true },
                domicilioNumeroExterior: { type: 'string', nullable: true },
                domicilioNumeroInterior: { type: 'string', nullable: true },
                domicilioEntreCalle1: { type: 'string', nullable: true },
                domicilioEntreCalle2: { type: 'string', nullable: true },
                domicilioColonia: { type: 'string', nullable: true },
                domicilioCodigoPostal: { type: 'number', nullable: true },
                telefono: { type: 'string', nullable: true },
                estadoCivilId: { type: 'number', nullable: true },
                sexo: { type: 'string', nullable: true },
                correoElectronico: { type: 'string', nullable: true },
                estatus: { type: 'boolean' },
                interno: { type: 'number', nullable: true },
                noEmpleado: { type: 'string', nullable: true },
                localidad: { type: 'string', nullable: true },
                municipio: { type: 'string', nullable: true },
                estado: { type: 'string', nullable: true },
                pais: { type: 'string', nullable: true },
                dependientes: { type: 'number', nullable: true },
                poseeInmuebles: { type: 'boolean', nullable: true },
                fechaCarta: { type: 'string', nullable: true },
                nacionalidad: { type: 'string', nullable: true },
                fechaAlta: { type: 'string', nullable: true },
                celular: { type: 'string', nullable: true },
                expediente: { type: 'string', nullable: true },
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
      const record = await getAfiliadoByIdService(id);
      return reply.send(ok(record));
    } catch (error: any) {
      if (error.message === 'AFILIADO_NOT_FOUND') {
        return reply.code(404).send(fail('AFILIADO_NOT_FOUND'));
      }
      console.error('Error getting afiliado:', error);
      return reply.code(500).send(fail('AFILIADO_GET_FAILED'));
    }
  });

  // POST /afiliado - Create new record
  app.post('/afiliado', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crear nuevo registro de Afiliado',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['folio'],
        properties: {
          folio: { type: 'number' },
          apellidoPaterno: { type: 'string', maxLength: 255 },
          apellidoMaterno: { type: 'string', maxLength: 255 },
          nombre: { type: 'string', maxLength: 200 },
          curp: { type: 'string', maxLength: 18 },
          rfc: { type: 'string', maxLength: 13 },
          numeroSeguroSocial: { type: 'string', maxLength: 50 },
          fechaNacimiento: { type: 'string', format: 'date' },
          entidadFederativaNacId: { type: 'number' },
          domicilioCalle: { type: 'string', maxLength: 255 },
          domicilioNumeroExterior: { type: 'string', maxLength: 50 },
          domicilioNumeroInterior: { type: 'string', maxLength: 50 },
          domicilioEntreCalle1: { type: 'string', maxLength: 120 },
          domicilioEntreCalle2: { type: 'string', maxLength: 120 },
          domicilioColonia: { type: 'string', maxLength: 255 },
          domicilioCodigoPostal: { type: 'number' },
          telefono: { type: 'string', maxLength: 10 },
          estadoCivilId: { type: 'number' },
          sexo: { type: 'string', maxLength: 1 },
          correoElectronico: { type: 'string', maxLength: 255 },
          estatus: { type: 'boolean' },
          interno: { type: 'number' },
          noEmpleado: { type: 'string', maxLength: 20 },
          localidad: { type: 'string', maxLength: 150 },
          municipio: { type: 'string', maxLength: 150 },
          estado: { type: 'string', maxLength: 150 },
          pais: { type: 'string', maxLength: 100 },
          dependientes: { type: 'number' },
          poseeInmuebles: { type: 'boolean' },
          fechaCarta: { type: 'string', format: 'date' },
          nacionalidad: { type: 'string', maxLength: 80 },
          fechaAlta: { type: 'string', format: 'date' },
          celular: { type: 'string', maxLength: 15 },
          expediente: { type: 'string', maxLength: 50 }
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
    const parsed = CreateAfiliadoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const record = await createAfiliadoService({
        folio: parsed.data.folio,
        apellidoPaterno: parsed.data.apellidoPaterno ?? null,
        apellidoMaterno: parsed.data.apellidoMaterno ?? null,
        nombre: parsed.data.nombre ?? null,
        curp: parsed.data.curp ?? null,
        rfc: parsed.data.rfc ?? null,
        numeroSeguroSocial: parsed.data.numeroSeguroSocial ?? null,
        fechaNacimiento: parsed.data.fechaNacimiento ?? null,
        entidadFederativaNacId: parsed.data.entidadFederativaNacId ?? null,
        domicilioCalle: parsed.data.domicilioCalle ?? null,
        domicilioNumeroExterior: parsed.data.domicilioNumeroExterior ?? null,
        domicilioNumeroInterior: parsed.data.domicilioNumeroInterior ?? null,
        domicilioEntreCalle1: parsed.data.domicilioEntreCalle1 ?? null,
        domicilioEntreCalle2: parsed.data.domicilioEntreCalle2 ?? null,
        domicilioColonia: parsed.data.domicilioColonia ?? null,
        domicilioCodigoPostal: parsed.data.domicilioCodigoPostal ?? null,
        telefono: parsed.data.telefono ?? null,
        estadoCivilId: parsed.data.estadoCivilId ?? null,
        sexo: parsed.data.sexo ?? null,
        correoElectronico: parsed.data.correoElectronico ?? null,
        estatus: parsed.data.estatus,
        interno: parsed.data.interno ?? null,
        noEmpleado: parsed.data.noEmpleado ?? null,
        localidad: parsed.data.localidad ?? null,
        municipio: parsed.data.municipio ?? null,
        estado: parsed.data.estado ?? null,
        pais: parsed.data.pais ?? null,
        dependientes: parsed.data.dependientes ?? null,
        poseeInmuebles: parsed.data.poseeInmuebles ?? null,
        fechaCarta: parsed.data.fechaCarta ?? null,
        nacionalidad: parsed.data.nacionalidad ?? null,
        fechaAlta: parsed.data.fechaAlta ?? null,
        celular: parsed.data.celular ?? null,
        expediente: parsed.data.expediente ?? null,
        quincenaAplicacion: parsed.data.quincenaAplicacion ?? null,
        anioAplicacion: parsed.data.anioAplicacion ?? null
      });
      return reply.code(201).send(ok(record));
    } catch (error: any) {
      console.error('Error creating afiliado:', error);
      return reply.code(500).send(fail('AFILIADO_CREATE_FAILED'));
    }
  });

  // PUT /afiliado/:id - Update record
  app.put('/afiliado/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Actualizar registro de Afiliado',
      tags: ['afiliado'],
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
          apellidoPaterno: { type: 'string', maxLength: 255 },
          apellidoMaterno: { type: 'string', maxLength: 255 },
          nombre: { type: 'string', maxLength: 200 },
          curp: { type: 'string', maxLength: 18 },
          rfc: { type: 'string', maxLength: 13 },
          numeroSeguroSocial: { type: 'string', maxLength: 50 },
          fechaNacimiento: { type: 'string', format: 'date' },
          entidadFederativaNacId: { type: 'number' },
          domicilioCalle: { type: 'string', maxLength: 255 },
          domicilioNumeroExterior: { type: 'string', maxLength: 50 },
          domicilioNumeroInterior: { type: 'string', maxLength: 50 },
          domicilioEntreCalle1: { type: 'string', maxLength: 120 },
          domicilioEntreCalle2: { type: 'string', maxLength: 120 },
          domicilioColonia: { type: 'string', maxLength: 255 },
          domicilioCodigoPostal: { type: 'number' },
          telefono: { type: 'string', maxLength: 10 },
          estadoCivilId: { type: 'number' },
          sexo: { type: 'string', maxLength: 1 },
          correoElectronico: { type: 'string', maxLength: 255 },
          estatus: { type: 'boolean' },
          interno: { type: 'number' },
          noEmpleado: { type: 'string', maxLength: 20 },
          localidad: { type: 'string', maxLength: 150 },
          municipio: { type: 'string', maxLength: 150 },
          estado: { type: 'string', maxLength: 150 },
          pais: { type: 'string', maxLength: 100 },
          dependientes: { type: 'number' },
          poseeInmuebles: { type: 'boolean' },
          fechaCarta: { type: 'string', format: 'date' },
          nacionalidad: { type: 'string', maxLength: 80 },
          fechaAlta: { type: 'string', format: 'date' },
          celular: { type: 'string', maxLength: 15 },
          expediente: { type: 'string', maxLength: 50 }
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
    const parsed = UpdateAfiliadoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const record = await updateAfiliadoService(id, parsed.data);
      return reply.send(ok(record));
    } catch (error: any) {
      if (error.message === 'AFILIADO_NOT_FOUND') {
        return reply.code(404).send(fail('AFILIADO_NOT_FOUND'));
      }
      console.error('Error updating afiliado:', error);
      return reply.code(500).send(fail('AFILIADO_UPDATE_FAILED'));
    }
  });

  // POST /afiliado/complete - Create afiliado, afiliadoOrg and movimiento together
  app.post('/afiliado/complete', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crear registro completo de Afiliado con AfiliadoOrg y Movimiento. NOTA: claveOrganica0 a claveOrganica3 se obtienen automáticamente del usuario autenticado. nivel0Id a nivel3Id no deben enviarse. orgs1-orgs4 se construyen automáticamente concatenando las claveOrganica. tipoMovimientoId es siempre 1. creadoPor es el usuario autenticado. folio, fechaAlta, fechaCarta, fechaMovAlt, quincenaId, fechaMov, folioMov, estatusMov, aplicar, activo, poseeInmuebles y dependientes se calculan/asignan automáticamente.',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'curp', 'rfc', 'numeroSeguroSocial', 'fechaNacimiento', 'entidadFederativaNacId', 'domicilioCalle', 'domicilioNumeroExterior', 'domicilioColonia', 'domicilioCodigoPostal', 'telefono', 'estadoCivilId', 'sexo', 'correoElectronico', 'noEmpleado', 'localidad', 'municipio', 'estado', 'pais', 'nacionalidad', 'celular', 'expediente', 'sueldo', 'otrasPrestaciones', 'quinquenios'],
        properties: {
          // Afiliado fields
          apellidoPaterno: { type: 'string', maxLength: 255 },
          apellidoMaterno: { type: 'string', maxLength: 255 },
          nombre: { type: 'string', maxLength: 200 },
          curp: { type: 'string', maxLength: 18 },
          rfc: { type: 'string', maxLength: 13 },
          numeroSeguroSocial: { type: 'string', maxLength: 50 },
          fechaNacimiento: { type: 'string', format: 'date' },
          entidadFederativaNacId: { type: 'number' },
          domicilioCalle: { type: 'string', maxLength: 255 },
          domicilioNumeroExterior: { type: 'string', maxLength: 50 },
          domicilioNumeroInterior: { type: 'string', maxLength: 50, nullable: true },
          domicilioEntreCalle1: { type: 'string', maxLength: 120, nullable: true },
          domicilioEntreCalle2: { type: 'string', maxLength: 120, nullable: true },
          domicilioColonia: { type: 'string', maxLength: 255 },
          domicilioCodigoPostal: { type: 'number' },
          telefono: { type: 'string', maxLength: 10 },
          estadoCivilId: { type: 'number' },
          sexo: { type: 'string', maxLength: 1 },
          correoElectronico: { type: 'string', maxLength: 255 },
          estatus: { type: 'boolean', nullable: true },
          interno: { type: 'number', nullable: true },
          noEmpleado: { type: 'string', maxLength: 20 },
          localidad: { type: 'string', maxLength: 150 },
          municipio: { type: 'string', maxLength: 150 },
          estado: { type: 'string', maxLength: 150 },
          pais: { type: 'string', maxLength: 100 },
          fechaCarta: { type: 'string', format: 'date', nullable: true },
          nacionalidad: { type: 'string', maxLength: 80 },
          fechaAlta: { type: 'string', format: 'date', nullable: true },
          celular: { type: 'string', maxLength: 15 },
          expediente: { type: 'string', maxLength: 50 },
          // AfiliadoOrg fields (solo los que deben enviarse)
          internoOrg: { type: 'number', nullable: true },
          sueldo: { type: 'number' },
          otrasPrestaciones: { type: 'number' },
          quinquenios: { type: 'number' },
          dSueldo: { type: 'string', maxLength: 200, nullable: true },
          dOtrasPrestaciones: { type: 'string', maxLength: 200, nullable: true },
          dQuinquenios: { type: 'string', maxLength: 200, nullable: true },
          bc: { type: 'string', maxLength: 30, nullable: true },
          porcentaje: { type: 'number', nullable: true },
          // Movimiento fields
          observaciones: { type: 'string', maxLength: 1024, nullable: true }
        }
      }
      // Response schema removed to allow full object serialization
    }
  }, async (req, reply) => {
    const parsed = CreateAfiliadoAfiliadoOrgMovimientoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      // Obtener userId del token
      const userId = req.user?.sub ? parseInt(req.user.sub, 10) : null;
      
      // Obtener claveOrganica0 a claveOrganica3 del usuario autenticado (ya son strings)
      const claveOrganica0 = req.user?.idOrganica0 ?? null;
      const claveOrganica1 = req.user?.idOrganica1 ?? null;
      const claveOrganica2 = req.user?.idOrganica2 ?? null;
      const claveOrganica3 = req.user?.idOrganica3 ?? null;
      
      const result = await createAfiliadoAfiliadoOrgMovimientoService({
        ...parsed.data,
        // Valores por defecto que pueden ser sobrescritos
        estatus: parsed.data.estatus ?? true,
        interno: parsed.data.interno ?? 0,
        creadoPor: userId ?? 1,
        tipoMovimientoId: 1,
        // Valores opcionales vacíos
        domicilioNumeroInterior: parsed.data.domicilioNumeroInterior ?? '',
        bc: parsed.data.bc ?? '',
        // Campos automáticos que no están en el swagger
        activo: true,
        aplicar: true,
        poseeInmuebles: false,
        dependientes: 0,
        estatusMov: 'A',
        folioMov: '',
        // Asignar claveOrganica del usuario autenticado (sobrescribe los valores del body)
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        claveOrganica3,
        // nivel0Id a nivel3Id no se registran (siempre null)
        nivel0Id: null,
        nivel1Id: null,
        nivel2Id: null,
        nivel3Id: null,
        // Construir orgs1 a orgs4 concatenando claveOrganica
        orgs1: [claveOrganica0, claveOrganica1].filter(Boolean).join(''),
        orgs2: [claveOrganica0, claveOrganica1, claveOrganica2].filter(Boolean).join(''),
        orgs3: [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join(''),
        orgs4: [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('')
      });
      return reply.code(201).send(ok(result));
    } catch (error: any) {
      console.error('Error creating complete afiliado:', error);
      return reply.code(500).send(fail(`AFILIADO_CREATE_FAILED: ${error.message || error}`));
    }
  });

  // DELETE /afiliado/:id - Delete record
  app.delete('/afiliado/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Eliminar registro de Afiliado',
      tags: ['afiliado'],
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
      await deleteAfiliadoService(id);
      return reply.send(ok({}));
    } catch (error: any) {
      if (error.message === 'AFILIADO_NOT_FOUND') {
        return reply.code(404).send(fail('AFILIADO_NOT_FOUND'));
      }
      console.error('Error deleting afiliado:', error);
      return reply.code(500).send(fail('AFILIADO_DELETE_FAILED'));
    }
  });
}