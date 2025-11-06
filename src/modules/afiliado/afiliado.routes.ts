import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CreateAfiliadoSchema, UpdateAfiliadoSchema, CreateAfiliadoAfiliadoOrgMovimientoSchema, CreateCambioSueldoSchema, CreateBajaPermanenteSchema, CreateBajaSuspensionSchema, CreateBajaTerminaSuspensionSchema, CreateBajaTerminaSuspensionYBajaSchema } from './afiliado.schemas.js';
import {
  getAllAfiliadosService,
  getAfiliadoByIdService,
  createAfiliadoService,
  updateAfiliadoService,
  deleteAfiliadoService,
  createAfiliadoAfiliadoOrgMovimientoService,
  validateInternoInFirebird,
  getMovimientosQuincenalesService
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
      const userUid = req.user?.sub ?? null; // UUID del usuario

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
        orgs4: [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join(''),
        // Agregar creadoPorUid del usuario autenticado
        creadoPorUid: userUid
      });
      return reply.code(201).send(ok(result));
    } catch (error: any) {
      console.error('Error creating complete afiliado:', error);
      return reply.code(500).send(fail(`AFILIADO_CREATE_FAILED: ${error.message || error}`));
    }
  });

  // POST /afiliado/cambio-sueldo - Create salary change movement
  app.post('/afiliado/cambio-sueldo', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crear movimiento de cambio de sueldo (tipoMovimientoId=5). Similar a /afiliado/complete pero para cambios de sueldo. Los campos claveOrganica0-3, orgs1-4 y otros se obtienen automáticamente del usuario autenticado. El campo expediente es opcional y si no se proporciona se utilizará la CURP como identificador de documentos en el FTP.',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'curp', 'rfc', 'numeroSeguroSocial', 'fechaNacimiento', 'entidadFederativaNacId', 'domicilioCalle', 'domicilioNumeroExterior', 'domicilioColonia', 'domicilioCodigoPostal', 'telefono', 'estadoCivilId', 'sexo', 'correoElectronico', 'noEmpleado', 'localidad', 'municipio', 'estado', 'pais', 'nacionalidad', 'celular', 'sueldo', 'otrasPrestaciones', 'quinquenios', 'interno'],
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
          interno: { type: 'number', minimum: 1 },
          noEmpleado: { type: 'string', maxLength: 20 },
          localidad: { type: 'string', maxLength: 150 },
          municipio: { type: 'string', maxLength: 150 },
          estado: { type: 'string', maxLength: 150 },
          pais: { type: 'string', maxLength: 100 },
          fechaCarta: { type: 'string', format: 'date', nullable: true },
          nacionalidad: { type: 'string', maxLength: 80 },
          fechaAlta: { type: 'string', format: 'date', nullable: true },
          celular: { type: 'string', maxLength: 15 },
          expediente: { type: 'string', maxLength: 50, nullable: true, description: 'Identificador de expediente. Si no se proporciona, se utilizará la CURP como identificador de documentos en el FTP.' },
          // AfiliadoOrg fields
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
    }
  }, async (req, reply) => {
    const parsed = CreateCambioSueldoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      // Validar que el interno exista en Firebird
      const internoExists = await validateInternoInFirebird(parsed.data.interno!);
      if (!internoExists) {
        return reply.code(404).send(fail('INTERNO_NOT_FOUND_IN_FIREBIRD: El número de interno no existe en las tablas PERSONAL y ORG_PERSONAL'));
      }

      // Obtener userId del token
      const userId = req.user?.sub ? parseInt(req.user.sub, 10) : null;
      
      // Obtener claveOrganica0 a claveOrganica3 del usuario autenticado
      const claveOrganica0 = req.user?.idOrganica0 ?? null;
      const claveOrganica1 = req.user?.idOrganica1 ?? null;
      const claveOrganica2 = req.user?.idOrganica2 ?? null;
      const claveOrganica3 = req.user?.idOrganica3 ?? null;
      
      const result = await createAfiliadoAfiliadoOrgMovimientoService({
        ...parsed.data,
        estatus: parsed.data.estatus ?? true,
        interno: parsed.data.interno, // Usar el interno del body (obligatorio)
        creadoPor: userId ?? 1,
        tipoMovimientoId: 5, // CAMBIO DE SUELDO
        domicilioNumeroInterior: parsed.data.domicilioNumeroInterior ?? '',
        bc: parsed.data.bc ?? '',
        activo: true,
        aplicar: true,
        poseeInmuebles: false,
        dependientes: 0,
        estatusMov: 'A',
        folioMov: '',
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        claveOrganica3,
        nivel0Id: null,
        nivel1Id: null,
        nivel2Id: null,
        nivel3Id: null,
        orgs1: [claveOrganica0, claveOrganica1].filter(Boolean).join(''),
        orgs2: [claveOrganica0, claveOrganica1, claveOrganica2].filter(Boolean).join(''),
        orgs3: [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join(''),
        orgs4: [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('')
      });
      return reply.code(201).send(ok(result));
    } catch (error: any) {
      console.error('Error creating salary change:', error);
      return reply.code(500).send(fail(`SALARY_CHANGE_CREATE_FAILED: ${error.message || error}`));
    }
  });

  // POST /afiliado/baja-permanente - Create permanent discharge movement
  app.post('/afiliado/baja-permanente', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crear movimiento de baja permanente (tipoMovimientoId=2). Similar a /afiliado/complete pero para bajas permanentes. Los campos claveOrganica0-3, orgs1-4 y otros se obtienen automáticamente del usuario autenticado. El campo expediente es opcional y si no se proporciona se utilizará la CURP como identificador de documentos en el FTP.',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'curp', 'rfc', 'numeroSeguroSocial', 'fechaNacimiento', 'entidadFederativaNacId', 'domicilioCalle', 'domicilioNumeroExterior', 'domicilioColonia', 'domicilioCodigoPostal', 'telefono', 'estadoCivilId', 'sexo', 'correoElectronico', 'noEmpleado', 'localidad', 'municipio', 'estado', 'pais', 'nacionalidad', 'celular', 'sueldo', 'otrasPrestaciones', 'quinquenios', 'interno'],
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
          interno: { type: 'number', minimum: 1 },
          noEmpleado: { type: 'string', maxLength: 20 },
          localidad: { type: 'string', maxLength: 150 },
          municipio: { type: 'string', maxLength: 150 },
          estado: { type: 'string', maxLength: 150 },
          pais: { type: 'string', maxLength: 100 },
          fechaCarta: { type: 'string', format: 'date', nullable: true },
          nacionalidad: { type: 'string', maxLength: 80 },
          fechaAlta: { type: 'string', format: 'date', nullable: true },
          celular: { type: 'string', maxLength: 15 },
          expediente: { type: 'string', maxLength: 50, nullable: true, description: 'Identificador de expediente. Si no se proporciona, se utilizará la CURP como identificador de documentos en el FTP.' },
          // AfiliadoOrg fields
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
    }
  }, async (req, reply) => {
    const parsed = CreateBajaPermanenteSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      // Validar que el interno exista en Firebird
      const internoExists = await validateInternoInFirebird(parsed.data.interno!);
      if (!internoExists) {
        return reply.code(404).send(fail('INTERNO_NOT_FOUND_IN_FIREBIRD: El número de interno no existe en las tablas PERSONAL y ORG_PERSONAL'));
      }

      // Obtener userId del token
      const userId = req.user?.sub ? parseInt(req.user.sub, 10) : null;

      // Obtener claveOrganica0 a claveOrganica3 del usuario autenticado
      const claveOrganica0 = req.user?.idOrganica0 ?? null;
      const claveOrganica1 = req.user?.idOrganica1 ?? null;
      const claveOrganica2 = req.user?.idOrganica2 ?? null;
      const claveOrganica3 = req.user?.idOrganica3 ?? null;

      const result = await createAfiliadoAfiliadoOrgMovimientoService({
        ...parsed.data,
        estatus: parsed.data.estatus ?? true,
        interno: parsed.data.interno, // Usar el interno del body (obligatorio)
        creadoPor: userId ?? 1,
        tipoMovimientoId: 2, // BAJA PERMANENTE
        domicilioNumeroInterior: parsed.data.domicilioNumeroInterior ?? '',
        bc: parsed.data.bc ?? '',
        activo: true,
        aplicar: true,
        poseeInmuebles: false,
        dependientes: 0,
        estatusMov: 'A',
        folioMov: '',
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        claveOrganica3,
        nivel0Id: null,
        nivel1Id: null,
        nivel2Id: null,
        nivel3Id: null,
        orgs1: [claveOrganica0, claveOrganica1].filter(Boolean).join(''),
        orgs2: [claveOrganica0, claveOrganica1, claveOrganica2].filter(Boolean).join(''),
        orgs3: [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join(''),
        orgs4: [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('')
      });
      return reply.code(201).send(ok(result));
    } catch (error: any) {
      console.error('Error creating permanent discharge:', error);
      return reply.code(500).send(fail(`PERMANENT_DISCHARGE_CREATE_FAILED: ${error.message || error}`));
    }
  });

  // POST /afiliado/baja-suspension - Create affiliation suspension movement
  app.post('/afiliado/baja-suspension', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crear movimiento de baja suspensión de afiliación (tipoMovimientoId=3). Similar a /afiliado/complete pero para suspensiones de afiliación. Los campos claveOrganica0-3, orgs1-4 y otros se obtienen automáticamente del usuario autenticado. El campo expediente es opcional y si no se proporciona se utilizará la CURP como identificador de documentos en el FTP.',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'curp', 'rfc', 'numeroSeguroSocial', 'fechaNacimiento', 'entidadFederativaNacId', 'domicilioCalle', 'domicilioNumeroExterior', 'domicilioColonia', 'domicilioCodigoPostal', 'telefono', 'estadoCivilId', 'sexo', 'correoElectronico', 'noEmpleado', 'localidad', 'municipio', 'estado', 'pais', 'nacionalidad', 'celular', 'sueldo', 'otrasPrestaciones', 'quinquenios', 'interno'],
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
          interno: { type: 'number', minimum: 1 },
          noEmpleado: { type: 'string', maxLength: 20 },
          localidad: { type: 'string', maxLength: 150 },
          municipio: { type: 'string', maxLength: 150 },
          estado: { type: 'string', maxLength: 150 },
          pais: { type: 'string', maxLength: 100 },
          fechaCarta: { type: 'string', format: 'date', nullable: true },
          nacionalidad: { type: 'string', maxLength: 80 },
          fechaAlta: { type: 'string', format: 'date', nullable: true },
          celular: { type: 'string', maxLength: 15 },
          expediente: { type: 'string', maxLength: 50, nullable: true, description: 'Identificador de expediente. Si no se proporciona, se utilizará la CURP como identificador de documentos en el FTP.' },
          // AfiliadoOrg fields
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
    }
  }, async (req, reply) => {
    const parsed = CreateBajaSuspensionSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      // Validar que el interno exista en Firebird
      const internoExists = await validateInternoInFirebird(parsed.data.interno!);
      if (!internoExists) {
        return reply.code(404).send(fail('INTERNO_NOT_FOUND_IN_FIREBIRD: El número de interno no existe en las tablas PERSONAL y ORG_PERSONAL'));
      }

      // Obtener userId del token
      const userId = req.user?.sub ? parseInt(req.user.sub, 10) : null;

      // Obtener claveOrganica0 a claveOrganica3 del usuario autenticado
      const claveOrganica0 = req.user?.idOrganica0 ?? null;
      const claveOrganica1 = req.user?.idOrganica1 ?? null;
      const claveOrganica2 = req.user?.idOrganica2 ?? null;
      const claveOrganica3 = req.user?.idOrganica3 ?? null;

      const result = await createAfiliadoAfiliadoOrgMovimientoService({
        ...parsed.data,
        estatus: parsed.data.estatus ?? true,
        interno: parsed.data.interno, // Usar el interno del body (obligatorio)
        creadoPor: userId ?? 1,
        tipoMovimientoId: 3, // BAJA SUSPENSIÓN DE AFILIACIÓN
        domicilioNumeroInterior: parsed.data.domicilioNumeroInterior ?? '',
        bc: parsed.data.bc ?? '',
        activo: true,
        aplicar: true,
        poseeInmuebles: false,
        dependientes: 0,
        estatusMov: 'A',
        folioMov: '',
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        claveOrganica3,
        nivel0Id: null,
        nivel1Id: null,
        nivel2Id: null,
        nivel3Id: null,
        orgs1: [claveOrganica0, claveOrganica1].filter(Boolean).join(''),
        orgs2: [claveOrganica0, claveOrganica1, claveOrganica2].filter(Boolean).join(''),
        orgs3: [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join(''),
        orgs4: [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('')
      });
      return reply.code(201).send(ok(result));
    } catch (error: any) {
      console.error('Error creating affiliation suspension:', error);
      return reply.code(500).send(fail(`AFFILIATION_SUSPENSION_CREATE_FAILED: ${error.message || error}`));
    }
  });

  // POST /afiliado/baja-termina-suspension - Create affiliation suspension termination movement
  app.post('/afiliado/baja-termina-suspension', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crear movimiento de baja termina suspensión de afiliación (tipoMovimientoId=4). Similar a /afiliado/complete pero para terminación de suspensiones de afiliación. Los campos claveOrganica0-3, orgs1-4 y otros se obtienen automáticamente del usuario autenticado. El campo expediente es opcional y si no se proporciona se utilizará la CURP como identificador de documentos en el FTP.',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'curp', 'rfc', 'numeroSeguroSocial', 'fechaNacimiento', 'entidadFederativaNacId', 'domicilioCalle', 'domicilioNumeroExterior', 'domicilioColonia', 'domicilioCodigoPostal', 'telefono', 'estadoCivilId', 'sexo', 'correoElectronico', 'noEmpleado', 'localidad', 'municipio', 'estado', 'pais', 'nacionalidad', 'celular', 'sueldo', 'otrasPrestaciones', 'quinquenios', 'interno'],
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
          interno: { type: 'number', minimum: 1 },
          noEmpleado: { type: 'string', maxLength: 20 },
          localidad: { type: 'string', maxLength: 150 },
          municipio: { type: 'string', maxLength: 150 },
          estado: { type: 'string', maxLength: 150 },
          pais: { type: 'string', maxLength: 100 },
          fechaCarta: { type: 'string', format: 'date', nullable: true },
          nacionalidad: { type: 'string', maxLength: 80 },
          fechaAlta: { type: 'string', format: 'date', nullable: true },
          celular: { type: 'string', maxLength: 15 },
          expediente: { type: 'string', maxLength: 50, nullable: true, description: 'Identificador de expediente. Si no se proporciona, se utilizará la CURP como identificador de documentos en el FTP.' },
          internoOrg: { type: 'number', nullable: true },
          sueldo: { type: 'number' },
          otrasPrestaciones: { type: 'number' },
          quinquenios: { type: 'number' },
          dSueldo: { type: 'string', maxLength: 200, nullable: true },
          dOtrasPrestaciones: { type: 'string', maxLength: 200, nullable: true },
          dQuinquenios: { type: 'string', maxLength: 200, nullable: true },
          bc: { type: 'string', maxLength: 30, nullable: true },
          porcentaje: { type: 'number', nullable: true },
          observaciones: { type: 'string', maxLength: 1024, nullable: true }
        }
      }
    }
  }, async (req, reply) => {
    const parsed = CreateBajaTerminaSuspensionSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const internoExists = await validateInternoInFirebird(parsed.data.interno!);
      if (!internoExists) {
        return reply.code(404).send(fail('INTERNO_NOT_FOUND_IN_FIREBIRD: El número de interno no existe en las tablas PERSONAL y ORG_PERSONAL'));
      }

      const userId = req.user?.sub ? parseInt(req.user.sub, 10) : null;
      const claveOrganica0 = req.user?.idOrganica0 ?? null;
      const claveOrganica1 = req.user?.idOrganica1 ?? null;
      const claveOrganica2 = req.user?.idOrganica2 ?? null;
      const claveOrganica3 = req.user?.idOrganica3 ?? null;

      const result = await createAfiliadoAfiliadoOrgMovimientoService({
        ...parsed.data,
        estatus: parsed.data.estatus ?? true,
        interno: parsed.data.interno,
        creadoPor: userId ?? 1,
        tipoMovimientoId: 4,
        domicilioNumeroInterior: parsed.data.domicilioNumeroInterior ?? '',
        bc: parsed.data.bc ?? '',
        activo: true,
        aplicar: true,
        poseeInmuebles: false,
        dependientes: 0,
        estatusMov: 'A',
        folioMov: '',
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        claveOrganica3,
        nivel0Id: null,
        nivel1Id: null,
        nivel2Id: null,
        nivel3Id: null,
        orgs1: [claveOrganica0, claveOrganica1].filter(Boolean).join(''),
        orgs2: [claveOrganica0, claveOrganica1, claveOrganica2].filter(Boolean).join(''),
        orgs3: [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join(''),
        orgs4: [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('')
      });
      return reply.code(201).send(ok(result));
    } catch (error: any) {
      console.error('Error creating affiliation suspension termination:', error);
      return reply.code(500).send(fail(`AFFILIATION_SUSPENSION_TERMINATION_CREATE_FAILED: ${error.message || error}`));
    }
  });

  // POST /afiliado/baja-termina-suspension-y-baja - Create affiliation suspension termination and discharge movement
  app.post('/afiliado/baja-termina-suspension-y-baja', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crear movimiento de baja termina suspensión de afiliación y baja (tipoMovimientoId=6). Similar a /afiliado/complete pero para terminación de suspensiones de afiliación y baja simultánea. Los campos claveOrganica0-3, orgs1-4 y otros se obtienen automáticamente del usuario autenticado. El campo expediente es opcional y si no se proporciona se utilizará la CURP como identificador de documentos en el FTP.',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'curp', 'rfc', 'numeroSeguroSocial', 'fechaNacimiento', 'entidadFederativaNacId', 'domicilioCalle', 'domicilioNumeroExterior', 'domicilioColonia', 'domicilioCodigoPostal', 'telefono', 'estadoCivilId', 'sexo', 'correoElectronico', 'noEmpleado', 'localidad', 'municipio', 'estado', 'pais', 'nacionalidad', 'celular', 'sueldo', 'otrasPrestaciones', 'quinquenios', 'interno'],
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
          interno: { type: 'number', minimum: 1 },
          noEmpleado: { type: 'string', maxLength: 20 },
          localidad: { type: 'string', maxLength: 150 },
          municipio: { type: 'string', maxLength: 150 },
          estado: { type: 'string', maxLength: 150 },
          pais: { type: 'string', maxLength: 100 },
          fechaCarta: { type: 'string', format: 'date', nullable: true },
          nacionalidad: { type: 'string', maxLength: 80 },
          fechaAlta: { type: 'string', format: 'date', nullable: true },
          celular: { type: 'string', maxLength: 15 },
          expediente: { type: 'string', maxLength: 50, nullable: true, description: 'Identificador de expediente. Si no se proporciona, se utilizará la CURP como identificador de documentos en el FTP.' },
          internoOrg: { type: 'number', nullable: true },
          sueldo: { type: 'number' },
          otrasPrestaciones: { type: 'number' },
          quinquenios: { type: 'number' },
          dSueldo: { type: 'string', maxLength: 200, nullable: true },
          dOtrasPrestaciones: { type: 'string', maxLength: 200, nullable: true },
          dQuinquenios: { type: 'string', maxLength: 200, nullable: true },
          bc: { type: 'string', maxLength: 30, nullable: true },
          porcentaje: { type: 'number', nullable: true },
          observaciones: { type: 'string', maxLength: 1024, nullable: true }
        }
      }
    }
  }, async (req, reply) => {
    const parsed = CreateBajaTerminaSuspensionYBajaSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const internoExists = await validateInternoInFirebird(parsed.data.interno!);
      if (!internoExists) {
        return reply.code(404).send(fail('INTERNO_NOT_FOUND_IN_FIREBIRD: El número de interno no existe en las tablas PERSONAL y ORG_PERSONAL'));
      }

      const userId = req.user?.sub ? parseInt(req.user.sub, 10) : null;
      const claveOrganica0 = req.user?.idOrganica0 ?? null;
      const claveOrganica1 = req.user?.idOrganica1 ?? null;
      const claveOrganica2 = req.user?.idOrganica2 ?? null;
      const claveOrganica3 = req.user?.idOrganica3 ?? null;

      const result = await createAfiliadoAfiliadoOrgMovimientoService({
        ...parsed.data,
        estatus: parsed.data.estatus ?? true,
        interno: parsed.data.interno,
        creadoPor: userId ?? 1,
        tipoMovimientoId: 6,
        domicilioNumeroInterior: parsed.data.domicilioNumeroInterior ?? '',
        bc: parsed.data.bc ?? '',
        activo: true,
        aplicar: true,
        poseeInmuebles: false,
        dependientes: 0,
        estatusMov: 'A',
        folioMov: '',
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        claveOrganica3,
        nivel0Id: null,
        nivel1Id: null,
        nivel2Id: null,
        nivel3Id: null,
        orgs1: [claveOrganica0, claveOrganica1].filter(Boolean).join(''),
        orgs2: [claveOrganica0, claveOrganica1, claveOrganica2].filter(Boolean).join(''),
        orgs3: [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join(''),
        orgs4: [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('')
      });
      return reply.code(201).send(ok(result));
    } catch (error: any) {
      console.error('Error creating affiliation suspension termination and discharge:', error);
      return reply.code(500).send(fail(`AFFILIATION_SUSPENSION_TERMINATION_AND_DISCHARGE_CREATE_FAILED: ${error.message || error}`));
    }
  });

  // GET /afiliado/obtener-movimientos-quincenales - Get movimientos quincenales by user org
  app.get('/afiliado/obtener-movimientos-quincenales', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener listado de afiliados, afiliadosOrg y movimientos quincenales filtrados por org0 y org1 del usuario autenticado, donde estatus de afiliado = 1 y estatus de movimientos = "A". Omite campos de control y auditoria.',
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
                  afiliado: {
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
                      quincenaAplicacion: { type: 'number', nullable: true },
                      anioAplicacion: { type: 'number', nullable: true }
                    }
                  },
                  afiliadoOrg: {
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
                      activo: { type: 'boolean', nullable: true },
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
                      porcentaje: { type: 'number', nullable: true }
                    }
                  },
                  movimiento: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      quincenaId: { type: 'string' },
                      tipoMovimientoId: { type: 'number' },
                      afiliadoId: { type: 'number' },
                      fecha: { type: 'string', nullable: true },
                      observaciones: { type: 'string', nullable: true },
                      folio: { type: 'string', nullable: true },
                      estatus: { type: 'string' },
                      creadoPor: { type: 'number', nullable: true },
                      creadoPorUid: { type: 'string', nullable: true }
                    }
                  }
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
      // Obtener org0 y org1 del usuario autenticado
      const userOrg0 = req.user?.idOrganica0 ?? '';
      const userOrg1 = req.user?.idOrganica1 ?? '';

      if (!userOrg0 || !userOrg1) {
        return reply.code(400).send(fail('USER_ORGANICA_NOT_FOUND: Usuario no tiene orgánica configurada'));
      }

      const movimientos = await getMovimientosQuincenalesService(userOrg0, userOrg1);
      return reply.send(ok(movimientos));
    } catch (error: any) {
      console.error('Error getting movimientos quincenales:', error);
      return reply.code(500).send(fail('MOVIMIENTOS_QUINCENALES_GET_FAILED'));
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