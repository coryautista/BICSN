/* Snapshot quincenal inmutable. Migracion aditiva para SQL Server. */
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF SCHEMA_ID(N'liquidacion') IS NULL EXEC(N'CREATE SCHEMA liquidacion');
GO

IF OBJECT_ID(N'liquidacion.QnaSnapshot', N'U') IS NULL
BEGIN
  CREATE TABLE liquidacion.QnaSnapshot (
    LiquidacionSnapshotId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaSnapshot PRIMARY KEY,
    EntidadId INT NOT NULL,
    Anio SMALLINT NOT NULL,
    Quincena TINYINT NOT NULL,
    Periodo CHAR(4) NOT NULL,
    Organica0 CHAR(2) NOT NULL,
    Organica1 CHAR(2) NOT NULL,
    Organica2 CHAR(2) NOT NULL,
    Organica3 CHAR(2) NOT NULL,
    Ambiente VARCHAR(20) NOT NULL,
    Estado VARCHAR(20) NOT NULL,
    Revision INT NOT NULL,
    PrecisionPolicy VARCHAR(40) NOT NULL CONSTRAINT DF_QnaSnapshot_Policy DEFAULT ('MXN-DETAIL6-AGG2-TRUNC-v1'),
    VersionEsquema SMALLINT NOT NULL CONSTRAINT DF_QnaSnapshot_Version DEFAULT (3),
    HashContenido CHAR(64) NOT NULL,
    SnapshotCalculoV2Id BIGINT NULL,
    NominaCargaId BIGINT NULL,
    FormulaCalculoVersionId BIGINT NULL,
    FuentesEsperadas TINYINT NOT NULL CONSTRAINT DF_QnaSnapshot_FuentesEsperadas DEFAULT (10),
    FuentesCompletas TINYINT NOT NULL,
    UsuarioId NVARCHAR(100) NULL,
    FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaSnapshot_Fecha DEFAULT (SYSDATETIME()),
    CONSTRAINT CK_QnaSnapshot_Quincena CHECK (Quincena BETWEEN 1 AND 24),
    CONSTRAINT CK_QnaSnapshot_Periodo CHECK (Periodo = RIGHT('0' + CONVERT(VARCHAR(2), Quincena), 2) + RIGHT(CONVERT(VARCHAR(4), Anio), 2)),
    CONSTRAINT CK_QnaSnapshot_Revision CHECK (Revision > 0),
    CONSTRAINT CK_QnaSnapshot_Ambiente CHECK (Ambiente IN ('DESARROLLO', 'CALIDAD', 'PRODUCCION')),
    CONSTRAINT CK_QnaSnapshot_Estado CHECK (Estado IN ('COMPLETO', 'INCOMPLETO')),
    CONSTRAINT CK_QnaSnapshot_Fuentes CHECK (
      FuentesEsperadas = 10 AND FuentesCompletas BETWEEN 0 AND FuentesEsperadas
      AND ((Estado = 'COMPLETO' AND FuentesCompletas = FuentesEsperadas)
        OR (Estado = 'INCOMPLETO' AND FuentesCompletas < FuentesEsperadas))
    ),
    CONSTRAINT CK_QnaSnapshot_Policy CHECK (PrecisionPolicy = 'MXN-DETAIL6-AGG2-TRUNC-v1'),
    CONSTRAINT CK_QnaSnapshot_Hash CHECK (LEN(HashContenido) = 64 AND HashContenido NOT LIKE '%[^0-9A-F]%')
  );

  CREATE UNIQUE INDEX UX_QnaSnapshot_Revision
    ON liquidacion.QnaSnapshot (EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, Revision);
  CREATE UNIQUE INDEX UX_QnaSnapshot_Hash
    ON liquidacion.QnaSnapshot (EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, HashContenido);
END;
GO

