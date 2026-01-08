import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { handleAplicacionQuincenalError } from './infrastructure/errorHandler.js';
import { 
  AportacionQuincenalResumenParamsSchema, 
  ResumenOrgQnaAllParamsSchema,
  GuardarHistoricoAportacionesSchema,
  GuardarHistoricoRetencionesSchema
} from './aplicacionQuincenal.schemas.js';
import { GetAportacionQuincenalResumenQuery } from './application/queries/GetAportacionQuincenalResumenQuery.js';
import { GetResumenOrgQnaAllQuery } from './application/queries/GetResumenOrgQnaAllQuery.js';
import { AplicacionQuincenalRepository } from './infrastructure/persistence/AplicacionQuincenalRepository.js';

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
}

