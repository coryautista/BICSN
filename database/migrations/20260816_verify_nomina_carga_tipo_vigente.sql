/* Verificacion de clasificacion y seleccion determinista de carga TXT. Solo lectura. */
SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.NominaAplicacionQnalCarga', N'TipoCarga') IS NULL
  THROW 51400, 'Falta la columna TipoCarga.', 1;
IF COL_LENGTH(N'dbo.NominaAplicacionQnalCarga', N'EsVigente') IS NULL
  THROW 51401, 'Falta la columna EsVigente.', 1;
IF COL_LENGTH(N'dbo.NominaAplicacionQnalDetalle', N'RfcNormalizado') IS NULL
  THROW 51406, 'Falta la columna calculada RfcNormalizado.', 1;
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID(N'dbo.NominaAplicacionQnalCarga')
    AND name = N'UX_NominaAplicacionQnalCarga_TxtVigente'
)
  THROW 51402, 'Falta el indice unico de carga TXT vigente.', 1;
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID(N'dbo.NominaAplicacionQnalDetalle')
    AND name = N'UX_NominaAplicacionQnalDetalle_AmbitoRfc'
)
  THROW 51407, 'Falta el indice unico de RFC por ambito.', 1;
IF EXISTS (
  SELECT 1
  FROM dbo.NominaAplicacionQnalCarga
  WHERE EsVigente = 1 AND (TipoCarga <> 'TXT' OR Estatus <> 'APLICADA')
)
  THROW 51403, 'Existe una carga vigente que no es TXT aplicada.', 1;
IF EXISTS (
  SELECT EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3
  FROM dbo.NominaAplicacionQnalCarga
  WHERE EsVigente = 1
  GROUP BY EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3
  HAVING COUNT(*) > 1
)
  THROW 51404, 'Existe mas de una carga vigente para un ambito.', 1;
IF EXISTS (
  SELECT EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, UPPER(LTRIM(RTRIM(RFC))) AS RFC
  FROM dbo.NominaAplicacionQnalDetalle
  WHERE NULLIF(LTRIM(RTRIM(RFC)), '') IS NOT NULL
  GROUP BY EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, UPPER(LTRIM(RTRIM(RFC)))
  HAVING COUNT(*) > 1
)
  THROW 51405, 'Existen RFC duplicados dentro de un ambito vigente.', 1;

SELECT
  DB_NAME() AS BaseDatos,
  TipoCarga,
  EsVigente,
  Estatus,
  COUNT(*) AS Cargas
FROM dbo.NominaAplicacionQnalCarga
GROUP BY TipoCarga, EsVigente, Estatus
ORDER BY TipoCarga, EsVigente DESC, Estatus;

SELECT
  EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3,
  Id AS CargaId, ArchivoNombre, FechaRegistro
FROM dbo.NominaAplicacionQnalCarga
WHERE TipoCarga = 'TXT' AND EsVigente = 1 AND Estatus = 'APLICADA'
ORDER BY Anio, Quincena, Organica0, Organica1, Organica2, Organica3;
