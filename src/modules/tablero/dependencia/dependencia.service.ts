export class DependenciaService {
  private dependenciaRepo: any;

  constructor(deps: { dependenciaRepo: any }) {
    this.dependenciaRepo = deps.dependenciaRepo;
  }

  async getAllDependencias() {
    return await this.dependenciaRepo.findAll();
  }

  async getDependenciasByTipo(tipoDependencia: string) {
    return await this.dependenciaRepo.findByTipo(tipoDependencia);
  }

  async getDependenciasHijas(dependenciaPadreId: number) {
    return await this.dependenciaRepo.findHijas(dependenciaPadreId);
  }

  async getDependenciaById(dependenciaId: number) {
    const dependencia = await this.dependenciaRepo.findById(dependenciaId);
    if (!dependencia) {
      throw new Error('DEPENDENCIA_NOT_FOUND');
    }
    return dependencia;
  }

  async getDependenciaWithHijas(dependenciaId: number) {
    const dependencia = await this.dependenciaRepo.getDependenciaWithHijas(dependenciaId);
    if (!dependencia) {
      throw new Error('DEPENDENCIA_NOT_FOUND');
    }
    return dependencia;
  }

  async createDependenciaItem(
    nombre: string,
    descripcion: string,
    tipoDependencia: string,
    claveDependencia: string,
    idDependenciaPadre?: number,
    responsable?: string,
    telefono?: string,
    email?: string,
    esActiva?: boolean,
    userId?: string,
    tx?: any
  ) {
    try {
      return await this.dependenciaRepo.create(
        nombre,
        descripcion,
        tipoDependencia,
        claveDependencia,
        idDependenciaPadre,
        responsable,
        telefono,
        email,
        esActiva,
        userId,
        tx
      );
    } catch (error: any) {
      if (error.message.includes('FOREIGN KEY constraint')) {
        throw new Error('DEPENDENCIA_PADRE_NOT_FOUND');
      }
      if (error.message.includes('Violation of PRIMARY KEY constraint')) {
        throw new Error('DEPENDENCIA_EXISTS');
      }
      throw error;
    }
  }

  async updateDependenciaItem(
    dependenciaId: number,
    nombre?: string,
    descripcion?: string,
    tipoDependencia?: string,
    claveDependencia?: string,
    idDependenciaPadre?: number,
    responsable?: string,
    telefono?: string,
    email?: string,
    esActiva?: boolean,
    userId?: string,
    tx?: any
  ) {
    const dependencia = await this.dependenciaRepo.update(
      dependenciaId,
      nombre,
      descripcion,
      tipoDependencia,
      claveDependencia,
      idDependenciaPadre,
      responsable,
      telefono,
      email,
      esActiva,
      userId,
      tx
    );
    if (!dependencia) {
      throw new Error('DEPENDENCIA_NOT_FOUND');
    }
    return dependencia;
  }

  async deleteDependenciaItem(dependenciaId: number, tx?: any) {
    const deletedId = await this.dependenciaRepo.delete(dependenciaId, tx);
    if (!deletedId) {
      throw new Error('DEPENDENCIA_NOT_FOUND');
    }
    return deletedId;
  }
}