import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository.js';
import { UserRole } from '../../domain/entities/UserRole.js';

export interface GetAllUserRolesInput {
  // Podríamos agregar filtros opcionales aquí si fuera necesario
  // usuarioId?: string;
  // roleId?: string;
}

export class GetAllUserRolesQuery {
  constructor(private userRoleRepo: IUserRoleRepository) {}

  async execute(input: GetAllUserRolesInput = {}, userId: string): Promise<UserRole[]> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Consultando todas las asignaciones usuario-rol`, {
      filtros: input
    });

    try {
      const userRoles = await this.userRoleRepo.findAll();

      console.log(`[${timestamp}] [Usuario: ${userId}] Consulta de asignaciones usuario-rol completada`, {
        totalAsignaciones: userRoles.length
      });

      return userRoles;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en consulta de asignaciones usuario-rol`, {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }
}
