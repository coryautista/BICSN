import { FastifyInstance } from 'fastify';
import { ok, fail } from '../../utils/http.js';
import { RegisterSchema, LoginSchema } from './auth.schemas.js';
import { register, login, rotateRefresh, denylistAccessToken } from './auth.service.js';
import { requireAuth } from './auth.middleware.js';

function setRefreshCookie(reply: any, refreshPlain: string, secure: boolean, domain: string) {
  reply.setCookie('refresh_token', refreshPlain, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'strict' : 'lax',
    path: '/api/auth',
    domain
  });
}

export default async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', {
    schema: {
      description: 'Register a new user',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 }
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
                id: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' }
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
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));
    try {
      const u = await register(parsed.data.username, parsed.data.email, parsed.data.password);
      return reply.code(201).send(ok({ id: u.id, username: u.username, email: u.email }));
    } catch (e: any) {
      return reply.code(500).send(fail(e.message || 'REGISTER_FAILED'));
    }
  });

  app.post('/auth/login', {
    schema: {
      description: 'Login user',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['usernameOrEmail', 'password'],
        properties: {
          usernameOrEmail: { type: 'string', minLength: 3 },
          password: { type: 'string', minLength: 8 }
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
                userId: { type: 'string' },
                accessToken: { type: 'string' },
                accessExp: { type: 'number' }
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
        401: {
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
        423: {
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
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));
    try {
      const ip = req.ip;
      const ua = req.headers['user-agent'] as string | undefined;
      const { userId, accessToken, accessExp, refreshToken } =
        await login(parsed.data.usernameOrEmail, parsed.data.password, ip, ua);

      setRefreshCookie(reply, refreshToken, app.config.cookie.secure, app.config.cookie.domain);
      return reply.send(ok({ userId, accessToken, accessExp }));
    } catch (e: any) {
      app.log.error(e);
      const msg = e.message;
      if (msg === 'INVALID_CREDENTIALS') return reply.code(401).send(fail(msg, 'UNAUTHORIZED'));
      if (msg === 'LOCKED_OUT') return reply.code(423).send(fail(msg, 'LOCKED'));
      return reply.code(500).send(fail('LOGIN_FAILED'));
    }
  });

  app.post('/auth/refresh', {
    schema: {
      description: 'Refresh access token',
      tags: ['auth'],
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                rotated: { type: 'boolean' }
              }
            }
          }
        },
        401: {
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
    const token = (req.cookies?.refresh_token as string | undefined);
    if (!token) return reply.code(401).send(fail('No refresh token', 'UNAUTHORIZED'));
    try {
      const ip = req.ip;
      const ua = req.headers['user-agent'] as string | undefined;
      const newPlain = await rotateRefresh(token, ip, ua);
      setRefreshCookie(reply, newPlain, app.config.cookie.secure, app.config.cookie.domain);
      return reply.send(ok({ rotated: true }));
    } catch {
      return reply.code(401).send(fail('Invalid or expired refresh token', 'UNAUTHORIZED'));
    }
  });

  app.post('/auth/logout', {
    preHandler: [requireAuth],
    schema: {
      description: 'Logout user',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (req: any, reply) => {
    if (req.user?.jti && req.user?.exp) {
      await denylistAccessToken(req.user.jti, req.user.sub, req.user.exp);
    }
    reply.clearCookie('refresh_token', { path: '/api/auth', domain: app.config.cookie.domain });
    return reply.send(ok({}));
  });

  app.get('/me', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get current user info',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                sub: { type: 'string' },
                roles: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (req: any) => {
    return ok({ sub: req.user.sub, roles: req.user.roles });
  });
}
// Auth routes