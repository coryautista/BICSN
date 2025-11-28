export class ProgramaService {
  private programaRepo: any;

  constructor(deps: { programaRepo: any }) {
    this.programaRepo = deps.programaRepo;
  }

  async getAllProgramas() {
    return await this.programaRepo.findAll();
  }

  async getProgramasByEje(ejeId: number) {
    return await this.programaRepo.findByEje(ejeId);
  }

  async getProgramasByLineaEstrategica(lineaEstrategicaId: number) {
    return await this.programaRepo.findByLineaEstrategica(lineaEstrategicaId);
  }

  async getProgramaById(programaId: number) {
    const programa = await this.programaRepo.findById(programaId);
    if (!programa) {
      throw new Error('PROGRAMA_NOT_FOUND');
    }
    return programa;
  }

  async createProgramaItem(idEje: number, idLineaEstrategica: number, nombre: string, descripcion: string, userId?: string, tx?: any) {
    try {
      return await this.programaRepo.create(idEje, idLineaEstrategica, nombre, descripcion, userId, tx);
    } catch (error: any) {
      if (error.message.includes('FOREIGN KEY constraint')) {
        if (error.message.includes('idEje')) {
          throw new Error('EJE_NOT_FOUND');
        }
        if (error.message.includes('idLineaEstrategica')) {
          throw new Error('LINEA_ESTRATEGICA_NOT_FOUND');
        }
      }
      if (error.message.includes('Violation of PRIMARY KEY constraint')) {
        throw new Error('PROGRAMA_EXISTS');
      }
      throw error;
    }
  }

  async updateProgramaItem(programaId: number, nombre?: string, descripcion?: string, userId?: string, tx?: any) {
    const programa = await this.programaRepo.update(programaId, nombre, descripcion, userId, tx);
    if (!programa) {
      throw new Error('PROGRAMA_NOT_FOUND');
    }
    return programa;
  }

  async deleteProgramaItem(programaId: number, tx?: any) {
    const deletedId = await this.programaRepo.delete(programaId, tx);
    if (!deletedId) {
      throw new Error('PROGRAMA_NOT_FOUND');
    }
    return deletedId;
  }
}