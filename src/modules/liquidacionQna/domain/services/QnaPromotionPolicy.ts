import { qnaFail } from '../errors.js';

export interface QnaPromotionValidation {
  fuenteNominaVigente: boolean;
  mismoAmbito: boolean;
  mismosEnlaces: boolean;
  snapshotV2Valido: boolean;
  conteosValidos: boolean;
  fuentesValidas: boolean;
  totalesValidos: boolean;
}

export function validateQnaPromotion(validation: QnaPromotionValidation): void {
  if (!validation.fuenteNominaVigente) {
    qnaFail(
      'La fuente nominal del snapshot ya no coincide con el TXT vigente o con su ausencia confirmada.',
      'QNA_NOMINA_CARGA_DESACTUALIZADA'
    );
  }
  if (!validation.mismoAmbito || !validation.mismosEnlaces || !validation.snapshotV2Valido
    || !validation.conteosValidos || !validation.fuentesValidas || !validation.totalesValidos) {
    qnaFail('Los enlaces o evidencias del snapshot no son consistentes.', 'QNA_PROMOCION_INTEGRIDAD_INVALIDA');
  }
}
