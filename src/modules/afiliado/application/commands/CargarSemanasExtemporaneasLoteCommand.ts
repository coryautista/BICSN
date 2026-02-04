import { IFormatoExtemporaneaRepository } from '../../domain/repositories/IFormatoExtemporaneaRepository.js';
import { CreateFormatoExtemporaneaData, InternoQnaPair } from '../../domain/entities/FormatoExtemporanea.js';
import {
  FormatoExtemporaneaDuplicadosEnBDError,
  FormatoExtemporaneaDuplicadosEnLoteError,
  FormatoExtemporaneaInsertError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'cargarSemanasExtemporaneasLoteCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface CargarSemanasExtemporaneasLoteData {
  registros: CreateFormatoExtemporaneaData[];
}

export interface CargarSemanasExtemporaneasLoteResult {
  insertados: number;
  total: number;
}

export class CargarSemanasExtemporaneasLoteCommand {
  constructor(private formatoExtemporaneaRepo: IFormatoExtemporaneaRepository) {}

  async execute(data: CargarSemanasExtemporaneasLoteData): Promise<CargarSemanasExtemporaneasLoteResult> {
    const logContext = {
      operation: 'cargarSemanasExtemporaneasLote',
      totalRegistros: data.registros.length
    };

    logger.info(logContext, 'Iniciando carga de semanas extemporáneas en lote');

    // 1. Validar que no haya duplicados dentro del lote
    const duplicadosEnLote = this.findDuplicatesInBatch(data.registros);
    if (duplicadosEnLote.length > 0) {
      logger.warn({
        ...logContext,
        duplicadosEnLote: duplicadosEnLote.length
      }, 'Se encontraron duplicados dentro del lote');
      throw new FormatoExtemporaneaDuplicadosEnLoteError(duplicadosEnLote);
    }

    // 2. Extraer pares únicos (interno, qnaAplica) para verificar en BD
    const pares: InternoQnaPair[] = data.registros.map(r => ({
      interno: r.interno,
      qnaAplica: r.qnaAplica
    }));

    // 3. Verificar si existen en BD
    logger.info(logContext, 'Verificando existencia de pares en base de datos');
    const existentesEnBD = await this.formatoExtemporaneaRepo.findExistingInternoQnaPairs(pares);
    
    if (existentesEnBD.length > 0) {
      logger.warn({
        ...logContext,
        duplicadosEnBD: existentesEnBD.length
      }, 'Se encontraron registros que ya existen en BD');
      throw new FormatoExtemporaneaDuplicadosEnBDError(existentesEnBD);
    }

    // 4. Insertar todos los registros
    logger.info(logContext, 'Insertando registros en base de datos');
    try {
      const insertados = await this.formatoExtemporaneaRepo.insertLote(data.registros);
      
      logger.info({
        ...logContext,
        insertados
      }, 'Carga de semanas extemporáneas completada exitosamente');

      return {
        insertados,
        total: data.registros.length
      };
    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message
      }, 'Error al insertar registros');
      throw new FormatoExtemporaneaInsertError(error.message, { originalError: error });
    }
  }

  /**
   * Encuentra pares (interno, qnaAplica) duplicados dentro del lote
   */
  private findDuplicatesInBatch(registros: CreateFormatoExtemporaneaData[]): InternoQnaPair[] {
    const seen = new Map<string, number>();
    const duplicados: InternoQnaPair[] = [];

    for (const registro of registros) {
      const key = `${registro.interno}-${registro.qnaAplica}`;
      const count = seen.get(key) || 0;
      seen.set(key, count + 1);
    }

    // Reportar los que aparecen más de una vez
    for (const [key, count] of seen.entries()) {
      if (count > 1) {
        const [interno, qnaAplica] = key.split('-').map(Number);
        duplicados.push({ interno, qnaAplica });
      }
    }

    return duplicados;
  }
}