IF OBJECT_ID(N'liquidacion.QnaSnapshotFuente', N'U') IS NULL
BEGIN
  CREATE TABLE liquidacion.QnaSnapshotFuente (
    QnaSnapshotFuenteId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaSnapshotFuente PRIMARY KEY,
    LiquidacionSnapshotId BIGINT NOT NULL,
    Dominio VARCHAR(30) NOT NULL,
    TipoFuente VARCHAR(30) NOT NULL,
    Estado VARCHAR(20) NOT NULL,
    Requerida BIT NOT NULL CONSTRAINT DF_QnaSnapshotFuente_Requerida DEFAULT (1),
    IdentificadorFuente NVARCHAR(300) NOT NULL,
    HashFuente CHAR(64) NULL,
    SourceScale TINYINT NOT NULL,
    Registros INT NOT NULL,
    NotApplicableAprobado BIT NOT NULL CONSTRAINT DF_QnaSnapshotFuente_NotApplicable DEFAULT (0),
    AprobadoPor NVARCHAR(100) NULL,
    Evidencia NVARCHAR(500) NULL,
    ErrorCode VARCHAR(100) NULL,
    FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaSnapshotFuente_Fecha DEFAULT (SYSDATETIME()),
    CONSTRAINT FK_QnaSnapshotFuente_Snapshot FOREIGN KEY (LiquidacionSnapshotId)
      REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId),
    CONSTRAINT UQ_QnaSnapshotFuente_Tipo UNIQUE (LiquidacionSnapshotId, Dominio),
    CONSTRAINT CK_QnaSnapshotFuente_Dominio CHECK (Dominio IN ('AHORRO','VIVIENDA','PRESTACIONES','CAIR','GUARDERIAS','TRANSITORIO','AGUINALDO','PCP','PMP','HIP')),
    CONSTRAINT CK_QnaSnapshotFuente_Tipo CHECK (TipoFuente IN ('TXT_NOMINA', 'FIREBIRD', 'SQL_HISTORICO', 'MOVIMIENTO')),
    CONSTRAINT CK_QnaSnapshotFuente_Estado CHECK (Estado IN ('COMPLETE','EMPTY','NOT_APPLICABLE','ERROR')),
    CONSTRAINT CK_QnaSnapshotFuente_SourceScale CHECK (SourceScale IN (2, 6)),
    CONSTRAINT CK_QnaSnapshotFuente_Registros CHECK (Registros >= 0),
    CONSTRAINT CK_QnaSnapshotFuente_Hash CHECK (HashFuente IS NULL OR (LEN(HashFuente) = 64 AND HashFuente NOT LIKE '%[^0-9A-F]%')),
    CONSTRAINT CK_QnaSnapshotFuente_Completitud CHECK (
      (Estado='COMPLETE' AND Registros > 0 AND HashFuente IS NOT NULL)
      OR (Estado='EMPTY' AND Registros = 0)
      OR (Estado='NOT_APPLICABLE' AND Registros = 0 AND NotApplicableAprobado=1 AND AprobadoPor IS NOT NULL AND Evidencia IS NOT NULL)
      OR (Estado='ERROR' AND ErrorCode IS NOT NULL)
    )
  );
  CREATE INDEX IX_QnaSnapshotFuente_Snapshot ON liquidacion.QnaSnapshotFuente (LiquidacionSnapshotId);
END;
GO

