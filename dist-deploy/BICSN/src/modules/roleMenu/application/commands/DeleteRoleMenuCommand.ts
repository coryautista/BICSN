import { IRoleMenuRepository } from '../../domain/repositories/IRoleMenuRepository.js';
import { DeleteRoleMenuData } from '../../domain/entities/RoleMenu.js';
import {
  RoleMenuNotFoundError,
  RoleMenuInvalidIdError
} from '../../domain/errors.js';

export class DeleteRoleMenuCommand {
  constructor(private roleMenuRepo: IRoleMenuRepository) {}

  async execute(data: DeleteRoleMenuData, userId: string): Promise<{ id: number }> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando eliminación de asignación role-menu`, {
      roleMenuId: data.id
    });

    try {
      // Validar ID del roleMenu
      if (!data.id || typeof data.id !== 'number' || data.id <= 0 || !Number.isInteger(data.id)) {
        throw new RoleMenuInvalidIdError(data.id);
      }

      // Verificar que existe
      const existing = await this.roleMenuRepo.findById(data.id);
      if (!existing) {
        throw new RoleMenuNotFoundError(data.id);
      }

      // Aquí podríamos agregar validaciones de negocio adicionales
      // Por ejemplo, verificar si la asignación está siendo usada por sesiones activas
      // o si tiene dependencias que impedirían su eliminación

      const deletedId = await this.roleMenuRepo.delete(data.id);
      if (!deletedId) {
        throw new RoleMenuNotFoundError(data.id);
      }

      console.log(`[${timestamp}] [Usuario: ${userId}] Asignación role-menu eliminada exitosamente`, {
        roleMenuId: deletedId,
        roleId: existing.roleId,
        menuId: existing.menuId
      });

      return { id: deletedId };

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en eliminación de asignación role-menu`, {
        roleMenuId: data.id,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }
}
