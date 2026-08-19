/* Retenciones V3: contratos tipados D6/A2 y persistencia estrictamente append-only. */
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF SCHEMA_ID(N'retenciones') IS NULL EXEC(N'CREATE SCHEMA retenciones');
GO

IF OBJECT_ID(N'liquidacion.QnaSnapshot', N'U') IS NULL
  THROW 51620, 'Falta liquidacion.QnaSnapshot; ejecute primero 20260818_01.', 1;
GO

IF OBJECT_ID(N'retenciones.RetencionPCPHistoricoV3', N'U') IS NULL
BEGIN
  CREATE TABLE retenciones.RetencionPCPHistoricoV3 (
    RetencionPCPHistoricoV3Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_RetencionPCPHistoricoV3 PRIMARY KEY,
    LiquidacionSnapshotId BIGINT NOT NULL,
    Orden INT NOT NULL,
    EmpleadoClave NVARCHAR(50) NOT NULL,
    Rfc NVARCHAR(20) NULL,
    Prestamo INT NOT NULL,
    Letra INT NULL,
    Plazo INT NULL,
    CapitalD6 DECIMAL(19,6) NOT NULL,
    InteresD6 DECIMAL(19,6) NOT NULL,
    MontoD6 DECIMAL(19,6) NOT NULL,
    MoratoriosD6 DECIMAL(19,6) NOT NULL,
    TotalD6 DECIMAL(19,6) NOT NULL,
    SourceScale TINYINT NOT NULL,
    TotalLoteA2 DECIMAL(19,2) NOT NULL,
    UsuarioId NVARCHAR(100) NOT NULL,
    FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_RetencionPCPHistoricoV3_Fecha DEFAULT (SYSDATETIME()),
    CONSTRAINT FK_RetencionPCPHistoricoV3_Snapshot FOREIGN KEY (LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId),
    CONSTRAINT UQ_RetencionPCPHistoricoV3_Orden UNIQUE (LiquidacionSnapshotId, Orden),
    CONSTRAINT CK_RetencionPCPHistoricoV3_SourceScale CHECK (SourceScale = 2)
  );
  CREATE INDEX IX_RetencionPCPHistoricoV3_Empleado ON retenciones.RetencionPCPHistoricoV3 (LiquidacionSnapshotId, EmpleadoClave);
END;
GO

IF OBJECT_ID(N'retenciones.RetencionPMPHistoricoV3', N'U') IS NULL
BEGIN
  CREATE TABLE retenciones.RetencionPMPHistoricoV3 (
    RetencionPMPHistoricoV3Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_RetencionPMPHistoricoV3 PRIMARY KEY,
    LiquidacionSnapshotId BIGINT NOT NULL,
    Orden INT NOT NULL,
    EmpleadoClave NVARCHAR(50) NOT NULL,
    Rfc NVARCHAR(20) NULL,
    Prestamo INT NOT NULL,
    Letra INT NULL,
    Plazo INT NULL,
    CapitalD6 DECIMAL(19,6) NOT NULL,
    InteresD6 DECIMAL(19,6) NOT NULL,
    MoratoriosD6 DECIMAL(19,6) NOT NULL,
    SeguroD6 DECIMAL(19,6) NOT NULL,
    TotalD6 DECIMAL(19,6) NOT NULL,
    SourceScale TINYINT NOT NULL,
    TotalLoteA2 DECIMAL(19,2) NOT NULL,
    UsuarioId NVARCHAR(100) NOT NULL,
    FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_RetencionPMPHistoricoV3_Fecha DEFAULT (SYSDATETIME()),
    CONSTRAINT FK_RetencionPMPHistoricoV3_Snapshot FOREIGN KEY (LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId),
    CONSTRAINT UQ_RetencionPMPHistoricoV3_Orden UNIQUE (LiquidacionSnapshotId, Orden),
    CONSTRAINT CK_RetencionPMPHistoricoV3_SourceScale CHECK (SourceScale = 2)
  );
  CREATE INDEX IX_RetencionPMPHistoricoV3_Empleado ON retenciones.RetencionPMPHistoricoV3 (LiquidacionSnapshotId, EmpleadoClave);
END;
GO

