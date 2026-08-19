/* Proceso, transiciones y seleccion oficial; los eventos son append-only. */
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF SCHEMA_ID(N'liquidacion') IS NULL EXEC(N'CREATE SCHEMA liquidacion');
GO

IF OBJECT_ID(N'liquidacion.QnaSnapshot', N'U') IS NULL
  THROW 51609, 'Falta liquidacion.QnaSnapshot; ejecute primero 20260818_01.', 1;
GO

IF OBJECT_ID(N'liquidacion.QnaProceso', N'U') IS NULL
BEGIN
  CREATE TABLE liquidacion.QnaProceso (
    QnaProcesoId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaProceso PRIMARY KEY,
    EntidadId INT NOT NULL,
    Anio SMALLINT NOT NULL,
    Quincena TINYINT NOT NULL,
    Organica0 CHAR(2) NOT NULL,
    Organica1 CHAR(2) NOT NULL,
    Organica2 CHAR(2) NOT NULL,
    Organica3 CHAR(2) NOT NULL,
    UsuarioId NVARCHAR(100) NULL,
    FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaProceso_Fecha DEFAULT (SYSDATETIME()),
    CONSTRAINT UQ_QnaProceso_Contexto UNIQUE (EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3),
    CONSTRAINT CK_QnaProceso_Quincena CHECK (Quincena BETWEEN 1 AND 24)
  );
END;
GO

IF OBJECT_ID(N'liquidacion.QnaProcesoTransicion', N'U') IS NULL
BEGIN
  CREATE TABLE liquidacion.QnaProcesoTransicion (
    QnaProcesoTransicionId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaProcesoTransicion PRIMARY KEY,
    QnaProcesoId BIGINT NOT NULL,
    LiquidacionSnapshotId BIGINT NULL,
    EstadoOrigen VARCHAR(30) NULL,
    EstadoDestino VARCHAR(30) NOT NULL,
    Motivo NVARCHAR(500) NULL,
    UsuarioId NVARCHAR(100) NOT NULL,
    FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaProcesoTransicion_Fecha DEFAULT (SYSDATETIME()),
    CONSTRAINT FK_QnaProcesoTransicion_Proceso FOREIGN KEY (QnaProcesoId) REFERENCES liquidacion.QnaProceso (QnaProcesoId),
    CONSTRAINT FK_QnaProcesoTransicion_Snapshot FOREIGN KEY (LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId),
    CONSTRAINT CK_QnaProcesoTransicion_Destino CHECK (EstadoDestino IN (
      'CREADO','CALCULADO','EN_REVISION','APROBADO','RECHAZADO','OFICIAL','CANCELADO',
      'APLICANDO_FIREBIRD','FIREBIRD_CONFIRMADO','FIREBIRD_REVERTIDO','APLICACION_INCIERTA',
      'LINEA_CONFIRMADA','REVISA_PROGRAMADA','TERMINADO'
    )),
    CONSTRAINT CK_QnaProcesoTransicion_Origen CHECK (EstadoOrigen IS NULL OR EstadoOrigen IN (
      'CREADO','CALCULADO','EN_REVISION','APROBADO','RECHAZADO','OFICIAL','CANCELADO',
      'APLICANDO_FIREBIRD','FIREBIRD_CONFIRMADO','FIREBIRD_REVERTIDO','APLICACION_INCIERTA',
      'LINEA_CONFIRMADA','REVISA_PROGRAMADA','TERMINADO'
    )),
    CONSTRAINT CK_QnaProcesoTransicion_Cambio CHECK (EstadoOrigen IS NULL OR EstadoOrigen <> EstadoDestino)
  );
  CREATE INDEX IX_QnaProcesoTransicion_ProcesoFecha
    ON liquidacion.QnaProcesoTransicion (QnaProcesoId, FechaCreacion DESC, QnaProcesoTransicionId DESC);
END;
GO

IF OBJECT_ID(N'liquidacion.QnaSnapshotSeleccionEvento', N'U') IS NULL
BEGIN
  CREATE TABLE liquidacion.QnaSnapshotSeleccionEvento (
    QnaSnapshotSeleccionEventoId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaSnapshotSeleccionEvento PRIMARY KEY,
    QnaProcesoId BIGINT NOT NULL,
    LiquidacionSnapshotId BIGINT NOT NULL,
    TipoEvento VARCHAR(20) NOT NULL,
    Motivo NVARCHAR(500) NULL,
    UsuarioId NVARCHAR(100) NOT NULL,
    FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaSnapshotSeleccionEvento_Fecha DEFAULT (SYSDATETIME()),
    CONSTRAINT FK_QnaSnapshotSeleccionEvento_Proceso FOREIGN KEY (QnaProcesoId) REFERENCES liquidacion.QnaProceso (QnaProcesoId),
    CONSTRAINT FK_QnaSnapshotSeleccionEvento_Snapshot FOREIGN KEY (LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId),
    CONSTRAINT UQ_QnaSnapshotSeleccionEvento_Contexto UNIQUE (QnaSnapshotSeleccionEventoId, QnaProcesoId, LiquidacionSnapshotId),
    CONSTRAINT CK_QnaSnapshotSeleccionEvento_Tipo CHECK (TipoEvento IN ('SELECCIONADO', 'REEMPLAZADO', 'RETIRADO'))
  );
  CREATE INDEX IX_QnaSnapshotSeleccionEvento_ProcesoFecha
    ON liquidacion.QnaSnapshotSeleccionEvento (QnaProcesoId, FechaCreacion DESC, QnaSnapshotSeleccionEventoId DESC);
