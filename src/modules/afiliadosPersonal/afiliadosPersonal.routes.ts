import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { getObtenerPlantilla, getBusquedaHistorico } from './afiliadosPersonal.service.js';
import { ok, fail } from '../../utils/http.js';

export default async function afiliadosPersonalRoutes(app: FastifyInstance) {
  // GET /obtenerPlantilla - Obtener plantilla de personal
  app.get('/obtenerPlantilla', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener plantilla de personal con información de PERSONAL y ORG_PERSONAL',
      tags: ['afiliadosPersonal', 'firebird'],
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
                  INTERNO: { type: 'string' },
                  CURP: { type: 'string', nullable: true },
                  RFC: { type: 'string', nullable: true },
                  NOEMPLEADO: { type: 'string', nullable: true },
                  NOMBRE: { type: 'string', nullable: true },
                  APELLIDO_PATERNO: { type: 'string', nullable: true },
                  APELLIDO_MATERNO: { type: 'string', nullable: true },
                  FECHA_NACIMIENTO: { type: 'string', nullable: true },
                  SEXO: { type: 'string', nullable: true },
                  ESTADO_CIVIL: { type: 'string', nullable: true },
                  NACIONALIDAD: { type: 'string', nullable: true },
                  FECHA_ALTA: { type: 'string', nullable: true },
                  CELULAR: { type: 'string', nullable: true },
                  EMAIL: { type: 'string', nullable: true },
                  CALLE_NUMERO: { type: 'string', nullable: true },
                  FRACCIONAMIENTO: { type: 'string', nullable: true },
                  CODIGO_POSTAL: { type: 'string', nullable: true },
                  LOCALIDAD: { type: 'string', nullable: true },
                  MUNICIPIO: { type: 'string', nullable: true },
                  ESTADO: { type: 'string', nullable: true },
                  PAIS: { type: 'string', nullable: true },
                  DEPENDIENTES: { type: 'number', nullable: true },
                  POSEE_INMUEBLES: { type: 'string', nullable: true },
                  FULLNAME: { type: 'string', nullable: true },
                  FECHA_CARTA: { type: 'string', nullable: true },
                  TELEFONO: { type: 'string', nullable: true },
                  EXPEDIENTE: { type: 'string', nullable: true },
                  F_EXPEDIENTE: { type: 'string', nullable: true },
                  CLAVE_ORGANICA_0: { type: 'string', nullable: true },
                  CLAVE_ORGANICA_1: { type: 'string', nullable: true },
                  CLAVE_ORGANICA_2: { type: 'string', nullable: true },
                  CLAVE_ORGANICA_3: { type: 'string', nullable: true },
                  SUELDO: { type: 'number', nullable: true },
                  OTRAS_PRESTACIONES: { type: 'number', nullable: true },
                  QUINQUENIOS: { type: 'number', nullable: true },
                  ACTIVO: { type: 'string', nullable: true },
                  FECHA_MOV_ALT: { type: 'string', nullable: true },
                  ORGS1: { type: 'string', nullable: true },
                  ORGS2: { type: 'string', nullable: true },
                  ORGS3: { type: 'string', nullable: true },
                  ORGS: { type: 'string', nullable: true },
                  DSUELDO: { type: 'number', nullable: true },
                  DOTRAS_PRESTACIONES: { type: 'number', nullable: true },
                  DQUINQUENIOS: { type: 'number', nullable: true },
                  APLICAR: { type: 'string', nullable: true },
                  BC: { type: 'string', nullable: true },
                  PORCENTAJE: { type: 'number', nullable: true }
                }
              }
            }
          }
        },
        403: {
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
  }, async (req: any, reply) => {
    try {
      // Obtener las claves orgánicas del usuario desde el token JWT
      const user = req.user;
      if (!user || !user.idOrganica0 || !user.idOrganica1) {
        return reply.code(403).send(fail('Usuario no tiene permisos para acceder a esta información'));
      }

      const claveOrganica0 = user.idOrganica0.toString();
      const claveOrganica1 = user.idOrganica1.toString();

      const records = await getObtenerPlantilla(claveOrganica0, claveOrganica1);
      return reply.send(ok(records));
    } catch (error: any) {
      console.error('Error obteniendo plantilla:', error);
      return reply.code(500).send(fail('OBTENER_PLANTILLA_FAILED'));
    }
  });

  // GET /busquedaHistorico - Búsqueda histórica de personal
  app.get('/busquedaHistorico', {
    preHandler: [requireAuth],
    schema: {
      description: 'Búsqueda histórica de personal por RFC, CURP, INTERNO, NOEMPLEADO o nombre completo',
      tags: ['afiliadosPersonal', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Término de búsqueda (RFC, CURP, INTERNO, NOEMPLEADO o nombre completo)'
          }
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
                  INTERNO: { type: 'string' },
                  CURP: { type: 'string', nullable: true },
                  RFC: { type: 'string', nullable: true },
                  NOEMPLEADO: { type: 'string', nullable: true },
                  NOMBRE: { type: 'string', nullable: true },
                  APELLIDO_PATERNO: { type: 'string', nullable: true },
                  APELLIDO_MATERNO: { type: 'string', nullable: true },
                  FECHA_NACIMIENTO: { type: 'string', nullable: true },
                  SEXO: { type: 'string', nullable: true },
                  ESTADO_CIVIL: { type: 'string', nullable: true },
                  NACIONALIDAD: { type: 'string', nullable: true },
                  FECHA_ALTA: { type: 'string', nullable: true },
                  CELULAR: { type: 'string', nullable: true },
                  EMAIL: { type: 'string', nullable: true },
                  CALLE_NUMERO: { type: 'string', nullable: true },
                  FRACCIONAMIENTO: { type: 'string', nullable: true },
                  CODIGO_POSTAL: { type: 'string', nullable: true },
                  LOCALIDAD: { type: 'string', nullable: true },
                  MUNICIPIO: { type: 'string', nullable: true },
                  ESTADO: { type: 'string', nullable: true },
                  PAIS: { type: 'string', nullable: true },
                  DEPENDIENTES: { type: 'number', nullable: true },
                  POSEE_INMUEBLES: { type: 'string', nullable: true },
                  FULLNAME: { type: 'string', nullable: true },
                  FECHA_CARTA: { type: 'string', nullable: true },
                  TELEFONO: { type: 'string', nullable: true },
                  EXPEDIENTE: { type: 'string', nullable: true },
                  F_EXPEDIENTE: { type: 'string', nullable: true },
                  CLAVE_ORGANICA_0: { type: 'string', nullable: true },
                  CLAVE_ORGANICA_1: { type: 'string', nullable: true },
                  CLAVE_ORGANICA_2: { type: 'string', nullable: true },
                  CLAVE_ORGANICA_3: { type: 'string', nullable: true },
                  SUELDO: { type: 'number', nullable: true },
                  OTRAS_PRESTACIONES: { type: 'number', nullable: true },
                  QUINQUENIOS: { type: 'number', nullable: true },
                  ACTIVO: { type: 'string', nullable: true },
                  FECHA_MOV_ALT: { type: 'string', nullable: true },
                  ORGS1: { type: 'string', nullable: true },
                  ORGS2: { type: 'string', nullable: true },
                  ORGS3: { type: 'string', nullable: true },
                  ORGS: { type: 'string', nullable: true },
                  DSUELDO: { type: 'number', nullable: true },
                  DOTRAS_PRESTACIONES: { type: 'number', nullable: true },
                  DQUINQUENIOS: { type: 'number', nullable: true },
                  APLICAR: { type: 'string', nullable: true },
                  BC: { type: 'string', nullable: true },
                  PORCENTAJE: { type: 'number', nullable: true }
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
  }, async (req: any, reply) => {
    try {
      const { search } = req.query as { search?: string };
      const records = await getBusquedaHistorico(search);
      return reply.send(ok(records));
    } catch (error: any) {
      console.error('Error en búsqueda histórica:', error);
      return reply.code(500).send(fail('BUSQUEDA_HISTORICA_FAILED'));
    }
  });
}