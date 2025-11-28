export class IndicadorService {
  private indicadorRepo: any;

  constructor(deps: { indicadorRepo: any }) {
    this.indicadorRepo = deps.indicadorRepo;
  }

  async getAllIndicadores() {
    return await this.indicadorRepo.findAll();
  }

  async getIndicadoresByPrograma(programaId: number) {
    return await this.indicadorRepo.findByPrograma(programaId);
  }

  async getIndicadoresByLineaEstrategica(lineaEstrategicaId: number) {
    return await this.indicadorRepo.findByLineaEstrategica(lineaEstrategicaId);
  }

  async getIndicadoresByEje(ejeId: number) {
    return await this.indicadorRepo.findByEje(ejeId);
  }

  async getIndicadorById(indicadorId: number) {
    const indicador = await this.indicadorRepo.findById(indicadorId);
    if (!indicador) {
      throw new Error('INDICADOR_NOT_FOUND');
    }
    return indicador;
  }

  async createIndicadorItem(
    idPrograma: number,
    nombre: string,
    descripcion: string,
    tipoIndicador: string,
    frecuenciaMedicion: string,
    meta?: number,
    sentido?: string,
    formula?: string,
    idUnidadMedida?: number,
    idDimension?: number,
    fuenteDatos?: string,
    responsable?: string,
    observaciones?: string,
    userId?: string,
    tx?: any
  ) {
    try {
      return await this.indicadorRepo.create(
        idPrograma,
        nombre,
        descripcion,
        tipoIndicador,
        frecuenciaMedicion,
        meta,
        sentido,
        formula,
        idUnidadMedida,
        idDimension,
        fuenteDatos,
        responsable,
        observaciones,
        userId,
        tx
      );
    } catch (error: any) {
      if (error.message.includes('FOREIGN KEY constraint')) {
        throw new Error('PROGRAMA_NOT_FOUND');
      }
      if (error.message.includes('Violation of PRIMARY KEY constraint')) {
        throw new Error('INDICADOR_EXISTS');
      }
      throw error;
    }
  }

  async updateIndicadorItem(
    indicadorId: number,
    nombre?: string,
    descripcion?: string,
    tipoIndicador?: string,
    frecuenciaMedicion?: string,
    meta?: number,
    sentido?: string,
    formula?: string,
    idUnidadMedida?: number,
    idDimension?: number,
    fuenteDatos?: string,
    responsable?: string,
    observaciones?: string,
    userId?: string,
    tx?: any
  ) {
    const indicador = await this.indicadorRepo.update(
      indicadorId,
      nombre,
      descripcion,
      tipoIndicador,
      frecuenciaMedicion,
      meta,
      sentido,
      formula,
      idUnidadMedida,
      idDimension,
      fuenteDatos,
      responsable,
      observaciones,
      userId,
      tx
    );
    if (!indicador) {
      throw new Error('INDICADOR_NOT_FOUND');
    }
    return indicador;
  }

  async deleteIndicadorItem(indicadorId: number, tx?: any) {
    const deletedId = await this.indicadorRepo.delete(indicadorId, tx);
    if (!deletedId) {
      throw new Error('INDICADOR_NOT_FOUND');
    }
    return deletedId;
  }
}