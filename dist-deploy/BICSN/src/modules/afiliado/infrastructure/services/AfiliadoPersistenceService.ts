import pino from 'pino';
import { getPool, sql } from '../../../../db/mssql.js';
import type { Afiliado } from '../../domain/entities/Afiliado.js';
import { AfiliadoRepository } from '../persistence/AfiliadoRepository.js';

const logger = pino({
  name: 'afiliado-persistence-service',
  level: process.env.LOG_LEVEL || 'info'
});

async function getRepository(): Promise<AfiliadoRepository> {
  return new AfiliadoRepository(await getPool());
}

export async function getAllAfiliados(): Promise<Afiliado[]> {
  return (await getRepository()).findAll();
}

export async function getAfiliadoById(id: number): Promise<Afiliado | undefined> {
  return (await getRepository()).findById(id);
}

export async function createAfiliado(data: Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>): Promise<Afiliado> {
  return (await getRepository()).create(data);
}

export async function updateAfiliado(id: number, data: Partial<Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Afiliado> {
  return (await getRepository()).update({ id, ...data });
}

export async function deleteAfiliado(id: number): Promise<void> {
  return (await getRepository()).delete(id);
}

export async function actualizarInternoAfiliado(
  afiliadoId: number,
  interno: number,
  usuarioId?: string
): Promise<void> {
  const logContext = {
    operation: 'actualizarInternoAfiliado',
    afiliadoId,
    interno,
    usuarioId
  };

  try {
    logger.info(logContext, `Actualizando INTERNO ${interno} en SQL Server para afiliado ${afiliadoId}`);

    const p = await getPool();
    const result = await p.request()
      .input('afiliadoId', sql.Int, afiliadoId)
      .input('interno', sql.Int, interno)
      .query(`
        UPDATE afi.Afiliado 
        SET interno = @interno, 
            updatedAt = SYSUTCDATETIME()
        WHERE id = @afiliadoId
      `);

    const rowsAffected = result.rowsAffected[0] || 0;

    if (rowsAffected === 0) {
      logger.warn({
        ...logContext,
        rowsAffected
      }, 'No se actualizó ningún registro - Afiliado no encontrado');
      throw new Error(`Afiliado con ID ${afiliadoId} no encontrado para actualizar INTERNO`);
    }

    logger.info({
      ...logContext,
      rowsAffected
    }, 'INTERNO actualizado exitosamente en SQL Server');
  } catch (error: any) {
    logger.error({
      ...logContext,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        number: error.number
      }
    }, 'Error al actualizar INTERNO en SQL Server');
    throw error;
  }
}
