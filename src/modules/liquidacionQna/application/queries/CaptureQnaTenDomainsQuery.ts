import { randomUUID } from 'node:crypto';
import { env } from '../../../../config/env.js';
import type { IAportacionFondoRepository } from '../../../aportacionesFondos/domain/repositories/IAportacionFondoRepository.js';
import type { QnaEnvironment } from '../../domain/entities/LiquidacionQna.js';
import type { QnaCaptureScope, QnaTenDomainCapture } from '../../domain/entities/QnaTenDomainCapture.js';
import { QnaTenDomainCaptureFactory } from '../../domain/services/QnaTenDomainCaptureFactory.js';

export type CaptureQnaTenDomainsInput = QnaCaptureScope & {
  ambiente: QnaEnvironment;
  usuarioId: string;
};

export class CaptureQnaTenDomainsQuery {
  private readonly factory = new QnaTenDomainCaptureFactory();

  constructor(private readonly aportacionFondoRepo: IAportacionFondoRepository) {}

  async execute(input: CaptureQnaTenDomainsInput): Promise<QnaTenDomainCapture> {
    const periodo = `${String(input.quincena).padStart(2, '0')}${String(input.anio).slice(-2)}`;
    if (env.qna.hipLegacyPeriods === null) throw new Error('QNA_HIP_POLICY_NOT_CONFIGURED');
    const hipLegacy = env.qna.hipLegacyPeriods.includes(periodo);
    const hipProcedure = hipLegacy ? 'AP_S_COMP_QNA' : 'AP_S_HIP_QNA';
    const [fondos, identidadesFai, guarderias, transitorio, aguinaldo, pcp, pmp, hip] = await Promise.all([
      this.aportacionFondoRepo.obtenerAportacionesCompletas(
        input.organica0,
        input.organica1,
        periodo,
        { entidadId: input.entidadId, organica2: input.organica2, organica3: input.organica3 }
      ),
      this.aportacionFondoRepo.obtenerFondosFai(input.organica0, input.organica1, periodo),
      this.aportacionFondoRepo.obtenerAportacionGuarderias(input.organica0, input.organica1, periodo),
      this.aportacionFondoRepo.obtenerPensionNominaTransitorio('04', '60', input.organica0, input.organica1, periodo),
      this.aportacionFondoRepo.obtenerAguinaldo(input.organica0, input.organica1, periodo),
      this.aportacionFondoRepo.obtenerPrestamos(input.organica0, input.organica1, periodo),
      this.aportacionFondoRepo.obtenerPrestamosMedianoPlazo(input.organica0, input.organica1, periodo),
      this.aportacionFondoRepo.obtenerPrestamosHipotecarios(input.organica0, input.organica1, periodo, hipLegacy)
    ]);

    const guarderiasConInterno = guarderias.map((row) => {
      if (!Number.isInteger(row.titular_interno) || Number(row.titular_interno) <= 0) {
        throw new Error('QNA_GUARDERIAS_INTERNO_NO_RESUELTO');
      }
      return { interno: Number(row.titular_interno), row };
    });

    return this.factory.create({
      captureId: randomUUID(),
      capturedAt: new Date().toISOString(),
      periodo,
      scope: {
        entidadId: input.entidadId,
        anio: input.anio,
        quincena: input.quincena,
        organica0: input.organica0,
        organica1: input.organica1,
        organica2: input.organica2,
        organica3: input.organica3
      },
      ambiente: input.ambiente,
      usuarioId: input.usuarioId,
      hipProcedure,
      fondos,
      identidadesFai,
      guarderias: guarderiasConInterno,
      transitorio,
      aguinaldo,
      pcp,
      pmp,
      hip
    });
  }
}
