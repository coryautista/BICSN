import { IUsuariosRepository } from '../../domain/repositories/IUsuariosRepository.js';
import {
  UsuarioNotFoundError,
  UsuarioInvalidIdError,
  UsuarioInUseError
} from '../../domain/errors.js';

export interface DeleteUsuarioInput {
  userId: string;
}

export class DeleteUsuarioCommand {
  constructor(private usuariosRepo: IUsuariosRepository) {}

  async execute(input: DeleteUsuarioInput, userId?: string): Promise<boolean> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] Iniciando eliminación de usuario`, {
      targetUserId: input.userId,
      userId: userId || 'anonymous'
    });

    // 1. Validar ID del usuario
    this.validateUserId(input.userId);

    try {
      // 2. Verificar que el usuario existe
      const existing = await this.usuariosRepo.findById(input.userId);
      if (!existing) {
        throw new UsuarioNotFoundError(input.userId);
      }

      // 3. Verificar que el usuario no esté en uso
      await this.checkUsuarioInUse(input.userId, userId);

      // 4. Eliminar usuario
      const deleted = await this.usuariosRepo.delete(input.userId);

      if (deleted) {
        console.log(`[${timestamp}] Usuario eliminado exitosamente`, {
          targetUserId: input.userId,
          username: existing.username,
          email: existing.email,
          userId: userId || 'anonymous'
        });
      } else {
        console.warn(`[${timestamp}] No se pudo eliminar el usuario`, {
          targetUserId: input.userId,
          userId: userId || 'anonymous'
        });
      }

      return deleted;

    } catch (error: any) {
      console.error(`[${timestamp}] Error eliminando usuario`, {
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

  private async checkUsuarioInUse(userId: string, requestingUserId?: string): Promise<void> {
    // Aquí podríamos verificar si el usuario tiene:
    // - Sesiones activas
    // - Registros de auditoría críticos
    // - Relaciones importantes que no deberían eliminarse
    // - Etc.

    // Por ahora, una verificación básica: no permitir eliminar al propio usuario
    if (requestingUserId && userId === requestingUserId) {
      throw new UsuarioInUseError(userId);
    }

    console.log(`[${new Date().toISOString()}] Verificando si usuario está en uso`, {
      targetUserId: userId,
      userId: requestingUserId || 'anonymous'
    });

    // TODO: Agregar verificaciones adicionales según reglas de negocio
    // Por ejemplo:
    // - Verificar si tiene expedientes activos
    // - Verificar si es administrador del sistema
    // - Verificar si tiene roles críticos asignados
  }
}
