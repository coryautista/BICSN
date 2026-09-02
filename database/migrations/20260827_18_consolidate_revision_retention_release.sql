SET XACT_ABORT ON;

IF OBJECT_ID(N'reportes.catalogoRevision', N'U') IS NULL
  THROW 51818, 'No existe reportes.catalogoRevision.', 1;

IF (SELECT COUNT(*) FROM reportes.catalogoRevision WHERE numeroConcepto = 13) <> 1
  THROW 51819, 'El concepto 13 debe existir exactamente una vez.', 1;

UPDATE reportes.catalogoRevision
SET concepto = N'Liberación de retenciones con fondo de Ahorro',
    activo = 1
WHERE numeroConcepto = 13
  AND (concepto <> N'Liberación de retenciones con fondo de Ahorro' OR activo <> 1);

UPDATE reportes.catalogoRevision
SET activo = 0
WHERE numeroConcepto IN (15, 16)
  AND activo <> 0;
