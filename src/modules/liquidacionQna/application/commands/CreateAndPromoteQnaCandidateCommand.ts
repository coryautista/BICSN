import { env } from '../../../../config/env.js';
import { resolveDatabaseEnvironment } from '../../../../config/databaseEnvironments.js';
import type { ILiquidacionQnaRepository } from '../../domain/repositories/ILiquidacionQnaRepository.js';
import { qnaFail } from '../../domain/errors.js';
import { QnaOfficialSnapshotV5Factory, type QnaNotApplicableApproval } from '../../domain/services/QnaOfficialSnapshotV5Factory.js';
import type { AppendQnaDecisionCommand } from './AppendQnaDecisionCommand.js';
import type { PromoteQnaSnapshotCommand } from './PromoteQnaSnapshotCommand.js';
import type { CaptureQnaTenDomainsQuery } from '../queries/CaptureQnaTenDomainsQuery.js';

export interface CreateAndPromoteQnaCandidateInput {
  entidadId: number;
  anio: number;
  quincena: number;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
  usuarioId: string;
  roles?: string[];
  notApplicableApprovals?: QnaNotApplicableApproval[];
}

export interface CreateAndPromoteQnaCandidateResult {
  liquidacionSnapshotId: string;
  revision: number;
  hashContenido: string;
  idempotente: boolean;
  promovido: boolean;
  promoted: true;
  legacyProjectionStatus?: 'COMPLETE' | 'WARNING' | 'ERROR';
  legacyProjectionDetails?: string[];
}

export class CreateAndPromoteQnaCandidateCommand {
  private readonly factory = new QnaOfficialSnapshotV5Factory();

  constructor(
    private captureQnaTenDomainsQuery: CaptureQnaTenDomainsQuery,
    private appendQnaDecisionCommand: AppendQnaDecisionCommand,
    private promoteQnaSnapshotCommand: PromoteQnaSnapshotCommand,
    private liquidacionQnaRepo: ILiquidacionQnaRepository
  ) {}

  async execute(input: CreateAndPromoteQnaCandidateInput): Promise<CreateAndPromoteQnaCandidateResult> {
    const ambiente = resolveDatabaseEnvironment(env.sql.database, env.firebird.database);
    if (!ambiente) throw new Error('DATABASE_ENVIRONMENT_MISMATCH');
    const scope = {
      entidadId: input.entidadId,
      anio: input.anio,
      quincena: input.quincena,
      organica0: normalizeOrganica(input.organica0),
      organica1: normalizeOrganica(input.organica1),
      organica2: normalizeOrganica(input.organica2),
      organica3: normalizeOrganica(input.organica3)
    };
    const approvals = input.notApplicableApprovals ?? [];
    if (approvals.length > 0 && !(input.roles ?? []).some((role) => role.trim().toLowerCase() === 'admin')) {
      qnaFail('La aprobacion NOT_APPLICABLE requiere rol administrativo', 'QNA_NOT_APPLICABLE_REQUIERE_ADMIN', 403);
    }
    const candidate = await this.liquidacionQnaRepo.createOfficialV5FromCapture(scope, async () => {
      const capture = await this.captureQnaTenDomainsQuery.execute({ ...scope, ambiente, usuarioId: input.usuarioId });
      return this.factory.create(capture, approvals);
    });
    const persisted = await this.liquidacionQnaRepo.getById(candidate.liquidacionSnapshotId);
    if (!persisted || persisted.estado !== 'COMPLETO' || persisted.fuentesCompletas !== 10) {
      throw new Error('QNA_CANDIDATO_AUTOMATICO_INCOMPLETO');
    }
    if (!persisted.esOficial) {
      if (persisted.ultimaDecision?.decision !== 'APROBADO') {
        await this.appendQnaDecisionCommand.execute(candidate.liquidacionSnapshotId, 'APROBADO',
          'Aprobacion automatica: diez fuentes e invariantes V5 validos', input.usuarioId);
      }
    }
    const promotion = await this.promoteQnaSnapshotCommand.execute(
      candidate.liquidacionSnapshotId, 'Promocion automatica V5 validada', input.usuarioId
    );
    const verified = await this.liquidacionQnaRepo.resolveOfficialById(candidate.liquidacionSnapshotId);
    if (!verified) throw new Error('QNA_PROMOCION_AUTOMATICA_NO_CONFIRMADA');
    return { ...candidate, promovido: true, promoted: true,
      legacyProjectionStatus: promotion.legacyProjectionStatus,
      legacyProjectionDetails: promotion.legacyProjectionDetails };
  }
}

function normalizeOrganica(value: string): string {
  const normalized = String(value).trim().padStart(2, '0');
  if (!/^\d{2}$/.test(normalized)) throw new Error('QNA_ORGANICA_INVALIDA');
  return normalized;
}
