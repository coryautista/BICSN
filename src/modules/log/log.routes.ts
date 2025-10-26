import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import {
  GetLogStatsSchema,
  GetLogContentSchema,
  SearchLogsSchema,
  CleanupLogsSchema,
  ArchiveLogsSchema
} from './log.schemas.js';
import {
  getLogStats,
  getLogContent,
  searchLogs,
  cleanupLogs,
  archiveLogs
} from './log.service.js';
import { ok, fail } from '../../utils/http.js';

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
  }, async (_req, reply) => {
    try {
      const stats = await getLogStats();
      return reply.send(ok(stats));
    } catch (error: any) {
      console.error('Error getting log stats:', error);
      return reply.code(500).send(fail('LOG_STATS_FAILED'));
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
      const content = await getLogContent(fileName, lines);
      if (!content.content && content.totalLines === 0) {
        return reply.code(404).send(fail('LOG_FILE_NOT_FOUND'));
      }
      return reply.send(ok(content));
    } catch (error: any) {
      console.error('Error getting log content:', error);
      return reply.code(500).send(fail('LOG_CONTENT_FAILED'));
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
      const results = await searchLogs(parsed.data.searchTerm, parsed.data.maxResults);
      return reply.send(ok(results));
    } catch (error: any) {
      console.error('Error searching logs:', error);
      return reply.code(500).send(fail('LOG_SEARCH_FAILED'));
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
      const result = await cleanupLogs(parsed.data.maxAgeDays, parsed.data.maxFiles);
      return reply.send(ok(result));
    } catch (error: any) {
      console.error('Error cleaning up logs:', error);
      return reply.code(500).send(fail('LOG_CLEANUP_FAILED'));
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
      const result = await archiveLogs(parsed.data.archiveDir);
      return reply.send(ok(result));
    } catch (error: any) {
      console.error('Error archiving logs:', error);
      return reply.code(500).send(fail('LOG_ARCHIVE_FAILED'));
    }
  });
}