IF OBJECT_ID(N'retenciones.RetencionHIPHistoricoV3', N'U') IS NULL
BEGIN
  CREATE TABLE retenciones.RetencionHIPHistoricoV3 (
    RetencionHIPHistoricoV3Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_RetencionHIPHistoricoV3 PRIMARY KEY,
    LiquidacionSnapshotId BIGINT NOT NULL,
    Orden INT NOT NULL,
    EmpleadoClave NVARCHAR(50) NOT NULL,
    Rfc NVARCHAR(20) NULL,
    Solicitud INT NOT NULL,
    AnioPrestamo SMALLINT NULL,
    Plazo INT NULL,
    CantidadD6 DECIMAL(19,6) NOT NULL,
    DescuentoD6 DECIMAL(19,6) NOT NULL,
    CapitalD6 DECIMAL(19,6) NOT NULL,
    InteresD6 DECIMAL(19,6) NOT NULL,
    InteresDiferidoD6 DECIMAL(19,6) NOT NULL,
    SeguroD6 DECIMAL(19,6) NOT NULL,
    MoratorioD6 DECIMAL(19,6) NOT NULL,
    TotalD6 DECIMAL(19,6) NOT NULL,
    SourceScale TINYINT NOT NULL,
    TotalLoteA2 DECIMAL(19,2) NOT NULL,
    UsuarioId NVARCHAR(100) NOT NULL,
    FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_RetencionHIPHistoricoV3_Fecha DEFAULT (SYSDATETIME()),
    CONSTRAINT FK_RetencionHIPHistoricoV3_Snapshot FOREIGN KEY (LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId),
    CONSTRAINT UQ_RetencionHIPHistoricoV3_Orden UNIQUE (LiquidacionSnapshotId, Orden),
    CONSTRAINT CK_RetencionHIPHistoricoV3_SourceScale CHECK (SourceScale = 2)
  );
  CREATE INDEX IX_RetencionHIPHistoricoV3_Empleado ON retenciones.RetencionHIPHistoricoV3 (LiquidacionSnapshotId, EmpleadoClave);
END;
GO

IF TYPE_ID(N'retenciones.TVP_RetencionPCPHeader_V3') IS NULL
  EXEC(N'CREATE TYPE retenciones.TVP_RetencionPCPHeader_V3 AS TABLE (
    LiquidacionSnapshotId BIGINT NOT NULL, SourceScale TINYINT NOT NULL,
    Registros INT NOT NULL, TotalA2 DECIMAL(19,2) NOT NULL, UsuarioId NVARCHAR(100) NOT NULL
  )');
GO
IF TYPE_ID(N'retenciones.TVP_RetencionPCPDetalle_V3') IS NULL
  EXEC(N'CREATE TYPE retenciones.TVP_RetencionPCPDetalle_V3 AS TABLE (
    Orden INT NOT NULL, EmpleadoClave NVARCHAR(50) NOT NULL, Rfc NVARCHAR(20) NULL,
    Prestamo INT NOT NULL, Letra INT NULL, Plazo INT NULL,
    CapitalD6 DECIMAL(19,6) NOT NULL, InteresD6 DECIMAL(19,6) NOT NULL,
    MontoD6 DECIMAL(19,6) NOT NULL, MoratoriosD6 DECIMAL(19,6) NOT NULL, TotalD6 DECIMAL(19,6) NOT NULL
  )');
GO
IF TYPE_ID(N'retenciones.TVP_RetencionPMPHeader_V3') IS NULL
  EXEC(N'CREATE TYPE retenciones.TVP_RetencionPMPHeader_V3 AS TABLE (
    LiquidacionSnapshotId BIGINT NOT NULL, SourceScale TINYINT NOT NULL,
    Registros INT NOT NULL, TotalA2 DECIMAL(19,2) NOT NULL, UsuarioId NVARCHAR(100) NOT NULL
  )');
GO
IF TYPE_ID(N'retenciones.TVP_RetencionPMPDetalle_V3') IS NULL
  EXEC(N'CREATE TYPE retenciones.TVP_RetencionPMPDetalle_V3 AS TABLE (
    Orden INT NOT NULL, EmpleadoClave NVARCHAR(50) NOT NULL, Rfc NVARCHAR(20) NULL,
    Prestamo INT NOT NULL, Letra INT NULL, Plazo INT NULL,
    CapitalD6 DECIMAL(19,6) NOT NULL, InteresD6 DECIMAL(19,6) NOT NULL,
    MoratoriosD6 DECIMAL(19,6) NOT NULL, SeguroD6 DECIMAL(19,6) NOT NULL,
    TotalD6 DECIMAL(19,6) NOT NULL
  )');
