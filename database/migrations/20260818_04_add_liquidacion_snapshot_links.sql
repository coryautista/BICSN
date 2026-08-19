/* Enlaces opcionales: se agregan solo cuando la tabla destino existe. */
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'liquidacion.QnaSnapshot', N'U') IS NULL
  THROW 51640, 'Falta liquidacion.QnaSnapshot; ejecute primero 20260818_01.', 1;
GO

IF OBJECT_ID(N'pagos.LineaCapturaPeriodo', N'U') IS NOT NULL
BEGIN
  IF COL_LENGTH(N'pagos.LineaCapturaPeriodo', N'LiquidacionSnapshotId') IS NULL
    EXEC(N'ALTER TABLE pagos.LineaCapturaPeriodo ADD LiquidacionSnapshotId BIGINT NULL');
  IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    WHERE c.object_id=OBJECT_ID(N'pagos.LineaCapturaPeriodo') AND c.name=N'LiquidacionSnapshotId'
      AND TYPE_NAME(c.user_type_id)=N'bigint' AND c.is_nullable=1
  ) THROW 51641, 'pagos.LineaCapturaPeriodo.LiquidacionSnapshotId debe ser BIGINT NULL.', 1;
  IF OBJECT_ID(N'pagos.FK_LineaCapturaPeriodo_LiquidacionSnapshot', N'F') IS NULL
    EXEC(N'ALTER TABLE pagos.LineaCapturaPeriodo WITH CHECK ADD CONSTRAINT FK_LineaCapturaPeriodo_LiquidacionSnapshot FOREIGN KEY (LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId)');
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'pagos.LineaCapturaPeriodo') AND name=N'UX_LineaCapturaPeriodo_LiquidacionSnapshotId')
    EXEC(N'CREATE UNIQUE INDEX UX_LineaCapturaPeriodo_LiquidacionSnapshotId ON pagos.LineaCapturaPeriodo (LiquidacionSnapshotId) WHERE LiquidacionSnapshotId IS NOT NULL');
END
ELSE PRINT 'OMITIDO: no existe pagos.LineaCapturaPeriodo.';
GO

IF OBJECT_ID(N'conciliacion.RevisionTarea', N'U') IS NOT NULL
BEGIN
  IF COL_LENGTH(N'conciliacion.RevisionTarea', N'LiquidacionSnapshotId') IS NULL
    EXEC(N'ALTER TABLE conciliacion.RevisionTarea ADD LiquidacionSnapshotId BIGINT NULL');
  IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    WHERE c.object_id=OBJECT_ID(N'conciliacion.RevisionTarea') AND c.name=N'LiquidacionSnapshotId'
      AND TYPE_NAME(c.user_type_id)=N'bigint' AND c.is_nullable=1
  ) THROW 51642, 'conciliacion.RevisionTarea.LiquidacionSnapshotId debe ser BIGINT NULL.', 1;
  IF OBJECT_ID(N'conciliacion.FK_RevisionTarea_LiquidacionSnapshot', N'F') IS NULL
    EXEC(N'ALTER TABLE conciliacion.RevisionTarea WITH CHECK ADD CONSTRAINT FK_RevisionTarea_LiquidacionSnapshot FOREIGN KEY (LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId)');
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'conciliacion.RevisionTarea') AND name=N'UX_RevisionTarea_LiquidacionSnapshotId')
    EXEC(N'CREATE UNIQUE INDEX UX_RevisionTarea_LiquidacionSnapshotId ON conciliacion.RevisionTarea (LiquidacionSnapshotId) WHERE LiquidacionSnapshotId IS NOT NULL');
END
ELSE PRINT 'OMITIDO: no existe conciliacion.RevisionTarea.';
GO

IF OBJECT_ID(N'conciliacion.Revision', N'U') IS NOT NULL
BEGIN
  IF COL_LENGTH(N'conciliacion.Revision', N'LiquidacionSnapshotId') IS NULL
    EXEC(N'ALTER TABLE conciliacion.Revision ADD LiquidacionSnapshotId BIGINT NULL');
  IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    WHERE c.object_id=OBJECT_ID(N'conciliacion.Revision') AND c.name=N'LiquidacionSnapshotId'
      AND TYPE_NAME(c.user_type_id)=N'bigint' AND c.is_nullable=1
  ) THROW 51643, 'conciliacion.Revision.LiquidacionSnapshotId debe ser BIGINT NULL.', 1;
  IF OBJECT_ID(N'conciliacion.FK_Revision_LiquidacionSnapshot', N'F') IS NULL
    EXEC(N'ALTER TABLE conciliacion.Revision WITH CHECK ADD CONSTRAINT FK_Revision_LiquidacionSnapshot FOREIGN KEY (LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId)');
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'conciliacion.Revision') AND name=N'IX_Revision_LiquidacionSnapshotId')
    EXEC(N'CREATE INDEX IX_Revision_LiquidacionSnapshotId ON conciliacion.Revision (LiquidacionSnapshotId) WHERE LiquidacionSnapshotId IS NOT NULL');
