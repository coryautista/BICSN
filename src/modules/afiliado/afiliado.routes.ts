import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { CreateAfiliadoSchema, UpdateAfiliadoSchema, CreateAfiliadoAfiliadoOrgMovimientoSchema, CreateCambioSueldoSchema, CreateBajaPermanenteSchema, CreateBajaSuspensionSchema, CreateBajaTerminaSuspensionSchema, CreateBajaTerminaSuspensionYBajaSchema, AplicarBDIsspeaLoteSchema } from './afiliado.schemas.js';
import {
  createAfiliadoAfiliadoOrgMovimientoService
} from './afiliado.service.js';
import { ok, fail, validationError } from '../../utils/http.js';
import { GetAllAfiliadosQuery } from './application/queries/GetAllAfiliadosQuery.js';
import { GetAfiliadoByIdQuery } from './application/queries/GetAfiliadoByIdQuery.js';
import { ValidateInternoInFirebirdQuery } from './application/queries/ValidateInternoInFirebirdQuery.js';
import { GetMovimientosQuincenalesQuery } from './application/queries/GetMovimientosQuincenalesQuery.js';
import { CreateAfiliadoCommand } from './application/commands/CreateAfiliadoCommand.js';
import { UpdateAfiliadoCommand } from './application/commands/UpdateAfiliadoCommand.js';
import { DeleteAfiliadoCommand } from './application/commands/DeleteAfiliadoCommand.js';
import { CreateCompleteAfiliadoCommand } from './application/commands/CreateCompleteAfiliadoCommand.js';
import { AplicarBDIsspeaLoteCommand } from './application/commands/AplicarBDIsspeaLoteCommand.js';
import { AplicarBDIssspeaQNACommand } from './application/commands/AplicarBDIssspeaQNACommand.js';
import { handleAfiliadoError } from './infrastructure/errorHandler.js';
import { 
  prepararLogEjecucionDPEditaEntidad, 
  obtenerInternoParaPreview,
  obtenerPeriodo,
  type LogEjecucionDPEditaEntidad,
  type LogEjecucionDPEditaPersonal
} from './infrastructure/firebird/FirebirdMovimientoService.js';
import { getMovimientosByAfiliadoId } from '../movimiento/movimiento.repo.js';
import { getPool } from '../../db/mssql.js';
import sql from 'mssql';
import pino from 'pino';

const logger = pino({
  name: 'afiliado-routes',
  level: process.env.LOG_LEVEL || 'info'
});

