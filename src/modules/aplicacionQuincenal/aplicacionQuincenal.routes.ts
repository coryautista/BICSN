import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { handleAplicacionQuincenalError } from './infrastructure/errorHandler.js';
import { 
  AportacionQuincenalResumenParamsSchema, 
  ResumenOrgQnaAllParamsSchema,
  GuardarHistoricoAportacionesSchema,
  GuardarHistoricoRetencionesSchema,
  GuardarHistoricoAportaciones,
  GuardarHistoricoRetenciones
} from './aplicacionQuincenal.schemas.js';
import { GetAportacionQuincenalResumenQuery } from './application/queries/GetAportacionQuincenalResumenQuery.js';
import { GetResumenOrgQnaAllQuery } from './application/queries/GetResumenOrgQnaAllQuery.js';
import { AplicacionQuincenalRepository } from './infrastructure/persistence/AplicacionQuincenalRepository.js';
import { GetAportacionesIndividualesQuery } from '../aportacionesFondos/application/queries/GetAportacionesIndividualesQuery.js';
import { GetAguinaldoQuery } from '../aportacionesFondos/application/queries/GetAguinaldoQuery.js';
import { GetPensionNominaTransitorioQuery } from '../aportacionesFondos/application/queries/GetPensionNominaTransitorioQuery.js';
import { GetAportacionGuarderiasQuery } from '../aportacionesFondos/application/queries/GetAportacionGuarderiasQuery.js';
import { GetPrestamosQuery } from '../aportacionesFondos/application/queries/GetPrestamosQuery.js';
import { GetPrestamosMedianoPlazoQuery } from '../aportacionesFondos/application/queries/GetPrestamosMedianoPlazoQuery.js';
import { GetPrestamosHipotecariosQuery } from '../aportacionesFondos/application/queries/GetPrestamosHipotecariosQuery.js';
import { IAportacionFondoRepository } from '../aportacionesFondos/domain/repositories/IAportacionFondoRepository.js';

