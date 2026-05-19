import { IRoleRepository } from '../../domain/repositories/IRoleRepository.js';
import { Role, CreateRoleData } from '../../domain/entities/Role.js';
import {
  RoleAlreadyExistsError,
  RoleInvalidNameError,
  RoleInvalidDescriptionError
} from '../../domain/errors.js';

export class CreateRoleCommand {
  constructor(private roleRepo: IRoleRepository) {}

  async execute(data: CreateRoleData, userId: string): Promise<Role> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando creación de rol`, {
      name: data.name,
      description: data.description,
      isSystem: data.isSystem,
      isEntidad: data.isEntidad
    });

    try {
      // Validar datos de entrada
      await this.validateCreateData(data);

      // Verificar si el rol ya existe (comportamiento idempotente)
      const existing = await this.roleRepo.findByName(data.name);
      if (existing) {
        console.log(`[${timestamp}] [Usuario: ${userId}] Rol ya existe, retornando rol existente (comportamiento idempotente)`, {
          roleId: existing.id,
          roleName: existing.name
        });
        return existing;
      }

      console.log(`[${timestamp}] [Usuario: ${userId}] Creando nuevo rol`);

      try {
        const createdRole = await this.roleRepo.create({
          name: data.name,
          description: data.description,
          isSystem: data.isSystem ?? false,
          isEntidad: data.isEntidad ?? false
        });

        console.log(`[${timestamp}] [Usuario: ${userId}] Rol creado exitosamente`, {
          roleId: createdRole.id,
          roleName: createdRole.name
        });

        return createdRole;

      } catch (error: any) {
        console.error(`[${timestamp}] [Usuario: ${userId}] Error en creación de rol:`, {
          errorNumber: error.number,
          errorCode: error.code,
          errorMessage: error.message
        });

        // Unique constraint violation (duplicate key)
        if (error.number === 2627) {
          throw new RoleAlreadyExistsError(data.name);
        }

        // Trigger conflict with OUTPUT clause - intentar método alternativo
        if (error.number === 334) {
          console.log(`[${timestamp}] [Usuario: ${userId}] Conflicto con OUTPUT, intentando método alternativo`);

          try {
            await this.roleRepo.createWithoutOutput({
              name: data.name,
              description: data.description,
              isSystem: data.isSystem ?? false,
              isEntidad: data.isEntidad ?? false
            });

            // Obtener el rol recién creado
            const createdRole = await this.roleRepo.findByName(data.name);
            if (createdRole) {
              console.log(`[${timestamp}] [Usuario: ${userId}] Rol creado exitosamente via método alternativo`, {
                roleId: createdRole.id,
                roleName: createdRole.name
              });
              return createdRole;
            } else {
              throw new Error('No se pudo recuperar el rol creado después del método alternativo');
            }
          } catch (fallbackError: any) {
            console.error(`[${timestamp}] [Usuario: ${userId}] Método alternativo también falló:`, {
              errorNumber: fallbackError.number,
              errorCode: fallbackError.code,
              errorMessage: fallbackError.message
            });

            if (fallbackError.number === 2627) {
              throw new RoleAlreadyExistsError(data.name);
            }
            throw fallbackError;
          }
        }

        throw error;
      }

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en comando de creación de rol`, {
        name: data.name,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  private async validateCreateData(data: CreateRoleData): Promise<void> {
    // Validar nombre (requerido)
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2 || data.name.length > 50) {
      throw new RoleInvalidNameError(data.name || '');
    }

    // Validar formato del nombre (solo caracteres alfanuméricos y guiones bajos)
    if (!/^[A-Z0-9_]+$/i.test(data.name)) {
      throw new RoleInvalidNameError(data.name);
    }

    // Validar descripción si se proporciona
    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description !== 'string' || data.description.length > 255) {
        throw new RoleInvalidDescriptionError(data.description);
      }
    }
  }
}
