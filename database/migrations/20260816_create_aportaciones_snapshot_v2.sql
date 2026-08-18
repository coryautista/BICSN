/*
  Snapshot inmutable V2 para calculos de aportaciones.
  Es aditivo: no modifica historicos, Linea de Pago ni REVISA.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF SCHEMA_ID(N'aportaciones') IS NULL EXEC(N'CREATE SCHEMA aportaciones');
GO

IF OBJECT_ID(N'aportaciones.SnapshotCalculoV2', N'U') IS NULL
BEGIN
  CREATE TABLE aportaciones.SnapshotCalculoV2 (
    SnapshotId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SnapshotCalculoV2 PRIMARY KEY,
    EntidadId INT NOT NULL,
    Anio SMALLINT NOT NULL,
    Quincena TINYINT NOT NULL,
    Periodo CHAR(4) NOT NULL,
    Organica0 CHAR(2) NOT NULL,
    Organica1 CHAR(2) NOT NULL,
    Organica2 CHAR(2) NOT NULL,
    Organica3 CHAR(2) NOT NULL,
    Ambiente VARCHAR(20) NOT NULL,
    Fuente VARCHAR(30) NOT NULL,
    Estado VARCHAR(30) NOT NULL,
    FormulaCalculoVersionId BIGINT NULL,
    NominaCargaId BIGINT NULL,
    PrecisionPolicy VARCHAR(80) NOT NULL,
    VersionEsquema SMALLINT NOT NULL CONSTRAINT DF_SnapshotCalculoV2_Version DEFAULT (1),
    Revision INT NOT NULL,
    HashContenido CHAR(64) NOT NULL,
    Registros INT NOT NULL,
    CAIR DECIMAL(19,2) NOT NULL,
    FRA DECIMAL(19,2) NOT NULL,
    FRE DECIMAL(19,2) NOT NULL,
    FH DECIMAL(19,2) NOT NULL,
    FV DECIMAL(19,2) NOT NULL,
    FAA DECIMAL(19,2) NOT NULL,
    FAE DECIMAL(19,2) NOT NULL,
    FAT DECIMAL(19,2) NOT NULL,
    FAI DECIMAL(19,2) NOT NULL,
    EsCerrado BIT NOT NULL CONSTRAINT DF_SnapshotCalculoV2_Cerrado DEFAULT (1),
    UsuarioId NVARCHAR(100) NULL,
    FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_SnapshotCalculoV2_Fecha DEFAULT (SYSDATETIME()),
    CONSTRAINT CK_SnapshotCalculoV2_Quincena CHECK (Quincena BETWEEN 1 AND 24),
    CONSTRAINT CK_SnapshotCalculoV2_Periodo CHECK (Periodo = RIGHT('0' + CONVERT(VARCHAR(2), Quincena), 2) + RIGHT(CONVERT(VARCHAR(4), Anio), 2)),
    CONSTRAINT CK_SnapshotCalculoV2_Ambiente CHECK (Ambiente IN ('DESARROLLO', 'CALIDAD', 'PRODUCCION')),
    CONSTRAINT CK_SnapshotCalculoV2_Fuente CHECK (Fuente IN ('LIQUIDACION_V2', 'HISTORICO_SQL')),
    CONSTRAINT CK_SnapshotCalculoV2_Estado CHECK (Estado IN ('COMPLETO', 'AGREGADO_LEGADO', 'INCOMPLETO')),
    CONSTRAINT CK_SnapshotCalculoV2_Hash CHECK (HashContenido NOT LIKE '%[^0-9A-F]%'),
    CONSTRAINT CK_SnapshotCalculoV2_Registros CHECK (Registros >= 0),
    CONSTRAINT FK_SnapshotCalculoV2_Formula FOREIGN KEY (FormulaCalculoVersionId)
      REFERENCES aportaciones.FormulaCalculoVersion (FormulaCalculoVersionId)
  );

  CREATE UNIQUE INDEX UX_SnapshotCalculoV2_Revision
    ON aportaciones.SnapshotCalculoV2
      (EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, Fuente, Revision);

  CREATE UNIQUE INDEX UX_SnapshotCalculoV2_Hash
    ON aportaciones.SnapshotCalculoV2
      (EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, Fuente, HashContenido);
END;
GO

IF OBJECT_ID(N'aportaciones.SnapshotCalculoV2Detalle', N'U') IS NULL
BEGIN
  CREATE TABLE aportaciones.SnapshotCalculoV2Detalle (
    SnapshotDetalleId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SnapshotCalculoV2Detalle PRIMARY KEY,
    SnapshotId BIGINT NOT NULL,
    Orden INT NOT NULL,
    EmpleadoClaveHash CHAR(64) NOT NULL,
    DiasLaborados DECIMAL(5,2) NULL,
    DiasOrigen VARCHAR(40) NOT NULL,
    SueldoMensualD6 DECIMAL(19,6) NULL,
    OtrasPrestacionesMensualesD6 DECIMAL(19,6) NULL,
    QuinqueniosMensualD6 DECIMAL(19,6) NULL,
    BaseCotizacionQuinqueniosD6 DECIMAL(19,6) NULL,
    CAIRD6 DECIMAL(19,6) NULL,
    FRAD6 DECIMAL(19,6) NULL,
    FRED6 DECIMAL(19,6) NULL,
    FHD6 DECIMAL(19,6) NULL,
    FVD6 DECIMAL(19,6) NULL,
    FAAD6 DECIMAL(19,6) NULL,
    FAED6 DECIMAL(19,6) NULL,
    FATD6 DECIMAL(19,6) NULL,
    FAID6 DECIMAL(19,6) NULL,
    CONSTRAINT FK_SnapshotCalculoV2Detalle_Snapshot FOREIGN KEY (SnapshotId)
      REFERENCES aportaciones.SnapshotCalculoV2 (SnapshotId),
    CONSTRAINT UQ_SnapshotCalculoV2Detalle_Orden UNIQUE (SnapshotId, Orden),
    CONSTRAINT UQ_SnapshotCalculoV2Detalle_Empleado UNIQUE (SnapshotId, EmpleadoClaveHash),
    CONSTRAINT CK_SnapshotCalculoV2Detalle_Dias CHECK (DiasLaborados IS NULL OR DiasLaborados BETWEEN 0 AND 15),
    CONSTRAINT CK_SnapshotCalculoV2Detalle_Hash CHECK (EmpleadoClaveHash NOT LIKE '%[^0-9A-F]%')
  );

  CREATE INDEX IX_SnapshotCalculoV2Detalle_Snapshot
    ON aportaciones.SnapshotCalculoV2Detalle (SnapshotId);
END;
GO

CREATE OR ALTER TRIGGER aportaciones.TR_SnapshotCalculoV2_Inmutable
ON aportaciones.SnapshotCalculoV2
AFTER UPDATE, DELETE
AS
BEGIN
  SET NOCOUNT ON;
  THROW 51540, 'SNAPSHOT_CALCULO_V2_INMUTABLE', 1;
END;
GO

CREATE OR ALTER TRIGGER aportaciones.TR_SnapshotCalculoV2Detalle_Inmutable
ON aportaciones.SnapshotCalculoV2Detalle
AFTER UPDATE, DELETE
AS
BEGIN
  SET NOCOUNT ON;
  THROW 51541, 'SNAPSHOT_CALCULO_V2_DETALLE_INMUTABLE', 1;
END;
GO
