export class UnidadMedidaService {
  private unidadMedidaRepo: any;

  constructor(deps: { unidadMedidaRepo: any }) {
    this.unidadMedidaRepo = deps.unidadMedidaRepo;
  }

  async getAllUnidadesMedida() {
    return await this.unidadMedidaRepo.findAll();
  }

  async getUnidadesMedidaByCategoria(categoria: string) {
    return await this.unidadMedidaRepo.findByCategoria(categoria);
  }

  async getUnidadMedidaById(unidadMedidaId: number) {
    const unidadMedida = await this.unidadMedidaRepo.findById(unidadMedidaId);
    if (!unidadMedida) {
      throw new Error('UNIDAD_MEDIDA_NOT_FOUND');
    }
    return unidadMedida;
  }

  async createUnidadMedidaItem(
    nombre: string,
    simbolo: string,
    descripcion: string,
    categoria: string,
    esActiva?: boolean,
    userId?: string,
    tx?: any
  ) {
    try {
      return await this.unidadMedidaRepo.create(
        nombre,
        simbolo,
        descripcion,
        categoria,
        esActiva,
        userId,
        tx
      );
    } catch (error: any) {
      if (error.message.includes('Violation of PRIMARY KEY constraint')) {
        throw new Error('UNIDAD_MEDIDA_EXISTS');
      }
      throw error;
    }
  }

  async updateUnidadMedidaItem(
    unidadMedidaId: number,
    nombre?: string,
    simbolo?: string,
    descripcion?: string,
    categoria?: string,
    esActiva?: boolean,
    userId?: string,
    tx?: any
  ) {
    const unidadMedida = await this.unidadMedidaRepo.update(
      unidadMedidaId,
      nombre,
      simbolo,
      descripcion,
      categoria,
      esActiva,
      userId,
      tx
    );
    if (!unidadMedida) {
      throw new Error('UNIDAD_MEDIDA_NOT_FOUND');
    }
    return unidadMedida;
  }

  async deleteUnidadMedidaItem(unidadMedidaId: number, tx?: any) {
    const deletedId = await this.unidadMedidaRepo.delete(unidadMedidaId, tx);
    if (!deletedId) {
      throw new Error('UNIDAD_MEDIDA_NOT_FOUND');
    }
    return deletedId;
  }
}