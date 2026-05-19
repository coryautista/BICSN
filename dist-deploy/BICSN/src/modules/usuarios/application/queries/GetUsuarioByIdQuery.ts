import { IUsuariosRepository } from '../../domain/repositories/IUsuariosRepository.js';
import { Usuario } from '../../domain/entities/Usuario.js';
import {
  UsuarioNotFoundError,
  UsuarioInvalidIdError
} from '../../domain/errors.js';

export class GetUsuarioByIdQuery {
  constructor(private usuariosRepo: IUsuariosRepository) {}

  async execute(usuarioId: string, userId?: string): Promise<Usuario> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] Consultando usuario por ID`, {
      targetUserId: usuarioId,
      userId: userId || 'anonymous'
    });

    // 1. Validar ID del usuario
    this.validateUserId(usuarioId);

    try {
      const usuario = await this.usuariosRepo.findById(usuarioId);

      if (!usuario) {
        throw new UsuarioNotFoundError(usuarioId);
      }

      console.log(`[${timestamp}] Usuario encontrado por ID`, {
        targetUserId: usuarioId,
        username: usuario.username,
        email: usuario.email,
        userId: userId || 'anonymous'
      });

      return usuario;

    } catch (error: any) {
      console.error(`[${timestamp}] Error consultando usuario por ID`, {
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