IF OBJECT_ID(N'liquidacion.QnaSnapshotTotal', N'U') IS NULL
BEGIN
  CREATE TABLE liquidacion.QnaSnapshotTotal (
    QnaSnapshotTotalId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaSnapshotTotal PRIMARY KEY,
    LiquidacionSnapshotId BIGINT NOT NULL,
    Registros INT NOT NULL,
    CAIRA2 DECIMAL(19,2) NOT NULL,
    FRAA2 DECIMAL(19,2) NOT NULL,
    FREA2 DECIMAL(19,2) NOT NULL,
    FHA2 DECIMAL(19,2) NOT NULL,
    FVA2 DECIMAL(19,2) NOT NULL,
    FAAA2 DECIMAL(19,2) NOT NULL,
    FAEA2 DECIMAL(19,2) NOT NULL,
    FATA2 DECIMAL(19,2) NOT NULL,
    FAIA2 DECIMAL(19,2) NOT NULL,
    AhorroA2 DECIMAL(19,2) NOT NULL,
    ViviendaA2 DECIMAL(19,2) NOT NULL,
    PrestacionesA2 DECIMAL(19,2) NOT NULL,
    GuarderiasA2 DECIMAL(19,2) NOT NULL,
    TransitorioA2 DECIMAL(19,2) NOT NULL,
    AguinaldoA2 DECIMAL(19,2) NOT NULL,
    RetencionPCPA2 DECIMAL(19,2) NOT NULL,
    RetencionPMPA2 DECIMAL(19,2) NOT NULL,
    RetencionHIPA2 DECIMAL(19,2) NOT NULL,
    TotalAportacionesA2 DECIMAL(19,2) NOT NULL,
    TotalRetencionesA2 DECIMAL(19,2) NOT NULL,
    TotalGeneralA2 DECIMAL(19,2) NOT NULL,
    CONSTRAINT FK_QnaSnapshotTotal_Snapshot FOREIGN KEY (LiquidacionSnapshotId)
      REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId),
    CONSTRAINT UQ_QnaSnapshotTotal_Snapshot UNIQUE (LiquidacionSnapshotId),
    CONSTRAINT CK_QnaSnapshotTotal_Registros CHECK (Registros >= 0),
    CONSTRAINT CK_QnaSnapshotTotal_FAT CHECK (FATA2 = FAAA2 + FAEA2),
    CONSTRAINT CK_QnaSnapshotTotal_Aportaciones CHECK (
      TotalAportacionesA2 = AhorroA2 + ViviendaA2 + PrestacionesA2 + CAIRA2 + GuarderiasA2 + TransitorioA2 + AguinaldoA2
    ),
    CONSTRAINT CK_QnaSnapshotTotal_Retenciones CHECK (TotalRetencionesA2 = RetencionPCPA2 + RetencionPMPA2 + RetencionHIPA2),
    CONSTRAINT CK_QnaSnapshotTotal_General CHECK (TotalGeneralA2 = TotalAportacionesA2 + TotalRetencionesA2)
  );
END;
GO

IF OBJECT_ID(N'liquidacion.QnaSnapshotFuenteDetalle', N'U') IS NULL
BEGIN
  CREATE TABLE liquidacion.QnaSnapshotFuenteDetalle (
    QnaSnapshotFuenteDetalleId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaSnapshotFuenteDetalle PRIMARY KEY,
    LiquidacionSnapshotId BIGINT NOT NULL,
    Dominio VARCHAR(30) NOT NULL,
    Orden INT NOT NULL,
    ClaveFilaHash CHAR(64) NOT NULL,
    SourceScale TINYINT NOT NULL,
    ImporteOficialD6 DECIMAL(19,6) NOT NULL,
    PayloadCanonico NVARCHAR(MAX) NOT NULL,
    HashFila CHAR(64) NOT NULL,
    CONSTRAINT FK_QnaSnapshotFuenteDetalle_Snapshot FOREIGN KEY (LiquidacionSnapshotId)
      REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId),
    CONSTRAINT UQ_QnaSnapshotFuenteDetalle_Orden UNIQUE (LiquidacionSnapshotId, Dominio, Orden),
    CONSTRAINT UQ_QnaSnapshotFuenteDetalle_Clave UNIQUE (LiquidacionSnapshotId, Dominio, ClaveFilaHash),
    CONSTRAINT CK_QnaSnapshotFuenteDetalle_Dominio CHECK (Dominio IN ('GUARDERIAS','TRANSITORIO','AGUINALDO','PCP','PMP','HIP')),
    CONSTRAINT CK_QnaSnapshotFuenteDetalle_Orden CHECK (Orden > 0),
    CONSTRAINT CK_QnaSnapshotFuenteDetalle_SourceScale CHECK (SourceScale IN (2,6)),
    CONSTRAINT CK_QnaSnapshotFuenteDetalle_Payload CHECK (ISJSON(PayloadCanonico) = 1),
    CONSTRAINT CK_QnaSnapshotFuenteDetalle_Hashes CHECK (
      ClaveFilaHash NOT LIKE '%[^0-9A-F]%' AND HashFila NOT LIKE '%[^0-9A-F]%'
    )
  );
  CREATE INDEX IX_QnaSnapshotFuenteDetalle_SnapshotDominio
    ON liquidacion.QnaSnapshotFuenteDetalle (LiquidacionSnapshotId, Dominio, Orden);
END;
GO

