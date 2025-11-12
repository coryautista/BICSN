import { IUsuariosRepository } from '../../domain/repositories/IUsuariosRepository.js';
import { Usuario, UpdateUsuarioData } from '../../domain/entities/Usuario.js';
import {
  UsuarioNotFoundError,
  UsuarioAlreadyExistsError,
  UsuarioInvalidEmailError,
  UsuarioInvalidNameError,
  UsuarioInvalidIdError
} from '../../domain/errors.js';

export interface UpdateUsuarioInput {
  userId: string;
  email?: string;
  displayName?: string;
  photoPath?: string;
  idOrganica0?: number;
  idOrganica1?: number;
  idOrganica2?: number;
  idOrganica3?: number;
}

export class UpdateUsuarioCommand {
  constructor(private usuariosRepo: IUsuariosRepository) {}

  async execute(input: UpdateUsuarioInput, userId?: string): Promise<Usuario> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] Iniciando actualización de usuario`, {
      targetUserId: input.userId,
      hasEmail: !!input.email,
      hasDisplayName: !!input.displayName,
      hasPhotoPath: !!input.photoPath,
      hasOrganica: !!(input.idOrganica0 || input.idOrganica1 || input.idOrganica2 || input.idOrganica3),
      userId: userId || 'anonymous'
    });

    // 1. Validar ID del usuario
    this.validateUserId(input.userId);

    // 2. Validar email si está presente
    if (input.email !== undefined) {
      this.validateEmail(input.email);
    }

    // 3. Validar displayName si está presente
    if (input.displayName !== undefined) {
      this.validateDisplayName(input.displayName);
    }

    try {
      // 4. Verificar que el usuario existe
      const existing = await this.usuariosRepo.findById(input.userId);
      if (!existing) {
        throw new UsuarioNotFoundError(input.userId);
      }

      // 5. Verificar unicidad de email si está siendo actualizado
      if (input.email !== undefined && input.email !== existing.email) {
        if (input.email) {
          const existingEmail = await this.usuariosRepo.findByEmail(input.email);
          if (existingEmail && existingEmail.id !== input.userId) {
            throw new UsuarioAlreadyExistsError('email', input.email);
          }
        }
      }

      // 6. Preparar datos de actualización
      const updateData: UpdateUsuarioData = {
        email: input.email,
        displayName: input.displayName,
        photoPath: input.photoPath,
        idOrganica0: input.idOrganica0,
        idOrganica1: input.idOrganica1,
        idOrganica2: input.idOrganica2,
        idOrganica3: input.idOrganica3
      };

      // 7. Actualizar usuario
      const updated = await this.usuariosRepo.update(input.userId, updateData);
      if (!updated) {
        throw new UsuarioNotFoundError(input.userId);
      }

      console.log(`[${timestamp}] Usuario actualizado exitosamente`, {
        targetUserId: input.userId,
        username: updated.username,
        email: updated.email,
        displayName: updated.displayName,
        userId: userId || 'anonymous'
      });

      return updated;

    } catch (error: any) {
      console.error(`[${timestamp}] Error actualizando usuario`, {
        targetUserId: input.userId,
        error: error.message,
        userId: userId || 'anonymous'
      });
      throw error;
    }
  }

  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string') {
      throw new UsuarioInvalidIdError(userId || 'undefined');
    }

    const trimmed = userId.trim();
    if (trimmed.length === 0) {
      throw new UsuarioInvalidIdError(userId);
    }
  }

  private validateEmail(email: string | null): void {
    if (email === null) {
      return; // Email puede ser null (opcional)
    }

    if (typeof email !== 'string') {
      throw new UsuarioInvalidEmailError(String(email));
    }

    if (email.trim().length === 0) {
      return; // Email vacío es válido (se establece como null)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new UsuarioInvalidEmailError(email);
    }
  }

  private validateDisplayName(displayName: string | null): void {
    if (displayName === null) {
      return; // displayName puede ser null (opcional)
    }

    if (typeof displayName !== 'string') {
      throw new UsuarioInvalidNameError('displayName', String(displayName));
    }

    if (displayName.trim().length === 0) {
      return; // displayName vacío es válido (se establece como null)
    }

    const trimmed = displayName.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      throw new UsuarioInvalidNameError('displayName', displayName);
    }
  }
}
