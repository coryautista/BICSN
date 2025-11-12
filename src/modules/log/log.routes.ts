import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { SearchLogsSchema, CleanupLogsSchema, ArchiveLogsSchema } from './log.schemas.js';
import { ok, fail } from '../../utils/http.js';
import { handleLogError } from './infrastructure/errorHandler.js';
import type { GetLogStatsQuery } from './application/queries/GetLogStatsQuery.js';
import type { GetLogContentQuery } from './application/queries/GetLogContentQuery.js';
import type { SearchLogsQuery } from './application/queries/SearchLogsQuery.js';
import type { CleanupLogsCommand } from './application/commands/CleanupLogsCommand.js';
import type { ArchiveLogsCommand } from './application/commands/ArchiveLogsCommand.js';

// [ADMIN] Routes for log management operations
export default async function logRoutes(app: FastifyInstance) {

  // GET /logs/stats - Get log statistics (admin only)
  app.get('/logs/stats', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Get log files statistics',
      tags: ['logs', 'admin'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalFiles: { type: 'number' },
                totalSize: { type: 'number' },
                oldestFile: { type: ['string', 'null'] },
                newestFile: { type: ['string', 'null'] },
                files: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      size: { type: 'number' },
                      created: { type: 'string', format: 'date-time' },
                      modified: { type: 'string', format: 'date-time' }
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
      const getLogStatsQuery = req.diScope.resolve<GetLogStatsQuery>('getLogStatsQuery');
      const userId = req.user?.sub;
      const stats = await getLogStatsQuery.execute(userId);
      return reply.send(ok(stats));
    } catch (error: any) {
      return handleLogError(error, reply);
    }
  });

  // GET /logs/content/:fileName - Get log file content (admin only)
  app.get('/logs/content/:fileName', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Get log file content',
      tags: ['logs', 'admin'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['fileName'],
        properties: {
          fileName: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          lines: { type: 'number', minimum: 1, maximum: 1000, default: 100 }
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
                content: { type: 'string' },
                totalLines: { type: 'number' },
                hasMore: { type: 'boolean' }
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
    const { fileName } = req.params as { fileName: string };
    const { lines = 100 } = req.query as { lines?: number };

    try {
      const getLogContentQuery = req.diScope.resolve<GetLogContentQuery>('getLogContentQuery');
      const userId = req.user?.sub;
      const content = await getLogContentQuery.execute({ fileName, lines }, userId);
      return reply.send(ok(content));
    } catch (error: any) {
      return handleLogError(error, reply);
    }
  });

  // POST /logs/search - Search logs (admin only)
  app.post('/logs/search', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Search log files for specific terms',
      tags: ['logs', 'admin'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['searchTerm'],
        properties: {
          searchTerm: { type: 'string', minLength: 1 },
          maxResults: { type: 'number', minimum: 1, maximum: 1000, default: 100 }
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
                  file: { type: 'string' },
                  line: { type: 'number' },
                  content: { type: 'string' },
                  timestamp: { type: 'string' }
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
                code: { type: 'boolean' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    const parsed = SearchLogsSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const searchLogsQuery = req.diScope.resolve<SearchLogsQuery>('searchLogsQuery');
      const userId = req.user?.sub;
      const results = await searchLogsQuery.execute({
        searchTerm: parsed.data.searchTerm,
        maxResults: parsed.data.maxResults
      }, userId);
      return reply.send(ok(results));
    } catch (error: any) {
      return handleLogError(error, reply);
    }
  });

  // POST /logs/cleanup - Cleanup old log files (admin only)
  app.post('/logs/cleanup', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Cleanup old log files',
      tags: ['logs', 'admin'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          maxAgeDays: { type: 'number', minimum: 1, maximum: 365, default: 30 },
          maxFiles: { type: 'number', minimum: 1, maximum: 100, default: 50 }
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
                deletedFiles: {
                  type: 'array',
                  items: { type: 'string' }
                },
                totalDeleted: { type: 'number' }
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
    const parsed = CleanupLogsSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const cleanupLogsCommand = req.diScope.resolve<CleanupLogsCommand>('cleanupLogsCommand');
      const result = await cleanupLogsCommand.execute({
        maxAgeDays: parsed.data.maxAgeDays,
        maxFiles: parsed.data.maxFiles
      });
      return reply.send(ok(result));
    } catch (error: any) {
      return handleLogError(error, reply);
    }
  });

  // POST /logs/archive - Archive log files (admin only)
  app.post('/logs/archive', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Archive log files to separate directory',
      tags: ['logs', 'admin'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          archiveDir: { type: 'string' }
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
                archivedFiles: {
                  type: 'array',
                  items: { type: 'string' }
                },
                totalArchived: { type: 'number' }
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
    const parsed = ArchiveLogsSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(fail(parsed.error.message));
    }

    try {
      const archiveLogsCommand = req.diScope.resolve<ArchiveLogsCommand>('archiveLogsCommand');
      const result = await archiveLogsCommand.execute({
        archiveDir: parsed.data.archiveDir
      });
      return reply.send(ok(result));
    } catch (error: any) {
      return handleLogError(error, reply);
    }
  });
}