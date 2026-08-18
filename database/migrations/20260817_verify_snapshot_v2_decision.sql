SET NOCOUNT ON;

IF OBJECT_ID(N'aportaciones.SnapshotCalculoV2Decision', N'U') IS NULL
  THROW 51561, 'Falta aportaciones.SnapshotCalculoV2Decision.', 1;
IF OBJECT_ID(N'aportaciones.TR_SnapshotCalculoV2Decision_Inmutable', N'TR') IS NULL
  THROW 51562, 'Falta trigger de inmutabilidad de decisiones.', 1;
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id=OBJECT_ID(N'aportaciones.SnapshotCalculoV2Decision')
    AND name=N'IX_SnapshotCalculoV2Decision_SnapshotFecha'
)
  THROW 51563, 'Falta indice de decisiones por snapshot.', 1;

SELECT DB_NAME() AS BaseDatos,
  (SELECT COUNT(*) FROM aportaciones.SnapshotCalculoV2Decision) AS Decisiones,
  'SNAPSHOT_V2_DECISION_SCHEMA_OK' AS Resultado;
