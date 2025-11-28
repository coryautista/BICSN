export class DimensionService {
  private dimensionRepo: any;

  constructor(deps: { dimensionRepo: any }) {
    this.dimensionRepo = deps.dimensionRepo;
  }

  async getAllDimensiones() {
    return await this.dimensionRepo.findAll();
  }

  async getDimensionesByTipo(tipoDimension: string) {
    return await this.dimensionRepo.findByTipo(tipoDimension);
  }

  async getDimensionById(dimensionId: number) {
    const dimension = await this.dimensionRepo.findById(dimensionId);
    if (!dimension) {
      throw new Error('DIMENSION_NOT_FOUND');
    }
    return dimension;
  }

  async createDimensionItem(
    nombre: string,
    descripcion: string,
    tipoDimension: string,
    esActiva?: boolean,
    userId?: string,
    tx?: any
  ) {
    try {
      return await this.dimensionRepo.create(
        nombre,
        descripcion,
        tipoDimension,
        esActiva,
        userId,
        tx
      );
    } catch (error: any) {
      if (error.message.includes('Violation of PRIMARY KEY constraint')) {
        throw new Error('DIMENSION_EXISTS');
      }
      throw error;
    }
  }

  async updateDimensionItem(
    dimensionId: number,
    nombre?: string,
    descripcion?: string,
    tipoDimension?: string,
    esActiva?: boolean,
    userId?: string,
    tx?: any
  ) {
    const dimension = await this.dimensionRepo.update(
      dimensionId,
      nombre,
      descripcion,
      tipoDimension,
      esActiva,
      userId,
      tx
    );
    if (!dimension) {
      throw new Error('DIMENSION_NOT_FOUND');
    }
    return dimension;
  }

  async deleteDimensionItem(dimensionId: number, tx?: any) {
    const deletedId = await this.dimensionRepo.delete(dimensionId, tx);
    if (!deletedId) {
      throw new Error('DIMENSION_NOT_FOUND');
    }
    return deletedId;
  }
}