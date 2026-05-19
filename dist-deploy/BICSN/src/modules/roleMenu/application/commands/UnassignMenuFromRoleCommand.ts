import { IRoleMenuRepository } from '../../domain/repositories/IRoleMenuRepository.js';
import { UnassignMenuFromRoleData } from '../../domain/entities/RoleMenu.js';
import {
  RoleMenuNotFoundError,
  RoleMenuInvalidRoleIdError,
  RoleMenuInvalidMenuIdError
} from '../../domain/errors.js';

export class UnassignMenuFromRoleCommand {
  constructor(private roleMenuRepo: IRoleMenuRepository) {}

  async execute(data: UnassignMenuFromRoleData, userId: string): Promise<{ id: number }> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando desasignación de menú de rol`, {
      roleId: data.roleId,
      menuId: data.menuId
    });

    try {
      // Validar datos de entrada
      await this.validateUnassignInput(data);

      const deletedId = await this.roleMenuRepo.deleteByRoleAndMenu(data.roleId, data.menuId);
      if (!deletedId) {
        throw new RoleMenuNotFoundError(-1); // ID genérico ya que no tenemos el ID específico
      }

      console.log(`[${timestamp}] [Usuario: ${userId}] Menú desasignado de rol exitosamente`, {
        deletedRoleMenuId: deletedId,
        roleId: data.roleId,
        menuId: data.menuId
      });

      return { id: deletedId };

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en desasignación de menú de rol`, {
        roleId: data.roleId,
        menuId: data.menuId,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  private async validateUnassignInput(data: UnassignMenuFromRoleData): Promise<void> {
    // Validar roleId (requerido)
    if (!data.roleId || typeof data.roleId !== 'string' || data.roleId.trim().length === 0) {
      throw new RoleMenuInvalidRoleIdError(data.roleId);
    }

    // Validar menuId (requerido)
    if (!data.menuId || typeof data.menuId !== 'number' || data.menuId <= 0 || !Number.isInteger(data.menuId)) {
      throw new RoleMenuInvalidMenuIdError(data.menuId);
    }
  }
}
