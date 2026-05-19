import { IRoleRepository } from '../../domain/repositories/IRoleRepository.js';
import { UnassignRoleData } from '../../domain/entities/Role.js';
import {
  RoleUserNotFoundError,
  RoleNotFoundError,
  RoleNotAssignedError,
  RoleInvalidIdError,
  RoleInvalidNameError
} from '../../domain/errors.js';

export class UnassignRoleCommand {
  constructor(
    private roleRepo: IRoleRepository,
    private getUserRoles: (userId: string) => Promise<string[]>
  ) {}

  async execute(data: UnassignRoleData, userId: string): Promise<{ userId: string; roles: string[] }> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando desasignación de rol`, {
      targetUserId: data.userId,
      roleName: data.roleName
    });

    try {
      // Validar datos de entrada
      await this.validateUnassignData(data);

      // Verificar que el usuario exista
      const user = await this.roleRepo.findUserById(data.userId);
      if (!user) {
        throw new RoleUserNotFoundError(data.userId);
      }

      // Verificar que el rol exista
      const role = await this.roleRepo.findByName(data.roleName);
      if (!role) {
        throw new RoleNotFoundError(data.roleName);
      }

      // Verificar que el usuario tenga asignado este rol
      const currentRoles = await this.getUserRoles(data.userId);
      if (!currentRoles.includes(data.roleName)) {
        throw new RoleNotAssignedError(data.userId, data.roleName);
      }

      // Desasignar el rol
      await this.roleRepo.unassignUserRole(data.userId, role.id);

      // Obtener roles actualizados del usuario
      const updatedRoles = await this.getUserRoles(data.userId);

      console.log(`[${timestamp}] [Usuario: ${userId}] Rol desasignado exitosamente`, {
        targetUserId: data.userId,
        roleName: data.roleName,
        remainingRoles: updatedRoles.length
      });

      return { userId: data.userId, roles: updatedRoles };

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en desasignación de rol`, {
        targetUserId: data.userId,
        roleName: data.roleName,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  private async validateUnassignData(data: UnassignRoleData): Promise<void> {
    // Validar userId
    if (!data.userId || typeof data.userId !== 'string' || data.userId.trim().length === 0) {
      throw new RoleInvalidIdError(data.userId || '');
    }

    // Validar roleName
    if (!data.roleName || typeof data.roleName !== 'string' || data.roleName.trim().length < 2 || data.roleName.length > 50) {
      throw new RoleInvalidNameError(data.roleName || '');
    }

    // Validar formato del roleName
    if (!/^[A-Z0-9_]+$/i.test(data.roleName)) {
      throw new RoleInvalidNameError(data.roleName);
    }
  }
}
