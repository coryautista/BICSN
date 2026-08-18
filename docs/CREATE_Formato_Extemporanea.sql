-- =============================================================================
-- Tabla afi.Formato_Extemporanea (semanas extemporáneas)
-- Ejecutar en SQL Server contra la base de datos que usa la API.
-- Endpoints: POST /v1/afiliado/carga-semanas-extemporaneas (insertar)
--            GET  /v1/afiliado/semanas-extemporaneas?org0=&org1=&periodo= (consultar)
-- =============================================================================

-- Asegurar que el esquema afi exista
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'afi')
  EXEC('CREATE SCHEMA afi');

GO

-- Crear la tabla si no existe
IF NOT EXISTS (
  SELECT * FROM sys.tables t
  INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
  WHERE s.name = 'afi' AND t.name = 'Formato_Extemporanea'
)
BEGIN
  CREATE TABLE afi.Formato_Extemporanea
  (
      Id                   BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Formato_Extemporanea PRIMARY KEY,
      QnaAplica            INT            NOT NULL,
      Interno              INT            NOT NULL,
      Org0                 VARCHAR(2)     NOT NULL,
      Org1                 VARCHAR(2)     NOT NULL,
      Org2                 VARCHAR(2)     NOT NULL,
      Org3                 VARCHAR(2)     NOT NULL,
      QnasPlus             INT            NOT NULL,
      Cair                 DECIMAL(18,2)  NOT NULL,
      Fra                  DECIMAL(18,2)  NOT NULL,
      Fre                  DECIMAL(18,2)  NOT NULL,
      Fh                   DECIMAL(18,2)  NOT NULL,
      Fv                   DECIMAL(18,2)  NOT NULL,
      Faa                  DECIMAL(18,2)  NOT NULL,
      Fae                  DECIMAL(18,2)  NOT NULL,
      Usuario              VARCHAR(50)    NOT NULL
  );

  CREATE INDEX IX_Formato_Extemporanea_Qna_Org_Interno
  ON afi.Formato_Extemporanea (QnaAplica, Org0, Org1, Org2, Org3, Interno);

  PRINT 'Tabla afi.Formato_Extemporanea creada correctamente.';
END
ELSE
  PRINT 'La tabla afi.Formato_Extemporanea ya existe.';

GO
