import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { CreateIndicadorSchema, UpdateIndicadorSchema, IndicadorIdParamSchema, ProgramaIdParamSchema, EjeIdParamSchema, LineaEstrategicaIdParamSchema } from './indicador.schemas.js';
import { getAllIndicadores, getIndicadoresByPrograma, getIndicadoresByLineaEstrategica, getIndicadoresByEje, getIndicadorById, createIndicadorItem, updateIndicadorItem, deleteIndicadorItem } from './indicador.service.js';
import { ok, validationError, notFound, internalError } from '../../../utils/http.js';
import { withDbContext } from '../../../db/context.js';

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
  }, async (_req, reply) => {
    try {
      const indicadores = await getAllIndicadores();
      return reply.send(ok(indicadores));
    } catch (error: any) {
      console.error('Error listing indicadores:', error);
      return reply.code(500).send(internalError('Failed to retrieve indicadores'));
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
      const indicadores = await getIndicadoresByPrograma(paramValidation.data.programaId);
      return reply.send(ok(indicadores));
    } catch (error: any) {
      console.error('Error listing indicadores by programa:', error);
      return reply.code(500).send(internalError('Failed to retrieve indicadores'));
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
      const indicadores = await getIndicadoresByLineaEstrategica(paramValidation.data.lineaEstrategicaId);
      return reply.send(ok(indicadores));
    } catch (error: any) {
      console.error('Error listing indicadores by linea estrategica:', error);
      return reply.code(500).send(internalError('Failed to retrieve indicadores'));
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
      const indicadores = await getIndicadoresByEje(paramValidation.data.ejeId);
      return reply.send(ok(indicadores));
    } catch (error: any) {
      console.error('Error listing indicadores by eje:', error);
      return reply.code(500).send(internalError('Failed to retrieve indicadores'));
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
      const indicador = await getIndicadorById(paramValidation.data.indicadorId);
      return reply.send(ok(indicador));
    } catch (error: any) {
      if (error.message === 'INDICADOR_NOT_FOUND') {
        return reply.code(404).send(notFound('Indicador', indicadorId));
      }
      console.error('Error getting indicador:', error);
      return reply.code(500).send(internalError('Failed to retrieve indicador'));
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
        const indicador = await createIndicadorItem(
          parsed.data.idPrograma,
          parsed.data.nombre,
          parsed.data.descripcion,
          parsed.data.tipoIndicador,
          parsed.data.frecuenciaMedicion,
          parsed.data.meta,
          parsed.data.sentido,
          parsed.data.formula,
          parsed.data.idUnidadMedida,
          parsed.data.idDimension,
          parsed.data.fuenteDatos,
          parsed.data.responsable,
          parsed.data.observaciones,
          userId,
          tx
        );
        return reply.code(201).send(ok(indicador));
      } catch (error: any) {
        if (error.message === 'PROGRAMA_NOT_FOUND') {
          return reply.code(400).send({ ok: false, error: { code: 'BAD_REQUEST', message: 'Programa not found' } });
        }
        console.error('Error creating indicador:', error);
        return reply.code(500).send(internalError('Failed to create indicador'));
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
        const indicador = await updateIndicadorItem(
          paramValidation.data.indicadorId,
          parsed.data.nombre,
          parsed.data.descripcion,
          parsed.data.tipoIndicador,
          parsed.data.frecuenciaMedicion,
          parsed.data.meta,
          parsed.data.sentido,
          parsed.data.formula,
          parsed.data.idUnidadMedida,
          parsed.data.idDimension,
          parsed.data.fuenteDatos,
          parsed.data.responsable,
          parsed.data.observaciones,
          userId,
          tx
        );
        return reply.send(ok(indicador));
      } catch (error: any) {
        if (error.message === 'INDICADOR_NOT_FOUND') {
          return reply.code(404).send(notFound('Indicador', indicadorId));
        }
        console.error('Error updating indicador:', error);
        return reply.code(500).send(internalError('Failed to update indicador'));
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
        const deletedId = await deleteIndicadorItem(paramValidation.data.indicadorId, tx);
        return reply.send(ok({ id: deletedId }));
      } catch (error: any) {
        if (error.message === 'INDICADOR_NOT_FOUND') {
          return reply.code(404).send(notFound('Indicador', indicadorId));
        }
        console.error('Error deleting indicador:', error);
        return reply.code(500).send(internalError('Failed to delete indicador'));
      }
    });
  });
}