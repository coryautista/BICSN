import { IRoleMenuRepository } from '../../domain/repositories/IRoleMenuRepository.js';
import { RoleMenu } from '../../domain/entities/RoleMenu.js';
import { RoleMenuInvalidRoleIdError } from '../../domain/errors.js';

export class GetRoleMenusByRoleIdQuery {
  constructor(private roleMenuRepo: IRoleMenuRepository) {}

  async execute(data: { roleId: string }, userId: string): Promise<RoleMenu[]> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Consultando asignaciones role-menu por roleId`, {
      roleId: data.roleId
    });

    try {
      // Validar roleId
      if (!data.roleId || typeof data.roleId !== 'string' || data.roleId.trim().length === 0) {
        throw new RoleMenuInvalidRoleIdError(data.roleId);
      }

      const roleMenus = await this.roleMenuRepo.findByRoleId(data.roleId);

      console.log(`[${timestamp}] [Usuario: ${userId}] Consulta de asignaciones por roleId completada`, {
        roleId: data.roleId,
        totalAsignaciones: roleMenus.length
      });

      return roleMenus;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en consulta de asignaciones por roleId`, {
        roleId: data.roleId,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }
}