GO
IF TYPE_ID(N'retenciones.TVP_RetencionHIPHeader_V3') IS NULL
  EXEC(N'CREATE TYPE retenciones.TVP_RetencionHIPHeader_V3 AS TABLE (
    LiquidacionSnapshotId BIGINT NOT NULL, SourceScale TINYINT NOT NULL,
    Registros INT NOT NULL, TotalA2 DECIMAL(19,2) NOT NULL, UsuarioId NVARCHAR(100) NOT NULL
  )');
GO
IF TYPE_ID(N'retenciones.TVP_RetencionHIPDetalle_V3') IS NULL
  EXEC(N'CREATE TYPE retenciones.TVP_RetencionHIPDetalle_V3 AS TABLE (
    Orden INT NOT NULL, EmpleadoClave NVARCHAR(50) NOT NULL, Rfc NVARCHAR(20) NULL,
    Solicitud INT NOT NULL, AnioPrestamo SMALLINT NULL, Plazo INT NULL,
    CantidadD6 DECIMAL(19,6) NOT NULL, DescuentoD6 DECIMAL(19,6) NOT NULL,
    CapitalD6 DECIMAL(19,6) NOT NULL, InteresD6 DECIMAL(19,6) NOT NULL,
    InteresDiferidoD6 DECIMAL(19,6) NOT NULL, SeguroD6 DECIMAL(19,6) NOT NULL,
    MoratorioD6 DECIMAL(19,6) NOT NULL, TotalD6 DECIMAL(19,6) NOT NULL
  )');
GO

CREATE OR ALTER PROCEDURE retenciones.spGuardarRetencionPCPHistorico_V3
  @Header retenciones.TVP_RetencionPCPHeader_V3 READONLY,
  @Detalle retenciones.TVP_RetencionPCPDetalle_V3 READONLY
AS
BEGIN
  SET NOCOUNT ON; SET XACT_ABORT ON;
  IF (SELECT COUNT(*) FROM @Header) <> 1 THROW 51621, 'RETENCION_PCP_V3_REQUIERE_UN_HEADER', 1;
  IF EXISTS (SELECT 1 FROM @Header WHERE SourceScale <> 2 OR Registros < 0) THROW 51622, 'RETENCION_PCP_V3_HEADER_INVALIDO', 1;
  IF (SELECT Registros FROM @Header) <> (SELECT COUNT(*) FROM @Detalle) THROW 51623, 'RETENCION_PCP_V3_CONTEO_INVALIDO', 1;
  IF NOT EXISTS (
    SELECT 1 FROM @Header h
    JOIN liquidacion.QnaSnapshotOficialActual o ON o.LiquidacionSnapshotId=h.LiquidacionSnapshotId
    JOIN liquidacion.QnaSnapshotFuente f ON f.LiquidacionSnapshotId=h.LiquidacionSnapshotId AND f.Dominio='PCP' AND f.Registros=h.Registros
    JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=h.LiquidacionSnapshotId AND t.RetencionPCPA2=h.TotalA2
  ) THROW 51624, 'RETENCION_PCP_V3_SNAPSHOT_NO_COINCIDE', 1;
  IF (SELECT TotalA2 FROM @Header) <> ROUND(COALESCE((SELECT SUM(TotalD6) FROM @Detalle),0),2,1)
    THROW 51633, 'RETENCION_PCP_V3_TOTAL_INVALIDO', 1;
  IF EXISTS (SELECT TotalD6,COUNT_BIG(*) AS Repeticiones FROM @Detalle GROUP BY TotalD6 EXCEPT SELECT ImporteOficialD6,COUNT_BIG(*) FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header) AND Dominio='PCP' GROUP BY ImporteOficialD6)
    OR EXISTS (SELECT ImporteOficialD6,COUNT_BIG(*) AS Repeticiones FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header) AND Dominio='PCP' GROUP BY ImporteOficialD6 EXCEPT SELECT TotalD6,COUNT_BIG(*) FROM @Detalle GROUP BY TotalD6)
    THROW 51634, 'RETENCION_PCP_V3_DETALLE_NO_COINCIDE', 1;
  IF EXISTS (SELECT 1 FROM retenciones.RetencionPCPHistoricoV3 WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header)) RETURN;
  INSERT retenciones.RetencionPCPHistoricoV3
    (LiquidacionSnapshotId, Orden, EmpleadoClave, Rfc, Prestamo, Letra, Plazo, CapitalD6, InteresD6, MontoD6, MoratoriosD6, TotalD6, SourceScale, TotalLoteA2, UsuarioId)
  SELECT h.LiquidacionSnapshotId, d.Orden, d.EmpleadoClave, d.Rfc, d.Prestamo, d.Letra, d.Plazo,
    d.CapitalD6, d.InteresD6, d.MontoD6, d.MoratoriosD6, d.TotalD6, h.SourceScale, h.TotalA2, h.UsuarioId
  FROM @Detalle d CROSS JOIN @Header h;
