SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.NominaAplicacionQnalStagingDetalle', N'U') IS NULL
  THROW 51838, 'No existe dbo.NominaAplicacionQnalStagingDetalle.', 1;

IF COL_LENGTH(N'dbo.NominaAplicacionQnalStagingDetalle', N'AyudasMensuales') IS NULL
  ALTER TABLE dbo.NominaAplicacionQnalStagingDetalle ADD AyudasMensuales DECIMAL(12,2) NULL;

IF COL_LENGTH(N'dbo.NominaAplicacionQnalStagingDetalle', N'QuinqueniosMensual') IS NULL
  ALTER TABLE dbo.NominaAplicacionQnalStagingDetalle ADD QuinqueniosMensual DECIMAL(12,2) NULL;

PRINT 'NOMINA_STAGING_LAYOUT20_SEMANTICS_OK';
