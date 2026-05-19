import { IRoleRepository } from '../../domain/repositories/IRoleRepository.js';
import { AssignRoleData } from '../../domain/entities/Role.js';
import {
  RoleUserNotFoundError,
  RoleNotFoundError,
  RoleAlreadyAssignedError,
  RoleInvalidIdError,
  RoleInvalidNameError
} from '../../domain/errors.js';

export class AssignRoleCommand {
  constructor(
    private roleRepo: IRoleRepository,
    private getUserRoles: (userId: string) => Promise<string[]>
  ) {}

  async execute(data: AssignRoleData, userId: string): Promise<{ userId: string; roles: string[] }> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando asignación de rol`, {
      targetUserId: data.userId,
      roleName: data.roleName
    });

    try {
      // Validar datos de entrada
      await this.validateAssignData(data);

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

      // Verificar que el usuario no tenga ya asignado este rol
      const currentRoles = await this.getUserRoles(data.userId);
      if (currentRoles.includes(data.roleName)) {
        throw new RoleAlreadyAssignedError(data.userId, data.roleName);
      }

      // Asignar el rol
      await this.roleRepo.assignUserRole(data.userId, role.id);

      // Obtener roles actualizados del usuario
      const updatedRoles = await this.getUserRoles(data.userId);

      console.log(`[${timestamp}] [Usuario: ${userId}] Rol asignado exitosamente`, {
        targetUserId: data.userId,
        roleName: data.roleName,
        totalRoles: updatedRoles.length
      });

      return { userId: data.userId, roles: updatedRoles };

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en asignación de rol`, {
        targetUserId: data.userId,
        roleName: data.roleName,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  private async validateAssignData(data: AssignRoleData): Promise<void> {
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
