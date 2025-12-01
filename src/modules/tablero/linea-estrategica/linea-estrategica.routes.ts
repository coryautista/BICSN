import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { CreateLineaEstrategicaSchema, UpdateLineaEstrategicaSchema, LineaEstrategicaIdParamSchema, EjeIdParamSchema } from './linea-estrategica.schemas.js';
import { ok, validationError } from '../../../utils/http.js';
import { withDbContext } from '../../../db/context.js';
import { handleLineaEstrategicaError } from './infrastructure/errorHandler.js';
import { GetAllLineasEstrategicasQuery } from './application/queries/GetAllLineasEstrategicasQuery.js';
import { GetLineaEstrategicaByIdQuery } from './application/queries/GetLineaEstrategicaByIdQuery.js';
import { GetLineasEstrategicasByEjeQuery } from './application/queries/GetLineasEstrategicasByEjeQuery.js';
import { GetLineaEstrategicaWithProgramasQuery } from './application/queries/GetLineaEstrategicaWithProgramasQuery.js';
import { CreateLineaEstrategicaCommand } from './application/commands/CreateLineaEstrategicaCommand.js';
import { UpdateLineaEstrategicaCommand } from './application/commands/UpdateLineaEstrategicaCommand.js';
import { DeleteLineaEstrategicaCommand } from './application/commands/DeleteLineaEstrategicaCommand.js';