export default async function aplicacionQuincenalRoutes(app: FastifyInstance) {
  // GET /aplicacion-quincenal/AportacionQuincenalResumen
  app.get('/aplicacion-quincenal/AportacionQuincenalResumen', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Consulta de resumen de aportación quincenal desde APORTACION_QUINCENAL_RESUMEN. Los usuarios entidad (isEntidad=true) usan las claves orgánicas del token. Los usuarios no entidad deben proporcionar org0 y org1 en parámetros.',
      summary: 'Aportación Quincenal Resumen',
      tags: ['aplicacion-quincenal', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['PERIODO'],
        properties: {
          org0: {
            type: 'string',
            description: 'Clave orgánica 0 (requerido para usuarios no entidad, ignorado para usuarios entidad)',
            minLength: 1,
            maxLength: 2
          },
          org1: {
            type: 'string',
            description: 'Clave orgánica 1 (requerido para usuarios no entidad, ignorado para usuarios entidad)',
            minLength: 1,
            maxLength: 2
          },
          PERIODO: {
            type: 'string',
            description: 'Período en formato QQAA (ej: "2125")',
            minLength: 1,
            maxLength: 10
          }
        }
      },
      response: {
        200: {
          description: 'Consulta ejecutada exitosamente',
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                description: 'Registro de AportacionQuincenalResumen con todos los campos'
              }
            }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        403: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const parsed = AportacionQuincenalResumenParamsSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros de consulta inválidos',
            details: parsed.error.issues,
            timestamp: new Date().toISOString()
          }
        });
      }

      const user = (request as any).user;
      const userId = user?.sub;
      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true;

      // Validar y determinar las claves orgánicas a usar
      let org0: string;
      let org1: string;

      if (isEntidad) {
        // Usuario entidad: usar claves del token
        const idOrg0 = user?.idOrganica0;
        const idOrg1 = user?.idOrganica1;

        org0 = idOrg0 ? (typeof idOrg0 === 'string' ? idOrg0.padStart(2, '0') : idOrg0.toString().padStart(2, '0')) : null;
        org1 = idOrg1 ? (typeof idOrg1 === 'string' ? idOrg1.padStart(2, '0') : idOrg1.toString().padStart(2, '0')) : null;

        if (!org0 || !org1) {
          return reply.code(400).send({
            ok: false,
            error: {
              code: 'MISSING_ORGANICA_KEYS',
              message: 'Las claves orgánicas (org0 y org1) son requeridas en el token del usuario.',
              timestamp: new Date().toISOString()
            }
          });
        }
      } else {
        // Usuario no entidad: debe proporcionar org0 y org1 en parámetros
        if (!parsed.data.org0 || !parsed.data.org1) {
          return reply.code(400).send({
            ok: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'org0 y org1 son requeridos para usuarios no entidad',
              timestamp: new Date().toISOString()
            }
          });
        }

        org0 = parsed.data.org0;
        org1 = parsed.data.org1;
      }

      const query = request.diScope.resolve<GetAportacionQuincenalResumenQuery>('getAportacionQuincenalResumenQuery');
      const registros = await query.execute(org0, org1, parsed.data.PERIODO, userId);

      // SOLUCIÓN AL PROBLEMA DE SERIALIZACIÓN DE FASTIFY
      // Fastify a veces tiene problemas serializando objetos que tienen referencias circulares,
      // getters/setters, o propiedades no enumerables. La solución es crear una copia profunda
      // completamente limpia usando JSON.parse(JSON.stringify()). Esto elimina cualquier
      // getter/setter, propiedades no enumerables, o referencias problemáticas.
      // Este problema ha ocurrido constantemente en otros endpoints (HIP, Concentrado, Movimientos, etc.)
      // y esta es la solución documentada y probada.
      // Ver: docs/SOLUCION_SERIALIZACION_FASTIFY.md
      const cleanData = JSON.parse(JSON.stringify(registros));

      const responseObject = {
        ok: true,
        data: cleanData
      };

      // Serializar manualmente ANTES de enviar
      // Esto evita que Fastify procese el objeto y pierda datos
      const jsonString = JSON.stringify(responseObject);
      
      // Asegurar que el content-type sea JSON explícitamente
      reply.type('application/json');
      
      // Enviar el JSON serializado manualmente como string
      // Fastify no lo volverá a serializar si ya es un string
      return reply.code(200).send(jsonString);
    } catch (error) {
      return handleAplicacionQuincenalError(error, reply);
    }
  });

  // GET /aplicacion-quincenal/ResumenOrgQnaAll
  app.get('/aplicacion-quincenal/ResumenOrgQnaAll', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Consulta de resumen orgánico quincenal desde AP_RESUMEN_ORG_QNA_ALL. Los usuarios entidad (isEntidad=true) usan las claves orgánicas del token. Los usuarios no entidad deben proporcionar org0 y org1 en parámetros.',
      summary: 'Resumen Orgánico QNA All',
      tags: ['aplicacion-quincenal', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['PERIODO'],
        properties: {
          org0: {
            type: 'string',
            description: 'Clave orgánica 0 (requerido para usuarios no entidad, ignorado para usuarios entidad)',
            minLength: 1,
            maxLength: 2
          },
          org1: {
            type: 'string',
            description: 'Clave orgánica 1 (requerido para usuarios no entidad, ignorado para usuarios entidad)',
            minLength: 1,
            maxLength: 2
          },
          PERIODO: {
            type: 'string',
            description: 'Período en formato QQAA (ej: "2125")',
            minLength: 1,
            maxLength: 10
          }
        }
      },
      response: {
        200: {
          description: 'Consulta ejecutada exitosamente',
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                description: 'Registro de ResumenOrgQnaAll con todos los campos'
              }
            }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        403: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const parsed = ResumenOrgQnaAllParamsSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros de consulta inválidos',
            details: parsed.error.issues,
            timestamp: new Date().toISOString()
          }
        });
      }

      const user = (request as any).user;
      const userId = user?.sub;
      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true;

      // Validar y determinar las claves orgánicas a usar
      let org0: string;
      let org1: string;

      if (isEntidad) {
        // Usuario entidad: usar claves del token
        const idOrg0 = user?.idOrganica0;
        const idOrg1 = user?.idOrganica1;

        org0 = idOrg0 ? (typeof idOrg0 === 'string' ? idOrg0.padStart(2, '0') : idOrg0.toString().padStart(2, '0')) : null;
        org1 = idOrg1 ? (typeof idOrg1 === 'string' ? idOrg1.padStart(2, '0') : idOrg1.toString().padStart(2, '0')) : null;

        if (!org0 || !org1) {
          return reply.code(400).send({
            ok: false,
            error: {
              code: 'MISSING_ORGANICA_KEYS',
              message: 'Las claves orgánicas (org0 y org1) son requeridas en el token del usuario.',
              timestamp: new Date().toISOString()
            }
          });
        }
      } else {
        // Usuario no entidad: debe proporcionar org0 y org1 en parámetros
        if (!parsed.data.org0 || !parsed.data.org1) {
          return reply.code(400).send({
            ok: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'org0 y org1 son requeridos para usuarios no entidad',
              timestamp: new Date().toISOString()
            }
          });
        }

        org0 = parsed.data.org0;
        org1 = parsed.data.org1;
      }

      const query = request.diScope.resolve<GetResumenOrgQnaAllQuery>('getResumenOrgQnaAllQuery');
      const registros = await query.execute(org0, org1, parsed.data.PERIODO, userId);

      // SOLUCIÓN AL PROBLEMA DE SERIALIZACIÓN DE FASTIFY
      // Fastify a veces tiene problemas serializando objetos que tienen referencias circulares,
      // getters/setters, o propiedades no enumerables. La solución es crear una copia profunda
      // completamente limpia usando JSON.parse(JSON.stringify()). Esto elimina cualquier
      // getter/setter, propiedades no enumerables, o referencias problemáticas.
      // Este problema ha ocurrido constantemente en otros endpoints (HIP, Concentrado, Movimientos, etc.)
      // y esta es la solución documentada y probada.
      // Ver: docs/SOLUCION_SERIALIZACION_FASTIFY.md
      const cleanData = JSON.parse(JSON.stringify(registros));

      const responseObject = {
        ok: true,
        data: cleanData
      };

      // Serializar manualmente ANTES de enviar
      // Esto evita que Fastify procese el objeto y pierda datos
      const jsonString = JSON.stringify(responseObject);
      
      // Asegurar que el content-type sea JSON explícitamente
      reply.type('application/json');
      
      // Enviar el JSON serializado manualmente como string
      // Fastify no lo volverá a serializar si ya es un string
      return reply.code(200).send(jsonString);
    } catch (error) {
      return handleAplicacionQuincenalError(error, reply);
    }
  });

  // POST /aplicacion-quincenal/guardar-historico-aportaciones
  app.post('/aplicacion-quincenal/guardar-historico-aportaciones', {
    preHandler: [requireAuth],
    schema: {
      description: '[SQL SERVER] Guarda el histórico de aportaciones por lotes usando stored procedures. Los usuarios entidad (isEntidad=true) usan las claves orgánicas del token. Los usuarios no entidad deben proporcionar claves orgánicas en el body.',
      summary: 'Guardar Histórico de Aportaciones',
      tags: ['aplicacion-quincenal', 'sql-server'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          ahorro: {
            type: 'object',
            properties: {
              header: { type: 'object' },
              detalle: { type: 'array', items: { type: 'object' } }
            }
          },
          vivienda: {
            type: 'object',
            properties: {
              header: { type: 'object' },
              detalle: { type: 'array', items: { type: 'object' } }
            }
          },
          prestaciones: {
            type: 'object',
            properties: {
              header: { type: 'object' },
              detalle: { type: 'array', items: { type: 'object' } }
            }
          },
          cair: {
            type: 'object',
            properties: {
              header: { type: 'object' },
              detalle: { type: 'array', items: { type: 'object' } }
            }
          },
          transitorio: {
            type: 'object',
            properties: {
              header: { type: 'object' },
              detalle: { type: 'array', items: { type: 'object' } }
            }
          },
          guarderias: {
            type: 'object',
            properties: {
              header: { type: 'object' },
              detalle: { type: 'array', items: { type: 'object' } }
            }
          },
          aguinaldo: {
            type: 'object',
            properties: {
              header: { type: 'object' },
              detalle: { type: 'array', items: { type: 'object' } }
            }
          }
        }
      },
      response: {
        200: {
          description: 'Histórico guardado exitosamente',
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                procesados: { type: 'array', items: { type: 'string' } },
                totalRegistros: { type: 'object' }
              }
            }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      // Validar request body
      const parsed = GuardarHistoricoAportacionesSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de entrada inválidos',
            details: parsed.error.issues,
            timestamp: new Date().toISOString()
          }
        });
      }

      const user = (request as any).user;
      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true;

      // Validar y sobrescribir claves orgánicas según permisos
      let org0: string | null = null;
      let org1: string | null = null;

      if (isEntidad) {
        // Usuario entidad: extraer claves del token
        const idOrg0 = user?.idOrganica0;
        const idOrg1 = user?.idOrganica1;

        org0 = idOrg0 ? (typeof idOrg0 === 'string' ? idOrg0.padStart(2, '0') : idOrg0.toString().padStart(2, '0')) : null;
        org1 = idOrg1 ? (typeof idOrg1 === 'string' ? idOrg1.padStart(2, '0') : idOrg1.toString().padStart(2, '0')) : null;

        if (!org0 || !org1) {
          return reply.code(400).send({
            ok: false,
            error: {
              code: 'MISSING_ORGANICA_KEYS',
              message: 'Las claves orgánicas (org0 y org1) son requeridas en el token del usuario.',
              timestamp: new Date().toISOString()
            }
          });
        }

        // Sobrescribir claves orgánicas en todos los tipos de aportación
        if (parsed.data.ahorro) {
          parsed.data.ahorro.header.clave_organica_0 = org0;
          parsed.data.ahorro.header.clave_organica_1 = org1;
          parsed.data.ahorro.detalle.forEach(d => {
            d.clave_organica_0 = org0!;
            d.clave_organica_1 = org1!;
          });
        }

        if (parsed.data.vivienda) {
          parsed.data.vivienda.header.clave_organica_0 = org0;
          parsed.data.vivienda.header.clave_organica_1 = org1;
          parsed.data.vivienda.detalle.forEach(d => {
            d.clave_organica_0 = org0!;
            d.clave_organica_1 = org1!;
          });
        }

        if (parsed.data.prestaciones) {
          parsed.data.prestaciones.header.clave_organica_0 = org0;
          parsed.data.prestaciones.header.clave_organica_1 = org1;
          parsed.data.prestaciones.detalle.forEach(d => {
            d.clave_organica_0 = org0!;
            d.clave_organica_1 = org1!;
          });
        }

        if (parsed.data.cair) {
          parsed.data.cair.header.clave_organica_0 = org0;
          parsed.data.cair.header.clave_organica_1 = org1;
          parsed.data.cair.detalle.forEach(d => {
            d.clave_organica_0 = org0!;
            d.clave_organica_1 = org1!;
          });
        }

        if (parsed.data.transitorio) {
          parsed.data.transitorio.header.clave_organica_0 = org0;
          parsed.data.transitorio.header.clave_organica_1 = org1;
          parsed.data.transitorio.detalle.forEach(d => {
            d.clave_organica_0 = org0!;
            d.clave_organica_1 = org1!;
          });
        }

        if (parsed.data.guarderias) {
          parsed.data.guarderias.header.clave_organica_0 = org0;
          parsed.data.guarderias.header.clave_organica_1 = org1;
          parsed.data.guarderias.detalle.forEach(d => {
            d.clave_organica_0 = org0!;
            d.clave_organica_1 = org1!;
          });
        }

        if (parsed.data.aguinaldo) {
          parsed.data.aguinaldo.header.clave_organica_0 = org0;
          parsed.data.aguinaldo.header.clave_organica_1 = org1;
          parsed.data.aguinaldo.detalle.forEach(d => {
            d.clave_organica_0 = org0!;
            d.clave_organica_1 = org1!;
            d.org0 = org0!;
            d.org1 = org1!;
          });
        }
      }

      // Llamar al repository
      const repository = request.diScope.resolve<AplicacionQuincenalRepository>('aplicacionQuincenalRepo');
      const result = await repository.guardarHistoricoAportaciones(request, parsed.data);

      return reply.code(200).send({
        ok: true,
        data: result
      });
    } catch (error) {
      return handleAplicacionQuincenalError(error, reply);
    }
  });

  // POST /aplicacion-quincenal/guardar-historico-retenciones
  app.post('/aplicacion-quincenal/guardar-historico-retenciones', {
    preHandler: [requireAuth],
    schema: {
      description: '[SQL SERVER] Guarda el histórico de retenciones (préstamos) por lotes usando stored procedures. Los usuarios entidad (isEntidad=true) usan las claves orgánicas del token. Los usuarios no entidad deben proporcionar claves orgánicas en el body.',
      summary: 'Guardar Histórico de Retenciones',
      tags: ['aplicacion-quincenal', 'sql-server'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          prestamosCortoPlazo: {
            type: 'object',
            properties: {
              header: { type: 'object' },
              detalle: { type: 'array', items: { type: 'object' } }
            }
          },
          prestamosMedianoPlazo: {
            type: 'object',
            properties: {
              header: { type: 'object' },
              detalle: { type: 'array', items: { type: 'object' } }
            }
          },
          prestamosHipotecarios: {
            type: 'object',
            properties: {
              header: { type: 'object' },
              detalle: { type: 'array', items: { type: 'object' } }
            }
          }
        }
      },
      response: {
        200: {
          description: 'Histórico guardado exitosamente',
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                procesados: { type: 'array', items: { type: 'string' } },
                totalRegistros: { type: 'object' }
              }
            }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      // Validar request body
      const parsed = GuardarHistoricoRetencionesSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de entrada inválidos',
            details: parsed.error.issues,
            timestamp: new Date().toISOString()
          }
        });
      }

      const user = (request as any).user;
      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true;

      // Validar y sobrescribir claves orgánicas según permisos
      let org0: string | null = null;
      let org1: string | null = null;

      if (isEntidad) {
        // Usuario entidad: extraer claves del token
        const idOrg0 = user?.idOrganica0;
        const idOrg1 = user?.idOrganica1;

        org0 = idOrg0 ? (typeof idOrg0 === 'string' ? idOrg0.padStart(2, '0') : idOrg0.toString().padStart(2, '0')) : null;
        org1 = idOrg1 ? (typeof idOrg1 === 'string' ? idOrg1.padStart(2, '0') : idOrg1.toString().padStart(2, '0')) : null;

        if (!org0 || !org1) {
          return reply.code(400).send({
            ok: false,
            error: {
              code: 'MISSING_ORGANICA_KEYS',
              message: 'Las claves orgánicas (org0 y org1) son requeridas en el token del usuario.',
              timestamp: new Date().toISOString()
            }
          });
        }

        // Sobrescribir claves orgánicas en todos los tipos de préstamo
        if (parsed.data.prestamosCortoPlazo) {
          parsed.data.prestamosCortoPlazo.header.clave_organica_0 = org0;
          parsed.data.prestamosCortoPlazo.header.clave_organica_1 = org1;
          parsed.data.prestamosCortoPlazo.detalle.forEach(d => {
            d.clave_organica_0 = org0!;
            d.clave_organica_1 = org1!;
            d.org0 = org0!;
            d.org1 = org1!;
          });
        }

        if (parsed.data.prestamosMedianoPlazo) {
          parsed.data.prestamosMedianoPlazo.header.clave_organica_0 = org0;
          parsed.data.prestamosMedianoPlazo.header.clave_organica_1 = org1;
          parsed.data.prestamosMedianoPlazo.detalle.forEach(d => {
            d.clave_organica_0 = org0!;
            d.clave_organica_1 = org1!;
            d.org0 = org0!;
            d.org1 = org1!;
          });
        }

        if (parsed.data.prestamosHipotecarios) {
          parsed.data.prestamosHipotecarios.header.clave_organica_0 = org0;
          parsed.data.prestamosHipotecarios.header.clave_organica_1 = org1;
          parsed.data.prestamosHipotecarios.detalle.forEach(d => {
            d.clave_organica_0 = org0!;
            d.clave_organica_1 = org1!;
            d.org0 = org0!;
            d.org1 = org1!;
          });
        }
      }

      // Llamar al repository
      const repository = request.diScope.resolve<AplicacionQuincenalRepository>('aplicacionQuincenalRepo');
      const result = await repository.guardarHistoricoRetenciones(request, parsed.data);

      return reply.code(200).send({
        ok: true,
        data: result
      });
    } catch (error) {
      return handleAplicacionQuincenalError(error, reply);
    }
  });

  // POST /aplicacion-quincenal/guardar-historico-aportaciones-desde-bd
  app.post('/aplicacion-quincenal/guardar-historico-aportaciones-desde-bd', {
    preHandler: [requireAuth],
    schema: {
      description: '[SQL SERVER] Obtiene los datos de aportaciones directamente de la base de datos y los guarda en el histórico. Los usuarios entidad (isEntidad=true) usan las claves orgánicas del token. Los usuarios no entidad deben proporcionar claves orgánicas en query params.',
      summary: 'Guardar Histórico de Aportaciones desde BD',
      tags: ['aplicacion-quincenal', 'sql-server'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          clave_organica_0: {
            type: 'string',
            description: 'Clave orgánica 0 (requerido para usuarios no entidad, ignorado para usuarios entidad)',
            minLength: 1,
            maxLength: 2
          },
          clave_organica_1: {
            type: 'string',
            description: 'Clave orgánica 1 (requerido para usuarios no entidad, ignorado para usuarios entidad)',
            minLength: 1,
            maxLength: 2
          }
        }
      },
      response: {
        200: {
          description: 'Histórico guardado exitosamente',
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                procesados: { type: 'array', items: { type: 'string' } },
                totalRegistros: { type: 'object' }
              }
            }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const userId = user?.sub;
      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true;

      // Validar y determinar las claves orgánicas a usar
      let org0: string | null = null;
      let org1: string | null = null;

      if (isEntidad) {
        // Usuario entidad: usar claves del token
        const idOrg0 = user?.idOrganica0;
        const idOrg1 = user?.idOrganica1;

        org0 = idOrg0 ? (typeof idOrg0 === 'string' ? idOrg0.padStart(2, '0') : idOrg0.toString().padStart(2, '0')) : null;
        org1 = idOrg1 ? (typeof idOrg1 === 'string' ? idOrg1.padStart(2, '0') : idOrg1.toString().padStart(2, '0')) : null;

        if (!org0 || !org1) {
          return reply.code(400).send({
            ok: false,
            error: {
              code: 'MISSING_ORGANICA_KEYS',
              message: 'Las claves orgánicas (org0 y org1) son requeridas en el token del usuario.',
              timestamp: new Date().toISOString()
            }
          });
        }
      } else {
        // Usuario no entidad: debe proporcionar org0 y org1 en query params
        const query = request.query as any;
        if (!query?.clave_organica_0 || !query?.clave_organica_1) {
          return reply.code(400).send({
            ok: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'clave_organica_0 y clave_organica_1 son requeridos para usuarios no entidad',
              timestamp: new Date().toISOString()
            }
          });
        }

        org0 = query.clave_organica_0.padStart(2, '0');
        org1 = query.clave_organica_1.padStart(2, '0');
      }

      // Asegurar que org0 y org1 no sean null en este punto
      if (!org0 || !org1) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'MISSING_ORGANICA_KEYS',
            message: 'Las claves orgánicas (org0 y org1) son requeridas.',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Obtener período (quincena y año)
      const aportacionFondoRepo = request.diScope.resolve<IAportacionFondoRepository>('aportacionFondoRepo');
      const periodoInfo = await aportacionFondoRepo.obtenerQuincenaYAnio(org0, org1);
      const quincena = periodoInfo.quincena;
      const anio = periodoInfo.anio;

      // Obtener datos de todos los tipos de aportaciones en paralelo
      const getAportacionesIndividualesQuery = request.diScope.resolve<GetAportacionesIndividualesQuery>('getAportacionesIndividualesQuery');
      const getAguinaldoQuery = request.diScope.resolve<GetAguinaldoQuery>('getAguinaldoQuery');
      const getPensionNominaTransitorioQuery = request.diScope.resolve<GetPensionNominaTransitorioQuery>('getPensionNominaTransitorioQuery');
      const getAportacionGuarderiasQuery = request.diScope.resolve<GetAportacionGuarderiasQuery>('getAportacionGuarderiasQuery');

      const userClave0 = (user as any).idOrganica0 || '';
      const userClave1 = (user as any).idOrganica1 || '';

      const [
        ahorroData,
        viviendaData,
        prestacionesData,
        cairData,
        aguinaldoData,
        transitorioData,
        guarderiasData
      ] = await Promise.all([
        getAportacionesIndividualesQuery.execute('ahorro', userClave0, userClave1, isEntidad, org0, org1, userId?.toString()).catch(() => null),
        getAportacionesIndividualesQuery.execute('vivienda', userClave0, userClave1, isEntidad, org0, org1, userId?.toString()).catch(() => null),
        getAportacionesIndividualesQuery.execute('prestaciones', userClave0, userClave1, isEntidad, org0, org1, userId?.toString()).catch(() => null),
        getAportacionesIndividualesQuery.execute('cair', userClave0, userClave1, isEntidad, org0, org1, userId?.toString()).catch(() => null),
        getAguinaldoQuery.execute(userClave0, userClave1, isEntidad, org0, org1, userId?.toString()).catch(() => null),
        getPensionNominaTransitorioQuery.execute(userClave0, userClave1, isEntidad, org0, org1, userId?.toString()).catch(() => null),
        getAportacionGuarderiasQuery.execute(userClave0, userClave1, isEntidad, org0, org1, userId?.toString()).catch(() => null)
      ]);

      // Transformar datos al formato esperado
      // Siempre crear todos los tipos, incluso si tienen 0 registros
      const historicoData: GuardarHistoricoAportaciones = {};

      // Transformar Ahorro (siempre, incluso con 0 registros)
      historicoData.ahorro = {
        header: {
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          usuario_id: userId?.toString() || '',
          total_empleados: ahorroData?.resumen?.total_empleados || 0,
          total_contribucion: ahorroData?.resumen?.total_contribucion || 0,
          total_sueldo_base: ahorroData?.resumen?.total_sueldo_base || 0
        },
        detalle: (ahorroData?.datos || []).map(d => ({
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          interno: d.interno || 0,
          nombre: (d.nombre && typeof d.nombre === 'string' && d.nombre.trim()) ? d.nombre.trim().substring(0, 200) : 'SIN NOMBRE',
          sueldo: d.sueldo || 0,
          quinquenios: d.quinquenios || 0,
          otras_prestaciones: d.otras_prestaciones ?? null,
          sueldo_base: d.sueldo_base || 0,
          afae: d.afae || 0,
          afaa: d.afaa || 0,
          total: d.total || 0
        }))
      };

      // Transformar Vivienda (siempre, incluso con 0 registros)
      historicoData.vivienda = {
        header: {
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          usuario_id: userId?.toString() || '',
          total_empleados: viviendaData?.resumen?.total_empleados || 0,
          total_contribucion: viviendaData?.resumen?.total_contribucion || 0,
          total_sueldo_base: viviendaData?.resumen?.total_sueldo_base || 0
        },
        detalle: (viviendaData?.datos || []).map(d => ({
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          interno: d.interno || 0,
          nombre: (d.nombre && typeof d.nombre === 'string' && d.nombre.trim()) ? d.nombre.trim().substring(0, 200) : 'SIN NOMBRE',
          sueldo: d.sueldo || 0,
          quinquenios: d.quinquenios || 0,
          otras_prestaciones: d.otras_prestaciones ?? null,
          sueldo_base: d.sueldo_base || 0,
          afe: d.afe || 0,
          total: d.total || 0
        }))
      };

      // Transformar Prestaciones (siempre, incluso con 0 registros)
      historicoData.prestaciones = {
        header: {
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          usuario_id: userId?.toString() || '',
          total_empleados: prestacionesData?.resumen?.total_empleados || 0,
          total_contribucion: prestacionesData?.resumen?.total_contribucion || 0,
          total_sueldo_base: prestacionesData?.resumen?.total_sueldo_base || 0
        },
        detalle: (prestacionesData?.datos || []).map(d => ({
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          interno: d.interno || 0,
          nombre: (d.nombre && typeof d.nombre === 'string' && d.nombre.trim()) ? d.nombre.trim().substring(0, 200) : 'SIN NOMBRE',
          sueldo: d.sueldo || 0,
          quinquenios: d.quinquenios || 0,
          otras_prestaciones: d.otras_prestaciones ?? null,
          sueldo_base: d.sueldo_base || 0,
          afpe: d.afpe || 0,
          afpa: d.afpa || 0,
          total: d.total || 0
        }))
      };

      // Transformar Cair (siempre, incluso con 0 registros)
      historicoData.cair = {
        header: {
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          usuario_id: userId?.toString() || '',
          total_empleados: cairData?.resumen?.total_empleados || 0,
          total_contribucion: cairData?.resumen?.total_contribucion || 0,
          total_sueldo_base: cairData?.resumen?.total_sueldo_base || 0
        },
        detalle: (cairData?.datos || []).map(d => ({
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          interno: d.interno || 0,
          nombre: (d.nombre && typeof d.nombre === 'string' && d.nombre.trim()) ? d.nombre.trim().substring(0, 200) : 'SIN NOMBRE',
          sueldo: d.sueldo || 0,
          quinquenios: d.quinquenios || 0,
          otras_prestaciones: d.otras_prestaciones ?? null,
          sueldo_base: d.sueldo_base || 0,
          afe: d.afe || 0,
          total: d.total || 0
        }))
      };

      // Transformar Transitorio (siempre, incluso con 0 registros)
      historicoData.transitorio = {
        header: {
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          usuario_id: userId?.toString() || '',
          total_empleados: transitorioData?.registros?.length || 0,
          total_contribucion: transitorioData?.registros?.reduce((sum, r) => sum + (r.total || 0), 0) || 0,
          total_sueldo_base: transitorioData?.registros?.reduce((sum, r) => sum + (r.sdo || 0), 0) || 0
        },
        detalle: (transitorioData?.registros || []).map(d => ({
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena: typeof quincena === 'number' ? quincena : parseInt(String(quincena || '1'), 10),
          anio: typeof anio === 'number' ? anio : parseInt(String(anio || '2000'), 10),
          fpension: Number.isInteger(d.fpension) ? d.fpension : (typeof d.fpension === 'number' ? Math.floor(d.fpension) : (d.fpension ? Math.floor(Number(d.fpension)) || 0 : 0)),
          interno: Number.isInteger(d.interno) ? d.interno : (typeof d.interno === 'number' ? Math.floor(d.interno) : (d.interno ? Math.floor(Number(d.interno)) || 0 : 0)),
          nombres: d.nombres || '',
          nonombre: d.nonombre || null,
          rfc: d.rfc || '',
          norfc: d.norfc || null,
          org0: (d.org0 && String(d.org0).length === 2) ? String(d.org0) : org0,
          org1: (d.org1 && String(d.org1).length === 2) ? String(d.org1) : org1,
          org2: (d.org2 && String(d.org2).length === 2) ? String(d.org2) : '00',
          org3: (d.org3 && String(d.org3).length === 2) ? String(d.org3) : '00',
          sueldo: (typeof d.sueldo === 'number' && !isNaN(d.sueldo)) ? d.sueldo : (d.sueldo != null ? (typeof d.sueldo === 'string' ? (parseFloat(d.sueldo) || null) : null) : null),
          oprestaciones: (typeof d.oprestaciones === 'number' && !isNaN(d.oprestaciones)) ? d.oprestaciones : (d.oprestaciones != null ? (typeof d.oprestaciones === 'string' ? (parseFloat(d.oprestaciones) || null) : null) : null),
          quinquenios: (typeof d.quinquenios === 'number' && !isNaN(d.quinquenios)) ? d.quinquenios : (d.quinquenios != null ? (typeof d.quinquenios === 'string' ? (parseFloat(d.quinquenios) || null) : null) : null),
          sdo: (typeof d.sdo === 'number' && !isNaN(d.sdo)) ? d.sdo : (d.sdo != null ? (typeof d.sdo === 'string' ? (parseFloat(d.sdo) || 0) : 0) : 0),
          oprest: (typeof d.oprest === 'number' && !isNaN(d.oprest)) ? d.oprest : (d.oprest != null ? (typeof d.oprest === 'string' ? (parseFloat(d.oprest) || null) : null) : null),
          quinq: (typeof d.quinq === 'number' && !isNaN(d.quinq)) ? d.quinq : (d.quinq != null ? (typeof d.quinq === 'string' ? (parseFloat(d.quinq) || null) : null) : null),
          tpension: (typeof d.tpension === 'number' && !isNaN(d.tpension)) ? d.tpension : (d.tpension != null ? (typeof d.tpension === 'string' ? (parseFloat(d.tpension) || null) : null) : null),
          transitorio: (typeof d.transitorio === 'number' && !isNaN(d.transitorio)) ? d.transitorio : (d.transitorio != null ? (typeof d.transitorio === 'string' ? (parseFloat(d.transitorio) || 0) : 0) : 0),
          norg0: d.norg0 || null,
          norg1: d.norg1 || null,
          norg2: d.norg2 || null,
          norg3: d.norg3 || null,
          cconcepto: d.cconcepto || '',
          descripcion: d.descripcion || '',
          importe: (typeof d.importe === 'number' && !isNaN(d.importe)) ? d.importe : (d.importe != null ? (typeof d.importe === 'string' ? (parseFloat(d.importe) || 0) : 0) : 0),
          defuncion: d.defuncion ? new Date(d.defuncion).toISOString().split('T')[0] : null,
          pcp: (typeof d.pcp === 'number' && !isNaN(d.pcp)) ? d.pcp : (d.pcp != null ? (typeof d.pcp === 'string' ? (parseFloat(d.pcp) || null) : null) : null),
          palimenticia: (typeof d.palimenticia === 'number' && !isNaN(d.palimenticia)) ? d.palimenticia : (d.palimenticia != null ? (typeof d.palimenticia === 'string' ? (parseFloat(d.palimenticia) || null) : null) : null),
          retroactivo: (typeof d.retroactivo === 'number' && !isNaN(d.retroactivo)) ? d.retroactivo : (d.retroactivo != null ? (typeof d.retroactivo === 'string' ? (parseFloat(d.retroactivo) || null) : null) : null),
          payudaecon: (typeof d.payudaecon === 'number' && !isNaN(d.payudaecon)) ? d.payudaecon : (d.payudaecon != null ? (typeof d.payudaecon === 'string' ? (parseFloat(d.payudaecon) || null) : null) : null),
          otrosp1: (typeof d.otrosp1 === 'number' && !isNaN(d.otrosp1)) ? d.otrosp1 : (d.otrosp1 != null ? (typeof d.otrosp1 === 'string' ? (parseFloat(d.otrosp1) || null) : null) : null),
          otrosp2: (typeof d.otrosp2 === 'number' && !isNaN(d.otrosp2)) ? d.otrosp2 : (d.otrosp2 != null ? (typeof d.otrosp2 === 'string' ? (parseFloat(d.otrosp2) || null) : null) : null),
          otrosp3: (typeof d.otrosp3 === 'number' && !isNaN(d.otrosp3)) ? d.otrosp3 : (d.otrosp3 != null ? (typeof d.otrosp3 === 'string' ? (parseFloat(d.otrosp3) || null) : null) : null),
          otrosp4: (typeof d.otrosp4 === 'number' && !isNaN(d.otrosp4)) ? d.otrosp4 : (d.otrosp4 != null ? (typeof d.otrosp4 === 'string' ? (parseFloat(d.otrosp4) || null) : null) : null),
          otrosp5: (typeof d.otrosp5 === 'number' && !isNaN(d.otrosp5)) ? d.otrosp5 : (d.otrosp5 != null ? (typeof d.otrosp5 === 'string' ? (parseFloat(d.otrosp5) || null) : null) : null),
          terreno: (typeof d.terreno === 'number' && !isNaN(d.terreno)) ? d.terreno : (d.terreno != null ? (typeof d.terreno === 'string' ? (parseFloat(d.terreno) || null) : null) : null),
          hipviv: (typeof d.hipviv === 'number' && !isNaN(d.hipviv)) ? d.hipviv : (d.hipviv != null ? (typeof d.hipviv === 'string' ? (parseFloat(d.hipviv) || null) : null) : null),
          prodental: (typeof d.prodental === 'number' && !isNaN(d.prodental)) ? d.prodental : (d.prodental != null ? (typeof d.prodental === 'string' ? (parseFloat(d.prodental) || null) : null) : null),
          otrod1: (typeof d.otrod1 === 'number' && !isNaN(d.otrod1)) ? d.otrod1 : (d.otrod1 != null ? (typeof d.otrod1 === 'string' ? (parseFloat(d.otrod1) || null) : null) : null),
          otrod2: (typeof d.otrod2 === 'number' && !isNaN(d.otrod2)) ? d.otrod2 : (d.otrod2 != null ? (typeof d.otrod2 === 'string' ? (parseFloat(d.otrod2) || null) : null) : null),
          otrod3: (typeof d.otrod3 === 'number' && !isNaN(d.otrod3)) ? d.otrod3 : (d.otrod3 != null ? (typeof d.otrod3 === 'string' ? (parseFloat(d.otrod3) || null) : null) : null),
          otrod4: (typeof d.otrod4 === 'number' && !isNaN(d.otrod4)) ? d.otrod4 : (d.otrod4 != null ? (typeof d.otrod4 === 'string' ? (parseFloat(d.otrod4) || null) : null) : null),
          otrod5: (typeof d.otrod5 === 'number' && !isNaN(d.otrod5)) ? d.otrod5 : (d.otrod5 != null ? (typeof d.otrod5 === 'string' ? (parseFloat(d.otrod5) || null) : null) : null),
          otrod6: (typeof d.otrod6 === 'number' && !isNaN(d.otrod6)) ? d.otrod6 : (d.otrod6 != null ? (typeof d.otrod6 === 'string' ? (parseFloat(d.otrod6) || null) : null) : null),
          tpercep: (typeof d.tpercep === 'number' && !isNaN(d.tpercep)) ? d.tpercep : (d.tpercep != null ? (typeof d.tpercep === 'string' ? (parseFloat(d.tpercep) || 0) : 0) : 0),
          tdeduc: (typeof d.tdeduc === 'number' && !isNaN(d.tdeduc)) ? d.tdeduc : (d.tdeduc != null ? (typeof d.tdeduc === 'string' ? (parseFloat(d.tdeduc) || 0) : 0) : 0),
          total: (typeof d.total === 'number' && !isNaN(d.total)) ? d.total : (d.total != null ? (typeof d.total === 'string' ? (parseFloat(d.total) || 0) : 0) : 0),
          inicio: d.inicio ? new Date(d.inicio).toISOString().split('T')[0] : '1900-01-01',
          fin: d.fin ? new Date(d.fin).toISOString().split('T')[0] : '1900-01-01',
          anio_detalle: Number.isInteger(d.anio) ? d.anio : (typeof d.anio === 'number' ? Math.floor(d.anio) : (d.anio ? Math.floor(Number(d.anio)) || null : null)),
          sihay: (d.sihay !== null && d.sihay !== undefined) ? String(d.sihay) : null,
          porcentaje: (typeof d.porcentaje === 'number' && !isNaN(d.porcentaje)) ? d.porcentaje : (d.porcentaje != null ? (typeof d.porcentaje === 'string' ? (parseFloat(d.porcentaje) || null) : null) : null),
          sdoporc: (typeof d.sdoporc === 'number' && !isNaN(d.sdoporc)) ? d.sdoporc : (d.sdoporc != null ? (typeof d.sdoporc === 'string' ? (parseFloat(d.sdoporc) || null) : null) : null),
          ayudporc: (typeof d.ayudporc === 'number' && !isNaN(d.ayudporc)) ? d.ayudporc : (d.ayudporc != null ? (typeof d.ayudporc === 'string' ? (parseFloat(d.ayudporc) || null) : null) : null),
          quinqporc: (typeof d.quinqporc === 'number' && !isNaN(d.quinqporc)) ? d.quinqporc : (d.quinqporc != null ? (typeof d.quinqporc === 'string' ? (parseFloat(d.quinqporc) || null) : null) : null),
          transorg0: (d.transorg0 && String(d.transorg0).length === 2) ? String(d.transorg0) : org0,
          transorg1: (d.transorg1 && String(d.transorg1).length === 2) ? String(d.transorg1) : org1,
          transnorg0: d.transnorg0 || null,
          transnorg1: d.transnorg1 || null
        }))
      };

      // Transformar Guarderias (siempre, incluso con 0 registros)
      historicoData.guarderias = {
        header: {
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          usuario_id: userId?.toString() || '',
          total_empleados: guarderiasData?.aportaciones?.length || 0,
          total_contribucion: guarderiasData?.aportaciones?.reduce((sum, a) => sum + (a.recibo_total || 0), 0) || 0,
          total_sueldo_base: 0 // Guarderías no tiene sueldo_base
        },
        detalle: (guarderiasData?.aportaciones || []).map(d => ({
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          titular_nombre: d.titular_nombre || '',
          titular_no_empleado: d.titular_no_empleado || '',
          titular_monto: d.titular_monto ?? 0,
          titular_rfc: d.titular_rfc || '',
          titular_monto_texto: d.titular_monto_texto ?? null,
          titular_org0: d.titular_org0 ?? null,
          titular_org0_nombre: d.titular_org0_nombre ?? null,
          titular_org1: d.titular_org1 ?? null,
          titular_org1_nombre: d.titular_org1_nombre ?? null,
          titular_org2: d.titular_org2 ?? null,
          titular_org2_nombre: d.titular_org2_nombre ?? null,
          titular_org3: d.titular_org3 ?? null,
          titular_org3_nombre: d.titular_org3_nombre ?? null,
          entidad_monto: d.entidad_monto ?? null,
          recibo_ajuste: d.recibo_ajuste ?? null,
          recibo_total: d.recibo_total ?? 0,
          recibo_mes_ano: d.recibo_mes_ano || '',
          recibo_fecha_venc: d.recibo_fecha_venc ? new Date(d.recibo_fecha_venc).toISOString().split('T')[0] : '1900-01-01',
          recibo_folio: d.recibo_folio || '',
          menor_id: d.menor_id ?? 0,
          menor_nombre: d.menor_nombre || '',
          menor_rfc: d.menor_rfc ?? null,
          menor_nivel: d.menor_nivel || '',
          menor_sala: d.menor_sala || '',
          estatus: d.estatus || ''
        }))
      };

      // Transformar Aguinaldo (siempre, incluso con 0 registros)
      historicoData.aguinaldo = {
        header: {
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          usuario_id: userId?.toString() || '',
          total_empleados: aguinaldoData?.aguinaldos?.length || 0,
          total_contribucion: aguinaldoData?.aguinaldos?.reduce((sum, a) => sum + (a.general || 0), 0) || 0,
          total_sueldo_base: aguinaldoData?.aguinaldos?.reduce((sum, a) => sum + (a.sdo || 0), 0) || 0
        },
        detalle: (aguinaldoData?.aguinaldos || []).map(d => ({
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          interno: d.interno ?? 0,
          movimiento: d.movimiento ?? null,
          noempleado: d.noempleado || '',
          tipomovimiento: d.tipomovimiento ?? null,
          nombres: d.nombres || '',
          rfc: d.rfc || '',
          curp: d.curp || '',
          fecha: d.fecha ? new Date(d.fecha).toISOString().split('T')[0] : '1900-01-01',
          dias_aguinaldo: d.dias_aguinaldo ?? null,
          cuantos: d.cuantos ?? null,
          cuantos_ori: d.cuantos_ori ?? null,
          nocontar: d.nocontar ?? null,
          sdo: d.sdo ?? 0,
          op: d.op ?? null,
          q: d.q ?? null,
          activo: d.activo ?? null,
          nom_activo: d.nom_activo ?? null,
          qna_a: d.qna_a ?? null,
          porcentaje_a: d.porcentaje_a ?? null,
          diario: d.diario ?? null,
          general: d.general ?? 0,
          porcentaje: d.porcentaje ?? null,
          proporcion: d.proporcion ?? 0,
          mensaje: d.mensaje ?? null,
          dias_gral_agui: d.dias_gral_agui ?? null,
          fecha_lf: d.fecha_lf ? new Date(d.fecha_lf).toISOString().split('T')[0] : null,
          fecha_li: d.fecha_li ? new Date(d.fecha_li).toISOString().split('T')[0] : null,
          f_inicio: d.f_inicio ? new Date(d.f_inicio).toISOString().split('T')[0] : null,
          f_fin: d.f_fin ? new Date(d.f_fin).toISOString().split('T')[0] : null,
          org0: (d.org0 && String(d.org0).length === 2) ? String(d.org0) : org0,
          org1: (d.org1 && String(d.org1).length === 2) ? String(d.org1) : org1,
          org2: (d.org2 && String(d.org2).length === 2) ? String(d.org2) : '00',
          org3: (d.org3 && String(d.org3).length === 2) ? String(d.org3) : '00',
          norg0: d.norg0 || '',
          norg1: d.norg1 || '',
          norg2: d.norg2 || '',
          norg3: d.norg3 || ''
        }))
      };

      // Validar con schema
      const parsed = GuardarHistoricoAportacionesSchema.safeParse(historicoData);
      if (!parsed.success) {
        // Log detallado del error para debugging
        console.error('[VALIDATION_ERROR] Errores de validación:', JSON.stringify(parsed.error.issues, null, 2));
        console.error('[VALIDATION_ERROR] Primeros 3 errores:', parsed.error.issues.slice(0, 3));
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos transformados inválidos',
            details: parsed.error.issues,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Llamar al repository para guardar
      const repository = request.diScope.resolve<AplicacionQuincenalRepository>('aplicacionQuincenalRepo');
      const result = await repository.guardarHistoricoAportaciones(request, parsed.data);

      return reply.code(200).send({
        ok: true,
        data: result
      });
    } catch (error) {
      return handleAplicacionQuincenalError(error, reply);
    }
  });

  // POST /aplicacion-quincenal/guardar-historico-retenciones-desde-bd
  app.post('/aplicacion-quincenal/guardar-historico-retenciones-desde-bd', {
    preHandler: [requireAuth],
    schema: {
      description: '[SQL SERVER] Obtiene los datos de retenciones (préstamos) directamente desde Firebird usando los queries del módulo aportacionesFondos y los guarda en el histórico. Los usuarios entidad (isEntidad=true) usan las claves orgánicas del token. Los usuarios no entidad deben proporcionar claves orgánicas en query params.',
      summary: 'Guardar Histórico de Retenciones desde BD',
      tags: ['aplicacion-quincenal', 'sql-server'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          clave_organica_0: {
            type: 'string',
            description: 'Clave orgánica 0 (requerido para usuarios no entidad, ignorado para usuarios entidad)',
            minLength: 1,
            maxLength: 2
          },
          clave_organica_1: {
            type: 'string',
            description: 'Clave orgánica 1 (requerido para usuarios no entidad, ignorado para usuarios entidad)',
            minLength: 1,
            maxLength: 2
          }
        }
      },
      response: {
        200: {
          description: 'Histórico guardado exitosamente',
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                procesados: { type: 'array', items: { type: 'string' } },
                totalRegistros: { type: 'object' }
              }
            }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const userId = user?.sub;
      const entidades = (user as any).entidades || [false];
      const isEntidad = entidades[0] === true;

      // Validar y determinar las claves orgánicas a usar
      let org0: string | null = null;
      let org1: string | null = null;

      if (isEntidad) {
        // Usuario entidad: usar claves del token
        const idOrg0 = user?.idOrganica0;
        const idOrg1 = user?.idOrganica1;

        org0 = idOrg0 ? (typeof idOrg0 === 'string' ? idOrg0.padStart(2, '0') : idOrg0.toString().padStart(2, '0')) : null;
        org1 = idOrg1 ? (typeof idOrg1 === 'string' ? idOrg1.padStart(2, '0') : idOrg1.toString().padStart(2, '0')) : null;

        if (!org0 || !org1) {
          return reply.code(400).send({
            ok: false,
            error: {
              code: 'MISSING_ORGANICA_KEYS',
              message: 'Las claves orgánicas (org0 y org1) son requeridas en el token del usuario.',
              timestamp: new Date().toISOString()
            }
          });
        }
      } else {
        // Usuario no entidad: debe proporcionar org0 y org1 en query params
        const query = request.query as any;
        if (!query?.clave_organica_0 || !query?.clave_organica_1) {
          return reply.code(400).send({
            ok: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'clave_organica_0 y clave_organica_1 son requeridos para usuarios no entidad',
              timestamp: new Date().toISOString()
            }
          });
        }

        org0 = query.clave_organica_0.padStart(2, '0');
        org1 = query.clave_organica_1.padStart(2, '0');
      }

      // Asegurar que org0 y org1 no sean null en este punto
      if (!org0 || !org1) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'MISSING_ORGANICA_KEYS',
            message: 'Las claves orgánicas (org0 y org1) son requeridas.',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Obtener período (quincena y año)
      const aportacionFondoRepo = request.diScope.resolve<IAportacionFondoRepository>('aportacionFondoRepo');
      const periodoInfo = await aportacionFondoRepo.obtenerQuincenaYAnio(org0, org1);
      const quincena = periodoInfo.quincena;
      const anio = periodoInfo.anio;

      // Obtener datos (Firebird) mediante los queries del módulo aportacionesFondos (igual que aportaciones-desde-bd)
      const getPrestamosQuery = request.diScope.resolve<GetPrestamosQuery>('getPrestamosQuery');
      const getPrestamosMedianoPlazoQuery = request.diScope.resolve<GetPrestamosMedianoPlazoQuery>('getPrestamosMedianoPlazoQuery');
      const getPrestamosHipotecariosQuery = request.diScope.resolve<GetPrestamosHipotecariosQuery>('getPrestamosHipotecariosQuery');

      // Normalizar claves del usuario a string de 2 dígitos (evita errores tipo: userClave0.trim is not a function)
      // Si el usuario no tiene claves en token (caso no-entidad/admin), usamos las claves objetivo para pasar validación del query.
      const rawUserClave0 = (user as any).idOrganica0;
      const rawUserClave1 = (user as any).idOrganica1;
      const userClave0 =
        rawUserClave0 !== undefined && rawUserClave0 !== null && String(rawUserClave0).trim().length > 0
          ? String(rawUserClave0).trim().padStart(2, '0').substring(0, 2)
          : org0;
      const userClave1 =
        rawUserClave1 !== undefined && rawUserClave1 !== null && String(rawUserClave1).trim().length > 0
          ? String(rawUserClave1).trim().padStart(2, '0').substring(0, 2)
          : org1;

      const [
        prestamosCortoPlazoData,
        prestamosMedianoPlazoData,
        prestamosHipotecariosData
      ] = await Promise.all([
        getPrestamosQuery
          .execute(userClave0, userClave1, isEntidad, org0, org1, userId?.toString())
          .catch((e: any) => {
            request.log?.error?.({ err: e }, 'Error ejecutando GetPrestamosQuery (corto plazo)');
            return null;
          }),
        getPrestamosMedianoPlazoQuery
          .execute(userClave0, userClave1, isEntidad, org0, org1, userId?.toString())
          .catch((e: any) => {
            request.log?.error?.({ err: e }, 'Error ejecutando GetPrestamosMedianoPlazoQuery (mediano plazo)');
            return null;
          }),
        getPrestamosHipotecariosQuery
          .execute(userClave0, userClave1, isEntidad, false, org0, org1, userId?.toString())
          .catch((e: any) => {
            request.log?.error?.({ err: e }, 'Error ejecutando GetPrestamosHipotecariosQuery (hipotecarios)');
            return null;
          })
      ]);

      // Transformar datos al formato esperado
      // Siempre crear todos los tipos, incluso si tienen 0 registros
      const historicoData: GuardarHistoricoRetenciones = {};

      // Transformar PrestamosCortoPlazo (siempre, incluso con 0 registros)
      historicoData.prestamosCortoPlazo = {
        header: {
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          usuario_id: userId?.toString() || 'system',
          total_empleados: prestamosCortoPlazoData?.prestamos?.length || 0,
          total_contribucion: prestamosCortoPlazoData?.prestamos?.reduce((sum: number, p: any) => sum + (typeof p.total === 'number' && !isNaN(p.total) ? p.total : 0), 0) || 0,
          total_sueldo_base: 0 // No aplica directamente para préstamos
        },
        detalle: (prestamosCortoPlazoData?.prestamos || []).map((d: any) => ({
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          interno: Number.isInteger(d.interno) ? d.interno : 0,
          rfc: (d.rfc && typeof d.rfc === 'string' && d.rfc.trim()) || 'N/A',
          nombre: ((d.nombre && typeof d.nombre === 'string' && d.nombre.trim()) || 'N/A').substring(0, 200),
          prestamo: Number.isInteger(d.prestamo) ? d.prestamo : 0,
          letra: Number.isInteger(d.letra) ? d.letra : 0,
          plazo: Number.isInteger(d.plazo) ? d.plazo : 0,
          periodo_c: (d.periodo_c && typeof d.periodo_c === 'string' && d.periodo_c.trim()) || 'N/A',
          fecha_c: d.fecha_c ? new Date(d.fecha_c).toISOString().split('T')[0] : '1900-01-01',
          capital: typeof d.capital === 'number' && !isNaN(d.capital) ? d.capital : 0,
          interes: typeof d.interes === 'number' && !isNaN(d.interes) ? d.interes : 0,
          monto: typeof d.monto === 'number' && !isNaN(d.monto) ? d.monto : 0,
          moratorios: typeof d.moratorios === 'number' && !isNaN(d.moratorios) ? d.moratorios : 0,
          total: typeof d.total === 'number' && !isNaN(d.total) ? d.total : 0,
          resultado: (d.resultado && typeof d.resultado === 'string' && d.resultado.trim()) || 'N/A',
          td: (d.td && typeof d.td === 'string' && d.td.trim()) || 'N/A',
          org0: ((d.org0 && typeof d.org0 === 'string' && d.org0.trim()) || org0).padStart(2, '0').substring(0, 2),
          org1: ((d.org1 && typeof d.org1 === 'string' && d.org1.trim()) || org1).padStart(2, '0').substring(0, 2),
          org2: ((d.org2 && typeof d.org2 === 'string' && d.org2.trim()) || '00').padStart(2, '0').substring(0, 2),
          org3: ((d.org3 && typeof d.org3 === 'string' && d.org3.trim()) || '00').padStart(2, '0').substring(0, 2),
          norg0: (d.norg0 && typeof d.norg0 === 'string' && d.norg0.trim()) || 'N/A',
          norg1: (d.norg1 && typeof d.norg1 === 'string' && d.norg1.trim()) || 'N/A',
          norg2: (d.norg2 && typeof d.norg2 === 'string' && d.norg2.trim()) || 'N/A',
          norg3: (d.norg3 && typeof d.norg3 === 'string' && d.norg3.trim()) || 'N/A'
        }))
      };

      // Transformar PrestamosMedianoPlazo (siempre, incluso con 0 registros)
      historicoData.prestamosMedianoPlazo = {
        header: {
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          usuario_id: userId?.toString() || 'system',
          total_empleados: prestamosMedianoPlazoData?.prestamos?.length || 0,
          total_contribucion: prestamosMedianoPlazoData?.prestamos?.reduce((sum: number, p: any) => sum + (typeof p.total === 'number' && !isNaN(p.total) ? p.total : 0), 0) || 0,
          total_sueldo_base: 0 // No aplica directamente para préstamos
        },
        detalle: (prestamosMedianoPlazoData?.prestamos || []).map((d: any) => ({
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          interno: Number.isInteger(d.interno) ? d.interno : 0,
          rfc: (d.rfc && typeof d.rfc === 'string' && d.rfc.trim()) || 'N/A',
          nombre: ((d.nombre && typeof d.nombre === 'string' && d.nombre.trim()) || 'N/A').substring(0, 200),
          prestamo: Number.isInteger(d.prestamo) ? d.prestamo : 0,
          letra: Number.isInteger(d.letra) ? d.letra : 0,
          plazo: Number.isInteger(d.plazo) ? d.plazo : 0,
          periodo_c: (d.periodo_c && typeof d.periodo_c === 'string' && d.periodo_c.trim()) || 'N/A',
          fecha_c: d.fecha_c ? new Date(d.fecha_c).toISOString().split('T')[0] : '1900-01-01',
          capital: typeof d.capital === 'number' && !isNaN(d.capital) ? d.capital : 0,
          moratorios: typeof d.moratorios === 'number' && !isNaN(d.moratorios) ? d.moratorios : 0,
          interes: typeof d.interes === 'number' && !isNaN(d.interes) ? d.interes : 0,
          seguro: typeof d.seguro === 'number' && !isNaN(d.seguro) ? d.seguro : 0,
          total: typeof d.total === 'number' && !isNaN(d.total) ? d.total : 0,
          resultado: (d.resultado && typeof d.resultado === 'string' && d.resultado.trim()) || 'N/A',
          clase: (d.clase && typeof d.clase === 'string' && d.clase.trim()) || 'N/A',
          desc_clase: (d.desc_clase && typeof d.desc_clase === 'string' && d.desc_clase.trim()) || 'N/A',
          desc_prestamo: (d.desc_prestamo && typeof d.desc_prestamo === 'string' && d.desc_prestamo.trim()) || 'N/A',
          clave_p: (d.clave_p && typeof d.clave_p === 'string' && d.clave_p.trim()) || 'N/A',
          noemple: (d.noemple && typeof d.noemple === 'string' && d.noemple.trim()) || 'N/A',
          folio: Number.isInteger(d.folio) ? d.folio : 0,
          anio_prestamo: Number.isInteger(d.anio) ? d.anio : 0,
          po: (d.po && typeof d.po === 'string' && d.po.trim()) || 'N/A',
          fecha_origen: d.fecha_origen ? new Date(d.fecha_origen).toISOString().split('T')[0] : '1900-01-01',
          org0: ((d.org0 && typeof d.org0 === 'string' && d.org0.trim()) || org0).padStart(2, '0').substring(0, 2),
          org1: ((d.org1 && typeof d.org1 === 'string' && d.org1.trim()) || org1).padStart(2, '0').substring(0, 2),
          org2: ((d.org2 && typeof d.org2 === 'string' && d.org2.trim()) || '00').padStart(2, '0').substring(0, 2),
          org3: ((d.org3 && typeof d.org3 === 'string' && d.org3.trim()) || '00').padStart(2, '0').substring(0, 2),
          norg0: (d.norg0 && typeof d.norg0 === 'string' && d.norg0.trim()) || 'N/A',
          norg1: (d.norg1 && typeof d.norg1 === 'string' && d.norg1.trim()) || 'N/A',
          norg2: (d.norg2 && typeof d.norg2 === 'string' && d.norg2.trim()) || 'N/A',
          norg3: (d.norg3 && typeof d.norg3 === 'string' && d.norg3.trim()) || 'N/A'
        }))
      };

      // Transformar PrestamosHipotecarios (siempre, incluso con 0 registros)
      const computadoraAntiguaInt = prestamosHipotecariosData?.computadora_antigua ? 1 : 0;
      historicoData.prestamosHipotecarios = {
        header: {
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          usuario_id: userId?.toString() || 'system',
          total_empleados: prestamosHipotecariosData?.prestamos?.length || 0,
          total_contribucion: prestamosHipotecariosData?.prestamos?.reduce((sum: number, p: any) => sum + (typeof p.cantidad === 'number' && !isNaN(p.cantidad) ? p.cantidad : 0), 0) || 0,
          total_sueldo_base: 0 // No aplica directamente para préstamos
        },
        detalle: (prestamosHipotecariosData?.prestamos || []).map((d: any) => ({
          clave_organica_0: org0,
          clave_organica_1: org1,
          quincena,
          anio,
          computadora_antigua: computadoraAntiguaInt,
          interno: Number.isInteger(d.interno) ? d.interno : 0,
          nombre: ((d.nombre && typeof d.nombre === 'string' && d.nombre.trim()) || 'N/A').substring(0, 200),
          noempleado: (d.noempleado && typeof d.noempleado === 'string' && d.noempleado.trim()) || 'N/A',
          rfc: (d.rfc && typeof d.rfc === 'string' && d.rfc.trim()) || 'N/A',
          cantidad: typeof d.cantidad === 'number' && !isNaN(d.cantidad) ? d.cantidad : 0,
          status: (d.status && typeof d.status === 'string' && d.status.trim()) || 'N/A',
          referencia_1: (d.referencia_1 && typeof d.referencia_1 === 'string' && d.referencia_1.trim()) || 'N/A',
          referencia_2: (d.referencia_2 && typeof d.referencia_2 === 'string' && d.referencia_2.trim()) || 'N/A',
          pno_solicitud: Number.isInteger(d.pno_solicitud) ? d.pno_solicitud : 0,
          pano: Number.isInteger(d.pano) ? d.pano : 0,
          pclave_clase_prestamo: (d.pclave_clase_prestamo && typeof d.pclave_clase_prestamo === 'string' && d.pclave_clase_prestamo.trim()) || 'N/A',
          pdescripcion: (d.pdescripcion && typeof d.pdescripcion === 'string' && d.pdescripcion.trim()) || 'N/A',
          pclave_prestamo: (d.pclave_prestamo && typeof d.pclave_prestamo === 'string' && d.pclave_prestamo.trim()) || 'N/A',
          prestamo_desc: (d.prestamo_desc && typeof d.prestamo_desc === 'string' && d.prestamo_desc.trim()) || 'N/A',
          tipo: (d.tipo && typeof d.tipo === 'string' && d.tipo.trim()) || 'N/A',
          periodo_c: (d.periodo_c && typeof d.periodo_c === 'string' && d.periodo_c.trim()) || 'N/A',
          descto: typeof d.descto === 'number' && !isNaN(d.descto) ? d.descto : 0,
          fecha_c: d.fecha_c ? new Date(d.fecha_c).toISOString().split('T')[0] : '1900-01-01',
          resultado: (d.resultado && typeof d.resultado === 'string' && d.resultado.trim()) || 'N/A',
          po: (d.po && typeof d.po === 'string' && d.po.trim()) || 'N/A',
          fecha_origen: d.fecha_origen ? new Date(d.fecha_origen).toISOString().split('T')[0] : '1900-01-01',
          plazo: Number.isInteger(d.plazo) ? d.plazo : 0,
          capital_pagar: typeof d.capital_pagar === 'number' && !isNaN(d.capital_pagar) ? d.capital_pagar : 0,
          interes_pagar: typeof d.interes_pagar === 'number' && !isNaN(d.interes_pagar) ? d.interes_pagar : 0,
          interes_diferido_pagar: typeof d.interes_diferido_pagar === 'number' && !isNaN(d.interes_diferido_pagar) ? d.interes_diferido_pagar : 0,
          seguro_pagar: typeof d.seguro_pagar === 'number' && !isNaN(d.seguro_pagar) ? d.seguro_pagar : 0,
          moratorio_pagar: typeof d.moratorio_pagar === 'number' && !isNaN(d.moratorio_pagar) ? d.moratorio_pagar : 0,
          org0: ((d.org0 && typeof d.org0 === 'string' && d.org0.trim()) || org0).padStart(2, '0').substring(0, 2),
          org1: ((d.org1 && typeof d.org1 === 'string' && d.org1.trim()) || org1).padStart(2, '0').substring(0, 2),
          org2: ((d.org2 && typeof d.org2 === 'string' && d.org2.trim()) || '00').padStart(2, '0').substring(0, 2),
          org3: ((d.org3 && typeof d.org3 === 'string' && d.org3.trim()) || '00').padStart(2, '0').substring(0, 2),
          norg0: (d.norg0 && typeof d.norg0 === 'string' && d.norg0.trim()) || 'N/A',
          norg1: (d.norg1 && typeof d.norg1 === 'string' && d.norg1.trim()) || 'N/A',
          norg2: (d.norg2 && typeof d.norg2 === 'string' && d.norg2.trim()) || 'N/A',
          norg3: (d.norg3 && typeof d.norg3 === 'string' && d.norg3.trim()) || 'N/A'
        }))
      };

      // Validar con schema
      const parsed = GuardarHistoricoRetencionesSchema.safeParse(historicoData);
      if (!parsed.success) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos transformados inválidos',
            details: parsed.error.issues,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Llamar al repository para guardar
      const repository = request.diScope.resolve<AplicacionQuincenalRepository>('aplicacionQuincenalRepo');
      const result = await repository.guardarHistoricoRetenciones(request, parsed.data);

      return reply.code(200).send({
        ok: true,
        data: result
      });
    } catch (error: any) {
      return handleAplicacionQuincenalError(error, reply);
    }
  });
}

