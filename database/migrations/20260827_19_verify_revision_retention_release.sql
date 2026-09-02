SET NOCOUNT ON;

IF OBJECT_ID(N'reportes.catalogoRevision', N'U') IS NULL
  THROW 51820, 'No existe reportes.catalogoRevision.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM reportes.catalogoRevision
  WHERE numeroConcepto = 13
    AND concepto = N'Liberación de retenciones con fondo de Ahorro'
    AND activo = 1
)
  THROW 51821, 'El concepto 13 consolidado no esta activo o su nombre es incorrecto.', 1;

IF EXISTS (
  SELECT 1 FROM reportes.catalogoRevision
  WHERE numeroConcepto IN (15, 16) AND activo = 1
)
  THROW 51822, 'Los conceptos 15 y 16 deben permanecer inactivos.', 1;

SELECT numeroConcepto, concepto, activo
FROM reportes.catalogoRevision
WHERE numeroConcepto IN (13, 15, 16)
ORDER BY numeroConcepto;

PRINT 'REVISION_RETENTION_RELEASE_VERIFY_OK';
