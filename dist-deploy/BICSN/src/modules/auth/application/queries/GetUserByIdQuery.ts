import { IAuthRepository } from '../../domain/repositories/IAuthRepository.js';
import { SafeUser } from '../../domain/entities/User.js';

export class GetUserByIdQuery {
  constructor(private authRepo: IAuthRepository) {}

  async execute(userId: string): Promise<SafeUser | undefined> {
    const user = await this.authRepo.findUserById(userId);
    if (!user) return undefined;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, passwordAlgo, ...safeUser } = user;
    return safeUser;
  }
}
