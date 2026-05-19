import { IRoleRepository } from '../../domain/repositories/IRoleRepository.js';
import { Role } from '../../domain/entities/Role.js';
import {
  RoleInvalidNameError
} from '../../domain/errors.js';

export class GetRoleByNameQuery {
  constructor(private roleRepo: IRoleRepository) {}

  async execute(data: { name: string }, userId?: string): Promise<Role | undefined> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId || 'N/A'}] Consultando rol por nombre`, {
      roleName: data.name
    });

    try {
      // Validar nombre del rol
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2 || data.name.length > 50) {
        throw new RoleInvalidNameError(data.name || '');
      }

      // Validar formato del nombre
      if (!/^[A-Z0-9_]+$/i.test(data.name)) {
        throw new RoleInvalidNameError(data.name);
      }

      const result = await this.roleRepo.findByName(data.name);

      if (result) {
        console.log(`[${timestamp}] [Usuario: ${userId || 'N/A'}] Rol encontrado`, {
          roleId: result.id,
          roleName: result.name,
          isSystem: result.isSystem
        });
      } else {
        console.log(`[${timestamp}] [Usuario: ${userId || 'N/A'}] Rol no encontrado`, {
          roleName: data.name
        });
      }

      return result;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId || 'N/A'}] Error en consulta de rol por nombre`, {
        roleName: data.name,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }
}
