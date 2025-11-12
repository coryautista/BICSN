import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository.js';
import { UserRole, CreateUserRoleData } from '../../domain/entities/UserRole.js';
import {
  UserRoleAlreadyExistsError,
  UserRoleInvalidUsuarioIdError,
  UserRoleInvalidRoleIdError
} from '../../domain/errors.js';

export interface IUsuarioRepository {
  findById(id: string): Promise<any | undefined>;
}

export interface IRoleRepository {
  findById(id: string): Promise<any | undefined>;
}

export class CreateUserRoleCommand {
  constructor(private userRoleRepo: IUserRoleRepository) {}

  async execute(data: CreateUserRoleData, userId: string): Promise<UserRole> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando creación de asignación usuario-rol`, {
      usuarioId: data.usuarioId,
      roleId: data.roleId,
      esActivo: data.esActivo
    });

    try {
      // Validar datos de entrada
      await this.validateCreateInput(data);

      // Verificar si la relación ya existe
      const existing = await this.userRoleRepo.findByIds(data.usuarioId, data.roleId);
      if (existing) {
        throw new UserRoleAlreadyExistsError(data.usuarioId, data.roleId);
      }

      const userRole = await this.userRoleRepo.create(data.usuarioId, data.roleId);

      console.log(`[${timestamp}] [Usuario: ${userId}] Asignación usuario-rol creada exitosamente`, {
        usuarioId: userRole.usuarioId,
        roleId: userRole.roleId
      });

      return userRole;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en creación de asignación usuario-rol`, {
        usuarioId: data.usuarioId,
        roleId: data.roleId,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  private async validateCreateInput(data: CreateUserRoleData): Promise<void> {
    // Validar usuarioId (requerido)
    if (!data.usuarioId || typeof data.usuarioId !== 'string' || data.usuarioId.trim().length === 0) {
      throw new UserRoleInvalidUsuarioIdError(data.usuarioId);
    }

    // Validar roleId (requerido)
    if (!data.roleId || typeof data.roleId !== 'string' || data.roleId.trim().length === 0) {
      throw new UserRoleInvalidRoleIdError(data.roleId);
    }
  }
}
