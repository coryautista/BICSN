import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository.js';
import { UserRole } from '../../domain/entities/UserRole.js';
import {
  UserRoleNotFoundError,
  UserRoleInvalidUsuarioIdError,
  UserRoleInvalidRoleIdError
} from '../../domain/errors.js';

export class GetUserRoleByIdsQuery {
  constructor(private userRoleRepo: IUserRoleRepository) {}

  async execute(data: { usuarioId: string; roleId: string }, userId: string): Promise<UserRole> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Consultando asignación usuario-rol por IDs`, {
      usuarioId: data.usuarioId,
      roleId: data.roleId
    });

    try {
      // Validar datos de entrada
      await this.validateQueryInput(data);

      const userRole = await this.userRoleRepo.findByIds(data.usuarioId, data.roleId);
      if (!userRole) {
        throw new UserRoleNotFoundError(data.usuarioId, data.roleId);
      }

      console.log(`[${timestamp}] [Usuario: ${userId}] Asignación usuario-rol encontrada`, {
        usuarioId: userRole.usuarioId,
        roleId: userRole.roleId
      });

      return userRole;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en consulta de asignación usuario-rol por IDs`, {
        usuarioId: data.usuarioId,
        roleId: data.roleId,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  private async validateQueryInput(data: { usuarioId: string; roleId: string }): Promise<void> {
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
