import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { CreateDependenciaSchema, UpdateDependenciaSchema, DependenciaIdParamSchema, TipoDependenciaParamSchema } from './dependencia.schemas.js';
import { ok, validationError } from '../../../utils/http.js';
import { withDbContext } from '../../../db/context.js';
import { handleDependenciaError } from './infrastructure/errorHandler.js';
import { GetAllDependenciasQuery } from './application/queries/GetAllDependenciasQuery.js';
import { GetDependenciaByIdQuery } from './application/queries/GetDependenciaByIdQuery.js';
import { GetDependenciasByTipoQuery } from './application/queries/GetDependenciasByTipoQuery.js';
import { GetDependenciasHijasQuery } from './application/queries/GetDependenciasHijasQuery.js';
import { GetDependenciaWithHijasQuery } from './application/queries/GetDependenciaWithHijasQuery.js';
import { CreateDependenciaCommand } from './application/commands/CreateDependenciaCommand.js';
import { UpdateDependenciaCommand } from './application/commands/UpdateDependenciaCommand.js';
import { DeleteDependenciaCommand } from './application/commands/DeleteDependenciaCommand.js';

export default async function dependenciaRoutes(app: FastifyInstance) {

  // Listar todas las dependencias (requiere auth)
  app.get('/dependencias', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all dependencies',
      tags: ['dependencias'],
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
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  tipoDependencia: { type: 'string' },
                  idDependenciaPadre: { type: 'number' },
                  claveDependencia: { type: 'string' },
                  responsable: { type: 'string' },
                  telefono: { type: 'string' },
                  email: { type: 'string' },
                  esActiva: { type: 'boolean' },
                  dependenciaPadre: {
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
      const getAllDependenciasQuery = req.diScope.resolve<GetAllDependenciasQuery>('getAllDependenciasQuery');
      const dependencias = await getAllDependenciasQuery.execute();
      return reply.send(ok(dependencias));
    } catch (error: any) {
      return handleDependenciaError(error, reply);
    }
  });

  // Listar dependencias por tipo (requiere auth)
  app.get('/dependencias/tipo/:tipoDependencia', {
    preHandler: [requireAuth],
    schema: {
      description: 'List dependencies by type',
      tags: ['dependencias'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          tipoDependencia: {
            type: 'string',
            enum: ['SECRETARIA', 'DIRECCION_GENERAL', 'DIRECCION', 'DEPARTAMENTO', 'UNIDAD', 'OFICINA']
          }
        },
        required: ['tipoDependencia']
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
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  tipoDependencia: { type: 'string' },
                  idDependenciaPadre: { type: 'number' },
                  claveDependencia: { type: 'string' },
                  responsable: { type: 'string' },
                  telefono: { type: 'string' },
                  email: { type: 'string' },
                  esActiva: { type: 'boolean' },
                  dependenciaPadre: {
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
    const { tipoDependencia } = req.params as { tipoDependencia: string };

    const paramValidation = TipoDependenciaParamSchema.safeParse({ tipoDependencia });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getDependenciasByTipoQuery = req.diScope.resolve<GetDependenciasByTipoQuery>('getDependenciasByTipoQuery');
      const dependencias = await getDependenciasByTipoQuery.execute(paramValidation.data.tipoDependencia);
      return reply.send(ok(dependencias));
    } catch (error: any) {
      return handleDependenciaError(error, reply);
    }
  });

  // Listar dependencias hijas (requiere auth)
  app.get('/dependencias/:dependenciaId/hijas', {
    preHandler: [requireAuth],
    schema: {
      description: 'List child dependencies',
      tags: ['dependencias'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dependenciaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['dependenciaId']
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
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  tipoDependencia: { type: 'string' },
                  idDependenciaPadre: { type: 'number' },
                  claveDependencia: { type: 'string' },
                  responsable: { type: 'string' },
                  telefono: { type: 'string' },
                  email: { type: 'string' },
                  esActiva: { type: 'boolean' },
                  dependenciaPadre: {
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
    const { dependenciaId } = req.params as { dependenciaId: string };

    // Validate parameter
    const paramValidation = DependenciaIdParamSchema.safeParse({ dependenciaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getDependenciasHijasQuery = req.diScope.resolve<GetDependenciasHijasQuery>('getDependenciasHijasQuery');
      const dependencias = await getDependenciasHijasQuery.execute(paramValidation.data.dependenciaId);
      return reply.send(ok(dependencias));
    } catch (error: any) {
      return handleDependenciaError(error, reply);
    }
  });

  // Obtener dependencia por ID (requiere auth)
  app.get('/dependencias/:dependenciaId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get dependency by ID',
      tags: ['dependencias'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dependenciaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['dependenciaId']
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
                tipoDependencia: { type: 'string' },
                idDependenciaPadre: { type: 'number' },
                claveDependencia: { type: 'string' },
                responsable: { type: 'string' },
                telefono: { type: 'string' },
                email: { type: 'string' },
                esActiva: { type: 'boolean' },
                dependenciaPadre: {
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
    const { dependenciaId } = req.params as { dependenciaId: string };

    // Validate parameter
    const paramValidation = DependenciaIdParamSchema.safeParse({ dependenciaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getDependenciaByIdQuery = req.diScope.resolve<GetDependenciaByIdQuery>('getDependenciaByIdQuery');
      const dependencia = await getDependenciaByIdQuery.execute(paramValidation.data.dependenciaId);
      return reply.send(ok(dependencia));
    } catch (error: any) {
      return handleDependenciaError(error, reply);
    }
  });

  // Obtener dependencia con hijas (requiere auth)
  app.get('/dependencias/:dependenciaId/completa', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get dependency with child dependencies',
      tags: ['dependencias'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dependenciaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['dependenciaId']
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
                tipoDependencia: { type: 'string' },
                idDependenciaPadre: { type: 'number' },
                claveDependencia: { type: 'string' },
                responsable: { type: 'string' },
                telefono: { type: 'string' },
                email: { type: 'string' },
                esActiva: { type: 'boolean' },
                dependenciaPadre: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    nombre: { type: 'string' }
                  }
                },
                dependenciasHijas: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' },
                      descripcion: { type: 'string' },
                      tipoDependencia: { type: 'string' },
                      claveDependencia: { type: 'string' },
                      responsable: { type: 'string' },
                      telefono: { type: 'string' },
                      email: { type: 'string' },
                      esActiva: { type: 'boolean' }
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
    const { dependenciaId } = req.params as { dependenciaId: string };

    // Validate parameter
    const paramValidation = DependenciaIdParamSchema.safeParse({ dependenciaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getDependenciaWithHijasQuery = req.diScope.resolve<GetDependenciaWithHijasQuery>('getDependenciaWithHijasQuery');
      const dependencia = await getDependenciaWithHijasQuery.execute(paramValidation.data.dependenciaId);
      return reply.send(ok(dependencia));
    } catch (error: any) {
      return handleDependenciaError(error, reply);
    }
  });

  // Crear dependencia (requiere admin)
  app.post('/dependencias', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new dependency',
      tags: ['dependencias'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre', 'descripcion', 'tipoDependencia', 'claveDependencia'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 200 },
          descripcion: { type: 'string', minLength: 1, maxLength: 1000 },
          tipoDependencia: { type: 'string', enum: ['SECRETARIA', 'DIRECCION_GENERAL', 'DIRECCION', 'DEPARTAMENTO', 'UNIDAD', 'OFICINA'] },
          idDependenciaPadre: { type: 'number', minimum: 1 },
          claveDependencia: { type: 'string', minLength: 1, maxLength: 20 },
          responsable: { type: 'string', maxLength: 200 },
          telefono: { type: 'string', maxLength: 50 },
          email: { type: 'string', format: 'email' },
          esActiva: { type: 'boolean' }
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
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                tipoDependencia: { type: 'string' },
                claveDependencia: { type: 'string' },
                idDependenciaPadre: { type: 'number' },
                responsable: { type: 'string' },
                telefono: { type: 'string' },
                email: { type: 'string' },
                esActiva: { type: 'boolean' }
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
      const parsed = CreateDependenciaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const createDependenciaCommand = req.diScope.resolve<CreateDependenciaCommand>('createDependenciaCommand');
        const dependencia = await createDependenciaCommand.execute({
          nombre: parsed.data.nombre,
          descripcion: parsed.data.descripcion,
          tipoDependencia: parsed.data.tipoDependencia,
          claveDependencia: parsed.data.claveDependencia,
          idDependenciaPadre: parsed.data.idDependenciaPadre,
          responsable: parsed.data.responsable,
          telefono: parsed.data.telefono,
          email: parsed.data.email,
          esActiva: parsed.data.esActiva,
          userId
        }, tx);
        return reply.code(201).send(ok(dependencia));
      } catch (error: any) {
        return handleDependenciaError(error, reply);
      }
    });
  });

  // Actualizar dependencia (requiere admin)
  app.put('/dependencias/:dependenciaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update dependency',
      tags: ['dependencias'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dependenciaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['dependenciaId']
      },
      body: {
        type: 'object',
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 200 },
          descripcion: { type: 'string', minLength: 1, maxLength: 1000 },
          tipoDependencia: { type: 'string', enum: ['SECRETARIA', 'DIRECCION_GENERAL', 'DIRECCION', 'DEPARTAMENTO', 'UNIDAD', 'OFICINA'] },
          idDependenciaPadre: { type: 'number', minimum: 1 },
          claveDependencia: { type: 'string', minLength: 1, maxLength: 20 },
          responsable: { type: 'string', maxLength: 200 },
          telefono: { type: 'string', maxLength: 50 },
          email: { type: 'string', format: 'email' },
          esActiva: { type: 'boolean' }
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
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                tipoDependencia: { type: 'string' },
                claveDependencia: { type: 'string' },
                idDependenciaPadre: { type: 'number' },
                responsable: { type: 'string' },
                telefono: { type: 'string' },
                email: { type: 'string' },
                esActiva: { type: 'boolean' }
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
      const { dependenciaId } = req.params as { dependenciaId: string };

      // Validate parameter
      const paramValidation = DependenciaIdParamSchema.safeParse({ dependenciaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateDependenciaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const updateDependenciaCommand = req.diScope.resolve<UpdateDependenciaCommand>('updateDependenciaCommand');
        const dependencia = await updateDependenciaCommand.execute({
          dependenciaId: paramValidation.data.dependenciaId,
          nombre: parsed.data.nombre,
          descripcion: parsed.data.descripcion,
          tipoDependencia: parsed.data.tipoDependencia,
          claveDependencia: parsed.data.claveDependencia,
          idDependenciaPadre: parsed.data.idDependenciaPadre,
          responsable: parsed.data.responsable,
          telefono: parsed.data.telefono,
          email: parsed.data.email,
          esActiva: parsed.data.esActiva,
          userId
        }, tx);
        return reply.send(ok(dependencia));
      } catch (error: any) {
        return handleDependenciaError(error, reply);
      }
    });
  });

  // Eliminar dependencia (requiere admin)
  app.delete('/dependencias/:dependenciaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete dependency',
      tags: ['dependencias'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dependenciaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['dependenciaId']
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
      const { dependenciaId } = req.params as { dependenciaId: string };

      // Validate parameter
      const paramValidation = DependenciaIdParamSchema.safeParse({ dependenciaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const deleteDependenciaCommand = req.diScope.resolve<DeleteDependenciaCommand>('deleteDependenciaCommand');
        const deletedId = await deleteDependenciaCommand.execute({
          dependenciaId: paramValidation.data.dependenciaId
        }, tx);
        return reply.send(ok({ id: deletedId }));
      } catch (error: any) {
        return handleDependenciaError(error, reply);
      }
    });
  });
}