// Routes for Afiliado CRUD operations
export default async function afiliadoRoutes(app: FastifyInstance) {

  // POST /afiliado/reset - Ejecutar stored procedure sp_ResetAfiliados (solo admin)
  // IMPORTANTE: Esta ruta debe estar ANTES de /afiliado/:id para evitar conflictos
  app.post('/afiliado/reset', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Ejecutar stored procedure sp_ResetAfiliados para resetear afiliados. Requiere rol admin.',
      tags: ['afiliado', 'admin'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                result: { type: 'object' }
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
  }, async (req, reply) => {
    try {
      const { getPool } = await import('../../db/mssql.js');
      const p = await getPool();
      
      // Ejecutar el stored procedure
      const result = await p.request()
        .execute('[afi].[sp_ResetAfiliados]');
      
      return reply.send(ok({
        message: 'Stored procedure sp_ResetAfiliados ejecutado exitosamente',
        result: result.recordset || result.rowsAffected || {}
      }));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'resetAfiliados', user: req.user?.sub });
    }
  });

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
  }, async (req, reply) => {
    try {
      const getAllAfiliadosQuery = req.diScope.resolve<GetAllAfiliadosQuery>('getAllAfiliadosQuery');
      const records = await getAllAfiliadosQuery.execute();
      return reply.send(ok(records));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'getAllAfiliados', user: req.user?.sub });
    }
  });

  // GET /afiliado/preview-dp-edita-entidad-lote - Error handler para método incorrecto
  app.get('/afiliado/preview-dp-edita-entidad-lote', {
    preHandler: [requireAuth],
    schema: {
      description: 'Este endpoint solo acepta POST. Use POST en lugar de GET.',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      response: {
        405: {
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
    return reply.code(405).send({
      ok: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Este endpoint solo acepta el método POST. Por favor, use POST en lugar de GET.'
      }
    });
  });

  // Preview de comandos SQL para DP_EDITA_ENTIDAD sin ejecutar
  app.post('/afiliado/preview-dp-edita-entidad-lote', {
    preParsing: async (req: any, _reply: any) => {
      // Normalizar body ANTES de la validación del schema
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        req.body = {};
      }
    },
    preHandler: [requireAuth],
    schema: {
      description: 'Genera comandos SQL ejecutables para Firebird del stored procedure DP_EDITA_ENTIDAD para todos los afiliados en numValidacion=2 (Aprobado) o numValidacion=3 (En Revisión) de la orgánica del usuario. NO ejecuta nada, solo genera los comandos SQL.',
      summary: 'Preview de comandos SQL para DP_EDITA_ENTIDAD',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          motivo: { type: 'string', maxLength: 500, description: 'Motivo (opcional, no se usa en preview)' },
          observaciones: { type: 'string', maxLength: 1000, description: 'Observaciones (opcional, no se usa en preview)' }
        },
        additionalProperties: false
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                organica: { type: 'string' },
                totalAfiliados: { type: 'number' },
                totalMovimientos: { type: 'number' },
                movimientosListosParaEjecutar: { type: 'number' },
                movimientosConErrores: { type: 'number' },
                comandosFirebird: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      afiliadoId: { type: 'number' },
                      folio: { type: 'number', nullable: true },
                      nombreCompleto: { type: 'string' },
                      estadoActual: { type: 'string' },
                      movimientos: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            movimientoId: { type: 'number' },
                            tipoMovimientoId: { type: 'number' },
                            codigoMovimiento: { type: 'string', nullable: true },
                            sqlQuery: { type: 'string', nullable: true },
                            parametros: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  nombre: { type: 'string' },
                                  valor: {},
                                  tipo: { type: 'string' }
                                }
                              },
                              nullable: true
                            },
                            comandoEjecutable: { type: 'string', nullable: true },
                            validaciones: {
                              type: 'object',
                              properties: {
                                codigoMovimiento: { type: 'object' },
                                datosMovimiento: { type: 'object' },
                                periodo: { type: 'object' },
                                fecha: { type: 'object' },
                                porcentaje: { type: 'object' },
                                baseConfianza: { type: 'object' }
                              }
                            },
                            listoParaEjecutar: { type: 'boolean' },
                            errores: { type: 'array', items: { type: 'string' } }
                          }
                        }
                      }
                    }
                  }
                },
                comandosDPEditaPersonal: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      afiliadoId: { type: 'number' },
                      folio: { type: 'number', nullable: true },
                      nombreCompleto: { type: 'string' },
                      sqlQuery: { type: 'string', nullable: true },
                      parametros: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            nombre: { type: 'string' },
                            valor: {},
                            tipo: { type: 'string' }
                          }
                        },
                        nullable: true
                      },
                      comandoEjecutable: { type: 'string', nullable: true },
                      validaciones: {
                        type: 'object',
                        properties: {
                          datosAfiliado: { type: 'object' },
                          camposRequeridos: { type: 'object' }
                        }
                      },
                      listoParaEjecutar: { type: 'boolean' },
                      errores: { type: 'array', items: { type: 'string' } }
                    }
                  }
                },
                resumen: {
                  type: 'object',
                  properties: {
                    totalAfiliados: { type: 'number' },
                    totalMovimientos: { type: 'number' },
                    listosParaEjecutar: { type: 'number' },
                    conErrores: { type: 'number' },
                    organica: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        400: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      // Normalizar body: si es null, undefined o string vacío, usar objeto vacío
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      
      // Validar body con schema
      const parsed = AplicarBDIsspeaLoteSchema.safeParse(body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      // Obtener orgánica del usuario autenticado
      const userOrg0 = req.user?.idOrganica0 ?? '';
      const userOrg1 = req.user?.idOrganica1 ?? '';

      if (!userOrg0 || !userOrg1) {
        return reply.code(400).send(fail('USER_ORGANICA_NOT_FOUND: Usuario no tiene orgánica configurada'));
      }

      // Formatear orgánicas a strings de 2 caracteres
      const org0 = typeof userOrg0 === 'string' ? userOrg0.padStart(2, '0') : String(userOrg0).padStart(2, '0');
      const org1 = typeof userOrg1 === 'string' ? userOrg1.padStart(2, '0') : String(userOrg1).padStart(2, '0');

      // Obtener pool de conexión
      const p = await getPool();

      // Obtener todos los afiliados en estados 2 y 3
      const afiliadosQuery = await p.request()
        .input('org0', sql.VarChar(30), org0)
        .input('org1', sql.VarChar(30), org1)
        .query(`
          SELECT DISTINCT a.id, a.folio, a.nombre, a.apellidoPaterno, a.apellidoMaterno,
                 a.numValidacion, s.nombreStatus as statusActual
          FROM afi.Afiliado a
          INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
          INNER JOIN afi.AfiliadoStatusControl s ON a.numValidacion = s.numValidacion
          WHERE ao.claveOrganica0 = @org0
            AND ao.claveOrganica1 = @org1
            AND a.numValidacion IN (2, 3)
            AND a.estatus = 1
            AND s.activo = 1
          ORDER BY a.id
        `);

      const afiliadosParaProcesar = afiliadosQuery.recordset;
      const comandosFirebird: Array<{
        afiliadoId: number;
        folio: number | null;
        nombreCompleto: string;
        estadoActual: string;
        movimientos: Array<{
          movimientoId: number;
          tipoMovimientoId: number;
          codigoMovimiento: string | null;
          sqlQuery: string | null;
          parametros: Array<{ nombre: string; valor: any; tipo: string }> | null;
          comandoEjecutable: string | null;
          validaciones: LogEjecucionDPEditaEntidad['validaciones'];
          listoParaEjecutar: boolean;
          errores: string[];
        }>;
      }> = [];

      const comandosDPEditaPersonal: Array<{
        afiliadoId: number;
        folio: number | null;
        nombreCompleto: string;
        sqlQuery: string | null;
        parametros: Array<{ nombre: string; valor: any; tipo: string }> | null;
        comandoEjecutable: string | null;
        validaciones: LogEjecucionDPEditaPersonal['validaciones'];
        listoParaEjecutar: boolean;
        errores: string[];
      }> = [];

      let totalMovimientos = 0;
      let movimientosListosParaEjecutar = 0;
      let movimientosConErrores = 0;
      let comandosDPEditaPersonalListos = 0;
      let comandosDPEditaPersonalConErrores = 0;

      // Función helper para generar comando SQL ejecutable
      const generarComandoEjecutable = (log: LogEjecucionDPEditaEntidad): string | null => {
        if (!log.listoParaEjecutar || !log.datosPreparados || !log.parametros) {
          return null;
        }

        // Formatear valores según tipo
        const formatearValor = (valor: any, tipo: string): string => {
          if (valor === null || valor === undefined) {
            return 'NULL';
          }
          
          if (tipo === 'string') {
            // Escapar comillas simples en strings
            const valorStr = String(valor).replace(/'/g, "''");
            return `'${valorStr}'`;
          }
          
          if (tipo === 'number') {
            return String(valor);
          }
          
          // Por defecto, tratar como string
          const valorStr = String(valor).replace(/'/g, "''");
          return `'${valorStr}'`;
        };

        // Construir lista de parámetros formateados
        const parametrosFormateados = log.parametros.map(param => formatearValor(param.valor, param.tipo));
        
        // Generar comando SQL completo
        const comando = `SELECT CVE_ERROR, NOM_ERROR FROM DP_EDITA_ENTIDAD(${parametrosFormateados.join(', ')})`;
        
        return comando;
      };

      // Procesar cada afiliado
      for (const afiliado of afiliadosParaProcesar) {
        try {
          const nombreCompleto = `${afiliado.nombre || ''} ${afiliado.apellidoPaterno || ''} ${afiliado.apellidoMaterno || ''}`.trim();
          
          // 1. Verificar si necesita DP_EDITA_PERSONAL (no tiene interno)
          const resultadoInterno = await obtenerInternoParaPreview(afiliado.id);
          let tieneErroresDPEditaPersonal = false;

          if (resultadoInterno.logDPEditaPersonal) {
            // Necesita crear registro en PERSONAL
            comandosDPEditaPersonal.push({
              afiliadoId: afiliado.id,
              folio: afiliado.folio,
              nombreCompleto: nombreCompleto,
              sqlQuery: resultadoInterno.logDPEditaPersonal.sqlQuery,
              parametros: resultadoInterno.logDPEditaPersonal.parametros,
              comandoEjecutable: resultadoInterno.logDPEditaPersonal.comandoEjecutable,
              validaciones: resultadoInterno.logDPEditaPersonal.validaciones,
              listoParaEjecutar: resultadoInterno.logDPEditaPersonal.listoParaEjecutar,
              errores: resultadoInterno.logDPEditaPersonal.errores
            });

            if (resultadoInterno.logDPEditaPersonal.listoParaEjecutar) {
              comandosDPEditaPersonalListos++;
            } else {
              comandosDPEditaPersonalConErrores++;
              tieneErroresDPEditaPersonal = true;
            }
          }

          // 2. Obtener movimientos activos del afiliado
          const movimientos = await getMovimientosByAfiliadoId(afiliado.id);
          const movimientosActivos = movimientos.filter(m => m.estatus === 'A');

          if (movimientosActivos.length === 0) {
            continue;
          }

          const movimientosConLogs: Array<{
            movimientoId: number;
            tipoMovimientoId: number;
            codigoMovimiento: string | null;
            sqlQuery: string | null;
            parametros: Array<{ nombre: string; valor: any; tipo: string }> | null;
            comandoEjecutable: string | null;
            validaciones: LogEjecucionDPEditaEntidad['validaciones'];
            listoParaEjecutar: boolean;
            errores: string[];
          }> = [];

          // Generar log para cada movimiento
          for (const movimiento of movimientosActivos) {
            const log = await prepararLogEjecucionDPEditaEntidad(movimiento, org0, org1);
            const comandoEjecutable = generarComandoEjecutable(log);

            // Si el afiliado tiene errores en DP_EDITA_PERSONAL, marcar movimientos como con errores
            const listoParaEjecutar = log.listoParaEjecutar && !tieneErroresDPEditaPersonal;
            const errores = tieneErroresDPEditaPersonal 
              ? [...log.errores, 'El afiliado requiere DP_EDITA_PERSONAL pero tiene errores']
              : log.errores;

            movimientosConLogs.push({
              movimientoId: log.movimientoId,
              tipoMovimientoId: log.tipoMovimientoId,
              codigoMovimiento: log.codigoMovimiento,
              sqlQuery: log.sqlQuery,
              parametros: log.parametros,
              comandoEjecutable: comandoEjecutable,
              validaciones: log.validaciones,
              listoParaEjecutar: listoParaEjecutar,
              errores: errores
            });

            totalMovimientos++;
            if (listoParaEjecutar) {
              movimientosListosParaEjecutar++;
            } else {
              movimientosConErrores++;
            }
          }

          if (movimientosConLogs.length > 0) {
            comandosFirebird.push({
              afiliadoId: afiliado.id,
              folio: afiliado.folio,
              nombreCompleto: nombreCompleto,
              estadoActual: afiliado.statusActual,
              movimientos: movimientosConLogs
            });
          }
        } catch (error: any) {
          console.error(`Error procesando afiliado ${afiliado.id}:`, error);
          // Continuar con el siguiente afiliado
        }
      }

      return reply.send(ok({
        message: `Preview de comandos SQL generado. ${comandosDPEditaPersonalListos} comandos DP_EDITA_PERSONAL y ${movimientosListosParaEjecutar} movimientos listos para ejecutar.`,
        organica: `${org0}/${org1}`,
        totalAfiliados: afiliadosParaProcesar.length,
        totalMovimientos: totalMovimientos,
        movimientosListosParaEjecutar: movimientosListosParaEjecutar,
        movimientosConErrores: movimientosConErrores,
        comandosFirebird: comandosFirebird,
        comandosDPEditaPersonal: comandosDPEditaPersonal,
        resumen: {
          totalAfiliados: afiliadosParaProcesar.length,
          totalMovimientos: totalMovimientos,
          listosParaEjecutar: movimientosListosParaEjecutar,
          conErrores: movimientosConErrores,
          comandosDPEditaPersonalListos: comandosDPEditaPersonalListos,
          comandosDPEditaPersonalConErrores: comandosDPEditaPersonalConErrores,
          organica: `${org0}/${org1}`
        }
      }));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'previewDPEditaEntidadLote', user: req.user?.sub });
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
      const { id } = req.params as { id: number };

      // Validar parámetro ID
      if (!id || id <= 0) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El ID del afiliado debe ser un número positivo'
          }
        });
      }

      const getAfiliadoByIdQuery = req.diScope.resolve<GetAfiliadoByIdQuery>('getAfiliadoByIdQuery');
      const record = await getAfiliadoByIdQuery.execute(id);
      return reply.send(ok(record));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'getAfiliadoById', user: req.user?.sub, afiliadoId: (req.params as any)?.id });
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
      const createAfiliadoCommand = req.diScope.resolve<CreateAfiliadoCommand>('createAfiliadoCommand');
      const record = await createAfiliadoCommand.execute({
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
        codigoPostal: parsed.data.domicilioCodigoPostal ?? null,
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
        anioAplicacion: parsed.data.anioAplicacion ?? null,
        numValidacion: 1,
        afiliadosComplete: 0,
      });
      return reply.code(201).send(ok(record));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'createAfiliado', user: req.user?.sub });
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
      const updateAfiliadoCommand = req.diScope.resolve<UpdateAfiliadoCommand>('updateAfiliadoCommand');
      const record = await updateAfiliadoCommand.execute({ id, ...parsed.data });
      return reply.send(ok(record));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'updateAfiliado', user: req.user?.sub, afiliadoId: id });
    }
  });

  // POST /afiliado/complete - Create afiliado, afiliadoOrg and movimiento together
  app.post('/afiliado/complete', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crear registro completo de Afiliado con AfiliadoOrg y Movimiento. NOTA: claveOrganica0 y claveOrganica1 se obtienen automáticamente del usuario autenticado. claveOrganica2 y claveOrganica3 son opcionales y si se envían en el body se usan esos valores, si no se obtienen del usuario autenticado. orgs1-orgs4 son opcionales y si se envían en el body se usan esos valores, si no se construyen automáticamente concatenando las claveOrganica. nivel0Id a nivel3Id no deben enviarse. tipoMovimientoId es siempre 1. creadoPor es el usuario autenticado. folio, fechaAlta, fechaCarta, fechaMovAlt, quincenaId, fechaMov, folioMov, estatusMov, aplicar, activo, poseeInmuebles y dependientes se calculan/asignan automáticamente.',
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
          fechaNacimiento: { type: 'string' }, // Formato aceptado: YYYY-MM-DD o DD/MM/YYYY (se convierte automáticamente)
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
          fechaCarta: { type: 'string', nullable: true }, // Formato aceptado: YYYY-MM-DD o DD/MM/YYYY (se convierte automáticamente)
          nacionalidad: { type: 'string', maxLength: 80 },
          fechaAlta: { type: 'string', nullable: true }, // Formato aceptado: YYYY-MM-DD o DD/MM/YYYY (se convierte automáticamente)
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
          // Campos orgánicos opcionales (si no se envían, se obtienen del usuario autenticado)
          claveOrganica2: { type: 'string', maxLength: 30, nullable: true },
          claveOrganica3: { type: 'string', maxLength: 30, nullable: true },
          orgs1: { type: 'string', maxLength: 200, nullable: true },
          orgs2: { type: 'string', maxLength: 200, nullable: true },
          orgs3: { type: 'string', maxLength: 200, nullable: true },
          orgs4: { type: 'string', maxLength: 200, nullable: true },
          // Movimiento fields
          observaciones: { type: 'string', maxLength: 1024, nullable: true }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
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
                    anioAplicacion: { type: 'number', nullable: true },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' }
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
                    porcentaje: { type: 'number', nullable: true },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' }
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
                    creadoPorUid: { type: 'string', nullable: true },
                    createdAt: { type: 'string' }
                  }
                }
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
    const parsed = CreateAfiliadoAfiliadoOrgMovimientoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      // Obtener userId del token
      const userId = req.user?.sub ? parseInt(req.user.sub, 10) : null;
      const userUid = req.user?.sub ?? null; // UUID del usuario

      // Obtener claveOrganica0 a claveOrganica3 del body o del usuario autenticado
      // Si se envían en el body, se usan esos valores; si no, se obtienen del usuario
      const claveOrganica0 = req.user?.idOrganica0 ?? null;
      const claveOrganica1 = req.user?.idOrganica1 ?? null;
      const claveOrganica2 = parsed.data.claveOrganica2 ?? req.user?.idOrganica2 ?? null;
      const claveOrganica3 = parsed.data.claveOrganica3 ?? req.user?.idOrganica3 ?? null;
      
      // Construir orgs1-4: si se envían en el body, se usan esos valores
      // Si no, se construyen concatenando las claveOrganica
      const orgs1 = parsed.data.orgs1 !== undefined && parsed.data.orgs1 !== null 
        ? parsed.data.orgs1 
        : [claveOrganica0, claveOrganica1].filter(Boolean).join('');
      const orgs2 = parsed.data.orgs2 !== undefined && parsed.data.orgs2 !== null 
        ? parsed.data.orgs2 
        : [claveOrganica0, claveOrganica1, claveOrganica2].filter(Boolean).join('');
      const orgs3 = parsed.data.orgs3 !== undefined && parsed.data.orgs3 !== null 
        ? parsed.data.orgs3 
        : [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('');
      const orgs4 = parsed.data.orgs4 !== undefined && parsed.data.orgs4 !== null 
        ? parsed.data.orgs4 
        : [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('');

      const createCompleteAfiliadoCommand = req.diScope.resolve<CreateCompleteAfiliadoCommand>('createCompleteAfiliadoCommand');
      const result = await createCompleteAfiliadoCommand.execute({
        afiliado: {
          folio: undefined, // Se auto-genera
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
          estatus: parsed.data.estatus ?? true,
          interno: parsed.data.interno ?? 0,
          noEmpleado: parsed.data.noEmpleado ?? null,
          localidad: parsed.data.localidad ?? null,
          municipio: parsed.data.municipio ?? null,
          estado: parsed.data.estado ?? null,
          pais: parsed.data.pais ?? null,
          dependientes: 0,
          poseeInmuebles: false,
          fechaCarta: parsed.data.fechaCarta ?? null,
          nacionalidad: parsed.data.nacionalidad ?? null,
          fechaAlta: parsed.data.fechaAlta ?? null,
          celular: parsed.data.celular ?? null,
          expediente: parsed.data.expediente ?? null,
          quincenaAplicacion: undefined, // Se calcula automáticamente
          anioAplicacion: undefined, // Se calcula automáticamente
          codigoPostal: parsed.data.domicilioCodigoPostal ?? null
        },
        afiliadoOrg: {
          nivel0Id: null,
          nivel1Id: null,
          nivel2Id: null,
          nivel3Id: null,
          claveOrganica0,
          claveOrganica1,
          claveOrganica2,
          claveOrganica3,
          interno: parsed.data.internoOrg ?? null,
          sueldo: parsed.data.sueldo ?? null,
          otrasPrestaciones: parsed.data.otrasPrestaciones ?? null,
          quinquenios: parsed.data.quinquenios ?? null,
          activo: true,
          fechaMovAlt: null,
          orgs1: orgs1 || null, // Si es string vacío, se guarda como null
          orgs2: orgs2 || null,
          orgs3: orgs3 || null,
          orgs4: orgs4 || null,
          dSueldo: parsed.data.dSueldo ?? null,
          dOtrasPrestaciones: parsed.data.dOtrasPrestaciones ?? null,
          dQuinquenios: parsed.data.dQuinquenios ?? null,
          aplicar: true,
          bc: parsed.data.bc ?? null,
          porcentaje: parsed.data.porcentaje ?? null
        },
        movimiento: {
          quincenaId: undefined, // Se calcula automáticamente
          tipoMovimientoId: 1,
          fecha: null,
          observaciones: parsed.data.observaciones ?? null,
          folio: '',
          estatus: 'A',
          creadoPor: userId ?? 1,
          creadoPorUid: userUid
        }
      });
      return reply.code(201).send(ok(result));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'createCompleteAfiliado', user: req.user?.sub });
    }
  });

  // POST /afiliado/cambio-sueldo - Create salary change movement
  app.post('/afiliado/cambio-sueldo', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crear movimiento de cambio de sueldo (tipoMovimientoId=5). Similar a /afiliado/complete pero para cambios de sueldo. NOTA: claveOrganica0 y claveOrganica1 se obtienen automáticamente del usuario autenticado. claveOrganica2 y claveOrganica3 son opcionales y si se envían en el body se usan esos valores, si no se obtienen del usuario autenticado. orgs1-orgs4 son opcionales y si se envían en el body se usan esos valores, si no se construyen automáticamente concatenando las claveOrganica. El campo expediente es opcional y si no se proporciona se utilizará la CURP como identificador de documentos en el FTP.',
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
          // Campos orgánicos opcionales (si no se envían, se obtienen del usuario autenticado)
          claveOrganica2: { type: 'string', maxLength: 30, nullable: true },
          claveOrganica3: { type: 'string', maxLength: 30, nullable: true },
          orgs1: { type: 'string', maxLength: 200, nullable: true },
          orgs2: { type: 'string', maxLength: 200, nullable: true },
          orgs3: { type: 'string', maxLength: 200, nullable: true },
          orgs4: { type: 'string', maxLength: 200, nullable: true },
          // Movimiento fields
          observaciones: { type: 'string', maxLength: 1024, nullable: true }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
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
                    anioAplicacion: { type: 'number', nullable: true },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' }
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
                    porcentaje: { type: 'number', nullable: true },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' }
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
                    creadoPorUid: { type: 'string', nullable: true },
                    createdAt: { type: 'string' }
                  }
                }
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
    const parsed = CreateCambioSueldoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      // Validar que el interno exista en Firebird
      const validateInternoInFirebirdQuery = req.diScope.resolve<ValidateInternoInFirebirdQuery>('validateInternoInFirebirdQuery');
      const internoExists = await validateInternoInFirebirdQuery.execute(parsed.data.interno!);
      if (!internoExists) {
        return reply.code(404).send(fail('INTERNO_NOT_FOUND_IN_FIREBIRD: El número de interno no existe en las tablas PERSONAL y ORG_PERSONAL'));
      }

      // Obtener userId del token
      const userId = req.user?.sub ? parseInt(req.user.sub, 10) : null;
      const userUid = req.user?.sub ?? null; // UUID del usuario
      
      // Obtener claveOrganica0 a claveOrganica3 del body o del usuario autenticado
      // Si se envían en el body, se usan esos valores; si no, se obtienen del usuario
      const claveOrganica0 = req.user?.idOrganica0 ?? null;
      const claveOrganica1 = req.user?.idOrganica1 ?? null;
      const claveOrganica2 = parsed.data.claveOrganica2 ?? req.user?.idOrganica2 ?? null;
      const claveOrganica3 = parsed.data.claveOrganica3 ?? req.user?.idOrganica3 ?? null;
      
      // Construir orgs1-4: si se envían en el body, se usan esos valores
      // Si no, se construyen concatenando las claveOrganica
      const orgs1 = parsed.data.orgs1 !== undefined && parsed.data.orgs1 !== null 
        ? parsed.data.orgs1 
        : [claveOrganica0, claveOrganica1].filter(Boolean).join('');
      const orgs2 = parsed.data.orgs2 !== undefined && parsed.data.orgs2 !== null 
        ? parsed.data.orgs2 
        : [claveOrganica0, claveOrganica1, claveOrganica2].filter(Boolean).join('');
      const orgs3 = parsed.data.orgs3 !== undefined && parsed.data.orgs3 !== null 
        ? parsed.data.orgs3 
        : [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('');
      const orgs4 = parsed.data.orgs4 !== undefined && parsed.data.orgs4 !== null 
        ? parsed.data.orgs4 
        : [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('');
      
      const result = await createAfiliadoAfiliadoOrgMovimientoService({
        ...parsed.data,
        estatus: parsed.data.estatus ?? true,
        interno: parsed.data.interno, // Usar el interno del body (obligatorio)
        creadoPor: userId ?? 1,
        creadoPorUid: userUid,
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
        orgs1: orgs1 || null,
        orgs2: orgs2 || null,
        orgs3: orgs3 || null,
        orgs4: orgs4 || null
      });
      return reply.code(201).send(ok(result));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'createCambioSueldo', user: req.user?.sub });
    }
  });

  // POST /afiliado/baja-permanente - Create permanent discharge movement
  app.post('/afiliado/baja-permanente', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crear movimiento de baja permanente (tipoMovimientoId=2). Similar a /afiliado/complete pero para bajas permanentes. NOTA: claveOrganica0 y claveOrganica1 se obtienen automáticamente del usuario autenticado. claveOrganica2 y claveOrganica3 son opcionales y si se envían en el body se usan esos valores, si no se obtienen del usuario autenticado. orgs1-orgs4 son opcionales y si se envían en el body se usan esos valores, si no se construyen automáticamente concatenando las claveOrganica. El campo expediente es opcional y si no se proporciona se utilizará la CURP como identificador de documentos en el FTP.',
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
          // Campos orgánicos opcionales (si no se envían, se obtienen del usuario autenticado)
          claveOrganica2: { type: 'string', maxLength: 30, nullable: true },
          claveOrganica3: { type: 'string', maxLength: 30, nullable: true },
          orgs1: { type: 'string', maxLength: 200, nullable: true },
          orgs2: { type: 'string', maxLength: 200, nullable: true },
          orgs3: { type: 'string', maxLength: 200, nullable: true },
          orgs4: { type: 'string', maxLength: 200, nullable: true },
          // Movimiento fields
          observaciones: { type: 'string', maxLength: 1024, nullable: true }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
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
                    anioAplicacion: { type: 'number', nullable: true },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' }
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
                    porcentaje: { type: 'number', nullable: true },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' }
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
                    creadoPorUid: { type: 'string', nullable: true },
                    createdAt: { type: 'string' }
                  }
                }
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
    const parsed = CreateBajaPermanenteSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      // Validar que el interno exista en Firebird
      const validateInternoInFirebirdQuery = req.diScope.resolve<ValidateInternoInFirebirdQuery>('validateInternoInFirebirdQuery');
      const internoExists = await validateInternoInFirebirdQuery.execute(parsed.data.interno!);
      if (!internoExists) {
        return reply.code(404).send(fail('INTERNO_NOT_FOUND_IN_FIREBIRD: El número de interno no existe en las tablas PERSONAL y ORG_PERSONAL'));
      }

      // Obtener userId del token
      const userId = req.user?.sub ? parseInt(req.user.sub, 10) : null;
      const userUid = req.user?.sub ?? null; // UUID del usuario

      // Obtener claveOrganica0 a claveOrganica3 del body o del usuario autenticado
      // Si se envían en el body, se usan esos valores; si no, se obtienen del usuario
      const claveOrganica0 = req.user?.idOrganica0 ?? null;
      const claveOrganica1 = req.user?.idOrganica1 ?? null;
      const claveOrganica2 = parsed.data.claveOrganica2 ?? req.user?.idOrganica2 ?? null;
      const claveOrganica3 = parsed.data.claveOrganica3 ?? req.user?.idOrganica3 ?? null;
      
      // Construir orgs1-4: si se envían en el body, se usan esos valores
      // Si no, se construyen concatenando las claveOrganica
      const orgs1 = parsed.data.orgs1 !== undefined && parsed.data.orgs1 !== null 
        ? parsed.data.orgs1 
        : [claveOrganica0, claveOrganica1].filter(Boolean).join('');
      const orgs2 = parsed.data.orgs2 !== undefined && parsed.data.orgs2 !== null 
        ? parsed.data.orgs2 
        : [claveOrganica0, claveOrganica1, claveOrganica2].filter(Boolean).join('');
      const orgs3 = parsed.data.orgs3 !== undefined && parsed.data.orgs3 !== null 
        ? parsed.data.orgs3 
        : [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('');
      const orgs4 = parsed.data.orgs4 !== undefined && parsed.data.orgs4 !== null 
        ? parsed.data.orgs4 
        : [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('');

      const result = await createAfiliadoAfiliadoOrgMovimientoService({
        ...parsed.data,
        estatus: parsed.data.estatus ?? true,
        interno: parsed.data.interno, // Usar el interno del body (obligatorio)
        creadoPor: userId ?? 1,
        creadoPorUid: userUid,
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
        orgs1: orgs1 || null,
        orgs2: orgs2 || null,
        orgs3: orgs3 || null,
        orgs4: orgs4 || null
      });
      return reply.code(201).send(ok(result));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'createBajaPermanente', user: req.user?.sub });
    }
  });

  // POST /afiliado/baja-suspension - Create affiliation suspension movement
  app.post('/afiliado/baja-suspension', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crear movimiento de baja suspensión de afiliación (tipoMovimientoId=3). Similar a /afiliado/complete pero para suspensiones de afiliación. NOTA: claveOrganica0 y claveOrganica1 se obtienen automáticamente del usuario autenticado. claveOrganica2 y claveOrganica3 son opcionales y si se envían en el body se usan esos valores, si no se obtienen del usuario autenticado. orgs1-orgs4 son opcionales y si se envían en el body se usan esos valores, si no se construyen automáticamente concatenando las claveOrganica. El campo expediente es opcional y si no se proporciona se utilizará la CURP como identificador de documentos en el FTP.',
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
          // Campos orgánicos opcionales (si no se envían, se obtienen del usuario autenticado)
          claveOrganica2: { type: 'string', maxLength: 30, nullable: true },
          claveOrganica3: { type: 'string', maxLength: 30, nullable: true },
          orgs1: { type: 'string', maxLength: 200, nullable: true },
          orgs2: { type: 'string', maxLength: 200, nullable: true },
          orgs3: { type: 'string', maxLength: 200, nullable: true },
          orgs4: { type: 'string', maxLength: 200, nullable: true },
          // Movimiento fields
          observaciones: { type: 'string', maxLength: 1024, nullable: true }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
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
                    anioAplicacion: { type: 'number', nullable: true },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' }
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
                    porcentaje: { type: 'number', nullable: true },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' }
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
                    creadoPorUid: { type: 'string', nullable: true },
                    createdAt: { type: 'string' }
                  }
                }
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
    const parsed = CreateBajaSuspensionSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      // Validar que el interno exista en Firebird
      const validateInternoInFirebirdQuery = req.diScope.resolve<ValidateInternoInFirebirdQuery>('validateInternoInFirebirdQuery');
      const internoExists = await validateInternoInFirebirdQuery.execute(parsed.data.interno!);
      if (!internoExists) {
        return reply.code(404).send(fail('INTERNO_NOT_FOUND_IN_FIREBIRD: El número de interno no existe en las tablas PERSONAL y ORG_PERSONAL'));
      }

      // Obtener userId del token
      const userId = req.user?.sub ? parseInt(req.user.sub, 10) : null;
      const userUid = req.user?.sub ?? null; // UUID del usuario

      // Obtener claveOrganica0 a claveOrganica3 del body o del usuario autenticado
      // Si se envían en el body, se usan esos valores; si no, se obtienen del usuario
      const claveOrganica0 = req.user?.idOrganica0 ?? null;
      const claveOrganica1 = req.user?.idOrganica1 ?? null;
      const claveOrganica2 = parsed.data.claveOrganica2 ?? req.user?.idOrganica2 ?? null;
      const claveOrganica3 = parsed.data.claveOrganica3 ?? req.user?.idOrganica3 ?? null;
      
      // Construir orgs1-4: si se envían en el body, se usan esos valores
      // Si no, se construyen concatenando las claveOrganica
      const orgs1 = parsed.data.orgs1 !== undefined && parsed.data.orgs1 !== null 
        ? parsed.data.orgs1 
        : [claveOrganica0, claveOrganica1].filter(Boolean).join('');
      const orgs2 = parsed.data.orgs2 !== undefined && parsed.data.orgs2 !== null 
        ? parsed.data.orgs2 
        : [claveOrganica0, claveOrganica1, claveOrganica2].filter(Boolean).join('');
      const orgs3 = parsed.data.orgs3 !== undefined && parsed.data.orgs3 !== null 
        ? parsed.data.orgs3 
        : [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('');
      const orgs4 = parsed.data.orgs4 !== undefined && parsed.data.orgs4 !== null 
        ? parsed.data.orgs4 
        : [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('');

      const result = await createAfiliadoAfiliadoOrgMovimientoService({
        ...parsed.data,
        estatus: parsed.data.estatus ?? true,
        interno: parsed.data.interno, // Usar el interno del body (obligatorio)
        creadoPor: userId ?? 1,
        creadoPorUid: userUid,
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
        orgs1: orgs1 || null,
        orgs2: orgs2 || null,
        orgs3: orgs3 || null,
        orgs4: orgs4 || null
      });
      return reply.code(201).send(ok(result));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'createBajaSuspension', user: req.user?.sub });
    }
  });

  // POST /afiliado/baja-termina-suspension - Create affiliation suspension termination movement
  app.post('/afiliado/baja-termina-suspension', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crear movimiento de baja termina suspensión de afiliación (tipoMovimientoId=4). Similar a /afiliado/complete pero para terminación de suspensiones de afiliación. NOTA: claveOrganica0 y claveOrganica1 se obtienen automáticamente del usuario autenticado. claveOrganica2 y claveOrganica3 son opcionales y si se envían en el body se usan esos valores, si no se obtienen del usuario autenticado. orgs1-orgs4 son opcionales y si se envían en el body se usan esos valores, si no se construyen automáticamente concatenando las claveOrganica. El campo expediente es opcional y si no se proporciona se utilizará la CURP como identificador de documentos en el FTP.',
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
          // Campos orgánicos opcionales (si no se envían, se obtienen del usuario autenticado)
          claveOrganica2: { type: 'string', maxLength: 30, nullable: true },
          claveOrganica3: { type: 'string', maxLength: 30, nullable: true },
          orgs1: { type: 'string', maxLength: 200, nullable: true },
          orgs2: { type: 'string', maxLength: 200, nullable: true },
          orgs3: { type: 'string', maxLength: 200, nullable: true },
          orgs4: { type: 'string', maxLength: 200, nullable: true },
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
      // Validar que el interno exista en Firebird
      const validateInternoInFirebirdQuery = req.diScope.resolve<ValidateInternoInFirebirdQuery>('validateInternoInFirebirdQuery');
      const internoExists = await validateInternoInFirebirdQuery.execute(parsed.data.interno!);
      if (!internoExists) {
        return reply.code(404).send(fail('INTERNO_NOT_FOUND_IN_FIREBIRD: El número de interno no existe en las tablas PERSONAL y ORG_PERSONAL'));
      }

      const userId = req.user?.sub ? parseInt(req.user.sub, 10) : null;
      const userUid = req.user?.sub ?? null; // UUID del usuario
      
      // Obtener claveOrganica0 a claveOrganica3 del body o del usuario autenticado
      // Si se envían en el body, se usan esos valores; si no, se obtienen del usuario
      const claveOrganica0 = req.user?.idOrganica0 ?? null;
      const claveOrganica1 = req.user?.idOrganica1 ?? null;
      const claveOrganica2 = parsed.data.claveOrganica2 ?? req.user?.idOrganica2 ?? null;
      const claveOrganica3 = parsed.data.claveOrganica3 ?? req.user?.idOrganica3 ?? null;
      
      // Construir orgs1-4: si se envían en el body, se usan esos valores
      // Si no, se construyen concatenando las claveOrganica
      const orgs1 = parsed.data.orgs1 !== undefined && parsed.data.orgs1 !== null 
        ? parsed.data.orgs1 
        : [claveOrganica0, claveOrganica1].filter(Boolean).join('');
      const orgs2 = parsed.data.orgs2 !== undefined && parsed.data.orgs2 !== null 
        ? parsed.data.orgs2 
        : [claveOrganica0, claveOrganica1, claveOrganica2].filter(Boolean).join('');
      const orgs3 = parsed.data.orgs3 !== undefined && parsed.data.orgs3 !== null 
        ? parsed.data.orgs3 
        : [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('');
      const orgs4 = parsed.data.orgs4 !== undefined && parsed.data.orgs4 !== null 
        ? parsed.data.orgs4 
        : [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('');

      const result = await createAfiliadoAfiliadoOrgMovimientoService({
        ...parsed.data,
        estatus: parsed.data.estatus ?? true,
        interno: parsed.data.interno,
        creadoPor: userId ?? 1,
        creadoPorUid: userUid,
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
        orgs1: orgs1 || null,
        orgs2: orgs2 || null,
        orgs3: orgs3 || null,
        orgs4: orgs4 || null
      });
      return reply.code(201).send(ok(result));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'createTerminarSuspension', user: req.user?.sub });
    }
  });

  // POST /afiliado/baja-termina-suspension-y-baja - Create affiliation suspension termination and discharge movement
  app.post('/afiliado/baja-termina-suspension-y-baja', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crear movimiento de baja termina suspensión de afiliación y baja (tipoMovimientoId=6). Similar a /afiliado/complete pero para terminación de suspensiones de afiliación y baja simultánea. NOTA: claveOrganica0 y claveOrganica1 se obtienen automáticamente del usuario autenticado. claveOrganica2 y claveOrganica3 son opcionales y si se envían en el body se usan esos valores, si no se obtienen del usuario autenticado. orgs1-orgs4 son opcionales y si se envían en el body se usan esos valores, si no se construyen automáticamente concatenando las claveOrganica. El campo expediente es opcional y si no se proporciona se utilizará la CURP como identificador de documentos en el FTP.',
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
          // Campos orgánicos opcionales (si no se envían, se obtienen del usuario autenticado)
          claveOrganica2: { type: 'string', maxLength: 30, nullable: true },
          claveOrganica3: { type: 'string', maxLength: 30, nullable: true },
          orgs1: { type: 'string', maxLength: 200, nullable: true },
          orgs2: { type: 'string', maxLength: 200, nullable: true },
          orgs3: { type: 'string', maxLength: 200, nullable: true },
          orgs4: { type: 'string', maxLength: 200, nullable: true },
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
      // Validar que el interno exista en Firebird
      const validateInternoInFirebirdQuery = req.diScope.resolve<ValidateInternoInFirebirdQuery>('validateInternoInFirebirdQuery');
      const internoExists = await validateInternoInFirebirdQuery.execute(parsed.data.interno!);
      if (!internoExists) {
        return reply.code(404).send(fail('INTERNO_NOT_FOUND_IN_FIREBIRD: El número de interno no existe en las tablas PERSONAL y ORG_PERSONAL'));
      }

      const userId = req.user?.sub ? parseInt(req.user.sub, 10) : null;
      const userUid = req.user?.sub ?? null; // UUID del usuario
      
      // Obtener claveOrganica0 a claveOrganica3 del body o del usuario autenticado
      // Si se envían en el body, se usan esos valores; si no, se obtienen del usuario
      const claveOrganica0 = req.user?.idOrganica0 ?? null;
      const claveOrganica1 = req.user?.idOrganica1 ?? null;
      const claveOrganica2 = parsed.data.claveOrganica2 ?? req.user?.idOrganica2 ?? null;
      const claveOrganica3 = parsed.data.claveOrganica3 ?? req.user?.idOrganica3 ?? null;
      
      // Construir orgs1-4: si se envían en el body, se usan esos valores
      // Si no, se construyen concatenando las claveOrganica
      const orgs1 = parsed.data.orgs1 !== undefined && parsed.data.orgs1 !== null 
        ? parsed.data.orgs1 
        : [claveOrganica0, claveOrganica1].filter(Boolean).join('');
      const orgs2 = parsed.data.orgs2 !== undefined && parsed.data.orgs2 !== null 
        ? parsed.data.orgs2 
        : [claveOrganica0, claveOrganica1, claveOrganica2].filter(Boolean).join('');
      const orgs3 = parsed.data.orgs3 !== undefined && parsed.data.orgs3 !== null 
        ? parsed.data.orgs3 
        : [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('');
      const orgs4 = parsed.data.orgs4 !== undefined && parsed.data.orgs4 !== null 
        ? parsed.data.orgs4 
        : [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3].filter(Boolean).join('');

      const result = await createAfiliadoAfiliadoOrgMovimientoService({
        ...parsed.data,
        estatus: parsed.data.estatus ?? true,
        interno: parsed.data.interno,
        creadoPor: userId ?? 1,
        creadoPorUid: userUid,
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
        orgs1: orgs1 || null,
        orgs2: orgs2 || null,
        orgs3: orgs3 || null,
        orgs4: orgs4 || null
      });
      return reply.code(201).send(ok(result));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'createTerminarSuspensionYBaja', user: req.user?.sub });
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
                      anioAplicacion: { type: 'number', nullable: true },
                      numValidacion: { type: 'number' },
                      numValidacionDescripcion: { type: 'string', nullable: true },
                      createdAt: { type: 'string' },
                      updatedAt: { type: 'string' }
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
                      porcentaje: { type: 'number', nullable: true },
                      createdAt: { type: 'string' },
                      updatedAt: { type: 'string' }
                    }
                  },
                  movimiento: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      quincenaId: { type: 'string', nullable: true },
                      tipoMovimientoId: { type: 'number' },
                      tipoMovimientoDescripcion: { type: 'string', nullable: true },
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
      // Obtener org0 y org1 del usuario autenticado
      const userOrg0 = req.user?.idOrganica0 ?? '';
      const userOrg1 = req.user?.idOrganica1 ?? '';

      console.log('User org data:', { userOrg0, userOrg1, user: req.user });

      if (!userOrg0 || !userOrg1) {
        return reply.send(fail('USER_ORGANICA_NOT_FOUND: Usuario no tiene orgánica configurada'));
      }

      // Obtener periodo desde BitacoraAfectacionOrg para logging (opcional)
      const periodo = await obtenerPeriodo(userOrg0, userOrg1);
      if (periodo) {
        console.log('Periodo obtenido:', periodo);
      }

      const getMovimientosQuincenalesQuery = req.diScope.resolve<GetMovimientosQuincenalesQuery>('getMovimientosQuincenalesQuery');
      const movimientos = await getMovimientosQuincenalesQuery.execute(userOrg0, userOrg1);
      return reply.send(ok(movimientos));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'getMovimientosQuincenales', user: req.user?.sub });
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
      const deleteAfiliadoCommand = req.diScope.resolve<DeleteAfiliadoCommand>('deleteAfiliadoCommand');
      await deleteAfiliadoCommand.execute(id);
      return reply.send(ok({}));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'deleteAfiliado', user: req.user?.sub, afiliadoId: (req.params as any)?.id });
    }
  });

  // =============================================
  // RUTAS PARA GESTIÓN DE ESTADOS DE VALIDACIÓN
  // =============================================

  // GET /afiliado/estados - Obtener todos los estados de validación disponibles
  app.get('/afiliado/estados', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener todos los estados de validación de afiliados disponibles',
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
                  numValidacion: { type: 'number' },
                  nombreStatus: { type: 'string' },
                  descripcion: { type: 'string', nullable: true },
                  color: { type: 'string', nullable: true },
                  activo: { type: 'boolean' },
                  orden: { type: 'number' },
                  fechaCreacion: { type: 'string' },
                  fechaModificacion: { type: 'string' },
                  usuarioCreacion: { type: 'string' },
                  usuarioModificacion: { type: 'string' }
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
      const { getAllStatusControl } = await import('./afiliado.repo.js');
      const estados = await getAllStatusControl();
      return reply.send(ok(estados));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'getAllStatusControl', user: req.user?.sub });
    }
  });

  // GET /afiliado/pendientes - Obtener afiliados pendientes de aprobación
  app.get('/afiliado/pendientes', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener lista de afiliados pendientes de aprobación (numValidacion = 1)',
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
                  correoElectronico: { type: 'string', nullable: true },
                  telefono: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                  // Información del status
                  numValidacion: { type: 'number' },
                  nombreStatus: { type: 'string' },
                  statusDescripcion: { type: 'string', nullable: true },
                  statusColor: { type: 'string', nullable: true }
                }
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
    try {
      // Obtener org0 y org1 del usuario autenticado
      const userOrg0 = req.user?.idOrganica0 ?? '';
      const userOrg1 = req.user?.idOrganica1 ?? '';

      if (!userOrg0 || !userOrg1) {
        return reply.code(400).send(fail('USER_ORGANICA_NOT_FOUND: Usuario no tiene orgánica configurada'));
      }

      const { getAfiliadosPendientes } = await import('./afiliado.repo.js');
      const afiliadosPendientes = await getAfiliadosPendientes(userOrg0, userOrg1);
      return reply.send(ok(afiliadosPendientes));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'getAfiliadosPendientes', user: req.user?.sub });
    }
  });

  // =============================================
  // ENDPOINTS ESPECÍFICOS POR ESTADO DE VALIDACIÓN
  // =============================================

  // 1. REGISTRADOS (numValidacion = 1)
  // GET /afiliado/registrados - Obtener afiliados registrados
  app.get('/afiliado/registrados', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener afiliados en estado Registrado',
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
                  correoElectronico: { type: 'string', nullable: true },
                  telefono: { type: 'string', nullable: true },
                  numValidacion: { type: 'number' },
                  nombreStatus: { type: 'string' },
                  statusDescripcion: { type: 'string', nullable: true },
                  statusColor: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
                }
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
    try {
      const userOrg0 = req.user?.idOrganica0 ?? '';
      const userOrg1 = req.user?.idOrganica1 ?? '';

      if (!userOrg0 || !userOrg1) {
        return reply.code(400).send(fail('USER_ORGANICA_NOT_FOUND: Usuario no tiene orgánica configurada'));
      }

      const { getAfiliadosByStatus } = await import('./afiliado.repo.js');
      const afiliadosRegistrados = await getAfiliadosByStatus(userOrg0, userOrg1, 1);
      return reply.send(ok(afiliadosRegistrados));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'getAfiliadosRegistrados', user: req.user?.sub });
    }
  });

  // 2. APROBADOS (numValidacion = 2)
  // GET /afiliado/aprobados - Obtener afiliados aprobados
  app.get('/afiliado/aprobados', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener afiliados en estado Aprobado',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          org0: { type: 'string', description: 'Código organizacional nivel 0 (requerido si es admin)' },
          org1: { type: 'string', description: 'Código organizacional nivel 1 (requerido si es admin)' }
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
                  folio: { type: 'number' },
                  apellidoPaterno: { type: 'string', nullable: true },
                  apellidoMaterno: { type: 'string', nullable: true },
                  nombre: { type: 'string', nullable: true },
                  curp: { type: 'string', nullable: true },
                  rfc: { type: 'string', nullable: true },
                  correoElectronico: { type: 'string', nullable: true },
                  telefono: { type: 'string', nullable: true },
                  numValidacion: { type: 'number' },
                  nombreStatus: { type: 'string' },
                  statusDescripcion: { type: 'string', nullable: true },
                  statusColor: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
                }
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
    try {
      const query = req.query as { org0?: string; org1?: string };
      const userRoles = req.user?.roles ?? [];
      const isAdmin = userRoles.includes('admin') || userRoles.includes('Admin') || userRoles.includes('ADMIN');
      
      let org0: string;
      let org1: string;

      // Si hay parámetros en la URL y el usuario es admin, usar los parámetros
      if (query.org0 && query.org1 && isAdmin) {
        org0 = query.org0;
        org1 = query.org1;
      } else {
        // Si no hay parámetros o no es admin, usar los del token
        org0 = req.user?.idOrganica0 ?? '';
        org1 = req.user?.idOrganica1 ?? '';
      }

      if (!org0 || !org1) {
        return reply.code(400).send(fail('USER_ORGANICA_NOT_FOUND: Usuario no tiene orgánica configurada'));
      }

      const { getAfiliadosByStatus } = await import('./afiliado.repo.js');
      const afiliadosAprobados = await getAfiliadosByStatus(org0, org1, 2);
      return reply.send(ok(afiliadosAprobados));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'getAfiliadosAprobados', user: req.user?.sub });
    }
  });

  // 3. EN REVISIÓN (numValidacion = 3)
  // GET /afiliado/en-revision - Obtener afiliados en revisión
  app.get('/afiliado/en-revision', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener afiliados en estado En Revisión',
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
                  correoElectronico: { type: 'string', nullable: true },
                  telefono: { type: 'string', nullable: true },
                  numValidacion: { type: 'number' },
                  nombreStatus: { type: 'string' },
                  statusDescripcion: { type: 'string', nullable: true },
                  statusColor: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
                }
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
    try {
      const userOrg0 = req.user?.idOrganica0 ?? '';
      const userOrg1 = req.user?.idOrganica1 ?? '';

      if (!userOrg0 || !userOrg1) {
        return reply.code(400).send(fail('USER_ORGANICA_NOT_FOUND: Usuario no tiene orgánica configurada'));
      }

      const { getAfiliadosByStatus } = await import('./afiliado.repo.js');
      const afiliadosEnRevision = await getAfiliadosByStatus(userOrg0, userOrg1, 3);
      return reply.send(ok(afiliadosEnRevision));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'getAfiliadosEnRevision', user: req.user?.sub });
    }
  });

  // 4. RECHAZADOS (numValidacion = 4)
  // GET /afiliado/rechazados - Obtener afiliados rechazados
  app.get('/afiliado/rechazados', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener afiliados en estado Rechazado',
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
                  correoElectronico: { type: 'string', nullable: true },
                  telefono: { type: 'string', nullable: true },
                  numValidacion: { type: 'number' },
                  nombreStatus: { type: 'string' },
                  statusDescripcion: { type: 'string', nullable: true },
                  statusColor: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
                }
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
    try {
      const userOrg0 = req.user?.idOrganica0 ?? '';
      const userOrg1 = req.user?.idOrganica1 ?? '';

      if (!userOrg0 || !userOrg1) {
        return reply.code(400).send(fail('USER_ORGANICA_NOT_FOUND: Usuario no tiene orgánica configurada'));
      }

      const { getAfiliadosByStatus } = await import('./afiliado.repo.js');
      const afiliadosRechazados = await getAfiliadosByStatus(userOrg0, userOrg1, 4);
      return reply.send(ok(afiliadosRechazados));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'getAfiliadosRechazados', user: req.user?.sub });
    }
  });

  // 5. SUSPENDIDOS (numValidacion = 5)
  // GET /afiliado/suspendidos - Obtener afiliados suspendidos
  app.get('/afiliado/suspendidos', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener afiliados en estado Suspendido',
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
                  correoElectronico: { type: 'string', nullable: true },
                  telefono: { type: 'string', nullable: true },
                  numValidacion: { type: 'number' },
                  nombreStatus: { type: 'string' },
                  statusDescripcion: { type: 'string', nullable: true },
                  statusColor: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
                }
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
    try {
      const userOrg0 = req.user?.idOrganica0 ?? '';
      const userOrg1 = req.user?.idOrganica1 ?? '';

      if (!userOrg0 || !userOrg1) {
        return reply.code(400).send(fail('USER_ORGANICA_NOT_FOUND: Usuario no tiene orgánica configurada'));
      }

      const { getAfiliadosByStatus } = await import('./afiliado.repo.js');
      const afiliadosSuspendidos = await getAfiliadosByStatus(userOrg0, userOrg1, 5);
      return reply.send(ok(afiliadosSuspendidos));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'getAfiliadosSuspendidos', user: req.user?.sub });
    }
  });

  // 6. CANCELADOS (numValidacion = 6)
  // GET /afiliado/cancelados - Obtener afiliados cancelados
  app.get('/afiliado/cancelados', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener afiliados en estado Cancelado',
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
                  correoElectronico: { type: 'string', nullable: true },
                  telefono: { type: 'string', nullable: true },
                  numValidacion: { type: 'number' },
                  nombreStatus: { type: 'string' },
                  statusDescripcion: { type: 'string', nullable: true },
                  statusColor: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
                }
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
    try {
      const userOrg0 = req.user?.idOrganica0 ?? '';
      const userOrg1 = req.user?.idOrganica1 ?? '';

      if (!userOrg0 || !userOrg1) {
        return reply.code(400).send(fail('USER_ORGANICA_NOT_FOUND: Usuario no tiene orgánica configurada'));
      }

      const { getAfiliadosByStatus } = await import('./afiliado.repo.js');
      const afiliadosCancelados = await getAfiliadosByStatus(userOrg0, userOrg1, 6);
      return reply.send(ok(afiliadosCancelados));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'getAfiliadosCancelados', user: req.user?.sub });
    }
  });

  // GET /afiliado/:id/historial - Obtener historial de cambios de status de un afiliado
  app.get('/afiliado/:id/historial', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener historial de cambios de status de un afiliado',
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
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  afiliadoId: { type: 'number' },
                  numValidacionAnterior: { type: 'number', nullable: true },
                  numValidacionNuevo: { type: 'number' },
                  statusAnterior: { type: 'string', nullable: true },
                  statusNuevo: { type: 'string' },
                  motivo: { type: 'string', nullable: true },
                  observaciones: { type: 'string', nullable: true },
                  usuarioId: { type: 'string' },
                  fechaCambio: { type: 'string' },
                  ipAddress: { type: 'string', nullable: true },
                  userAgent: { type: 'string', nullable: true }
                }
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
    try {
      const { id } = req.params as { id: number };
      
      // Validar parámetro ID
      if (!id || id <= 0) {
        return reply.code(400).send(fail('El ID del afiliado debe ser un número positivo'));
      }

      const { getAfiliadoStatusHistory } = await import('./afiliado.repo.js');
      const historial = await getAfiliadoStatusHistory(id);
      return reply.send(ok(historial));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'getAfiliadoStatusHistory', user: req.user?.sub, afiliadoId: (req.params as any)?.id });
    }
  });

  // =============================================
  // ENDPOINTS PARA CAMBIOS DE ESTADO ESPECÍFICOS
  // =============================================

  // Cambiar a REGISTRADO (1)
  app.post('/afiliado/:id/registrar', {
    preHandler: [requireAuth],
    schema: {
      description: 'Cambiar afiliado a estado Registrado',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'number' } }
      },
      body: {
        type: 'object',
        properties: {
          motivo: { type: 'string', maxLength: 500 },
          observaciones: { type: 'string', maxLength: 1000 }
        }
      },
      response: {
        200: { type: 'object' },
        400: { type: 'object' },
        404: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      const { id } = req.params as { id: number };
      const body = req.body as { motivo?: string; observaciones?: string };
      
      if (!id || id <= 0) {
        return reply.code(400).send(fail('El ID del afiliado debe ser un número positivo'));
      }

      const { cambiarAStatusAfiliado } = await import('./afiliado.repo.js');
      const resultado = await cambiarAStatusAfiliado(
        id,
        1, // Registrado
        req.user?.sub || 'unknown',
        body.motivo,
        body.observaciones,
        req.ip,
        req.headers['user-agent']
      );

      return reply.send(ok(resultado));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'cambiarAStatusRegistrado', user: req.user?.sub, afiliadoId: (req.params as any)?.id });
    }
  });

  // Regresar al estado inicial REGISTRADO (1)
  app.post('/afiliado/:id/regresar-inicial', {
    preHandler: [requireAuth],
    schema: {
      description: 'Regresar afiliado al estado inicial Registrado',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'number' } }
      },
      body: {
        type: 'object',
        properties: {
          motivo: { type: 'string', maxLength: 500, description: 'Motivo del regreso al estado inicial' },
          observaciones: { type: 'string', maxLength: 1000, description: 'Observaciones adicionales' }
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
                message: { type: 'string' },
                afiliado: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    folio: { type: 'number', nullable: true },
                    apellidoPaterno: { type: 'string', nullable: true },
                    apellidoMaterno: { type: 'string', nullable: true },
                    nombre: { type: 'string', nullable: true },
                    curp: { type: 'string', nullable: true },
                    rfc: { type: 'string', nullable: true },
                    correoElectronico: { type: 'string', nullable: true },
                    telefono: { type: 'string', nullable: true },
                    numValidacion: { type: 'number' },
                    nombreStatus: { type: 'string' },
                    statusDescripcion: { type: 'string', nullable: true },
                    statusColor: { type: 'string', nullable: true },
                    updatedAt: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        400: { type: 'object' },
        404: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      const { id } = req.params as { id: number };
      const body = req.body as { motivo?: string; observaciones?: string };
      
      if (!id || id <= 0) {
        return reply.code(400).send(fail('El ID del afiliado debe ser un número positivo'));
      }

      // Obtener información del afiliado antes del cambio
      const getAfiliadoByIdQuery = req.diScope.resolve<GetAfiliadoByIdQuery>('getAfiliadoByIdQuery');
      const afiliadoActual = await getAfiliadoByIdQuery.execute(id);
      
      if (!afiliadoActual) {
        return reply.code(404).send(fail('Afiliado no encontrado'));
      }

      const { cambiarAStatusAfiliado } = await import('./afiliado.repo.js');
      const resultado = await cambiarAStatusAfiliado(
        id,
        1, // Estado inicial Registrado
        req.user?.sub || 'unknown',
        body.motivo || 'Regreso al estado inicial',
        body.observaciones || `Afiliado regresado al estado inicial desde estado: ${afiliadoActual.numValidacion}`,
        req.ip,
        req.headers['user-agent']
      );

      // Obtener información actualizada del afiliado
      const afiliadoActualizado = await getAfiliadoByIdQuery.execute(id);
      
      return reply.send(ok({
        message: 'Afiliado regresado exitosamente al estado inicial',
        afiliado: afiliadoActualizado
      }));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'regresarAEstadoInicial', user: req.user?.sub, afiliadoId: (req.params as any)?.id });
    }
  });

  // Cambiar a APROBADO (2)
  app.post('/afiliado/:id/aprobar', {
    preHandler: [requireAuth],
    schema: {
      description: 'Cambiar afiliado a estado Aprobado',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'number' } }
      },
      body: {
        type: 'object',
        properties: {
          motivo: { type: 'string', maxLength: 500 },
          observaciones: { type: 'string', maxLength: 1000 }
        }
      },
      response: {
        200: { type: 'object' },
        400: { type: 'object' },
        404: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      const { id } = req.params as { id: number };
      const body = req.body as { motivo?: string; observaciones?: string };
      
      if (!id || id <= 0) {
        return reply.code(400).send(fail('El ID del afiliado debe ser un número positivo'));
      }

      const { cambiarAStatusAfiliado } = await import('./afiliado.repo.js');
      const resultado = await cambiarAStatusAfiliado(
        id,
        2, // Aprobado
        req.user?.sub || 'unknown',
        body.motivo,
        body.observaciones,
        req.ip,
        req.headers['user-agent']
      );

      return reply.send(ok(resultado));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'cambiarAStatusAprobado', user: req.user?.sub, afiliadoId: (req.params as any)?.id });
    }
  });

  // Cambiar a EN REVISIÓN (3)
  app.post('/afiliado/:id/en-revision', {
    preHandler: [requireAuth],
    schema: {
      description: 'Cambiar afiliado a estado En Revisión',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'number' } }
      },
      body: {
        type: 'object',
        properties: {
          motivo: { type: 'string', maxLength: 500 },
          observaciones: { type: 'string', maxLength: 1000 }
        }
      },
      response: {
        200: { type: 'object' },
        400: { type: 'object' },
        404: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      const { id } = req.params as { id: number };
      const body = req.body as { motivo?: string; observaciones?: string };
      
      if (!id || id <= 0) {
        return reply.code(400).send(fail('El ID del afiliado debe ser un número positivo'));
      }

      const { cambiarAStatusAfiliado } = await import('./afiliado.repo.js');
      const resultado = await cambiarAStatusAfiliado(
        id,
        3, // En Revisión
        req.user?.sub || 'unknown',
        body.motivo,
        body.observaciones,
        req.ip,
        req.headers['user-agent']
      );

      return reply.send(ok(resultado));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'cambiarAStatusEnRevision', user: req.user?.sub, afiliadoId: (req.params as any)?.id });
    }
  });

  // Cambiar a RECHAZADO (4)
  app.post('/afiliado/:id/rechazar', {
    preHandler: [requireAuth],
    schema: {
      description: 'Cambiar afiliado a estado Rechazado',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'number' } }
      },
      body: {
        type: 'object',
        properties: {
          motivo: { type: 'string', maxLength: 500 },
          observaciones: { type: 'string', maxLength: 1000 }
        }
      },
      response: {
        200: { type: 'object' },
        400: { type: 'object' },
        404: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      const { id } = req.params as { id: number };
      const body = req.body as { motivo?: string; observaciones?: string };
      
      if (!id || id <= 0) {
        return reply.code(400).send(fail('El ID del afiliado debe ser un número positivo'));
      }

      const { cambiarAStatusAfiliado } = await import('./afiliado.repo.js');
      const resultado = await cambiarAStatusAfiliado(
        id,
        4, // Rechazado
        req.user?.sub || 'unknown',
        body.motivo,
        body.observaciones,
        req.ip,
        req.headers['user-agent']
      );

      return reply.send(ok(resultado));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'cambiarAStatusRechazado', user: req.user?.sub, afiliadoId: (req.params as any)?.id });
    }
  });

  // Cambiar a SUSPENDIDO (5)
  app.post('/afiliado/:id/suspender', {
    preHandler: [requireAuth],
    schema: {
      description: 'Cambiar afiliado a estado Suspendido',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'number' } }
      },
      body: {
        type: 'object',
        properties: {
          motivo: { type: 'string', maxLength: 500 },
          observaciones: { type: 'string', maxLength: 1000 }
        }
      },
      response: {
        200: { type: 'object' },
        400: { type: 'object' },
        404: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      const { id } = req.params as { id: number };
      const body = req.body as { motivo?: string; observaciones?: string };
      
      if (!id || id <= 0) {
        return reply.code(400).send(fail('El ID del afiliado debe ser un número positivo'));
      }

      const { cambiarAStatusAfiliado } = await import('./afiliado.repo.js');
      const resultado = await cambiarAStatusAfiliado(
        id,
        5, // Suspendido
        req.user?.sub || 'unknown',
        body.motivo,
        body.observaciones,
        req.ip,
        req.headers['user-agent']
      );

      return reply.send(ok(resultado));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'cambiarAStatusSuspendido', user: req.user?.sub, afiliadoId: (req.params as any)?.id });
    }
  });

  // Cambiar a CANCELADO (6)
  app.post('/afiliado/:id/cancelar', {
    preHandler: [requireAuth],
    schema: {
      description: 'Cambiar afiliado a estado Cancelado',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'number' } }
      },
      body: {
        type: 'object',
        properties: {
          motivo: { type: 'string', maxLength: 500 },
          observaciones: { type: 'string', maxLength: 1000 }
        }
      },
      response: {
        200: { type: 'object' },
        400: { type: 'object' },
        404: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      const { id } = req.params as { id: number };
      const body = req.body as { motivo?: string; observaciones?: string };
      
      if (!id || id <= 0) {
        return reply.code(400).send(fail('El ID del afiliado debe ser un número positivo'));
      }

      const { cambiarAStatusAfiliado } = await import('./afiliado.repo.js');
      const resultado = await cambiarAStatusAfiliado(
        id,
        6, // Cancelado
        req.user?.sub || 'unknown',
        body.motivo,
        body.observaciones,
        req.ip,
        req.headers['user-agent']
      );

      return reply.send(ok(resultado));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'cambiarAStatusCancelado', user: req.user?.sub, afiliadoId: (req.params as any)?.id });
    }
  });

  // Aplicar BDISSPEA en LOTE a todos los afiliados en estados 2 y 3 de la orgánica del usuario
  app.post('/afiliado/aplicar-bdisssspea-lote', {
    preParsing: async (req: any, _reply: any) => {
      // Normalizar body ANTES de la validación del schema
      if (typeof req.body === 'string') {
        try {
          req.body = JSON.parse(req.body);
        } catch (e) {
          req.body = {};
        }
      }
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        req.body = {};
      }
    },
    preHandler: [requireAuth],
    schema: {
      description: 'Aplicar BDIsspea en lote a TODOS los afiliados en numValidacion=2 (Aprobado) o numValidacion=3 (En Revisión) de la orgánica del usuario. Esta operación incluye: 1) Cambiar todos los afiliados elegibles a numValidacion=7, 2) Marcar todos los afiliados de la orgánica como completos (afiliadosComplete=1), 3) Actualizar BitacoraAfectacionOrg de "Aplicar" a "APLICAR"',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          motivo: { type: 'string', maxLength: 500, description: 'Motivo del cambio de estado en lote' },
          observaciones: { type: 'string', maxLength: 1000, description: 'Observaciones adicionales' }
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
                message: { type: 'string' },
                afiliadosProcesados: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      afiliadoId: { type: 'number' },
                      folio: { type: 'number', nullable: true },
                      nombreCompleto: { type: 'string' },
                      estadoAnterior: { type: 'string' },
                      estadoNuevo: { type: 'string' },
                      exito: { type: 'boolean' },
                      mensaje: { type: 'string' }
                    }
                  }
                },
                afiliadosCambiadosEstado: { type: 'number', description: 'Cantidad de afiliados que cambiaron de estado' },
                afiliadosFallidos: { type: 'number', description: 'Cantidad de afiliados que fallaron al procesar' },
                afiliadosCompletos: { type: 'number', description: 'Total de afiliados marcados como completos' },
                bitacoraActualizada: { type: 'number', description: 'Si se actualizó BitacoraAfectacionOrg (0 o 1)' },
                resumen: {
                  type: 'object',
                  properties: {
                    totalEncontrados: { type: 'number' },
                    procesadosExitosamente: { type: 'number' },
                    procesadosConError: { type: 'number' },
                    organica: { type: 'string' }
                  }
                },
                detalles: {
                  type: 'object',
                  properties: {
                    organica: { type: 'string' },
                    estadosOrigen: { type: 'array', items: { type: 'number' } },
                    estadoDestino: { type: 'number' },
                    motivo: { type: 'string', nullable: true },
                    observaciones: { type: 'string', nullable: true }
                  }
                }
              }
            }
          }
        },
        400: { type: 'object' },
        404: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      // Validar body con schema
      const parsed = AplicarBDIsspeaLoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      // Obtener orgánica del usuario autenticado
      const userOrg0 = req.user?.idOrganica0 ?? '';
      const userOrg1 = req.user?.idOrganica1 ?? '';

      if (!userOrg0 || !userOrg1) {
        return reply.code(400).send(fail('USER_ORGANICA_NOT_FOUND: Usuario no tiene orgánica configurada'));
      }

      // Resolver Command desde DI
      const aplicarBDIsspeaLoteCommand = req.diScope.resolve<AplicarBDIsspeaLoteCommand>('aplicarBDIsspeaLoteCommand');
      
      // Ejecutar Command
      const resultado = await aplicarBDIsspeaLoteCommand.execute({
        org0: userOrg0,
        org1: userOrg1,
        usuarioId: req.user?.sub || 'unknown',
        motivo: parsed.data.motivo,
        observaciones: parsed.data.observaciones,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return reply.send(ok({
        message: `Proceso de aplicación a BDIsspea completado. ${resultado.afiliadosCambiadosEstado} afiliados cambiados a estado 7.`,
        afiliadosProcesados: resultado.afiliadosProcesados,
        afiliadosCambiadosEstado: resultado.afiliadosCambiadosEstado,
        afiliadosFallidos: resultado.afiliadosFallidos,
        afiliadosCompletos: resultado.afiliadosCompletos,
        bitacoraActualizada: resultado.bitacoraActualizada,
        resumen: resultado.resumen,
        detalles: {
          organica: `${userOrg0}/${userOrg1}`,
          estadosOrigen: [2, 3],
          estadoDestino: 7,
          motivo: parsed.data.motivo,
          observaciones: parsed.data.observaciones
        }
      }));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'aplicarBDIsspeaLote', user: req.user?.sub });
    }
  });

  // Aplicar BDISSPEA QNA - Ejecutar stored procedures de Firebird para aplicar QNA
  app.post('/afiliado/aplicar-bdisssspea-qna', {
    preHandler: [requireAuth],
    schema: {
      description: 'Ejecutar stored procedures de Firebird para aplicar BDIssspea QNA. Ejecuta: 1) AP_G_APLICADO_TIPO para obtener quincena, 2) AP_P_APLICAR con tipo C, 3) AP_P_APLICAR con tipo F, 4) AP_D_ENVIO_LAYOUT, 5) Actualizar BitacoraAfectacionOrg a TERMINADO',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          org0: { type: 'string', description: 'Orgánica nivel 0 (opcional, se usa del token si no se proporciona)' },
          org1: { type: 'string', description: 'Orgánica nivel 1 (opcional, se usa del token si no se proporciona)' }
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
                exito: { type: 'boolean' },
                quincena: { type: 'string' },
                quincenaNumero: { type: 'number' },
                anio: { type: 'number' },
                ejecuciones: {
                  type: 'object',
                  properties: {
                    obtenerQuincena: {
                      type: 'object',
                      properties: {
                        exito: { type: 'boolean' },
                        duracionMs: { type: 'number' },
                        error: { type: 'string', nullable: true }
                      }
                    },
                    aplicarC: {
                      type: 'object',
                      properties: {
                        exito: { type: 'boolean' },
                        duracionMs: { type: 'number' },
                        error: { type: 'string', nullable: true }
                      }
                    },
                    aplicarF: {
                      type: 'object',
                      properties: {
                        exito: { type: 'boolean' },
                        duracionMs: { type: 'number' },
                        error: { type: 'string', nullable: true }
                      }
                    },
                    envioLayout: {
                      type: 'object',
                      properties: {
                        exito: { type: 'boolean' },
                        duracionMs: { type: 'number' },
                        error: { type: 'string', nullable: true }
                      }
                    },
                    actualizarBitacora: {
                      type: 'object',
                      properties: {
                        exito: { type: 'boolean' },
                        duracionMs: { type: 'number' },
                        error: { type: 'string', nullable: true }
                      }
                    }
                  }
                },
                bitacoraActualizada: { type: 'boolean' },
                mensaje: { type: 'string' },
                tiempoTotalMs: { type: 'number' }
              }
            }
          }
        },
        400: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      // Obtener orgánica del usuario autenticado o de query params
      const query = req.query as { org0?: string; org1?: string };
      let userOrg0 = query.org0 || req.user?.idOrganica0 || '';
      let userOrg1 = query.org1 || req.user?.idOrganica1 || '';

      // Normalizar orgánicas (padding a 2 dígitos)
      if (userOrg0) {
        userOrg0 = String(userOrg0).padStart(2, '0');
      }
      if (userOrg1) {
        userOrg1 = String(userOrg1).padStart(2, '0');
      }

      if (!userOrg0 || !userOrg1) {
        return reply.code(400).send(fail('USER_ORGANICA_NOT_FOUND: Usuario no tiene orgánica configurada y no se proporcionó en query params'));
      }

      // Resolver Command desde DI
      const aplicarBDIssspeaQNACommand = req.diScope.resolve<AplicarBDIssspeaQNACommand>('aplicarBDIssspeaQNACommand');
      
      // Ejecutar Command
      const resultado = await aplicarBDIssspeaQNACommand.execute({
        org0: userOrg0,
        org1: userOrg1,
        usuarioId: req.user?.sub || 'unknown'
      });

      // Retornar resultado completo (incluye campo 'exito' para indicar si fue exitoso)
      // Si no fue exitoso, el código de estado será 200 pero el cliente puede verificar resultado.exito
      return reply.send(ok(resultado));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'aplicarBDIssspeaQNA', user: req.user?.sub });
    }
  });

  // Obtener la acción actual de BitacoraAfectacionOrg para la orgánica del usuario
  app.get('/afiliado/bitacora-accion', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener el registro completo más reciente de BitacoraAfectacionOrg para la orgánica del usuario (Entidad=AFILIADOS). Permite conocer en qué acción se encuentra actualmente el proceso.',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          org0: { type: 'string', description: 'Orgánica nivel 0 (opcional, se usa del token si no se proporciona)' },
          org1: { type: 'string', description: 'Orgánica nivel 1 (opcional, se usa del token si no se proporciona)' }
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
                bitacora: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    orgNivel: { type: 'number' },
                    org0: { type: 'string' },
                    org1: { type: 'string', nullable: true },
                    org2: { type: 'string', nullable: true },
                    org3: { type: 'string', nullable: true },
                    entidad: { type: 'string' },
                    entidadId: { type: 'number', nullable: true },
                    anio: { type: 'number' },
                    quincena: { type: 'number' },
                    accion: { type: 'string' },
                    resultado: { type: 'string', nullable: true },
                    mensaje: { type: 'string', nullable: true },
                    usuario: { type: 'string', nullable: true },
                    userId: { type: 'number', nullable: true },
                    appName: { type: 'string', nullable: true },
                    ip: { type: 'string', nullable: true },
                    userAgent: { type: 'string', nullable: true },
                    requestId: { type: 'string', nullable: true },
                    createdAt: { type: 'string', nullable: true },
                    modifiedAt: { type: 'string', nullable: true }
                  }
                }
              }
            }
          }
        },
        400: { type: 'object' },
        404: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      // Obtener orgánica del usuario autenticado o de query params
      const query = req.query as { org0?: string; org1?: string };
      let userOrg0 = query.org0 || req.user?.idOrganica0 || '';
      let userOrg1 = query.org1 || req.user?.idOrganica1 || '';

      // Normalizar orgánicas (padding a 2 dígitos)
      if (userOrg0) {
        userOrg0 = String(userOrg0).padStart(2, '0');
      }
      if (userOrg1) {
        userOrg1 = String(userOrg1).padStart(2, '0');
      }

      if (!userOrg0 || !userOrg1) {
        return reply.code(400).send(fail('USER_ORGANICA_NOT_FOUND: Usuario no tiene orgánica configurada y no se proporcionó en query params'));
      }

      logger.info({
        operation: 'getBitacoraAccionAfiliado',
        org0: userOrg0,
        org1: userOrg1,
        usuarioId: req.user?.sub
      }, 'Consultando BitacoraAfectacionOrg para obtener acción actual');
      console.log(`[BITACORA_ACCION] Consultando BitacoraAfectacionOrg para orgánica ${userOrg0}/${userOrg1}`);

      // Importar función del repositorio
      const { getUltimaBitacoraAfectacionOrgPorOrganica } = await import('./afiliado.repo.js');
      
      // Obtener el último registro
      const bitacora = await getUltimaBitacoraAfectacionOrgPorOrganica(userOrg0, userOrg1);

      if (!bitacora) {
        logger.warn({
          operation: 'getBitacoraAccionAfiliado',
          org0: userOrg0,
          org1: userOrg1,
          usuarioId: req.user?.sub
        }, 'No se encontró registro en BitacoraAfectacionOrg');
        return reply.code(404).send(fail('BITACORA_NOT_FOUND: No se encontró registro en BitacoraAfectacionOrg para la orgánica especificada'));
      }

      logger.info({
        operation: 'getBitacoraAccionAfiliado',
        org0: userOrg0,
        org1: userOrg1,
        accion: bitacora.accion,
        anio: bitacora.anio,
        quincena: bitacora.quincena,
        usuarioId: req.user?.sub
      }, 'Registro de BitacoraAfectacionOrg obtenido exitosamente');
      console.log(`[BITACORA_ACCION] ✅ Registro obtenido - Accion: ${bitacora.accion}, Anio: ${bitacora.anio}, Quincena: ${bitacora.quincena}`);

      return reply.send(ok({ bitacora }));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'getBitacoraAccionAfiliado', user: req.user?.sub });
    }
  });

  // =============================================
  // ENDPOINTS PARA CAMBIOS EN LOTE POR ESTADO
  // =============================================

  // Cambiar múltiples afiliados a REGISTRADO en lote
  app.post('/afiliado/registrar-lote', {
    preHandler: [requireAuth],
    schema: {
      description: 'Cambiar múltiples afiliados a estado Registrado en lote',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['afiliadoIds'],
        properties: {
          afiliadoIds: { type: 'array', items: { type: 'number' }, minItems: 1 },
          motivo: { type: 'string', maxLength: 500 },
          observaciones: { type: 'string', maxLength: 1000 }
        }
      },
      response: {
        200: { type: 'object' },
        400: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      const body = req.body as { afiliadoIds: number[]; motivo?: string; observaciones?: string };
      
      if (!body.afiliadoIds || body.afiliadoIds.length === 0) {
        return reply.code(400).send(fail('Debe proporcionar al menos un ID de afiliado'));
      }

      const { cambiarStatusAfiliadosLote } = await import('./afiliado.repo.js');
      const resultados = await cambiarStatusAfiliadosLote(
        body.afiliadoIds,
        1, // Registrado
        req.user?.sub || 'unknown',
        body.motivo,
        body.observaciones,
        req.ip,
        req.headers['user-agent']
      );
      
      return reply.send(ok(resultados));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'registrarAfiliadosLote', user: req.user?.sub });
    }
  });

  // Cambiar múltiples afiliados a APROBADO en lote
  app.post('/afiliado/aprobar-lote', {
    preHandler: [requireAuth],
    schema: {
      description: 'Cambiar múltiples afiliados a estado Aprobado en lote',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['afiliadoIds'],
        properties: {
          afiliadoIds: { type: 'array', items: { type: 'number' }, minItems: 1 },
          motivo: { type: 'string', maxLength: 500 },
          observaciones: { type: 'string', maxLength: 1000 }
        }
      },
      response: {
        200: { type: 'object' },
        400: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      const body = req.body as { afiliadoIds: number[]; motivo?: string; observaciones?: string };
      
      if (!body.afiliadoIds || body.afiliadoIds.length === 0) {
        return reply.code(400).send(fail('Debe proporcionar al menos un ID de afiliado'));
      }

      const { cambiarStatusAfiliadosLote } = await import('./afiliado.repo.js');
      const resultados = await cambiarStatusAfiliadosLote(
        body.afiliadoIds,
        2, // Aprobado
        req.user?.sub || 'unknown',
        body.motivo,
        body.observaciones,
        req.ip,
        req.headers['user-agent']
      );
      
      return reply.send(ok(resultados));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'aprobarAfiliadosLote', user: req.user?.sub });
    }
  });

  // Cambiar múltiples afiliados a EN REVISIÓN en lote
  app.post('/afiliado/en-revision-lote', {
    preHandler: [requireAuth],
    schema: {
      description: 'Cambiar múltiples afiliados a estado En Revisión en lote',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['afiliadoIds'],
        properties: {
          afiliadoIds: { type: 'array', items: { type: 'number' }, minItems: 1 },
          motivo: { type: 'string', maxLength: 500 },
          observaciones: { type: 'string', maxLength: 1000 }
        }
      },
      response: {
        200: { type: 'object' },
        400: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      const body = req.body as { afiliadoIds: number[]; motivo?: string; observaciones?: string };
      
      if (!body.afiliadoIds || body.afiliadoIds.length === 0) {
        return reply.code(400).send(fail('Debe proporcionar al menos un ID de afiliado'));
      }

      const { cambiarStatusAfiliadosLote } = await import('./afiliado.repo.js');
      const resultados = await cambiarStatusAfiliadosLote(
        body.afiliadoIds,
        3, // En Revisión
        req.user?.sub || 'unknown',
        body.motivo,
        body.observaciones,
        req.ip,
        req.headers['user-agent']
      );
      
      return reply.send(ok(resultados));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'enviarRevisionAfiliadosLote', user: req.user?.sub });
    }
  });

  // Cambiar múltiples afiliados a RECHAZADO en lote
  app.post('/afiliado/rechazar-lote', {
    preHandler: [requireAuth],
    schema: {
      description: 'Cambiar múltiples afiliados a estado Rechazado en lote',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['afiliadoIds'],
        properties: {
          afiliadoIds: { type: 'array', items: { type: 'number' }, minItems: 1 },
          motivo: { type: 'string', maxLength: 500 },
          observaciones: { type: 'string', maxLength: 1000 }
        }
      },
      response: {
        200: { type: 'object' },
        400: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      const body = req.body as { afiliadoIds: number[]; motivo?: string; observaciones?: string };
      
      if (!body.afiliadoIds || body.afiliadoIds.length === 0) {
        return reply.code(400).send(fail('Debe proporcionar al menos un ID de afiliado'));
      }

      const { cambiarStatusAfiliadosLote } = await import('./afiliado.repo.js');
      const resultados = await cambiarStatusAfiliadosLote(
        body.afiliadoIds,
        4, // Rechazado
        req.user?.sub || 'unknown',
        body.motivo,
        body.observaciones,
        req.ip,
        req.headers['user-agent']
      );
      
      return reply.send(ok(resultados));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'rechazarAfiliadosLote', user: req.user?.sub });
    }
  });

  // Cambiar múltiples afiliados a SUSPENDIDO en lote
  app.post('/afiliado/suspender-lote', {
    preHandler: [requireAuth],
    schema: {
      description: 'Cambiar múltiples afiliados a estado Suspendido en lote',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['afiliadoIds'],
        properties: {
          afiliadoIds: { type: 'array', items: { type: 'number' }, minItems: 1 },
          motivo: { type: 'string', maxLength: 500 },
          observaciones: { type: 'string', maxLength: 1000 }
        }
      },
      response: {
        200: { type: 'object' },
        400: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      const body = req.body as { afiliadoIds: number[]; motivo?: string; observaciones?: string };
      
      if (!body.afiliadoIds || body.afiliadoIds.length === 0) {
        return reply.code(400).send(fail('Debe proporcionar al menos un ID de afiliado'));
      }

      const { cambiarStatusAfiliadosLote } = await import('./afiliado.repo.js');
      const resultados = await cambiarStatusAfiliadosLote(
        body.afiliadoIds,
        5, // Suspendido
        req.user?.sub || 'unknown',
        body.motivo,
        body.observaciones,
        req.ip,
        req.headers['user-agent']
      );
      
      return reply.send(ok(resultados));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'suspenderAfiliadosLote', user: req.user?.sub });
    }
  });

  // Cambiar múltiples afiliados a CANCELADO en lote
  app.post('/afiliado/cancelar-lote', {
    preHandler: [requireAuth],
    schema: {
      description: 'Cambiar múltiples afiliados a estado Cancelado en lote',
      tags: ['afiliado'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['afiliadoIds'],
        properties: {
          afiliadoIds: { type: 'array', items: { type: 'number' }, minItems: 1 },
          motivo: { type: 'string', maxLength: 500 },
          observaciones: { type: 'string', maxLength: 1000 }
        }
      },
      response: {
        200: { type: 'object' },
        400: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (req, reply) => {
    try {
      const body = req.body as { afiliadoIds: number[]; motivo?: string; observaciones?: string };
      
      if (!body.afiliadoIds || body.afiliadoIds.length === 0) {
        return reply.code(400).send(fail('Debe proporcionar al menos un ID de afiliado'));
      }

      const { cambiarStatusAfiliadosLote } = await import('./afiliado.repo.js');
      const resultados = await cambiarStatusAfiliadosLote(
        body.afiliadoIds,
        6, // Cancelado
        req.user?.sub || 'unknown',
        body.motivo,
        body.observaciones,
        req.ip,
        req.headers['user-agent']
      );
      
      return reply.send(ok(resultados));
    } catch (error: any) {
      return handleAfiliadoError(error, reply, { operation: 'cancelarAfiliadosLote', user: req.user?.sub });
    }
  });
}