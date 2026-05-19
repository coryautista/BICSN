import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository.js';
import { DeleteUserRoleData } from '../../domain/entities/UserRole.js';
import {
  UserRoleNotFoundError,
  UserRoleInvalidUsuarioIdError,
  UserRoleInvalidRoleIdError
} from '../../domain/errors.js';

export class DeleteUserRoleCommand {
  constructor(private userRoleRepo: IUserRoleRepository) {}

  async execute(data: DeleteUserRoleData, userId: string): Promise<{ usuarioId: string; roleId: string }> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando eliminación de asignación usuario-rol`, {
      usuarioId: data.usuarioId,
      roleId: data.roleId
    });

    try {
      // Validar datos de entrada
      await this.validateDeleteInput(data);

      // Verificar que la relación exista
      const existing = await this.userRoleRepo.findByIds(data.usuarioId, data.roleId);
      if (!existing) {
        throw new UserRoleNotFoundError(data.usuarioId, data.roleId);
      }

      // Aquí podríamos agregar validaciones de negocio adicionales
      // Por ejemplo, verificar si el usuario tiene al menos un rol asignado
      // o si esta asignación está siendo usada por sesiones activas

      const result = await this.userRoleRepo.delete(data.usuarioId, data.roleId);

      console.log(`[${timestamp}] [Usuario: ${userId}] Asignación usuario-rol eliminada exitosamente`, {
        usuarioId: result.usuarioId,
        roleId: result.roleId
      });

      return result;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en eliminación de asignación usuario-rol`, {
        usuarioId: data.usuarioId,
        roleId: data.roleId,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  private async validateDeleteInput(data: DeleteUserRoleData): Promise<void> {
    // Validar usuarioId (requerido)
    if (!data.usuarioId || typeof data.usuarioId !== 'string' || data.usuarioId.trim().length === 0) {
      throw new UserRoleInvalidUsuarioIdError(data.usuarioId);
    }

    // Validar roleId (requerido)
    if (!data.roleId || typeof data.roleId !== 'string' || data.roleId.trim().length === 0) {
      throw new UserRoleInvalidRoleIdError(data.roleId);
    }
  }
}
