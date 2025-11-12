import { IUsuariosRepository } from '../../domain/repositories/IUsuariosRepository.js';

export interface AssignRoleInput {
  userId: string;
  roleId: string;
}

export class AssignRoleCommand {
  constructor(private usuariosRepo: IUsuariosRepository) {}

  async execute(input: AssignRoleInput): Promise<void> {
    // 1. Check if user exists
    const user = await this.usuariosRepo.findById(input.userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // 2. Assign role
    await this.usuariosRepo.assignRole(input.userId, input.roleId);
  }
}
