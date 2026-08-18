/* Ejecutar una vez antes de desplegar BA_MOVIMIENTO. */
IF EXISTS (
  SELECT 1 FROM sys.check_constraints
  WHERE name = 'CK_EventoCalendario_tipo'
    AND parent_object_id = OBJECT_ID('dbo.EventoCalendario')
)
BEGIN
  ALTER TABLE dbo.EventoCalendario DROP CONSTRAINT CK_EventoCalendario_tipo;
END;
GO

ALTER TABLE dbo.EventoCalendario WITH CHECK ADD CONSTRAINT CK_EventoCalendario_tipo
CHECK ([tipo] IN (
  N'ARCHIVO_APLICACION', N'ASUETO', N'ALTA_BAJA_CAMBIO', N'BA_MOVIMIENTO',
  N'PAGO', N'HIPOTECARIO', N'INTERESES_MORATORIOS', N'REPORTES'
));
GO

IF COL_LENGTH('dbo.EventoCalendario', 'origen') IS NULL
BEGIN
  ALTER TABLE dbo.EventoCalendario ADD origen NVARCHAR(20) NOT NULL
    CONSTRAINT DF_EventoCalendario_origen DEFAULT N'MANUAL';
END;
GO

IF COL_LENGTH('dbo.EventoCalendario', 'periodoQna') IS NULL
BEGIN
  ALTER TABLE dbo.EventoCalendario ADD periodoQna NVARCHAR(4) NULL;
END;
GO

IF COL_LENGTH('dbo.EventoCalendario', 'eventoHipotecarioId') IS NULL
BEGIN
  ALTER TABLE dbo.EventoCalendario ADD eventoHipotecarioId INT NULL;
END;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.check_constraints
  WHERE name = 'CK_EventoCalendario_origen'
    AND parent_object_id = OBJECT_ID('dbo.EventoCalendario')
)
BEGIN
  ALTER TABLE dbo.EventoCalendario WITH CHECK ADD CONSTRAINT CK_EventoCalendario_origen
  CHECK ([origen] IN (N'MANUAL', N'AUTOMATICO'));
END;
GO
