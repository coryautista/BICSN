import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository.js';
import { UserRole } from '../../domain/entities/UserRole.js';
import { UserRoleInvalidUsuarioIdError } from '../../domain/errors.js';

export class GetUserRolesByUsuarioQuery {
  constructor(private userRoleRepo: IUserRoleRepository) {}

  async execute(data: { usuarioId: string }, userId: string): Promise<UserRole[]> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Consultando asignaciones usuario-rol por usuarioId`, {
      usuarioId: data.usuarioId
    });

    try {
      // Validar usuarioId
      if (!data.usuarioId || typeof data.usuarioId !== 'string' || data.usuarioId.trim().length === 0) {
        throw new UserRoleInvalidUsuarioIdError(data.usuarioId);
      }

      const userRoles = await this.userRoleRepo.findByUsuarioId(data.usuarioId);

      console.log(`[${timestamp}] [Usuario: ${userId}] Consulta de asignaciones por usuarioId completada`, {
        usuarioId: data.usuarioId,
        totalAsignaciones: userRoles.length
      });

      return userRoles;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en consulta de asignaciones por usuarioId`, {
        usuarioId: data.usuarioId,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }
}