IF OBJECT_ID(N'liquidacion.QnaSnapshotDetalle', N'U') IS NULL
BEGIN
  CREATE TABLE liquidacion.QnaSnapshotDetalle (
    QnaSnapshotDetalleId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaSnapshotDetalle PRIMARY KEY,
    LiquidacionSnapshotId BIGINT NOT NULL,
    Orden INT NOT NULL,
    EmpleadoClave NVARCHAR(50) NOT NULL,
    Rfc NVARCHAR(20) NULL,
    SourceScale TINYINT NOT NULL,
    SueldoD6 DECIMAL(19,6) NOT NULL,
    OtrasPrestacionesD6 DECIMAL(19,6) NOT NULL,
    QuinqueniosD6 DECIMAL(19,6) NOT NULL,
    CAIRD6 DECIMAL(19,6) NOT NULL,
    FRAD6 DECIMAL(19,6) NOT NULL,
    FRED6 DECIMAL(19,6) NOT NULL,
    FHD6 DECIMAL(19,6) NOT NULL,
    FVD6 DECIMAL(19,6) NOT NULL,
    FAAD6 DECIMAL(19,6) NOT NULL,
    FAED6 DECIMAL(19,6) NOT NULL,
    FATD6 DECIMAL(19,6) NOT NULL,
    FAID6 DECIMAL(19,6) NOT NULL,
    RetencionPCPD6 DECIMAL(19,6) NOT NULL,
    RetencionPMPD6 DECIMAL(19,6) NOT NULL,
    RetencionHIPD6 DECIMAL(19,6) NOT NULL,
    CONSTRAINT FK_QnaSnapshotDetalle_Snapshot FOREIGN KEY (LiquidacionSnapshotId)
      REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId),
    CONSTRAINT UQ_QnaSnapshotDetalle_Orden UNIQUE (LiquidacionSnapshotId, Orden),
    CONSTRAINT CK_QnaSnapshotDetalle_Orden CHECK (Orden > 0),
    CONSTRAINT CK_QnaSnapshotDetalle_SourceScale CHECK (SourceScale IN (2, 6)),
    CONSTRAINT CK_QnaSnapshotDetalle_FAT CHECK (FATD6 = FAAD6 + FAED6)
  );
  CREATE INDEX IX_QnaSnapshotDetalle_SnapshotEmpleado
    ON liquidacion.QnaSnapshotDetalle (LiquidacionSnapshotId, EmpleadoClave);
END;
GO

CREATE OR ALTER TRIGGER liquidacion.TR_QnaSnapshot_Inmutable ON liquidacion.QnaSnapshot AFTER UPDATE, DELETE AS
BEGIN SET NOCOUNT ON; THROW 51600, 'QNA_SNAPSHOT_INMUTABLE', 1; END;
GO
CREATE OR ALTER TRIGGER liquidacion.TR_QnaSnapshotFuente_Inmutable ON liquidacion.QnaSnapshotFuente AFTER UPDATE, DELETE AS
BEGIN SET NOCOUNT ON; THROW 51601, 'QNA_SNAPSHOT_FUENTE_INMUTABLE', 1; END;
GO
CREATE OR ALTER TRIGGER liquidacion.TR_QnaSnapshotTotal_Inmutable ON liquidacion.QnaSnapshotTotal AFTER UPDATE, DELETE AS
BEGIN SET NOCOUNT ON; THROW 51602, 'QNA_SNAPSHOT_TOTAL_INMUTABLE', 1; END;
GO
CREATE OR ALTER TRIGGER liquidacion.TR_QnaSnapshotDetalle_Inmutable ON liquidacion.QnaSnapshotDetalle AFTER UPDATE, DELETE AS
BEGIN SET NOCOUNT ON; THROW 51603, 'QNA_SNAPSHOT_DETALLE_INMUTABLE', 1; END;
GO
CREATE OR ALTER TRIGGER liquidacion.TR_QnaSnapshotFuenteDetalle_Inmutable ON liquidacion.QnaSnapshotFuenteDetalle AFTER UPDATE, DELETE AS
BEGIN SET NOCOUNT ON; THROW 51604, 'QNA_SNAPSHOT_FUENTE_DETALLE_INMUTABLE', 1; END;
GO
