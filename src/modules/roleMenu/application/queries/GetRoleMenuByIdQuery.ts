import { IRoleMenuRepository } from '../../domain/repositories/IRoleMenuRepository.js';
import { RoleMenu } from '../../domain/entities/RoleMenu.js';
import {
  RoleMenuNotFoundError,
  RoleMenuInvalidIdError
} from '../../domain/errors.js';

export class GetRoleMenuByIdQuery {
  constructor(private roleMenuRepo: IRoleMenuRepository) {}

  async execute(data: { id: number }, userId: string): Promise<RoleMenu> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Consultando asignación role-menu por ID`, {
      roleMenuId: data.id
    });

    try {
      // Validar ID del roleMenu
      if (!data.id || typeof data.id !== 'number' || data.id <= 0 || !Number.isInteger(data.id)) {
        throw new RoleMenuInvalidIdError(data.id);
      }

      const roleMenu = await this.roleMenuRepo.findById(data.id);
      if (!roleMenu) {
        throw new RoleMenuNotFoundError(data.id);
      }

      console.log(`[${timestamp}] [Usuario: ${userId}] Asignación role-menu encontrada`, {
        roleMenuId: roleMenu.id,
        roleId: roleMenu.roleId,
        menuId: roleMenu.menuId
      });

      return roleMenu;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en consulta de asignación role-menu por ID`, {
        roleMenuId: data.id,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }
}
