import { IUsuariosRepository } from '../../domain/repositories/IUsuariosRepository.js';
import { Usuario, CreateUsuarioData } from '../../domain/entities/Usuario.js';
import { hashPassword } from '../../../auth/infrastructure/security/crypto.js';
import { IUserRoleRepository } from '../../../userRole/domain/repositories/IUserRoleRepository.js';
import {
  UsuarioAlreadyExistsError,
  UsuarioInvalidEmailError,
  UsuarioInvalidUsernameError,
  UsuarioInvalidPasswordError,
  UsuarioInvalidNameError,
  UsuarioInvalidRoleError
} from '../../domain/errors.js';

export interface CreateUsuarioInput {
  username: string;
  email?: string;
  password: string;
  displayName?: string;
  photoPath?: string;
  idOrganica0?: number;
  idOrganica1?: number;
  idOrganica2?: number;
  idOrganica3?: number;
  roleId?: string;
}

export class CreateUsuarioCommand {
  constructor(
    private usuariosRepo: IUsuariosRepository,
    private userRoleRepo: IUserRoleRepository
  ) {}

  async execute(input: CreateUsuarioInput, userId?: string): Promise<Usuario> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] Iniciando creación de usuario`, {
      username: input.username,
      email: input.email,
      hasDisplayName: !!input.displayName,
      hasRole: !!input.roleId,
      userId: userId || 'anonymous'
    });

    // 1. Validar username
    this.validateUsername(input.username);

    // 2. Validar email si está presente
    if (input.email) {
      this.validateEmail(input.email);
    }

    // 3. Validar password
    this.validatePassword(input.password);

    // 4. Validar displayName si está presente
    if (input.displayName) {
      this.validateDisplayName(input.displayName);
    }

    // 5. Validar rol si está presente
    if (input.roleId) {
      await this.validateRole(input.roleId, userId);
    }

    try {
      // 6. Verificar unicidad de username
      const existingUsername = await this.usuariosRepo.findByUsername(input.username);
      if (existingUsername) {
        throw new UsuarioAlreadyExistsError('username', input.username);
      }

      // 7. Verificar unicidad de email si está presente
      if (input.email) {
        const existingEmail = await this.usuariosRepo.findByEmail(input.email);
        if (existingEmail) {
          throw new UsuarioAlreadyExistsError('email', input.email);
        }
      }

      // 8. Hash password
      const { hash, algo } = await hashPassword(input.password);

      // 9. Preparar datos del usuario
      const userData: CreateUsuarioData = {
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

      // 10. Crear usuario
      const usuario = await this.usuariosRepo.create(userData);

      console.log(`[${timestamp}] Usuario creado exitosamente`, {
        usuarioId: usuario.id,
        username: usuario.username,
        email: usuario.email,
        userId: userId || 'anonymous'
      });

      // 11. Asignar rol si está presente
      if (input.roleId) {
        try {
          await this.userRoleRepo.create(usuario.id, input.roleId);
          console.log(`[${timestamp}] Rol asignado exitosamente`, {
            usuarioId: usuario.id,
            roleId: input.roleId,
            userId: userId || 'anonymous'
          });
        } catch (roleError: any) {
          console.error(`[${timestamp}] Error asignando rol al usuario`, {
            usuarioId: usuario.id,
            roleId: input.roleId,
            error: roleError.message,
            userId: userId || 'anonymous'
          });
          // No fallar la creación del usuario si falla la asignación del rol
          // El rol puede ser asignado posteriormente
        }
      }

      return usuario;

    } catch (error: any) {
      console.error(`[${timestamp}] Error creando usuario`, {
        username: input.username,
        email: input.email,
        error: error.message,
        userId: userId || 'anonymous'
      });
      throw error;
    }
  }

  private validateUsername(username: string): void {
    if (!username || typeof username !== 'string') {
      throw new UsuarioInvalidUsernameError(username || 'undefined');
    }

    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 50) {
      throw new UsuarioInvalidUsernameError(username);
    }

    // Solo letras, números y guiones bajos
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmed)) {
      throw new UsuarioInvalidUsernameError(username);
    }
  }

  private validateEmail(email: string): void {
    if (!email || typeof email !== 'string') {
      throw new UsuarioInvalidEmailError(email || 'undefined');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new UsuarioInvalidEmailError(email);
    }
  }

  private validatePassword(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new UsuarioInvalidPasswordError();
    }

    // Mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un símbolo
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new UsuarioInvalidPasswordError();
    }
  }

  private validateDisplayName(displayName: string): void {
    if (!displayName || typeof displayName !== 'string') {
      throw new UsuarioInvalidNameError('displayName', displayName || 'undefined');
    }

    const trimmed = displayName.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      throw new UsuarioInvalidNameError('displayName', displayName);
    }
  }

  private async validateRole(roleId: string, userId?: string): Promise<void> {
    if (!roleId || typeof roleId !== 'string') {
      throw new UsuarioInvalidRoleError(roleId || 'undefined');
    }

    // Aquí podríamos validar que el rol existe en la base de datos
    // Por ahora solo validamos el formato básico
    const trimmed = roleId.trim();
    if (trimmed.length === 0) {
      throw new UsuarioInvalidRoleError(roleId);
    }

    console.log(`[${new Date().toISOString()}] Validando rol para usuario`, {
      roleId: trimmed,
      userId: userId || 'anonymous'
    });
  }
}
