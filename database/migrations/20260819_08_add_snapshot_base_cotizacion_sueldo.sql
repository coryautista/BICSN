SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'aportaciones.SnapshotCalculoV2Detalle', N'U') IS NULL
  THROW 51580, 'Falta aportaciones.SnapshotCalculoV2Detalle.', 1;

IF COL_LENGTH(N'aportaciones.SnapshotCalculoV2Detalle', N'BaseCotizacionSueldoD6') IS NULL
BEGIN
  ALTER TABLE aportaciones.SnapshotCalculoV2Detalle
    ADD BaseCotizacionSueldoD6 DECIMAL(19,6) NULL;
END;
GO

IF COL_LENGTH(N'aportaciones.SnapshotCalculoV2Detalle', N'BaseCotizacionSueldoD6') IS NULL
  THROW 51581, 'No se creo BaseCotizacionSueldoD6.', 1;

SELECT
  DB_NAME() AS BaseDatos,
  COL_LENGTH(N'aportaciones.SnapshotCalculoV2Detalle', N'BaseCotizacionSueldoD6') AS LongitudColumna,
  (SELECT COUNT_BIG(1) FROM aportaciones.SnapshotCalculoV2) AS Snapshots,
  (SELECT COUNT_BIG(1) FROM aportaciones.SnapshotCalculoV2Detalle) AS Detalles,
  'SNAPSHOT_BASE_COTIZACION_SUELDO_SCHEMA_OK' AS Resultado;
GO
