import { IAuthRepository } from '../../domain/repositories/IAuthRepository.js';
import { verifyPassword } from '../../infrastructure/security/crypto.js';
import { signAccessToken, generateRefreshToken } from '../../infrastructure/security/jwt.js';
import {
  InvalidCredentialsError,
  AccountLockedError,
  LoginFailedError,
  RateLimitExceededError
} from '../../domain/errors.js';

// Logger básico para comandos
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '')
};

export interface LoginInput {
  usernameOrEmail: string;
  password: string;
  ip?: string;
  userAgent?: string;
}

export interface LoginOutput {
  userId: string;
  username: string;
  accessToken: string;
  refreshToken: string;
  accessExp: number;
}

export class LoginCommand {
  constructor(private authRepo: IAuthRepository) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    try {
      logger.info('Iniciando proceso de autenticación', {
        identifier: input.usernameOrEmail,
        hasIp: !!input.ip,
        hasUserAgent: !!input.userAgent
      });

      // Validar entrada básica
      if (!input.usernameOrEmail || input.usernameOrEmail.trim().length === 0) {
        throw new InvalidCredentialsError({ reason: 'identifier_missing' });
      }

      if (!input.password || input.password.length === 0) {
        throw new InvalidCredentialsError({ reason: 'password_missing' });
      }

      // 1. Find user
      logger.debug('Buscando usuario en base de datos');
      const user = await this.authRepo.findUserByUsernameOrEmail(input.usernameOrEmail);
      if (!user) {
        logger.warn('Intento de login con usuario inexistente', {
          identifier: input.usernameOrEmail,
          ip: input.ip,
          userAgent: input.userAgent
        });
        throw new InvalidCredentialsError({ reason: 'user_not_found' });
      }

      // 2. Check lockout
      if (user.isLockedOut && user.lockoutEndAt && user.lockoutEndAt > new Date()) {
        logger.warn('Intento de login en cuenta bloqueada', {
          userId: user.id,
          username: user.username,
          lockoutEnd: user.lockoutEndAt.toISOString(),
          ip: input.ip,
          userAgent: input.userAgent
        });
        throw new AccountLockedError(user.id, user.lockoutEndAt, {
          remainingTime: Math.ceil((user.lockoutEndAt.getTime() - Date.now()) / 1000 / 60)
        });
      }

      // 3. Verify password
      logger.debug('Verificando contraseña');
      const isValid = await verifyPassword(user.passwordHash, input.password, user.passwordAlgo);
      if (!isValid) {
        logger.warn('Intento de login con contraseña incorrecta', {
          userId: user.id,
          username: user.username,
          ip: input.ip,
          userAgent: input.userAgent
        });

        // Registrar intento fallido
        await this.authRepo.registerFailedLogin(user.id);

        // Verificar límite de intentos fallidos (lógica simplificada)
        // En una implementación completa, esto debería estar en el repositorio
        const recentFailedLogins = 1; // Placeholder - debería obtenerse del repo
        if (recentFailedLogins >= 5) {
          logger.warn('Múltiples intentos fallidos de login detectados', {
            userId: user.id,
            username: user.username,
            failedAttempts: recentFailedLogins
          });
          throw new RateLimitExceededError(user.username, 5, 15 * 60 * 1000); // 5 intentos por 15 minutos
        }

        throw new InvalidCredentialsError({ reason: 'invalid_password' });
      }

      // 4. Get roles
      logger.debug('Obteniendo roles del usuario');
      const roles = await this.authRepo.getUserRoles(user.id);
      const roleNames = roles.map(r => r.name);
      const isEntidades = roles.map(r => r.isEntidad);

      // 5. Generate tokens
      logger.debug('Generando tokens de acceso');
      const accessTokenData = signAccessToken(
        user.id,
        roleNames,
        isEntidades,
        user.idOrganica0,
        user.idOrganica1,
        user.idOrganica2,
        user.idOrganica3
      );

      const { token: refreshToken, hash: refreshHash, ttlMinutes } = generateRefreshToken();

      // 6. Store refresh token
      logger.debug('Almacenando token de refresh');
      await this.authRepo.issueRefreshToken(
        user.id,
        refreshHash,
        ttlMinutes,
        input.ip,
        input.userAgent
      );

      // 7. Register successful login
      await this.authRepo.registerSuccessfulLogin(user.id);

      logger.info('Login exitoso', {
        userId: user.id,
        username: user.username,
        roles: roleNames,
        ip: input.ip,
        userAgent: input.userAgent
      });

      return {
        userId: user.id,
        username: user.username,
        accessToken: accessTokenData.token,
        refreshToken,
        accessExp: accessTokenData.exp
      };

    } catch (error) {
      if (error instanceof InvalidCredentialsError ||
          error instanceof AccountLockedError ||
          error instanceof RateLimitExceededError) {
        throw error;
      }

      logger.error('Error durante el proceso de login', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        identifier: input.usernameOrEmail,
        ip: input.ip,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new LoginFailedError('Error interno durante la autenticación');
    }
  }
}
