import { IUsuariosRepository } from '../../domain/repositories/IUsuariosRepository.js';

export interface RemoveRoleInput {
  userId: string;
  roleId: string;
}

export class RemoveRoleCommand {
  constructor(private usuariosRepo: IUsuariosRepository) {}

  async execute(input: RemoveRoleInput): Promise<void> {
    // 1. Check if user exists
    const user = await this.usuariosRepo.findById(input.userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // 2. Remove role
    await this.usuariosRepo.removeRole(input.userId, input.roleId);
  }
}
