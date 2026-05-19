import { IAuthRepository } from '../../domain/repositories/IAuthRepository.js';
import { UserRole } from '../../domain/entities/User.js';

export class GetUserRolesQuery {
  constructor(private authRepo: IAuthRepository) {}

  async execute(userId: string): Promise<UserRole[]> {
    return await this.authRepo.getUserRoles(userId);
  }
}