END;
GO

IF OBJECT_ID(N'liquidacion.QnaSnapshotDecision', N'U') IS NULL
BEGIN
  CREATE TABLE liquidacion.QnaSnapshotDecision (
    QnaSnapshotDecisionId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaSnapshotDecision PRIMARY KEY,
    LiquidacionSnapshotId BIGINT NOT NULL,
    Decision VARCHAR(20) NOT NULL,
    PoliticaVersion VARCHAR(80) NOT NULL,
    Comentario NVARCHAR(1000) NULL,
    UsuarioId NVARCHAR(100) NOT NULL,
    FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaSnapshotDecision_Fecha DEFAULT (SYSDATETIME()),
    CONSTRAINT FK_QnaSnapshotDecision_Snapshot FOREIGN KEY (LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId),
    CONSTRAINT CK_QnaSnapshotDecision_Decision CHECK (Decision IN ('APROBADO','OBSERVADO')),
    CONSTRAINT CK_QnaSnapshotDecision_Politica CHECK (PoliticaVersion IN (
      'MXN-DETAIL6-AGG2-TRUNC-v1',
      'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3'
    )),
    CONSTRAINT CK_QnaSnapshotDecision_Comentario CHECK (Decision <> 'OBSERVADO' OR Comentario IS NOT NULL)
  );
  CREATE INDEX IX_QnaSnapshotDecision_SnapshotFecha
    ON liquidacion.QnaSnapshotDecision (LiquidacionSnapshotId, FechaCreacion DESC, QnaSnapshotDecisionId DESC);
END;
GO

IF OBJECT_ID(N'liquidacion.QnaSnapshotOficialActual', N'U') IS NULL
BEGIN
  CREATE TABLE liquidacion.QnaSnapshotOficialActual (
    QnaProcesoId BIGINT NOT NULL CONSTRAINT PK_QnaSnapshotOficialActual PRIMARY KEY,
    LiquidacionSnapshotId BIGINT NOT NULL,
    QnaSnapshotSeleccionEventoId BIGINT NOT NULL,
    FechaActualizacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaSnapshotOficialActual_Fecha DEFAULT (SYSDATETIME()),
    CONSTRAINT FK_QnaSnapshotOficialActual_Proceso FOREIGN KEY (QnaProcesoId) REFERENCES liquidacion.QnaProceso (QnaProcesoId),
    CONSTRAINT FK_QnaSnapshotOficialActual_Snapshot FOREIGN KEY (LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot (LiquidacionSnapshotId),
    CONSTRAINT FK_QnaSnapshotOficialActual_Evento FOREIGN KEY (QnaSnapshotSeleccionEventoId, QnaProcesoId, LiquidacionSnapshotId)
      REFERENCES liquidacion.QnaSnapshotSeleccionEvento (QnaSnapshotSeleccionEventoId, QnaProcesoId, LiquidacionSnapshotId),
    CONSTRAINT UQ_QnaSnapshotOficialActual_Snapshot UNIQUE (LiquidacionSnapshotId)
  );
END;
GO

CREATE OR ALTER TRIGGER liquidacion.TR_QnaProceso_Inmutable ON liquidacion.QnaProceso AFTER UPDATE, DELETE AS
BEGIN SET NOCOUNT ON; THROW 51610, 'QNA_PROCESO_INMUTABLE', 1; END;
GO
CREATE OR ALTER TRIGGER liquidacion.TR_QnaProcesoTransicion_Inmutable ON liquidacion.QnaProcesoTransicion AFTER UPDATE, DELETE AS
BEGIN SET NOCOUNT ON; THROW 51611, 'QNA_PROCESO_TRANSICION_APPEND_ONLY', 1; END;
GO
CREATE OR ALTER TRIGGER liquidacion.TR_QnaSnapshotSeleccionEvento_Inmutable ON liquidacion.QnaSnapshotSeleccionEvento AFTER UPDATE, DELETE AS
BEGIN SET NOCOUNT ON; THROW 51612, 'QNA_SNAPSHOT_SELECCION_EVENTO_APPEND_ONLY', 1; END;
GO
CREATE OR ALTER TRIGGER liquidacion.TR_QnaSnapshotDecision_Inmutable ON liquidacion.QnaSnapshotDecision AFTER UPDATE, DELETE AS
BEGIN SET NOCOUNT ON; THROW 51613, 'QNA_SNAPSHOT_DECISION_APPEND_ONLY', 1; END;
GO
