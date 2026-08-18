/*
  Clasifica cargas de nomina y marca una unica carga TXT vigente por ambito.
  Ejecutar manualmente en Desarrollo, Calidad y Produccion antes del despliegue.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

IF COL_LENGTH(N'dbo.NominaAplicacionQnalCarga', N'TipoCarga') IS NULL
  EXEC(N'ALTER TABLE dbo.NominaAplicacionQnalCarga ADD TipoCarga VARCHAR(20) NULL;');

IF COL_LENGTH(N'dbo.NominaAplicacionQnalCarga', N'EsVigente') IS NULL
  EXEC(N'ALTER TABLE dbo.NominaAplicacionQnalCarga ADD EsVigente BIT NULL;');

IF COL_LENGTH(N'dbo.NominaAplicacionQnalDetalle', N'RfcNormalizado') IS NULL
  EXEC(N'ALTER TABLE dbo.NominaAplicacionQnalDetalle
    ADD RfcNormalizado AS NULLIF(UPPER(LTRIM(RTRIM(RFC))), '''') PERSISTED;');
GO

BEGIN TRY
  BEGIN TRANSACTION;

  UPDATE dbo.NominaAplicacionQnalCarga
  SET TipoCarga = CASE WHEN ArchivoNombre = N'MOVIMIENTO_AFILIADO' THEN 'MOVIMIENTO' ELSE 'TXT' END
  WHERE TipoCarga IS NULL;

  UPDATE dbo.NominaAplicacionQnalCarga SET EsVigente = 0 WHERE EsVigente IS NULL OR EsVigente = 1;

  ;WITH CargasTxt AS (
    SELECT
      Id,
      ROW_NUMBER() OVER (
        PARTITION BY EntidadId, Anio, Quincena, Organica0, Organica1,
                     ISNULL(Organica2, ''), ISNULL(Organica3, '')
        ORDER BY FechaRegistro DESC, Id DESC
      ) AS Orden
    FROM dbo.NominaAplicacionQnalCarga
    WHERE TipoCarga = 'TXT' AND Estatus = 'APLICADA'
  )
  UPDATE c
  SET EsVigente = 1
  FROM dbo.NominaAplicacionQnalCarga c
  JOIN CargasTxt x ON x.Id = c.Id
  WHERE x.Orden = 1;

  ALTER TABLE dbo.NominaAplicacionQnalCarga ALTER COLUMN TipoCarga VARCHAR(20) NOT NULL;
  ALTER TABLE dbo.NominaAplicacionQnalCarga ALTER COLUMN EsVigente BIT NOT NULL;

  IF OBJECT_ID(N'dbo.DF_NominaAplicacionQnalCarga_TipoCarga', N'D') IS NULL
    ALTER TABLE dbo.NominaAplicacionQnalCarga
      ADD CONSTRAINT DF_NominaAplicacionQnalCarga_TipoCarga DEFAULT ('TXT') FOR TipoCarga;

  IF OBJECT_ID(N'dbo.DF_NominaAplicacionQnalCarga_EsVigente', N'D') IS NULL
    ALTER TABLE dbo.NominaAplicacionQnalCarga
      ADD CONSTRAINT DF_NominaAplicacionQnalCarga_EsVigente DEFAULT (0) FOR EsVigente;

  IF OBJECT_ID(N'dbo.CK_NominaAplicacionQnalCarga_TipoCarga', N'C') IS NULL
    ALTER TABLE dbo.NominaAplicacionQnalCarga
      ADD CONSTRAINT CK_NominaAplicacionQnalCarga_TipoCarga CHECK (TipoCarga IN ('TXT', 'MOVIMIENTO'));

  IF EXISTS (
    SELECT 1
    FROM dbo.NominaAplicacionQnalCarga
    WHERE EsVigente = 1 AND (TipoCarga <> 'TXT' OR Estatus <> 'APLICADA')
  )
    THROW 51300, 'Existen cargas vigentes que no son TXT aplicadas.', 1;

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.NominaAplicacionQnalCarga')
      AND name = N'UX_NominaAplicacionQnalCarga_TxtVigente'
  )
    CREATE UNIQUE INDEX UX_NominaAplicacionQnalCarga_TxtVigente
      ON dbo.NominaAplicacionQnalCarga
        (EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3)
      WHERE EsVigente = 1 AND TipoCarga = 'TXT' AND Estatus = 'APLICADA';

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.NominaAplicacionQnalCarga')
      AND name = N'IX_NominaAplicacionQnalCarga_Seleccion'
  )
    CREATE INDEX IX_NominaAplicacionQnalCarga_Seleccion
      ON dbo.NominaAplicacionQnalCarga
        (EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, TipoCarga, EsVigente, Estatus)
      INCLUDE (Id, ArchivoNombre, TotalLineas, TotalDetalles, FechaRegistro);

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.NominaAplicacionQnalDetalle')
      AND name = N'UX_NominaAplicacionQnalDetalle_AmbitoRfc'
  )
    CREATE UNIQUE INDEX UX_NominaAplicacionQnalDetalle_AmbitoRfc
      ON dbo.NominaAplicacionQnalDetalle
        (EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, RfcNormalizado)
      WHERE RFC IS NOT NULL;

  COMMIT TRANSACTION;

  SELECT DB_NAME() AS BaseDatos, TipoCarga, EsVigente, Estatus, COUNT(*) AS Cargas
  FROM dbo.NominaAplicacionQnalCarga
  GROUP BY TipoCarga, EsVigente, Estatus
  ORDER BY TipoCarga, EsVigente DESC, Estatus;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
