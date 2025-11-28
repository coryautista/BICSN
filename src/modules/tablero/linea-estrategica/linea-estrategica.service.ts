export class LineaEstrategicaService {
  private lineaEstrategicaRepo: any;

  constructor(deps: { lineaEstrategicaRepo: any }) {
    this.lineaEstrategicaRepo = deps.lineaEstrategicaRepo;
  }

  async getAllLineasEstrategicas() {
    return await this.lineaEstrategicaRepo.findAll();
  }

  async getLineasEstrategicasByEje(ejeId: number) {
    return await this.lineaEstrategicaRepo.findByEje(ejeId);
  }

  async getLineaEstrategicaById(lineaEstrategicaId: number) {
    const lineaEstrategica = await this.lineaEstrategicaRepo.findById(lineaEstrategicaId);
    if (!lineaEstrategica) {
      throw new Error('LINEA_ESTRATEGICA_NOT_FOUND');
    }
    return lineaEstrategica;
  }

  async getLineaEstrategicaWithProgramas(lineaEstrategicaId: number) {
    const lineaEstrategica = await this.lineaEstrategicaRepo.getLineaEstrategicaWithProgramas(lineaEstrategicaId);
    if (!lineaEstrategica) {
      throw new Error('LINEA_ESTRATEGICA_NOT_FOUND');
    }
    return lineaEstrategica;
  }

  async createLineaEstrategicaItem(idEje: number, nombre: string, descripcion: string, userId?: string, tx?: any) {
    try {
      return await this.lineaEstrategicaRepo.create(idEje, nombre, descripcion, userId, tx);
    } catch (error: any) {
      if (error.message.includes('FOREIGN KEY constraint')) {
        throw new Error('EJE_NOT_FOUND');
      }
      if (error.message.includes('Violation of PRIMARY KEY constraint')) {
        throw new Error('LINEA_ESTRATEGICA_EXISTS');
      }
      throw error;
    }
  }

  async updateLineaEstrategicaItem(lineaEstrategicaId: number, nombre?: string, descripcion?: string, userId?: string, tx?: any) {
    const lineaEstrategica = await this.lineaEstrategicaRepo.update(lineaEstrategicaId, nombre, descripcion, userId, tx);
    if (!lineaEstrategica) {
      throw new Error('LINEA_ESTRATEGICA_NOT_FOUND');
    }
    return lineaEstrategica;
  }

  async deleteLineaEstrategicaItem(lineaEstrategicaId: number, tx?: any) {
    const deletedId = await this.lineaEstrategicaRepo.delete(lineaEstrategicaId, tx);
    if (!deletedId) {
      throw new Error('LINEA_ESTRATEGICA_NOT_FOUND');
    }
    return deletedId;
  }
}