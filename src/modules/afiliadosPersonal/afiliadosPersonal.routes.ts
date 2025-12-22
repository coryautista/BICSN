import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { ok } from '../../utils/http.js';
import { GetPlantillaQuery } from './application/queries/GetPlantillaQuery.js';
import { BusquedaHistoricoQuery } from './application/queries/BusquedaHistoricoQuery.js';
import { handleAfiliadosPersonalError } from './infrastructure/errorHandler.js';
import { AfiliadosPersonalAccessDeniedError } from './domain/errors.js';

export default async function afiliadosPersonalRoutes(app: FastifyInstance) {

  // Resolve dependencies from DI container
  const getPlantillaQuery = app.diContainer.resolve<GetPlantillaQuery>('getPlantillaQuery');
  const busquedaHistoricoQuery = app.diContainer.resolve<BusquedaHistoricoQuery>('busquedaHistoricoQuery');

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
                  INTERNO: { type: 'number' },
                  CURP: { type: 'string', nullable: true },
                  RFC: { type: 'string', nullable: true },
                  NOEMPLEADO: { type: 'string', nullable: true },
                  NOMBRE: { type: 'string', nullable: true },
                  APELLIDO_PATERNO: { type: 'string', nullable: true },
                  APELLIDO_MATERNO: { type: 'string', nullable: true },
                  FECHA_NACIMIENTO: { type: 'string', nullable: true },
                  SEGURIDAD_SOCIAL: { type: 'string', nullable: true },
                  CALLE_NUMERO: { type: 'string', nullable: true },
                  FRACCIONAMIENTO: { type: 'string', nullable: true },
                  CODIGO_POSTAL: { type: 'string', nullable: true },
                  TELEFONO: { type: 'string', nullable: true },
                  SEXO: { type: 'string', nullable: true },
                  ESTADO_CIVIL: { type: 'string', nullable: true },
                  LOCALIDAD: { type: 'string', nullable: true },
                  MUNICIPIO: { type: 'string', nullable: true },
                  ESTADO: { type: 'string', nullable: true },
                  PAIS: { type: 'string', nullable: true },
                  DEPENDIENTES: { type: 'number', nullable: true },
                  POSEE_INMUEBLES: { type: 'string', nullable: true },
                  FULLNAME: { type: 'string', nullable: true },
                  FECHA_CARTA: { type: 'string', nullable: true },
                  EMAIL: { type: 'string', nullable: true },
                  NACIONALIDAD: { type: 'string', nullable: true },
                  FECHA_ALTA: { type: 'string', nullable: true },
                  CELULAR: { type: 'string', nullable: true },
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
                  DSUELDO: { type: 'string', nullable: true },
                  DOTRAS_PRESTACIONES: { type: 'string', nullable: true },
                  DQUINQUENIOS: { type: 'string', nullable: true },
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
        throw new AfiliadosPersonalAccessDeniedError('Usuario no tiene permisos para acceder a esta información', { userId: user?.sub });
      }

      // Normalizar claves orgánicas: deben tener 2 caracteres con padding de ceros a la izquierda
      // Firebird espera formato "04" no "4"
      const claveOrganica0 = user.idOrganica0.toString().trim().padStart(2, '0');
      const claveOrganica1 = user.idOrganica1.toString().trim().padStart(2, '0');

      const records = await getPlantillaQuery.execute(claveOrganica0, claveOrganica1);
      
      // El mojibake se limpia automáticamente por el plugin mojibakeCleaner
      return reply.send(ok(records));
    } catch (error: any) {
      console.error('[DEBUG obtenerPlantilla] Error en endpoint:', {
        error: error.message,
        stack: error.stack
      });
      return handleAfiliadosPersonalError(error, reply);
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
                  INTERNO: { type: 'number' },
                  NOMBRE: { type: 'string', nullable: true },
                  APELLIDO_PATERNO: { type: 'string', nullable: true },
                  APELLIDO_MATERNO: { type: 'string', nullable: true },
                  CURP: { type: 'string', nullable: true },
                  RFC: { type: 'string', nullable: true },
                  ACTIVO: { type: 'string', nullable: true }
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
      const records = await busquedaHistoricoQuery.execute(search);
      
      // El mojibake se limpia automáticamente por el plugin mojibakeCleaner
      return reply.send(ok(records));
    } catch (error: any) {
      return handleAfiliadosPersonalError(error, reply);
    }
  });
}