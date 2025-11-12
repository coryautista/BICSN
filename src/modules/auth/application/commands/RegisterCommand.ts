import { IAuthRepository } from '../../domain/repositories/IAuthRepository.js';
import { CreateUserData } from '../../domain/entities/User.js';
import { hashPassword } from '../../infrastructure/security/crypto.js';
import {
  UserAlreadyExistsError,
  InvalidRegistrationDataError,
  WeakPasswordError
} from '../../domain/errors.js';

// Logger básico para comandos (se puede mejorar con inyección de dependencias)
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '')
};

export interface RegisterInput {
  username: string;
  email?: string;
  password: string;
  displayName?: string;
  photoPath?: string;
  idOrganica0?: number;
  idOrganica1?: number;
  idOrganica2?: number;
  idOrganica3?: number;
}

export interface RegisterOutput {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  photoPath: string | null;
  idOrganica0: string | null;
  idOrganica1: string | null;
  idOrganica2: string | null;
  idOrganica3: string | null;
}

export class RegisterCommand {
  constructor(private authRepo: IAuthRepository) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    try {
      logger.info('Iniciando proceso de registro de usuario', {
        username: input.username,
        hasEmail: !!input.email,
        hasDisplayName: !!input.displayName,
        hasPhotoPath: !!input.photoPath,
        hasOrganicaData: !!(input.idOrganica0 || input.idOrganica1 || input.idOrganica2 || input.idOrganica3)
      });

      // Validar entrada básica
      if (!input.username || input.username.trim().length === 0) {
        throw new InvalidRegistrationDataError('El nombre de usuario es requerido');
      }

      if (!input.password || input.password.length < 8) {
        throw new WeakPasswordError({ passwordLength: input.password?.length || 0 });
      }

      // Verificar si el usuario ya existe
      const existingUser = await this.authRepo.findUserByUsernameOrEmail(input.username);
      if (existingUser) {
        logger.warn('Intento de registro con usuario existente', {
          username: input.username,
          existingUserId: existingUser.id
        });
        throw new UserAlreadyExistsError(input.username, 'username');
      }

      // Verificar email si se proporciona
      if (input.email) {
        const existingEmailUser = await this.authRepo.findUserByUsernameOrEmail(input.email);
        if (existingEmailUser) {
          logger.warn('Intento de registro con email existente', {
            email: input.email,
            existingUserId: existingEmailUser.id
          });
          throw new UserAlreadyExistsError(input.email, 'email');
        }
      }

      // 1. Hash password
      logger.debug('Generando hash de contraseña para nuevo usuario');
      const { hash, algo } = await hashPassword(input.password);

      // 2. Prepare user data
      const userData: CreateUserData = {
        username: input.username,
        email: input.email ?? null,
        passwordHash: hash,
        passwordAlgo: algo,
        displayName: input.displayName ?? null,
        photoPath: input.photoPath ?? null,
        idOrganica0: input.idOrganica0 ?? null,
        idOrganica1: input.idOrganica1 ?? null,
        idOrganica2: input.idOrganica2 ?? null,
        idOrganica3: input.idOrganica3 ?? null
      };

      // 3. Create user
      logger.debug('Creando usuario en base de datos');
      const user = await this.authRepo.createUser(userData);

      logger.info('Usuario registrado exitosamente', {
        userId: user.id,
        username: user.username,
        email: user.email
      });

      // 4. Return safe user data
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        photoPath: user.photoPath,
        idOrganica0: user.idOrganica0,
        idOrganica1: user.idOrganica1,
        idOrganica2: user.idOrganica2,
        idOrganica3: user.idOrganica3
      };

    } catch (error) {
      if (error instanceof UserAlreadyExistsError || error instanceof InvalidRegistrationDataError || error instanceof WeakPasswordError) {
        throw error;
      }

      logger.error('Error durante el registro de usuario', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        username: input.username,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new InvalidRegistrationDataError('Error interno durante el registro');
    }
  }
}
