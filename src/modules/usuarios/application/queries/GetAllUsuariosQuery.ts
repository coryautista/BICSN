import { IUsuariosRepository } from '../../domain/repositories/IUsuariosRepository.js';
import { Usuario } from '../../domain/entities/Usuario.js';

export class GetAllUsuariosQuery {
  constructor(private usuariosRepo: IUsuariosRepository) {}

  async execute(userId?: string): Promise<Usuario[]> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] Consultando todos los usuarios`, {
      userId: userId || 'anonymous'
    });

    try {
      const usuarios = await this.usuariosRepo.findAll();

      console.log(`[${timestamp}] Consulta de usuarios completada`, {
        totalUsuarios: usuarios.length,
        userId: userId || 'anonymous'
      });

      return usuarios;

    } catch (error: any) {
      console.error(`[${timestamp}] Error consultando usuarios`, {
        error: error.message,
        userId: userId || 'anonymous'
      });
      throw error;
    }
  }
}
