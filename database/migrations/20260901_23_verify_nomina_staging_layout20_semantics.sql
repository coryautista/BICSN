SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.NominaAplicacionQnalStagingDetalle', N'U') IS NULL
  THROW 51839, 'No existe dbo.NominaAplicacionQnalStagingDetalle.', 1;

IF COL_LENGTH(N'dbo.NominaAplicacionQnalStagingDetalle', N'AyudasMensuales') IS NULL
 OR COL_LENGTH(N'dbo.NominaAplicacionQnalStagingDetalle', N'QuinqueniosMensual') IS NULL
  THROW 51840, 'Firma semantica incompleta de NominaAplicacionQnalStagingDetalle.', 1;

PRINT 'NOMINA_STAGING_LAYOUT20_SEMANTICS_VERIFY_OK';
