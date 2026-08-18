/* Decisiones administrativas append-only para la conciliacion Snapshot V2. */
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'aportaciones.SnapshotCalculoV2Decision', N'U') IS NULL
BEGIN
  CREATE TABLE aportaciones.SnapshotCalculoV2Decision (
    DecisionId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SnapshotCalculoV2Decision PRIMARY KEY,
    SnapshotId BIGINT NOT NULL,
    Decision VARCHAR(20) NOT NULL,
    PoliticaVersion VARCHAR(50) NOT NULL,
    Comentario NVARCHAR(500) NULL,
    UsuarioId UNIQUEIDENTIFIER NOT NULL,
    FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_SnapshotCalculoV2Decision_Fecha DEFAULT (SYSDATETIME()),
    CONSTRAINT FK_SnapshotCalculoV2Decision_Snapshot FOREIGN KEY (SnapshotId)
      REFERENCES aportaciones.SnapshotCalculoV2 (SnapshotId),
    CONSTRAINT CK_SnapshotCalculoV2Decision_Decision CHECK (Decision IN ('APROBADO', 'OBSERVADO'))
  );

  CREATE INDEX IX_SnapshotCalculoV2Decision_SnapshotFecha
    ON aportaciones.SnapshotCalculoV2Decision (SnapshotId, FechaCreacion DESC, DecisionId DESC);
END;
GO

CREATE OR ALTER TRIGGER aportaciones.TR_SnapshotCalculoV2Decision_Inmutable
ON aportaciones.SnapshotCalculoV2Decision
AFTER UPDATE, DELETE
AS
BEGIN
  SET NOCOUNT ON;
  THROW 51560, 'SNAPSHOT_CALCULO_V2_DECISION_INMUTABLE', 1;
END;
GO
