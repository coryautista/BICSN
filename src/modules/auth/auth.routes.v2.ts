import { FastifyInstance } from 'fastify';
import { ok, fail } from '../../utils/http.js';
import { LoginSchema } from './auth.schemas.js';
import type { LoginCommand } from './application/commands/LoginCommand.js';
import { handleAuthError } from './infrastructure/errorHandler.js';

function setCookie(reply: any, name: string, value: string, path: string) {
  const host = reply.request.hostname;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';
  const isDevTunnel = host.endsWith('.devtunnels.ms');

  reply.setCookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path,
    domain: (isLocalhost || isDevTunnel) ? undefined : process.env.COOKIE_DOMAIN,
    ...(name === 'access_token' && { maxAge: 15 * 60 * 1000 })
  });
}

/**
 * Rutas de autenticación versionadas (v2.0.0)
 * Incluye mejoras adicionales como metadata y mejor manejo de errores
 */
export default async function authRoutesV2(app: FastifyInstance) {
  
  // Login v2.0.0 - Versión mejorada con metadata adicional
  app.route({
    method: 'POST',
    url: '/auth/login',
    constraints: { version: '2.0.0' },
    schema: {
      description: 'Login user (v2.0.0 - Enhanced with metadata)',
      tags: ['auth'],
      headers: {
        type: 'object',
        properties: {
          'Accept-Version': { type: 'string', enum: ['2.0.0'] }
        }
      },
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
                username: { type: 'string' },
                accessToken: { type: 'string' },
                accessExp: { type: 'number' },
                // Campos adicionales en v2
                metadata: {
                  type: 'object',
                  properties: {
                    version: { type: 'string' },
                    loginTime: { type: 'string' },
                    ipAddress: { type: 'string' }
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
    },
    handler: async (req, reply) => {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(fail(parsed.error.message));
      }

      try {
        const ip = req.ip;
        const ua = req.headers['user-agent'] as string | undefined;
        
        // Resolve LoginCommand from DI container
        const loginCommand = req.diScope.resolve<LoginCommand>('loginCommand');
        const { userId, username, accessToken, accessExp, refreshToken } =
          await loginCommand.execute({
            usernameOrEmail: parsed.data.usernameOrEmail,
            password: parsed.data.password,
            ip,
            userAgent: ua
          });

        setCookie(reply, 'refresh_token', refreshToken, '/v1/auth');
        setCookie(reply, 'access_token', accessToken, '/');
        
        // Respuesta v2 con metadata adicional
        return reply.send(ok({ 
          userId, 
          username, 
          accessToken, 
          accessExp,
          metadata: {
            version: '2.0.0',
            loginTime: new Date().toISOString(),
            ipAddress: ip
          }
        }));
      } catch (error) {
        return handleAuthError(error, reply);
      }
    }
  });

  app.log.info('Auth routes v2.0.0 registered');
}
