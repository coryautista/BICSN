export class IndicadorAnualService {
  private indicadorAnualRepo: any;

  constructor(deps: { indicadorAnualRepo: any }) {
    this.indicadorAnualRepo = deps.indicadorAnualRepo;
  }

  async getIndicadoresAnualesByIndicador(indicadorId: number) {
    return await this.indicadorAnualRepo.findByIndicador(indicadorId);
  }

  async getIndicadoresAnualesByAnio(anio: number) {
    return await this.indicadorAnualRepo.findByAnio(anio);
  }

  async getIndicadorAnualById(indicadorAnualId: number) {
    const indicadorAnual = await this.indicadorAnualRepo.findById(indicadorAnualId);
    if (!indicadorAnual) {
      throw new Error('INDICADOR_ANUAL_NOT_FOUND');
    }
    return indicadorAnual;
  }

  async createIndicadorAnualItem(
    idIndicador: number,
    anio: number,
    enero?: number,
    febrero?: number,
    marzo?: number,
    abril?: number,
    mayo?: number,
    junio?: number,
    julio?: number,
    agosto?: number,
    septiembre?: number,
    octubre?: number,
    noviembre?: number,
    diciembre?: number,
    metaAnual?: number,
    observaciones?: string,
    userId?: string,
    tx?: any
  ) {
    try {
      return await this.indicadorAnualRepo.create(
        idIndicador,
        anio,
        enero,
        febrero,
        marzo,
        abril,
        mayo,
        junio,
        julio,
        agosto,
        septiembre,
        octubre,
        noviembre,
        diciembre,
        metaAnual,
        observaciones,
        userId,
        tx
      );
    } catch (error: any) {
      if (error.message.includes('FOREIGN KEY constraint')) {
        throw new Error('INDICADOR_NOT_FOUND');
      }
      if (error.message.includes('Violation of PRIMARY KEY constraint')) {
        throw new Error('INDICADOR_ANUAL_EXISTS');
      }
      throw error;
    }
  }

  async updateIndicadorAnualItem(
    indicadorAnualId: number,
    enero?: number,
    febrero?: number,
    marzo?: number,
    abril?: number,
    mayo?: number,
    junio?: number,
    julio?: number,
    agosto?: number,
    septiembre?: number,
    octubre?: number,
    noviembre?: number,
    diciembre?: number,
    metaAnual?: number,
    observaciones?: string,
    userId?: string,
    tx?: any
  ) {
    const indicadorAnual = await this.indicadorAnualRepo.update(
      indicadorAnualId,
      enero,
      febrero,
      marzo,
      abril,
      mayo,
      junio,
      julio,
      agosto,
      septiembre,
      octubre,
      noviembre,
      diciembre,
      metaAnual,
      observaciones,
      userId,
      tx
    );
    if (!indicadorAnual) {
      throw new Error('INDICADOR_ANUAL_NOT_FOUND');
    }
    return indicadorAnual;
  }

  async deleteIndicadorAnualItem(indicadorAnualId: number, tx?: any) {
    const deletedId = await this.indicadorAnualRepo.delete(indicadorAnualId, tx);
    if (!deletedId) {
      throw new Error('INDICADOR_ANUAL_NOT_FOUND');
    }
    return deletedId;
  }
}