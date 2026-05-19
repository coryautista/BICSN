import { IRoleMenuRepository } from '../../domain/repositories/IRoleMenuRepository.js';
import { RoleMenu, AssignMenuToRoleData } from '../../domain/entities/RoleMenu.js';
import {
  RoleMenuAlreadyExistsError,
  RoleMenuInvalidRoleIdError,
  RoleMenuInvalidMenuIdError,
  RoleMenuMenuNotFoundError
} from '../../domain/errors.js';

export interface IMenuRepository {
  findById(id: number): Promise<any | undefined>;
}

export class AssignMenuToRoleCommand {
  constructor(
    private roleMenuRepo: IRoleMenuRepository,
    private menuRepo: IMenuRepository
  ) {}

  async execute(data: AssignMenuToRoleData, userId: string): Promise<RoleMenu> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando asignación de menú a rol`, {
      roleId: data.roleId,
      menuId: data.menuId
    });

    try {
      // Validar datos de entrada
      await this.validateAssignInput(data);

      // Validar que el menu existe
      const menu = await this.menuRepo.findById(data.menuId);
      if (!menu) {
        throw new RoleMenuMenuNotFoundError(data.menuId);
      }

      // Verificar si ya está asignado
      const existing = await this.roleMenuRepo.findByRoleId(data.roleId);
      if (existing.some(rm => rm.menuId === data.menuId)) {
        throw new RoleMenuAlreadyExistsError(data.roleId, data.menuId);
      }

      const roleMenu = await this.roleMenuRepo.create(data.roleId, data.menuId, new Date().toISOString());

      console.log(`[${timestamp}] [Usuario: ${userId}] Menú asignado a rol exitosamente`, {
        roleMenuId: roleMenu.id,
        roleId: roleMenu.roleId,
        menuId: roleMenu.menuId
      });

      return roleMenu;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en asignación de menú a rol`, {
        roleId: data.roleId,
        menuId: data.menuId,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  private async validateAssignInput(data: AssignMenuToRoleData): Promise<void> {
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
