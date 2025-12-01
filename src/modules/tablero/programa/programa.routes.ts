import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { CreateProgramaSchema, UpdateProgramaSchema, ProgramaIdParamSchema, EjeIdParamSchema, LineaEstrategicaIdParamSchema } from './programa.schemas.js';
import { ok, validationError } from '../../../utils/http.js';
import { withDbContext } from '../../../db/context.js';
import { handleProgramaError } from './infrastructure/errorHandler.js';
import { GetAllProgramasQuery } from './application/queries/GetAllProgramasQuery.js';
import { GetProgramaByIdQuery } from './application/queries/GetProgramaByIdQuery.js';
import { GetProgramasByEjeQuery } from './application/queries/GetProgramasByEjeQuery.js';
import { GetProgramasByLineaEstrategicaQuery } from './application/queries/GetProgramasByLineaEstrategicaQuery.js';
import { CreateProgramaCommand } from './application/commands/CreateProgramaCommand.js';
import { UpdateProgramaCommand } from './application/commands/UpdateProgramaCommand.js';
import { DeleteProgramaCommand } from './application/commands/DeleteProgramaCommand.js';

export default async function programaRoutes(app: FastifyInstance) {

  // Listar todos los programas (requiere auth)
  app.get('/programas', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all programs',
      tags: ['programas'],
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
                  idLineaEstrategica: { type: 'number' },
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  eje: {
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
      const getAllProgramasQuery = req.diScope.resolve<GetAllProgramasQuery>('getAllProgramasQuery');
      const programas = await getAllProgramasQuery.execute();
      return reply.send(ok(programas));
    } catch (error: any) {
      return handleProgramaError(error, reply);
    }
  });

  // Listar programas por eje (requiere auth)
  app.get('/ejes/:ejeId/programas', {
    preHandler: [requireAuth],
    schema: {
      description: 'List programs by strategic axis',
      tags: ['programas'],
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
                  idLineaEstrategica: { type: 'number' },
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  lineaEstrategica: {
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
      const getProgramasByEjeQuery = req.diScope.resolve<GetProgramasByEjeQuery>('getProgramasByEjeQuery');
      const programas = await getProgramasByEjeQuery.execute(paramValidation.data.ejeId);
      return reply.send(ok(programas));
    } catch (error: any) {
      return handleProgramaError(error, reply);
    }
  });

  // Listar programas por línea estratégica (requiere auth)
  app.get('/lineas-estrategicas/:lineaEstrategicaId/programas', {
    preHandler: [requireAuth],
    schema: {
      description: 'List programs by strategic line',
      tags: ['programas'],
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
                  idEje: { type: 'number' },
                  idLineaEstrategica: { type: 'number' },
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
    const { lineaEstrategicaId } = req.params as { lineaEstrategicaId: string };

    // Validate parameter
    const paramValidation = LineaEstrategicaIdParamSchema.safeParse({ lineaEstrategicaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getProgramasByLineaEstrategicaQuery = req.diScope.resolve<GetProgramasByLineaEstrategicaQuery>('getProgramasByLineaEstrategicaQuery');
      const programas = await getProgramasByLineaEstrategicaQuery.execute(paramValidation.data.lineaEstrategicaId);
      return reply.send(ok(programas));
    } catch (error: any) {
      return handleProgramaError(error, reply);
    }
  });

  // Obtener programa por ID (requiere auth)
  app.get('/programas/:programaId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get program by ID',
      tags: ['programas'],
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
              type: 'object',
              properties: {
                id: { type: 'number' },
                idEje: { type: 'number' },
                idLineaEstrategica: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                eje: {
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
                    nombre: { type: 'string' },
                    descripcion: { type: 'string' }
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
    const { programaId } = req.params as { programaId: string };

    // Validate parameter
    const paramValidation = ProgramaIdParamSchema.safeParse({ programaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getProgramaByIdQuery = req.diScope.resolve<GetProgramaByIdQuery>('getProgramaByIdQuery');
      const programa = await getProgramaByIdQuery.execute(paramValidation.data.programaId);
      return reply.send(ok(programa));
    } catch (error: any) {
      return handleProgramaError(error, reply);
    }
  });

  // Crear programa (requiere admin)
  app.post('/programas', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new program',
      tags: ['programas'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['idEje', 'idLineaEstrategica', 'nombre', 'descripcion'],
        properties: {
          idEje: { type: 'number', minimum: 1 },
          idLineaEstrategica: { type: 'number', minimum: 1 },
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
                idLineaEstrategica: { type: 'number' },
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
      const parsed = CreateProgramaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const createProgramaCommand = req.diScope.resolve<CreateProgramaCommand>('createProgramaCommand');
        const programa = await createProgramaCommand.execute({
          idEje: parsed.data.idEje,
          idLineaEstrategica: parsed.data.idLineaEstrategica,
          nombre: parsed.data.nombre,
          descripcion: parsed.data.descripcion,
          userId
        }, tx);
        return reply.code(201).send(ok(programa));
      } catch (error: any) {
        return handleProgramaError(error, reply);
      }
    });
  });

  // Actualizar programa (requiere admin)
  app.put('/programas/:programaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update program',
      tags: ['programas'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          programaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['programaId']
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
                idLineaEstrategica: { type: 'number' },
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
      const { programaId } = req.params as { programaId: string };

      // Validate parameter
      const paramValidation = ProgramaIdParamSchema.safeParse({ programaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateProgramaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const updateProgramaCommand = req.diScope.resolve<UpdateProgramaCommand>('updateProgramaCommand');
        const programa = await updateProgramaCommand.execute({
          programaId: paramValidation.data.programaId,
          nombre: parsed.data.nombre,
          descripcion: parsed.data.descripcion,
          userId
        }, tx);
        return reply.send(ok(programa));
      } catch (error: any) {
        return handleProgramaError(error, reply);
      }
    });
  });

  // Eliminar programa (requiere admin)
  app.delete('/programas/:programaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete program',
      tags: ['programas'],
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
      const { programaId } = req.params as { programaId: string };

      // Validate parameter
      const paramValidation = ProgramaIdParamSchema.safeParse({ programaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const deleteProgramaCommand = req.diScope.resolve<DeleteProgramaCommand>('deleteProgramaCommand');
        const deletedId = await deleteProgramaCommand.execute({
          programaId: paramValidation.data.programaId
        }, tx);
        return reply.send(ok({ id: deletedId }));
      } catch (error: any) {
        return handleProgramaError(error, reply);
      }
    });
  });
}