END;
GO

CREATE OR ALTER PROCEDURE retenciones.spGuardarRetencionPMPHistorico_V3
  @Header retenciones.TVP_RetencionPMPHeader_V3 READONLY,
  @Detalle retenciones.TVP_RetencionPMPDetalle_V3 READONLY
AS
BEGIN
  SET NOCOUNT ON; SET XACT_ABORT ON;
  IF (SELECT COUNT(*) FROM @Header) <> 1 THROW 51625, 'RETENCION_PMP_V3_REQUIERE_UN_HEADER', 1;
  IF EXISTS (SELECT 1 FROM @Header WHERE SourceScale <> 2 OR Registros < 0) THROW 51626, 'RETENCION_PMP_V3_HEADER_INVALIDO', 1;
  IF (SELECT Registros FROM @Header) <> (SELECT COUNT(*) FROM @Detalle) THROW 51627, 'RETENCION_PMP_V3_CONTEO_INVALIDO', 1;
  IF NOT EXISTS (
    SELECT 1 FROM @Header h
    JOIN liquidacion.QnaSnapshotOficialActual o ON o.LiquidacionSnapshotId=h.LiquidacionSnapshotId
    JOIN liquidacion.QnaSnapshotFuente f ON f.LiquidacionSnapshotId=h.LiquidacionSnapshotId AND f.Dominio='PMP' AND f.Registros=h.Registros
    JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=h.LiquidacionSnapshotId AND t.RetencionPMPA2=h.TotalA2
  ) THROW 51628, 'RETENCION_PMP_V3_SNAPSHOT_NO_COINCIDE', 1;
  IF (SELECT TotalA2 FROM @Header) <> ROUND(COALESCE((SELECT SUM(TotalD6) FROM @Detalle),0),2,1)
    THROW 51635, 'RETENCION_PMP_V3_TOTAL_INVALIDO', 1;
  IF EXISTS (SELECT TotalD6,COUNT_BIG(*) AS Repeticiones FROM @Detalle GROUP BY TotalD6 EXCEPT SELECT ImporteOficialD6,COUNT_BIG(*) FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header) AND Dominio='PMP' GROUP BY ImporteOficialD6)
    OR EXISTS (SELECT ImporteOficialD6,COUNT_BIG(*) AS Repeticiones FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header) AND Dominio='PMP' GROUP BY ImporteOficialD6 EXCEPT SELECT TotalD6,COUNT_BIG(*) FROM @Detalle GROUP BY TotalD6)
    THROW 51636, 'RETENCION_PMP_V3_DETALLE_NO_COINCIDE', 1;
  IF EXISTS (SELECT 1 FROM retenciones.RetencionPMPHistoricoV3 WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header)) RETURN;
  INSERT retenciones.RetencionPMPHistoricoV3
    (LiquidacionSnapshotId, Orden, EmpleadoClave, Rfc, Prestamo, Letra, Plazo, CapitalD6, InteresD6, MoratoriosD6, SeguroD6, TotalD6, SourceScale, TotalLoteA2, UsuarioId)
  SELECT h.LiquidacionSnapshotId, d.Orden, d.EmpleadoClave, d.Rfc, d.Prestamo, d.Letra, d.Plazo,
    d.CapitalD6, d.InteresD6, d.MoratoriosD6, d.SeguroD6, d.TotalD6, h.SourceScale, h.TotalA2, h.UsuarioId
  FROM @Detalle d CROSS JOIN @Header h;
END;
GO

CREATE OR ALTER PROCEDURE retenciones.spGuardarRetencionHIPHistorico_V3
  @Header retenciones.TVP_RetencionHIPHeader_V3 READONLY,
  @Detalle retenciones.TVP_RetencionHIPDetalle_V3 READONLY