export default async function lineaEstrategicaRoutes(app: FastifyInstance) {

  // Listar todas las líneas estratégicas (requiere auth)
  app.get('/lineas-estrategicas', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all strategic lines',
      tags: ['lineas-estrategicas'],
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
                  idEje: { type: 'number' },
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
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
      const getAllLineasEstrategicasQuery = req.diScope.resolve<GetAllLineasEstrategicasQuery>('getAllLineasEstrategicasQuery');
      const lineasEstrategicas = await getAllLineasEstrategicasQuery.execute();
      return reply.send(ok(lineasEstrategicas));
    } catch (error: any) {
      return handleLineaEstrategicaError(error, reply);
    }
  });

  // Listar líneas estratégicas por eje (requiere auth)
  app.get('/ejes/:ejeId/lineas-estrategicas-list', {
    preHandler: [requireAuth],
    schema: {
      description: 'List strategic lines by strategic axis',
      tags: ['lineas-estrategicas'],
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
                  idEje: { type: 'number' },
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
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
      const getLineasEstrategicasByEjeQuery = req.diScope.resolve<GetLineasEstrategicasByEjeQuery>('getLineasEstrategicasByEjeQuery');
      const lineasEstrategicas = await getLineasEstrategicasByEjeQuery.execute(paramValidation.data.ejeId);
      return reply.send(ok(lineasEstrategicas));
    } catch (error: any) {
      return handleLineaEstrategicaError(error, reply);
    }
  });

  // Obtener línea estratégica por ID (requiere auth)
  app.get('/lineas-estrategicas/:lineaEstrategicaId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get strategic line by ID',
      tags: ['lineas-estrategicas'],
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
              type: 'object',
              properties: {
                id: { type: 'number' },
                idEje: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
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
    const { lineaEstrategicaId } = req.params as { lineaEstrategicaId: string };

    // Validate parameter
    const paramValidation = LineaEstrategicaIdParamSchema.safeParse({ lineaEstrategicaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getLineaEstrategicaByIdQuery = req.diScope.resolve<GetLineaEstrategicaByIdQuery>('getLineaEstrategicaByIdQuery');
      const lineaEstrategica = await getLineaEstrategicaByIdQuery.execute(paramValidation.data.lineaEstrategicaId);
      return reply.send(ok(lineaEstrategica));
    } catch (error: any) {
      return handleLineaEstrategicaError(error, reply);
    }
  });

  // Obtener línea estratégica con programas (requiere auth)
  app.get('/lineas-estrategicas/:lineaEstrategicaId/programas-list', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get strategic line with programs',
      tags: ['lineas-estrategicas'],
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
              type: 'object',
              properties: {
                id: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                idEje: { type: 'number' },
                eje: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    nombre: { type: 'string' }
                  }
                },
                programas: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' },
                      descripcion: { type: 'string' }
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
    const { lineaEstrategicaId } = req.params as { lineaEstrategicaId: string };

    // Validate parameter
    const paramValidation = LineaEstrategicaIdParamSchema.safeParse({ lineaEstrategicaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getLineaEstrategicaWithProgramasQuery = req.diScope.resolve<GetLineaEstrategicaWithProgramasQuery>('getLineaEstrategicaWithProgramasQuery');
      const lineaEstrategica = await getLineaEstrategicaWithProgramasQuery.execute(paramValidation.data.lineaEstrategicaId);
      return reply.send(ok(lineaEstrategica));
    } catch (error: any) {
      return handleLineaEstrategicaError(error, reply);
    }
  });

  // Crear línea estratégica (requiere admin)
  app.post('/lineas-estrategicas', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new strategic line',
      tags: ['lineas-estrategicas'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['idEje', 'nombre', 'descripcion'],
        properties: {
          idEje: { type: 'number', minimum: 1 },
          nombre: { type: 'string', minLength: 1, maxLength: 500 },
          descripcion: { type: 'string', minLength: 1, maxLength: 5000 }
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
                idEje: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' }
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
      const parsed = CreateLineaEstrategicaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const createLineaEstrategicaCommand = req.diScope.resolve<CreateLineaEstrategicaCommand>('createLineaEstrategicaCommand');
        const lineaEstrategica = await createLineaEstrategicaCommand.execute({
          idEje: parsed.data.idEje,
          nombre: parsed.data.nombre,
          descripcion: parsed.data.descripcion,
          userId
        }, tx);
        return reply.code(201).send(ok(lineaEstrategica));
      } catch (error: any) {
        return handleLineaEstrategicaError(error, reply);
      }
    });
  });

  // Actualizar línea estratégica (requiere admin)
  app.put('/lineas-estrategicas/:lineaEstrategicaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update strategic line',
      tags: ['lineas-estrategicas'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          lineaEstrategicaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['lineaEstrategicaId']
      },
      body: {
        type: 'object',
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 500 },
          descripcion: { type: 'string', minLength: 1, maxLength: 5000 }
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
                idEje: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' }
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
      const { lineaEstrategicaId } = req.params as { lineaEstrategicaId: string };

      // Validate parameter
      const paramValidation = LineaEstrategicaIdParamSchema.safeParse({ lineaEstrategicaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateLineaEstrategicaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const updateLineaEstrategicaCommand = req.diScope.resolve<UpdateLineaEstrategicaCommand>('updateLineaEstrategicaCommand');
        const lineaEstrategica = await updateLineaEstrategicaCommand.execute({
          lineaEstrategicaId: paramValidation.data.lineaEstrategicaId,
          nombre: parsed.data.nombre,
          descripcion: parsed.data.descripcion,
          userId
        }, tx);
        return reply.send(ok(lineaEstrategica));
      } catch (error: any) {
        return handleLineaEstrategicaError(error, reply);
      }
    });
  });

  // Eliminar línea estratégica (requiere admin)
  app.delete('/lineas-estrategicas/:lineaEstrategicaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete strategic line',
      tags: ['lineas-estrategicas'],
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
      const { lineaEstrategicaId } = req.params as { lineaEstrategicaId: string };

      // Validate parameter
      const paramValidation = LineaEstrategicaIdParamSchema.safeParse({ lineaEstrategicaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const deleteLineaEstrategicaCommand = req.diScope.resolve<DeleteLineaEstrategicaCommand>('deleteLineaEstrategicaCommand');
        const deletedId = await deleteLineaEstrategicaCommand.execute({
          lineaEstrategicaId: paramValidation.data.lineaEstrategicaId
        }, tx);
        return reply.send(ok({ id: deletedId }));
      } catch (error: any) {
        return handleLineaEstrategicaError(error, reply);
      }
    });
  });
}