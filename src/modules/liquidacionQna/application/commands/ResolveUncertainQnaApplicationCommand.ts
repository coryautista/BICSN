import type { QnaScope } from '../../domain/entities/LiquidacionQna.js';
import type { ILiquidacionQnaRepository } from '../../domain/repositories/ILiquidacionQnaRepository.js';
import type { QnaManualResolution } from '../../domain/services/QnaApplicationSagaPolicy.js';
import type { AplicarBDIssspeaQNACommand } from '../../../afiliado/application/commands/AplicarBDIssspeaQNACommand.js';

export class ResolveUncertainQnaApplicationCommand {
  constructor(private liquidacionQnaRepo: ILiquidacionQnaRepository,private aplicarBDIssspeaQNACommand:AplicarBDIssspeaQNACommand) {}

  async execute(input: QnaScope & { liquidacionSnapshotId: string; intentoUuid: string; resolution: QnaManualResolution; motivo: string; evidencia: string; usuarioId: string }) {
    const resolution=await this.liquidacionQnaRepo.resolveUncertainApplication(
      input.liquidacionSnapshotId, input.intentoUuid, input, input.resolution, input.motivo, input.evidencia, input.usuarioId
    );
    if(resolution.action!=='REANUDAR_SQL')return {...resolution,resolutionCommitted:true,recuperacionPendiente:false};
    try{return {...resolution,resolutionCommitted:true,recuperacionPendiente:false,recuperacion:await this.aplicarBDIssspeaQNACommand.execute(input)};}
    catch{return {...resolution,resolutionCommitted:true,recuperacionPendiente:true,
      recuperacionError:{code:'QNA_RECUPERACION_SQL_PENDIENTE',message:'La resolucion fue confirmada; la recuperacion SQL queda pendiente.'}};}
  }
}