END
ELSE PRINT 'OMITIDO: no existe conciliacion.Revision.';
GO

IF OBJECT_ID(N'conciliacion.RevisionHistorico', N'U') IS NOT NULL
BEGIN
  IF COL_LENGTH(N'conciliacion.RevisionHistorico', N'LiquidacionSnapshotId') IS NULL
    EXEC(N'ALTER TABLE conciliacion.RevisionHistorico ADD LiquidacionSnapshotId BIGINT NULL');
  IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    WHERE c.object_id=OBJECT_ID(N'conciliacion.RevisionHistorico') AND c.name=N'LiquidacionSnapshotId'
      AND TYPE_NAME(c.user_type_id)=N'bigint' AND c.is_nullable=1
  ) THROW 51644, 'conciliacion.RevisionHistorico.LiquidacionSnapshotId debe ser BIGINT NULL.', 1;
  IF OBJECT_ID(N'conciliacion.FK_RevisionHistorico_LiquidacionSnapshot', N'F') IS NULL
    EXEC(N'ALTER TABLE conciliacion.RevisionHistorico WITH CHECK ADD CONSTRAINT FK_RevisionHistorico_LiquidacionSnapshot FOREIGN KEY (LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId)');
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'conciliacion.RevisionHistorico') AND name=N'IX_RevisionHistorico_LiquidacionSnapshotId')
    EXEC(N'CREATE INDEX IX_RevisionHistorico_LiquidacionSnapshotId ON conciliacion.RevisionHistorico (LiquidacionSnapshotId) WHERE LiquidacionSnapshotId IS NOT NULL');
END
ELSE PRINT 'OMITIDO: no existe conciliacion.RevisionHistorico.';
GO

IF OBJECT_ID(N'conciliacion.RevisionAplicacionHistorico', N'U') IS NOT NULL
BEGIN
  IF COL_LENGTH(N'conciliacion.RevisionAplicacionHistorico', N'LiquidacionSnapshotId') IS NULL
    EXEC(N'ALTER TABLE conciliacion.RevisionAplicacionHistorico ADD LiquidacionSnapshotId BIGINT NULL');
  IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    WHERE c.object_id=OBJECT_ID(N'conciliacion.RevisionAplicacionHistorico') AND c.name=N'LiquidacionSnapshotId'
      AND TYPE_NAME(c.user_type_id)=N'bigint' AND c.is_nullable=1
  ) THROW 51645, 'conciliacion.RevisionAplicacionHistorico.LiquidacionSnapshotId debe ser BIGINT NULL.', 1;
  IF OBJECT_ID(N'conciliacion.FK_RevisionAplicacionHistorico_LiquidacionSnapshot', N'F') IS NULL
    EXEC(N'ALTER TABLE conciliacion.RevisionAplicacionHistorico WITH CHECK ADD CONSTRAINT FK_RevisionAplicacionHistorico_LiquidacionSnapshot FOREIGN KEY (LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId)');
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'conciliacion.RevisionAplicacionHistorico') AND name=N'IX_RevisionAplicacionHistorico_LiquidacionSnapshotId')
    EXEC(N'CREATE INDEX IX_RevisionAplicacionHistorico_LiquidacionSnapshotId ON conciliacion.RevisionAplicacionHistorico (LiquidacionSnapshotId) WHERE LiquidacionSnapshotId IS NOT NULL');
END
ELSE PRINT 'OMITIDO: no existe conciliacion.RevisionAplicacionHistorico.';
GO

IF OBJECT_ID(N'aportaciones.SnapshotCalculoV2', N'U') IS NOT NULL
  AND OBJECT_ID(N'liquidacion.FK_QnaSnapshot_SnapshotCalculoV2', N'F') IS NULL
  ALTER TABLE liquidacion.QnaSnapshot WITH CHECK ADD CONSTRAINT FK_QnaSnapshot_SnapshotCalculoV2
    FOREIGN KEY (SnapshotCalculoV2Id) REFERENCES aportaciones.SnapshotCalculoV2 (SnapshotId);
GO
IF OBJECT_ID(N'dbo.NominaAplicacionQnalCarga', N'U') IS NOT NULL
  AND OBJECT_ID(N'liquidacion.FK_QnaSnapshot_NominaCarga', N'F') IS NULL
  ALTER TABLE liquidacion.QnaSnapshot WITH CHECK ADD CONSTRAINT FK_QnaSnapshot_NominaCarga
    FOREIGN KEY (NominaCargaId) REFERENCES dbo.NominaAplicacionQnalCarga (Id);
GO
IF OBJECT_ID(N'aportaciones.FormulaCalculoVersion', N'U') IS NOT NULL
  AND OBJECT_ID(N'liquidacion.FK_QnaSnapshot_Formula', N'F') IS NULL
  ALTER TABLE liquidacion.QnaSnapshot WITH CHECK ADD CONSTRAINT FK_QnaSnapshot_Formula
    FOREIGN KEY (FormulaCalculoVersionId) REFERENCES aportaciones.FormulaCalculoVersion (FormulaCalculoVersionId);
GO
