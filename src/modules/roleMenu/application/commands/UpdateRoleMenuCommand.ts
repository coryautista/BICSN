import { IRoleMenuRepository } from '../../domain/repositories/IRoleMenuRepository.js';
import { RoleMenu, UpdateRoleMenuData } from '../../domain/entities/RoleMenu.js';
import {
  RoleMenuNotFoundError,
  RoleMenuInvalidIdError,
  RoleMenuInvalidRoleIdError,
  RoleMenuInvalidMenuIdError,
  RoleMenuAlreadyExistsError,
  RoleMenuMenuNotFoundError
} from '../../domain/errors.js';

export interface IMenuRepository {
  findById(id: number): Promise<any | undefined>;
}

export class UpdateRoleMenuCommand {
  constructor(
    private roleMenuRepo: IRoleMenuRepository,
    private menuRepo: IMenuRepository
  ) {}

  async execute(data: UpdateRoleMenuData, userId: string): Promise<RoleMenu> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando actualización de asignación role-menu`, {
      roleMenuId: data.id,
      camposActualizar: Object.keys(data).filter(key => key !== 'id' && data[key as keyof UpdateRoleMenuData] !== undefined)
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

      // Validar datos de entrada si se proporcionan
      await this.validateUpdateInput(data);

      // Verificar si hay al menos un campo para actualizar
      const hasFieldsToUpdate = data.roleId !== undefined ||
                               data.menuId !== undefined ||
                               data.createdAt !== undefined;

      if (!hasFieldsToUpdate) {
        console.log(`[${timestamp}] [Usuario: ${userId}] No hay campos para actualizar en roleMenu ${data.id}`);
        return existing;
      }

      // Validar si se cambia roleId o menuId
      if (data.roleId || data.menuId) {
        const newRoleId = data.roleId ?? existing.roleId;
        const newMenuId = data.menuId ?? existing.menuId;

        // Verificar si la nueva combinación ya existe
        if (newRoleId !== existing.roleId || newMenuId !== existing.menuId) {
          const roleMenus = await this.roleMenuRepo.findByRoleId(newRoleId);
          if (roleMenus.some(rm => rm.menuId === newMenuId && rm.id !== data.id)) {
            throw new RoleMenuAlreadyExistsError(newRoleId, newMenuId);
          }
        }

        // Validar que el menu existe si se está cambiando
        if (data.menuId) {
          const menu = await this.menuRepo.findById(data.menuId);
          if (!menu) {
            throw new RoleMenuMenuNotFoundError(data.menuId);
          }
        }
      }

      const updated = await this.roleMenuRepo.update(
        data.id,
        data.roleId,
        data.menuId,
        data.createdAt
      );

      if (!updated) {
        throw new RoleMenuNotFoundError(data.id);
      }

      console.log(`[${timestamp}] [Usuario: ${userId}] Asignación role-menu actualizada exitosamente`, {
        roleMenuId: updated.id,
        roleId: updated.roleId,
        menuId: updated.menuId,
        cambiosAplicados: Object.keys(data).filter(key => key !== 'id' && data[key as keyof UpdateRoleMenuData] !== undefined)
      });

      return updated;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en actualización de asignación role-menu`, {
        roleMenuId: data.id,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  private async validateUpdateInput(data: UpdateRoleMenuData): Promise<void> {
    // Validar roleId si se proporciona
    if (data.roleId !== undefined) {
      if (typeof data.roleId !== 'string' || data.roleId.trim().length === 0) {
        throw new RoleMenuInvalidRoleIdError(data.roleId);
      }
    }

    // Validar menuId si se proporciona
    if (data.menuId !== undefined) {
      if (typeof data.menuId !== 'number' || data.menuId <= 0 || !Number.isInteger(data.menuId)) {
        throw new RoleMenuInvalidMenuIdError(data.menuId);
      }
    }
  }
}