AS
BEGIN
  SET NOCOUNT ON; SET XACT_ABORT ON;
  IF (SELECT COUNT(*) FROM @Header) <> 1 THROW 51629, 'RETENCION_HIP_V3_REQUIERE_UN_HEADER', 1;
  IF EXISTS (SELECT 1 FROM @Header WHERE SourceScale <> 2 OR Registros < 0) THROW 51630, 'RETENCION_HIP_V3_HEADER_INVALIDO', 1;
  IF (SELECT Registros FROM @Header) <> (SELECT COUNT(*) FROM @Detalle) THROW 51631, 'RETENCION_HIP_V3_CONTEO_INVALIDO', 1;
  IF NOT EXISTS (
    SELECT 1 FROM @Header h
    JOIN liquidacion.QnaSnapshotOficialActual o ON o.LiquidacionSnapshotId=h.LiquidacionSnapshotId
    JOIN liquidacion.QnaSnapshotFuente f ON f.LiquidacionSnapshotId=h.LiquidacionSnapshotId AND f.Dominio='HIP' AND f.Registros=h.Registros
    JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=h.LiquidacionSnapshotId AND t.RetencionHIPA2=h.TotalA2
  ) THROW 51632, 'RETENCION_HIP_V3_SNAPSHOT_NO_COINCIDE', 1;
  IF (SELECT TotalA2 FROM @Header) <> ROUND(COALESCE((SELECT SUM(TotalD6) FROM @Detalle),0),2,1)
    THROW 51637, 'RETENCION_HIP_V3_TOTAL_INVALIDO', 1;
  IF EXISTS (SELECT TotalD6,COUNT_BIG(*) AS Repeticiones FROM @Detalle GROUP BY TotalD6 EXCEPT SELECT ImporteOficialD6,COUNT_BIG(*) FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header) AND Dominio='HIP' GROUP BY ImporteOficialD6)
    OR EXISTS (SELECT ImporteOficialD6,COUNT_BIG(*) AS Repeticiones FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header) AND Dominio='HIP' GROUP BY ImporteOficialD6 EXCEPT SELECT TotalD6,COUNT_BIG(*) FROM @Detalle GROUP BY TotalD6)
    THROW 51638, 'RETENCION_HIP_V3_DETALLE_NO_COINCIDE', 1;
  IF EXISTS (SELECT 1 FROM retenciones.RetencionHIPHistoricoV3 WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header)) RETURN;
  INSERT retenciones.RetencionHIPHistoricoV3
    (LiquidacionSnapshotId, Orden, EmpleadoClave, Rfc, Solicitud, AnioPrestamo, Plazo, CantidadD6, DescuentoD6, CapitalD6, InteresD6, InteresDiferidoD6, SeguroD6, MoratorioD6, TotalD6, SourceScale, TotalLoteA2, UsuarioId)
  SELECT h.LiquidacionSnapshotId, d.Orden, d.EmpleadoClave, d.Rfc, d.Solicitud, d.AnioPrestamo, d.Plazo,
    d.CantidadD6, d.DescuentoD6, d.CapitalD6, d.InteresD6, d.InteresDiferidoD6, d.SeguroD6, d.MoratorioD6, d.TotalD6,
    h.SourceScale, h.TotalA2, h.UsuarioId
  FROM @Detalle d CROSS JOIN @Header h;
END;
GO

CREATE OR ALTER TRIGGER retenciones.TR_RetencionPCPHistoricoV3_Inmutable ON retenciones.RetencionPCPHistoricoV3 AFTER UPDATE, DELETE AS
BEGIN SET NOCOUNT ON; THROW 51633, 'RETENCION_PCP_V3_APPEND_ONLY', 1; END;
GO
CREATE OR ALTER TRIGGER retenciones.TR_RetencionPMPHistoricoV3_Inmutable ON retenciones.RetencionPMPHistoricoV3 AFTER UPDATE, DELETE AS
BEGIN SET NOCOUNT ON; THROW 51634, 'RETENCION_PMP_V3_APPEND_ONLY', 1; END;
GO
CREATE OR ALTER TRIGGER retenciones.TR_RetencionHIPHistoricoV3_Inmutable ON retenciones.RetencionHIPHistoricoV3 AFTER UPDATE, DELETE AS
BEGIN SET NOCOUNT ON; THROW 51635, 'RETENCION_HIP_V3_APPEND_ONLY', 1; END;
GO
