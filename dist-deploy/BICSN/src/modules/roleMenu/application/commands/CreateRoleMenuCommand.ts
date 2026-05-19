import { IRoleMenuRepository } from '../../domain/repositories/IRoleMenuRepository.js';
import { RoleMenu, CreateRoleMenuData } from '../../domain/entities/RoleMenu.js';
import {
  RoleMenuAlreadyExistsError,
  RoleMenuInvalidRoleIdError,
  RoleMenuInvalidMenuIdError,
  RoleMenuRoleNotFoundError,
  RoleMenuMenuNotFoundError
} from '../../domain/errors.js';

export interface IRoleRepository {
  findById(id: string): Promise<any | undefined>;
}

export interface IMenuRepository {
  findById(id: number): Promise<any | undefined>;
}

export class CreateRoleMenuCommand {
  constructor(
    private roleMenuRepo: IRoleMenuRepository,
    private roleRepo: IRoleRepository,
    private menuRepo: IMenuRepository
  ) {}

  async execute(data: CreateRoleMenuData, userId: string): Promise<RoleMenu> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando creación de asignación role-menu`, {
      roleId: data.roleId,
      menuId: data.menuId
    });

    try {
      // Validar datos de entrada
      await this.validateCreateInput(data);

      // Validar que el role existe
      const role = await this.roleRepo.findById(data.roleId);
      if (!role) {
        throw new RoleMenuRoleNotFoundError(data.roleId);
      }

      // Validar que el menu existe
      const menu = await this.menuRepo.findById(data.menuId);
      if (!menu) {
        throw new RoleMenuMenuNotFoundError(data.menuId);
      }

      // Verificar si ya existe la asignación
      const existing = await this.roleMenuRepo.findByRoleId(data.roleId);
      if (existing.some(rm => rm.menuId === data.menuId)) {
        throw new RoleMenuAlreadyExistsError(data.roleId, data.menuId);
      }

      const createdAt = data.createdAt || new Date().toISOString();
      const roleMenu = await this.roleMenuRepo.create(data.roleId, data.menuId, createdAt);

      console.log(`[${timestamp}] [Usuario: ${userId}] Asignación role-menu creada exitosamente`, {
        roleMenuId: roleMenu.id,
        roleId: roleMenu.roleId,
        menuId: roleMenu.menuId
      });

      return roleMenu;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en creación de asignación role-menu`, {
        roleId: data.roleId,
        menuId: data.menuId,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  private async validateCreateInput(data: CreateRoleMenuData): Promise<void> {
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
