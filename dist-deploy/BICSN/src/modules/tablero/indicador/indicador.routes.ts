import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { CreateIndicadorSchema, UpdateIndicadorSchema, IndicadorIdParamSchema, ProgramaIdParamSchema, EjeIdParamSchema, LineaEstrategicaIdParamSchema } from './indicador.schemas.js';
import { ok, validationError } from '../../../utils/http.js';
import { withDbContext } from '../../../db/context.js';
import { handleIndicadorError } from './infrastructure/errorHandler.js';
import { GetAllIndicadoresQuery } from './application/queries/GetAllIndicadoresQuery.js';
import { GetIndicadorByIdQuery } from './application/queries/GetIndicadorByIdQuery.js';
import { GetIndicadoresByProgramaQuery } from './application/queries/GetIndicadoresByProgramaQuery.js';
import { GetIndicadoresByLineaEstrategicaQuery } from './application/queries/GetIndicadoresByLineaEstrategicaQuery.js';
import { GetIndicadoresByEjeQuery } from './application/queries/GetIndicadoresByEjeQuery.js';
import { CreateIndicadorCommand } from './application/commands/CreateIndicadorCommand.js';
import { UpdateIndicadorCommand } from './application/commands/UpdateIndicadorCommand.js';
import { DeleteIndicadorCommand } from './application/commands/DeleteIndicadorCommand.js';

