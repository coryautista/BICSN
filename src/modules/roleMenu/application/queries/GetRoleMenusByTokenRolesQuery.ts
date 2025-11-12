import { IRoleMenuRepository } from '../../domain/repositories/IRoleMenuRepository.js';
import { RoleMenuWithDetails } from '../../domain/entities/RoleMenu.js';

export class GetRoleMenusByTokenRolesQuery {
  constructor(private roleMenuRepo: IRoleMenuRepository) {}

  async execute(data: { roleNames: string[] }, userId: string): Promise<RoleMenuWithDetails[]> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Consultando asignaciones role-menu por nombres de roles`, {
      roleNames: data.roleNames,
      cantidadRoles: data.roleNames?.length || 0
    });

    try {
      // Validar roleNames
      if (!data.roleNames || !Array.isArray(data.roleNames) || data.roleNames.length === 0) {
        console.log(`[${timestamp}] [Usuario: ${userId}] Lista de roles vacía o inválida`);
        return [];
      }

      // Validar que todos los nombres de roles sean strings válidos
      const invalidRoles = data.roleNames.filter(role => !role || typeof role !== 'string' || role.trim().length === 0);
      if (invalidRoles.length > 0) {
        console.warn(`[${timestamp}] [Usuario: ${userId}] Nombres de roles inválidos encontrados`, {
          invalidRoles
        });
        // Filtrar roles válidos
        data.roleNames = data.roleNames.filter(role => role && typeof role === 'string' && role.trim().length > 0);
      }

      if (data.roleNames.length === 0) {
        console.log(`[${timestamp}] [Usuario: ${userId}] No hay roles válidos para consultar`);
        return [];
      }

      const roleMenus = await this.roleMenuRepo.findByRoleNames(data.roleNames);

      console.log(`[${timestamp}] [Usuario: ${userId}] Consulta de asignaciones por nombres de roles completada`, {
        roleNames: data.roleNames,
        totalAsignaciones: roleMenus.length
      });

      return roleMenus;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en consulta de asignaciones por nombres de roles`, {
        roleNames: data.roleNames,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }
}
