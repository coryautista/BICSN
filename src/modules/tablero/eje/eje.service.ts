export class EjeService {
  private ejeRepo: any;

  constructor(deps: { ejeRepo: any }) {
    this.ejeRepo = deps.ejeRepo;
  }

  async getAllEjes() {
    return await this.ejeRepo.findAll();
  }

  async getEjeById(ejeId: number) {
    const eje = await this.ejeRepo.findById(ejeId);
    if (!eje) {
      throw new Error('EJE_NOT_FOUND');
    }
    return eje;
  }

  async getEjeWithLineas(ejeId: number) {
    const eje = await this.ejeRepo.getEjeWithLineasEstrategicas(ejeId);
    if (!eje) {
      throw new Error('EJE_NOT_FOUND');
    }
    return eje;
  }

  async createEjeItem(nombre: string, userId?: string, tx?: any) {
    try {
      return await this.ejeRepo.create(nombre, userId, tx);
    } catch (error: any) {
      if (error.message.includes('Violation of PRIMARY KEY constraint')) {
        throw new Error('EJE_EXISTS');
      }
      throw error;
    }
  }

  async updateEjeItem(ejeId: number, nombre: string, userId?: string, tx?: any) {
    const eje = await this.ejeRepo.update(ejeId, nombre, userId, tx);
    if (!eje) {
      throw new Error('EJE_NOT_FOUND');
    }
    return eje;
  }

  async deleteEjeItem(ejeId: number, tx?: any) {
    const deletedId = await this.ejeRepo.delete(ejeId, tx);
    if (!deletedId) {
      throw new Error('EJE_NOT_FOUND');
    }
    return deletedId;
  }
}