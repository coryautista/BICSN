import { CreateFormatoExtemporaneaData, FormatoExtemporanea, InternoQnaPair } from '../entities/FormatoExtemporanea.js';

/**
 * Interface del repositorio para FormatoExtemporanea
 */
export interface IFormatoExtemporaneaRepository {
  /**
   * Busca pares (Interno, QnaAplica) que ya existen en la base de datos
   * @param pairs Array de pares a verificar
   * @returns Array de pares que ya existen en BD
   */
  findExistingInternoQnaPairs(pairs: InternoQnaPair[]): Promise<InternoQnaPair[]>;

  /**
   * Inserta un lote de registros en la tabla afi.Formato_Extemporanea
   * @param items Array de registros a insertar
   * @returns Cantidad de registros insertados
   */
  insertLote(items: CreateFormatoExtemporaneaData[]): Promise<number>;

  /**
   * Obtiene los registros de semanas extemporáneas filtrados por org0, org1 y periodo (QnaAplica)
   * @param org0 Clave orgánica nivel 0
   * @param org1 Clave orgánica nivel 1
   * @param periodo Quincena de aplicación (QnaAplica)
   * @returns Lista de registros de Formato_Extemporanea
   */
  findByOrg0Org1Periodo(org0: string, org1: string, periodo: number): Promise<FormatoExtemporanea[]>;
}
