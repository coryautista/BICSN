import { qnaFail } from '../errors.js';

export interface QnaPromotionValidation {
  cargaVigente: boolean;
  mismoAmbito: boolean;
  mismosEnlaces: boolean;
  snapshotV2Valido: boolean;
  conteosValidos: boolean;
  fuentesValidas: boolean;
  totalesValidos: boolean;
}

export function validateQnaPromotion(validation: QnaPromotionValidation): void {
  if (!validation.cargaVigente) {
    qnaFail(
      'La carga nominal usada por el snapshot ya no es la carga TXT aplicada vigente.',
      'QNA_NOMINA_CARGA_DESACTUALIZADA'
    );
  }
  if (!validation.mismoAmbito || !validation.mismosEnlaces || !validation.snapshotV2Valido
    || !validation.conteosValidos || !validation.fuentesValidas || !validation.totalesValidos) {
    qnaFail('Los enlaces o evidencias del snapshot no son consistentes.', 'QNA_PROMOCION_INTEGRIDAD_INVALIDA');
  }
}
