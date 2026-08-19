/* Permite decisiones de Liquidacion QNA bajo la politica monetaria V3. */
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'liquidacion.QnaSnapshotDecision', N'U') IS NULL
  THROW 51630, 'Falta liquidacion.QnaSnapshotDecision; ejecute primero 20260818_02.', 1;

BEGIN TRANSACTION;

IF EXISTS (
  SELECT 1
  FROM sys.check_constraints
  WHERE parent_object_id = OBJECT_ID(N'liquidacion.QnaSnapshotDecision')
    AND name = N'CK_QnaSnapshotDecision_Politica'
)
  ALTER TABLE liquidacion.QnaSnapshotDecision
    DROP CONSTRAINT CK_QnaSnapshotDecision_Politica;

ALTER TABLE liquidacion.QnaSnapshotDecision WITH CHECK
  ADD CONSTRAINT CK_QnaSnapshotDecision_Politica CHECK (PoliticaVersion IN (
    'MXN-DETAIL6-AGG2-TRUNC-v1',
    'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3'
  ));

ALTER TABLE liquidacion.QnaSnapshotDecision
  CHECK CONSTRAINT CK_QnaSnapshotDecision_Politica;

COMMIT TRANSACTION;
GO
