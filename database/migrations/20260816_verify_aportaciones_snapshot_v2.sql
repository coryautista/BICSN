SET NOCOUNT ON;

IF OBJECT_ID(N'aportaciones.SnapshotCalculoV2', N'U') IS NULL
  THROW 51550, 'Falta aportaciones.SnapshotCalculoV2.', 1;
IF OBJECT_ID(N'aportaciones.SnapshotCalculoV2Detalle', N'U') IS NULL
  THROW 51551, 'Falta aportaciones.SnapshotCalculoV2Detalle.', 1;
IF OBJECT_ID(N'aportaciones.TR_SnapshotCalculoV2_Inmutable', N'TR') IS NULL
  THROW 51552, 'Falta trigger de inmutabilidad de encabezado.', 1;
IF OBJECT_ID(N'aportaciones.TR_SnapshotCalculoV2Detalle_Inmutable', N'TR') IS NULL
  THROW 51553, 'Falta trigger de inmutabilidad de detalle.', 1;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'aportaciones.SnapshotCalculoV2') AND name = N'UX_SnapshotCalculoV2_Hash' AND is_unique = 1)
  THROW 51554, 'Falta unicidad por hash de snapshot.', 1;
IF COL_LENGTH(N'aportaciones.SnapshotCalculoV2', N'FormulaCalculoVersionId') IS NULL
  THROW 51555, 'Falta FormulaCalculoVersionId.', 1;
IF COL_LENGTH(N'aportaciones.SnapshotCalculoV2', N'NominaCargaId') IS NULL
  THROW 51556, 'Falta NominaCargaId.', 1;
IF COL_LENGTH(N'aportaciones.SnapshotCalculoV2Detalle', N'DiasLaborados') IS NULL
  THROW 51557, 'Falta DiasLaborados.', 1;

SELECT
  DB_NAME() AS BaseDatos,
  (SELECT COUNT(*) FROM aportaciones.SnapshotCalculoV2) AS Snapshots,
  (SELECT COUNT(*) FROM aportaciones.SnapshotCalculoV2Detalle) AS Detalles,
  'APORTACIONES_SNAPSHOT_V2_SCHEMA_OK' AS Resultado;
