import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { CreateIndicadorAnualSchema, UpdateIndicadorAnualSchema, IndicadorAnualIdParamSchema, IndicadorIdParamSchema, AnioParamSchema } from './indicador-anual.schemas.js';
import { ok, validationError } from '../../../utils/http.js';
import { withDbContext } from '../../../db/context.js';
import { handleIndicadorAnualError } from './infrastructure/errorHandler.js';
import { GetIndicadorAnualByIdQuery } from './application/queries/GetIndicadorAnualByIdQuery.js';
import { GetIndicadoresAnualesByIndicadorQuery } from './application/queries/GetIndicadoresAnualesByIndicadorQuery.js';
import { GetIndicadoresAnualesByAnioQuery } from './application/queries/GetIndicadoresAnualesByAnioQuery.js';
import { CreateIndicadorAnualCommand } from './application/commands/CreateIndicadorAnualCommand.js';
import { UpdateIndicadorAnualCommand } from './application/commands/UpdateIndicadorAnualCommand.js';
import { DeleteIndicadorAnualCommand } from './application/commands/DeleteIndicadorAnualCommand.js';

export default async function indicadorAnualRoutes(app: FastifyInstance) {

  // Listar indicadores anuales por indicador (requiere auth)
  app.get('/indicadores/:indicadorId/anuales', {
    preHandler: [requireAuth],
    schema: {
      description: 'List annual indicators by indicator',
      tags: ['indicadores-anuales'],
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
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  idIndicador: { type: 'number' },
                  anio: { type: 'number' },
                  enero: { type: 'number' },
                  febrero: { type: 'number' },
                  marzo: { type: 'number' },
                  abril: { type: 'number' },
                  mayo: { type: 'number' },
                  junio: { type: 'number' },
                  julio: { type: 'number' },
                  agosto: { type: 'number' },
                  septiembre: { type: 'number' },
                  octubre: { type: 'number' },
                  noviembre: { type: 'number' },
                  diciembre: { type: 'number' },
                  metaAnual: { type: 'number' },
                  observaciones: { type: 'string' },
                  indicador: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' },
                      descripcion: { type: 'string' },
                      tipoIndicador: { type: 'string' },
                      frecuenciaMedicion: { type: 'string' },
                      meta: { type: 'number' },
                      sentido: { type: 'string' }
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
    const { indicadorId } = req.params as { indicadorId: string };

    // Validate parameter
    const paramValidation = IndicadorIdParamSchema.safeParse({ indicadorId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getIndicadoresAnualesByIndicadorQuery = req.diScope.resolve<GetIndicadoresAnualesByIndicadorQuery>('getIndicadoresAnualesByIndicadorQuery');
      const indicadoresAnuales = await getIndicadoresAnualesByIndicadorQuery.execute({ indicadorId: paramValidation.data.indicadorId });
      return reply.send(ok(indicadoresAnuales));
    } catch (error: any) {
      return handleIndicadorAnualError(error, reply);
    }
  });

  // Listar indicadores anuales por año (requiere auth)
  app.get('/indicadores-anuales/anio/:anio', {
    preHandler: [requireAuth],
    schema: {
      description: 'List annual indicators by year',
      tags: ['indicadores-anuales'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          anio: { type: 'string', pattern: '^[0-9]{4}$' }
        },
        required: ['anio']
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
                  idIndicador: { type: 'number' },
                  anio: { type: 'number' },
                  enero: { type: 'number' },
                  febrero: { type: 'number' },
                  marzo: { type: 'number' },
                  abril: { type: 'number' },
                  mayo: { type: 'number' },
                  junio: { type: 'number' },
                  julio: { type: 'number' },
                  agosto: { type: 'number' },
                  septiembre: { type: 'number' },
                  octubre: { type: 'number' },
                  noviembre: { type: 'number' },
                  diciembre: { type: 'number' },
                  metaAnual: { type: 'number' },
                  observaciones: { type: 'string' },
                  indicador: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' },
                      descripcion: { type: 'string' },
                      tipoIndicador: { type: 'string' },
                      frecuenciaMedicion: { type: 'string' },
                      meta: { type: 'number' },
                      sentido: { type: 'string' }
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
    const { anio } = req.params as { anio: string };

    // Validate parameter
    const paramValidation = AnioParamSchema.safeParse({ anio });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getIndicadoresAnualesByAnioQuery = req.diScope.resolve<GetIndicadoresAnualesByAnioQuery>('getIndicadoresAnualesByAnioQuery');
      const indicadoresAnuales = await getIndicadoresAnualesByAnioQuery.execute({ anio: paramValidation.data.anio });
      return reply.send(ok(indicadoresAnuales));
    } catch (error: any) {
      return handleIndicadorAnualError(error, reply);
    }
  });

  // Obtener indicador anual por ID (requiere auth)
  app.get('/indicadores-anuales/:indicadorAnualId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get annual indicator by ID',
      tags: ['indicadores-anuales'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          indicadorAnualId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['indicadorAnualId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                idIndicador: { type: 'number' },
                anio: { type: 'number' },
                enero: { type: 'number' },
                febrero: { type: 'number' },
                marzo: { type: 'number' },
                abril: { type: 'number' },
                mayo: { type: 'number' },
                junio: { type: 'number' },
                julio: { type: 'number' },
                agosto: { type: 'number' },
                septiembre: { type: 'number' },
                octubre: { type: 'number' },
                noviembre: { type: 'number' },
                diciembre: { type: 'number' },
                metaAnual: { type: 'number' },
                observaciones: { type: 'string' },
                indicador: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    nombre: { type: 'string' },
                    descripcion: { type: 'string' },
                    tipoIndicador: { type: 'string' },
                    frecuenciaMedicion: { type: 'string' },
                    meta: { type: 'number' },
                    sentido: { type: 'string' }
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
    const { indicadorAnualId } = req.params as { indicadorAnualId: string };

    // Validate parameter
    const paramValidation = IndicadorAnualIdParamSchema.safeParse({ indicadorAnualId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getIndicadorAnualByIdQuery = req.diScope.resolve<GetIndicadorAnualByIdQuery>('getIndicadorAnualByIdQuery');
      const indicadorAnual = await getIndicadorAnualByIdQuery.execute({ indicadorAnualId: paramValidation.data.indicadorAnualId });
      return reply.send(ok(indicadorAnual));
    } catch (error: any) {
      return handleIndicadorAnualError(error, reply);
    }
  });

  // Crear indicador anual (requiere admin)
  app.post('/indicadores-anuales', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new annual indicator',
      tags: ['indicadores-anuales'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['idIndicador', 'anio'],
        properties: {
          idIndicador: { type: 'number', minimum: 1 },
          anio: { type: 'number', minimum: 2000, maximum: 2100 },
          enero: { type: 'number' },
          febrero: { type: 'number' },
          marzo: { type: 'number' },
          abril: { type: 'number' },
          mayo: { type: 'number' },
          junio: { type: 'number' },
          julio: { type: 'number' },
          agosto: { type: 'number' },
          septiembre: { type: 'number' },
          octubre: { type: 'number' },
          noviembre: { type: 'number' },
          diciembre: { type: 'number' },
          metaAnual: { type: 'number' },
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
                idIndicador: { type: 'number' },
                anio: { type: 'number' },
                enero: { type: 'number' },
                febrero: { type: 'number' },
                marzo: { type: 'number' },
                abril: { type: 'number' },
                mayo: { type: 'number' },
                junio: { type: 'number' },
                julio: { type: 'number' },
                agosto: { type: 'number' },
                septiembre: { type: 'number' },
                octubre: { type: 'number' },
                noviembre: { type: 'number' },
                diciembre: { type: 'number' },
                metaAnual: { type: 'number' },
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
      const parsed = CreateIndicadorAnualSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const createIndicadorAnualCommand = req.diScope.resolve<CreateIndicadorAnualCommand>('createIndicadorAnualCommand');
        const indicadorAnual = await createIndicadorAnualCommand.execute({
          idIndicador: parsed.data.idIndicador,
          anio: parsed.data.anio,
          enero: parsed.data.enero,
          febrero: parsed.data.febrero,
          marzo: parsed.data.marzo,
          abril: parsed.data.abril,
          mayo: parsed.data.mayo,
          junio: parsed.data.junio,
          julio: parsed.data.julio,
          agosto: parsed.data.agosto,
          septiembre: parsed.data.septiembre,
          octubre: parsed.data.octubre,
          noviembre: parsed.data.noviembre,
          diciembre: parsed.data.diciembre,
          metaAnual: parsed.data.metaAnual,
          observaciones: parsed.data.observaciones,
          userId
        }, tx);
        return reply.code(201).send(ok(indicadorAnual));
      } catch (error: any) {
        return handleIndicadorAnualError(error, reply);
      }
    });
  });

  // Actualizar indicador anual (requiere admin)
  app.put('/indicadores-anuales/:indicadorAnualId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update annual indicator',
      tags: ['indicadores-anuales'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          indicadorAnualId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['indicadorAnualId']
      },
      body: {
        type: 'object',
        properties: {
          enero: { type: 'number' },
          febrero: { type: 'number' },
          marzo: { type: 'number' },
          abril: { type: 'number' },
          mayo: { type: 'number' },
          junio: { type: 'number' },
          julio: { type: 'number' },
          agosto: { type: 'number' },
          septiembre: { type: 'number' },
          octubre: { type: 'number' },
          noviembre: { type: 'number' },
          diciembre: { type: 'number' },
          metaAnual: { type: 'number' },
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
                idIndicador: { type: 'number' },
                anio: { type: 'number' },
                enero: { type: 'number' },
                febrero: { type: 'number' },
                marzo: { type: 'number' },
                abril: { type: 'number' },
                mayo: { type: 'number' },
                junio: { type: 'number' },
                julio: { type: 'number' },
                agosto: { type: 'number' },
                septiembre: { type: 'number' },
                octubre: { type: 'number' },
                noviembre: { type: 'number' },
                diciembre: { type: 'number' },
                metaAnual: { type: 'number' },
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
      const { indicadorAnualId } = req.params as { indicadorAnualId: string };

      // Validate parameter
      const paramValidation = IndicadorAnualIdParamSchema.safeParse({ indicadorAnualId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateIndicadorAnualSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const updateIndicadorAnualCommand = req.diScope.resolve<UpdateIndicadorAnualCommand>('updateIndicadorAnualCommand');
        const indicadorAnual = await updateIndicadorAnualCommand.execute({
          indicadorAnualId: paramValidation.data.indicadorAnualId,
          enero: parsed.data.enero,
          febrero: parsed.data.febrero,
          marzo: parsed.data.marzo,
          abril: parsed.data.abril,
          mayo: parsed.data.mayo,
          junio: parsed.data.junio,
          julio: parsed.data.julio,
          agosto: parsed.data.agosto,
          septiembre: parsed.data.septiembre,
          octubre: parsed.data.octubre,
          noviembre: parsed.data.noviembre,
          diciembre: parsed.data.diciembre,
          metaAnual: parsed.data.metaAnual,
          observaciones: parsed.data.observaciones,
          userId
        }, tx);
        return reply.send(ok(indicadorAnual));
      } catch (error: any) {
        return handleIndicadorAnualError(error, reply);
      }
    });
  });

  // Eliminar indicador anual (requiere admin)
  app.delete('/indicadores-anuales/:indicadorAnualId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete annual indicator',
      tags: ['indicadores-anuales'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          indicadorAnualId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['indicadorAnualId']
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
      const { indicadorAnualId } = req.params as { indicadorAnualId: string };

      // Validate parameter
      const paramValidation = IndicadorAnualIdParamSchema.safeParse({ indicadorAnualId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const deleteIndicadorAnualCommand = req.diScope.resolve<DeleteIndicadorAnualCommand>('deleteIndicadorAnualCommand');
        const deletedId = await deleteIndicadorAnualCommand.execute({ indicadorAnualId: paramValidation.data.indicadorAnualId }, tx);
        return reply.send(ok({ id: deletedId }));
      } catch (error: any) {
        return handleIndicadorAnualError(error, reply);
      }
    });
  });
}