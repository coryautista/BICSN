SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.NominaAplicacionQnalSincronizacion', N'U') IS NULL
  THROW 51831, 'No existe dbo.NominaAplicacionQnalSincronizacion.', 1;
IF OBJECT_ID(N'dbo.NominaAplicacionQnalStagingCarga', N'U') IS NULL
  THROW 51832, 'No existe dbo.NominaAplicacionQnalStagingCarga.', 1;
IF OBJECT_ID(N'dbo.NominaAplicacionQnalStagingDetalle', N'U') IS NULL
  THROW 51833, 'No existe dbo.NominaAplicacionQnalStagingDetalle.', 1;

IF COL_LENGTH(N'dbo.NominaAplicacionQnalSincronizacion', N'IntentoUuid') IS NULL
 OR COL_LENGTH(N'dbo.NominaAplicacionQnalSincronizacion', N'ArchivoHash') IS NULL
 OR COL_LENGTH(N'dbo.NominaAplicacionQnalSincronizacion', N'ResultadoFirebird') IS NULL
 OR COL_LENGTH(N'dbo.NominaAplicacionQnalSincronizacion', N'CargaId') IS NULL
  THROW 51834, 'Firma incompleta de NominaAplicacionQnalSincronizacion.', 1;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.NominaAplicacionQnalSincronizacion') AND name=N'UX_NominaAplicacionQnalSincronizacion_Activa' AND is_unique=1 AND filter_definition=N'([Activo]=(1))')
  THROW 51835, 'Índice de sincronización activa ausente o inválido.', 1;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.NominaAplicacionQnalStagingDetalle') AND name=N'UX_NominaAplicacionQnalStagingDetalle_Rfc' AND is_unique=1)
  THROW 51836, 'Índice de RFC staging ausente o inválido.', 1;
IF EXISTS (
  SELECT 1 FROM sys.foreign_keys
  WHERE parent_object_id IN (OBJECT_ID(N'dbo.NominaAplicacionQnalSincronizacion'),OBJECT_ID(N'dbo.NominaAplicacionQnalStagingCarga'),OBJECT_ID(N'dbo.NominaAplicacionQnalStagingDetalle'))
    AND (is_disabled=1 OR is_not_trusted=1)
)
  THROW 51837, 'Existen llaves foráneas deshabilitadas o no confiables.', 1;

SELECT t.name AS tabla, SUM(p.rows) AS filas
FROM sys.tables t
JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN (0,1)
WHERE t.object_id IN (OBJECT_ID(N'dbo.NominaAplicacionQnalSincronizacion'),OBJECT_ID(N'dbo.NominaAplicacionQnalStagingCarga'),OBJECT_ID(N'dbo.NominaAplicacionQnalStagingDetalle'))
GROUP BY t.name
ORDER BY t.name;

PRINT 'NOMINA_TXT_SYNC_LEDGER_VERIFY_OK';