export default async function indicadorRoutes(app: FastifyInstance) {

  // Listar todos los indicadores (requiere auth)
  app.get('/indicadores', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all indicators',
      tags: ['indicadores'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  idPrograma: { type: 'number' },
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  tipoIndicador: { type: 'string' },
                  frecuenciaMedicion: { type: 'string' },
                  meta: { type: 'number' },
                  sentido: { type: 'string' },
                  formula: { type: 'string' },
                  unidadMedida: { type: 'string' },
                  fuenteDatos: { type: 'string' },
                  responsable: { type: 'string' },
                  observaciones: { type: 'string' },
                  programa: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' }
                    }
                  },
                  lineaEstrategica: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' }
                    }
                  },
                  eje: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' }
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
      const getAllIndicadoresQuery = req.diScope.resolve<GetAllIndicadoresQuery>('getAllIndicadoresQuery');
      const indicadores = await getAllIndicadoresQuery.execute();
      return reply.send(ok(indicadores));
    } catch (error: any) {
      return handleIndicadorError(error, reply);
    }
  });

  // Listar indicadores por programa (requiere auth)
  app.get('/programas/:programaId/indicadores', {
    preHandler: [requireAuth],
    schema: {
      description: 'List indicators by program',
      tags: ['indicadores'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          programaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['programaId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  idPrograma: { type: 'number' },
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  tipoIndicador: { type: 'string' },
                  frecuenciaMedicion: { type: 'string' },
                  meta: { type: 'number' },
                  sentido: { type: 'string' },
                  formula: { type: 'string' },
                  unidadMedida: { type: 'string' },
                  fuenteDatos: { type: 'string' },
                  responsable: { type: 'string' },
                  observaciones: { type: 'string' },
                  programa: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' }
                    }
                  },
                  lineaEstrategica: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' }
                    }
                  },
                  eje: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' }
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
    const { programaId } = req.params as { programaId: string };

    // Validate parameter
    const paramValidation = ProgramaIdParamSchema.safeParse({ programaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getIndicadoresByProgramaQuery = req.diScope.resolve<GetIndicadoresByProgramaQuery>('getIndicadoresByProgramaQuery');
      const indicadores = await getIndicadoresByProgramaQuery.execute({ programaId: paramValidation.data.programaId });
      return reply.send(ok(indicadores));
    } catch (error: any) {
      return handleIndicadorError(error, reply);
    }
  });

  // Listar indicadores por línea estratégica (requiere auth)
  app.get('/lineas-estrategicas/:lineaEstrategicaId/indicadores', {
    preHandler: [requireAuth],
    schema: {
      description: 'List indicators by strategic line',
      tags: ['indicadores'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          lineaEstrategicaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['lineaEstrategicaId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  idPrograma: { type: 'number' },
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  tipoIndicador: { type: 'string' },
                  frecuenciaMedicion: { type: 'string' },
                  meta: { type: 'number' },
                  sentido: { type: 'string' },
                  formula: { type: 'string' },
                  unidadMedida: { type: 'string' },
                  fuenteDatos: { type: 'string' },
                  responsable: { type: 'string' },
                  observaciones: { type: 'string' },
                  programa: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' }
                    }
                  },
                  lineaEstrategica: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' }
                    }
                  },
                  eje: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' }
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
    const { lineaEstrategicaId } = req.params as { lineaEstrategicaId: string };

    // Validate parameter
    const paramValidation = LineaEstrategicaIdParamSchema.safeParse({ lineaEstrategicaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getIndicadoresByLineaEstrategicaQuery = req.diScope.resolve<GetIndicadoresByLineaEstrategicaQuery>('getIndicadoresByLineaEstrategicaQuery');
      const indicadores = await getIndicadoresByLineaEstrategicaQuery.execute({ lineaEstrategicaId: paramValidation.data.lineaEstrategicaId });
      return reply.send(ok(indicadores));
    } catch (error: any) {
      return handleIndicadorError(error, reply);
    }
  });

  // Listar indicadores por eje (requiere auth)
  app.get('/ejes/:ejeId/indicadores', {
    preHandler: [requireAuth],
    schema: {
      description: 'List indicators by strategic axis',
      tags: ['indicadores'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          ejeId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['ejeId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  idPrograma: { type: 'number' },
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  tipoIndicador: { type: 'string' },
                  frecuenciaMedicion: { type: 'string' },
                  meta: { type: 'number' },
                  sentido: { type: 'string' },
                  formula: { type: 'string' },
                  unidadMedida: { type: 'string' },
                  fuenteDatos: { type: 'string' },
                  responsable: { type: 'string' },
                  observaciones: { type: 'string' },
                  programa: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' }
                    }
                  },
                  lineaEstrategica: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' }
                    }
                  },
                  eje: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' }
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
    const { ejeId } = req.params as { ejeId: string };

    // Validate parameter
    const paramValidation = EjeIdParamSchema.safeParse({ ejeId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getIndicadoresByEjeQuery = req.diScope.resolve<GetIndicadoresByEjeQuery>('getIndicadoresByEjeQuery');
      const indicadores = await getIndicadoresByEjeQuery.execute({ ejeId: paramValidation.data.ejeId });
      return reply.send(ok(indicadores));
    } catch (error: any) {
      return handleIndicadorError(error, reply);
    }
  });

  // Obtener indicador por ID (requiere auth)
  app.get('/indicadores/:indicadorId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get indicator by ID',
      tags: ['indicadores'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          indicadorId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['indicadorId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                idPrograma: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                tipoIndicador: { type: 'string' },
                frecuenciaMedicion: { type: 'string' },
                meta: { type: 'number' },
                sentido: { type: 'string' },
                formula: { type: 'string' },
                unidadMedida: { type: 'string' },
                fuenteDatos: { type: 'string' },
                responsable: { type: 'string' },
                observaciones: { type: 'string' },
                programa: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    nombre: { type: 'string' },
                    descripcion: { type: 'string' }
                  }
                },
                lineaEstrategica: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    nombre: { type: 'string' },
                    descripcion: { type: 'string' }
                  }
                },
                eje: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    nombre: { type: 'string' }
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
    const { indicadorId } = req.params as { indicadorId: string };

    // Validate parameter
    const paramValidation = IndicadorIdParamSchema.safeParse({ indicadorId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getIndicadorByIdQuery = req.diScope.resolve<GetIndicadorByIdQuery>('getIndicadorByIdQuery');
      const indicador = await getIndicadorByIdQuery.execute({ indicadorId: paramValidation.data.indicadorId });
      return reply.send(ok(indicador));
    } catch (error: any) {
      return handleIndicadorError(error, reply);
    }
  });

  // Crear indicador (requiere admin)
  app.post('/indicadores', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new indicator',
      tags: ['indicadores'],
      security: [{ bearerAuth: [] }],
      body: {
       type: 'object',
       required: ['idPrograma', 'nombre', 'descripcion', 'tipoIndicador', 'frecuenciaMedicion'],
       properties: {
         idPrograma: { type: 'number', minimum: 1 },
         idUnidadMedida: { type: 'number', minimum: 1 },
         idDimension: { type: 'number', minimum: 1 },
         nombre: { type: 'string', minLength: 1, maxLength: 500 },
         descripcion: { type: 'string', minLength: 1, maxLength: 5000 },
         tipoIndicador: { type: 'string', enum: ['PORCENTAJE', 'NUMERICO', 'MONETARIO', 'BOOLEANO'] },
         frecuenciaMedicion: { type: 'string', enum: ['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'] },
         meta: { type: 'number' },
         sentido: { type: 'string', enum: ['ASCENDENTE', 'DESCENDENTE'] },
         formula: { type: 'string', maxLength: 1000 },
         fuenteDatos: { type: 'string', maxLength: 500 },
         responsable: { type: 'string', maxLength: 200 },
         observaciones: { type: 'string', maxLength: 2000 }
       }
     },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                idPrograma: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                tipoIndicador: { type: 'string' },
                frecuenciaMedicion: { type: 'string' },
                meta: { type: 'number' },
                sentido: { type: 'string' },
                formula: { type: 'string' },
                unidadMedida: { type: 'string' },
                fuenteDatos: { type: 'string' },
                responsable: { type: 'string' },
                observaciones: { type: 'string' }
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
    return withDbContext(req, async (tx) => {
      const parsed = CreateIndicadorSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const createIndicadorCommand = req.diScope.resolve<CreateIndicadorCommand>('createIndicadorCommand');
        const indicador = await createIndicadorCommand.execute({
          idPrograma: parsed.data.idPrograma,
          nombre: parsed.data.nombre,
          descripcion: parsed.data.descripcion,
          tipoIndicador: parsed.data.tipoIndicador,
          frecuenciaMedicion: parsed.data.frecuenciaMedicion,
          meta: parsed.data.meta,
          sentido: parsed.data.sentido,
          formula: parsed.data.formula,
          idUnidadMedida: parsed.data.idUnidadMedida,
          idDimension: parsed.data.idDimension,
          fuenteDatos: parsed.data.fuenteDatos,
          responsable: parsed.data.responsable,
          observaciones: parsed.data.observaciones,
          userId
        }, tx);
        return reply.code(201).send(ok(indicador));
      } catch (error: any) {
        return handleIndicadorError(error, reply);
      }
    });
  });

  // Actualizar indicador (requiere admin)
  app.put('/indicadores/:indicadorId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update indicator',
      tags: ['indicadores'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          indicadorId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['indicadorId']
      },
      body: {
        type: 'object',
        properties: {
          idUnidadMedida: { type: 'number', minimum: 1 },
          idDimension: { type: 'number', minimum: 1 },
          nombre: { type: 'string', minLength: 1, maxLength: 500 },
          descripcion: { type: 'string', minLength: 1, maxLength: 5000 },
          tipoIndicador: { type: 'string', enum: ['PORCENTAJE', 'NUMERICO', 'MONETARIO', 'BOOLEANO'] },
          frecuenciaMedicion: { type: 'string', enum: ['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'] },
          meta: { type: 'number' },
          sentido: { type: 'string', enum: ['ASCENDENTE', 'DESCENDENTE'] },
          formula: { type: 'string', maxLength: 1000 },
          fuenteDatos: { type: 'string', maxLength: 500 },
          responsable: { type: 'string', maxLength: 200 },
          observaciones: { type: 'string', maxLength: 2000 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                idPrograma: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                tipoIndicador: { type: 'string' },
                frecuenciaMedicion: { type: 'string' },
                meta: { type: 'number' },
                sentido: { type: 'string' },
                formula: { type: 'string' },
                unidadMedida: { type: 'string' },
                fuenteDatos: { type: 'string' },
                responsable: { type: 'string' },
                observaciones: { type: 'string' }
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
    return withDbContext(req, async (tx) => {
      const { indicadorId } = req.params as { indicadorId: string };

      // Validate parameter
      const paramValidation = IndicadorIdParamSchema.safeParse({ indicadorId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateIndicadorSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const updateIndicadorCommand = req.diScope.resolve<UpdateIndicadorCommand>('updateIndicadorCommand');
        const indicador = await updateIndicadorCommand.execute({
          indicadorId: paramValidation.data.indicadorId,
          nombre: parsed.data.nombre,
          descripcion: parsed.data.descripcion,
          tipoIndicador: parsed.data.tipoIndicador,
          frecuenciaMedicion: parsed.data.frecuenciaMedicion,
          meta: parsed.data.meta,
          sentido: parsed.data.sentido,
          formula: parsed.data.formula,
          idUnidadMedida: parsed.data.idUnidadMedida,
          idDimension: parsed.data.idDimension,
          fuenteDatos: parsed.data.fuenteDatos,
          responsable: parsed.data.responsable,
          observaciones: parsed.data.observaciones,
          userId
        }, tx);
        return reply.send(ok(indicador));
      } catch (error: any) {
        return handleIndicadorError(error, reply);
      }
    });
  });

  // Eliminar indicador (requiere admin)
  app.delete('/indicadores/:indicadorId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete indicator',
      tags: ['indicadores'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          indicadorId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['indicadorId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' }
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
    return withDbContext(req, async (tx) => {
      const { indicadorId } = req.params as { indicadorId: string };

      // Validate parameter
      const paramValidation = IndicadorIdParamSchema.safeParse({ indicadorId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const deleteIndicadorCommand = req.diScope.resolve<DeleteIndicadorCommand>('deleteIndicadorCommand');
        const deletedId = await deleteIndicadorCommand.execute({ indicadorId: paramValidation.data.indicadorId }, tx);
        return reply.send(ok({ id: deletedId }));
      } catch (error: any) {
        return handleIndicadorError(error, reply);
      }
    });
  });
}