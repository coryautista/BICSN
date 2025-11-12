import { IUsuariosRepository } from '../../domain/repositories/IUsuariosRepository.js';
import { UsuarioRole } from '../../domain/entities/Usuario.js';
import {
  UsuarioInvalidIdError
} from '../../domain/errors.js';

export class GetUsuarioRolesQuery {
  constructor(private usuariosRepo: IUsuariosRepository) {}

  async execute(usuarioId: string, userId?: string): Promise<UsuarioRole[]> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] Consultando roles de usuario`, {
      targetUserId: usuarioId,
      userId: userId || 'anonymous'
    });

    // 1. Validar ID del usuario
    this.validateUserId(usuarioId);

    try {
      const roles = await this.usuariosRepo.getUserRoles(usuarioId);

      console.log(`[${timestamp}] Roles de usuario obtenidos`, {
        targetUserId: usuarioId,
        totalRoles: roles.length,
        userId: userId || 'anonymous'
      });

      return roles;

    } catch (error: any) {
      console.error(`[${timestamp}] Error consultando roles de usuario`, {
        targetUserId: usuarioId,
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
}
