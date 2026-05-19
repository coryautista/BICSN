import { IRoleMenuRepository } from '../../domain/repositories/IRoleMenuRepository.js';
import { RoleMenu } from '../../domain/entities/RoleMenu.js';

export interface GetAllRoleMenusInput {
  // Podríamos agregar filtros opcionales aquí si fuera necesario
  // roleId?: string;
  // menuId?: number;
}

export class GetAllRoleMenusQuery {
  constructor(private roleMenuRepo: IRoleMenuRepository) {}

  async execute(input: GetAllRoleMenusInput = {}, userId: string): Promise<RoleMenu[]> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Consultando todas las asignaciones role-menu`, {
      filtros: input
    });

    try {
      const roleMenus = await this.roleMenuRepo.findAll();

      console.log(`[${timestamp}] [Usuario: ${userId}] Consulta de asignaciones role-menu completada`, {
        totalAsignaciones: roleMenus.length
      });

      return roleMenus;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en consulta de asignaciones role-menu`, {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }
}
