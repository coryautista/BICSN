import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { IFormatoExtemporaneaRepository } from '../../domain/repositories/IFormatoExtemporaneaRepository.js';
import { CreateFormatoExtemporaneaData, FormatoExtemporanea, InternoQnaPair } from '../../domain/entities/FormatoExtemporanea.js';

export class FormatoExtemporaneaRepository implements IFormatoExtemporaneaRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  /** Convierte valor a number (MSSQL puede devolver Decimal como objeto) */
  private toNumber(value: any): number {
    if (value == null || value === '') return 0;
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    const n = Number(typeof value === 'object' && typeof value.valueOf === 'function' ? value.valueOf() : value);
    return Number.isNaN(n) ? 0 : n;
  }

  private mapRowToFormatoExtemporanea(row: any): FormatoExtemporanea {
    return {
      id: row.Id ?? 0,
      qnaAplica: row.QnaAplica ?? 0,
      interno: row.Interno ?? 0,
      org0: String(row.Org0 ?? '').trim(),
      org1: String(row.Org1 ?? '').trim(),
      org2: String(row.Org2 ?? '').trim(),
      org3: String(row.Org3 ?? '').trim(),
      qnasPlus: row.QnasPlus ?? 0,
      cair: this.toNumber(row.Cair),
      fra: this.toNumber(row.Fra),
      fre: this.toNumber(row.Fre),
      fh: this.toNumber(row.Fh),
      fv: this.toNumber(row.Fv),
      faa: this.toNumber(row.Faa),
      fae: this.toNumber(row.Fae),
      usuario: String(row.Usuario ?? '').trim()
    };
  }

  /**
   * Busca pares (Interno, QnaAplica) que ya existen en la base de datos
   * Utiliza una única consulta con tabla temporal para eficiencia
   */
  async findExistingInternoQnaPairs(pairs: InternoQnaPair[]): Promise<InternoQnaPair[]> {
    if (pairs.length === 0) {
      return [];
    }

    // Crear una tabla temporal con los pares a verificar
    const request = this.mssqlPool.request();

    // Construir los VALUES para la tabla temporal
    const valuesClauses = pairs.map((pair, index) => {
      request.input(`interno${index}`, sql.Int, pair.interno);
      request.input(`qna${index}`, sql.Int, pair.qnaAplica);
      return `(@interno${index}, @qna${index})`;
    }).join(', ');

    const query = `
      ;WITH ParesBuscar AS (
        SELECT * FROM (VALUES ${valuesClauses}) AS t(Interno, QnaAplica)
      )
      SELECT f.Interno, f.QnaAplica
      FROM afi.Formato_Extemporanea f
      INNER JOIN ParesBuscar p ON f.Interno = p.Interno AND f.QnaAplica = p.QnaAplica
    `;

    const result = await request.query(query);

    return result.recordset.map((row: any) => ({
      interno: row.Interno,
      qnaAplica: row.QnaAplica
    }));
  }

  /**
   * Inserta un lote de registros en la tabla afi.Formato_Extemporanea
   * Utiliza inserción múltiple para eficiencia
   */
  async insertLote(items: CreateFormatoExtemporaneaData[]): Promise<number> {
    if (items.length === 0) {
      return 0;
    }

    // Para lotes grandes, dividir en chunks de 100 registros
    const CHUNK_SIZE = 100;
    let totalInserted = 0;

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const request = this.mssqlPool.request();

      // Construir los VALUES para el INSERT múltiple
      const valuesClauses = chunk.map((item, index) => {
        request.input(`qnaAplica${index}`, sql.Int, item.qnaAplica);
        request.input(`interno${index}`, sql.Int, item.interno);
        request.input(`org0_${index}`, sql.VarChar(2), item.org0);
        request.input(`org1_${index}`, sql.VarChar(2), item.org1);
        request.input(`org2_${index}`, sql.VarChar(2), item.org2);
        request.input(`org3_${index}`, sql.VarChar(2), item.org3);
        request.input(`qnasPlus${index}`, sql.Int, item.qnasPlus);
        request.input(`cair${index}`, sql.Decimal(18, 2), item.cair);
        request.input(`fra${index}`, sql.Decimal(18, 2), item.fra);
        request.input(`fre${index}`, sql.Decimal(18, 2), item.fre);
        request.input(`fh${index}`, sql.Decimal(18, 2), item.fh);
        request.input(`fv${index}`, sql.Decimal(18, 2), item.fv);
        request.input(`faa${index}`, sql.Decimal(18, 2), item.faa);
        request.input(`fae${index}`, sql.Decimal(18, 2), item.fae);
        request.input(`usuario${index}`, sql.VarChar(50), item.usuario);

        return `(
          @qnaAplica${index}, @interno${index}, @org0_${index}, @org1_${index}, 
          @org2_${index}, @org3_${index}, @qnasPlus${index}, @cair${index}, 
          @fra${index}, @fre${index}, @fh${index}, @fv${index}, 
          @faa${index}, @fae${index}, @usuario${index}
        )`;
      }).join(', ');

      const query = `
        INSERT INTO afi.Formato_Extemporanea (
          QnaAplica, Interno, Org0, Org1, Org2, Org3, QnasPlus,
          Cair, Fra, Fre, Fh, Fv, Faa, Fae, Usuario
        )
        VALUES ${valuesClauses}
      `;

      const result = await request.query(query);
      totalInserted += result.rowsAffected[0] || 0;
    }

    return totalInserted;
  }

  /**
   * Obtiene los registros de semanas extemporáneas por org0, org1 y periodo (QnaAplica)
   */
  async findByOrg0Org1Periodo(org0: string, org1: string, periodo: number): Promise<FormatoExtemporanea[]> {
    const result = await this.mssqlPool.request()
      .input('org0', sql.VarChar(2), org0)
      .input('org1', sql.VarChar(2), org1)
      .input('periodo', sql.Int, periodo)
      .query(`
        SELECT
          Id,
          QnaAplica,
          Interno,
          Org0,
          Org1,
          Org2,
          Org3,
          QnasPlus,
          Cair,
          Fra,
          Fre,
          Fh,
          Fv,
          Faa,
          Fae,
          Usuario
        FROM afi.Formato_Extemporanea
        WHERE Org0 = @org0 AND Org1 = @org1 AND QnaAplica = @periodo
        ORDER BY Interno
      `);

    return result.recordset.map((row: any) => this.mapRowToFormatoExtemporanea(row));
  }
}
