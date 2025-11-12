import { IRoleRepository } from '../../domain/repositories/IRoleRepository.js';
import { Role } from '../../domain/entities/Role.js';

export class GetAllRolesQuery {
  constructor(private roleRepo: IRoleRepository) {}

  async execute(userId?: string): Promise<Role[]> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId || 'N/A'}] Consultando todos los roles`);

    try {
      const result = await this.roleRepo.findAll();

      console.log(`[${timestamp}] [Usuario: ${userId || 'N/A'}] Consulta de roles completada`, {
        totalRoles: result.length
      });

      return result;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId || 'N/A'}] Error en consulta de roles`, {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }
}
