SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'liquidacion.QnaAplicacionIntento',N'U') IS NULL
BEGIN
  CREATE TABLE liquidacion.QnaAplicacionIntento(
    QnaAplicacionIntentoId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaAplicacionIntento PRIMARY KEY,
    IntentoUuid UNIQUEIDENTIFIER NOT NULL,QnaProcesoId BIGINT NOT NULL,LiquidacionSnapshotId BIGINT NOT NULL,AfectacionId BIGINT NOT NULL,
    NumeroIntento INT NOT NULL,Estado VARCHAR(30) NOT NULL,Fase VARCHAR(30) NOT NULL,Activo BIT NOT NULL,
    ClaimToken UNIQUEIDENTIFIER NULL,ClaimTipo VARCHAR(20) NULL,LeaseExpiraEn DATETIME2(3) NULL,Actor NVARCHAR(100) NOT NULL,
    FechaCreacion DATETIME2(3) NOT NULL,FechaActualizacion DATETIME2(3) NOT NULL
  );
END;
GO

IF OBJECT_ID(N'liquidacion.QnaAplicacionIntentoEvento',N'U') IS NULL
BEGIN
  CREATE TABLE liquidacion.QnaAplicacionIntentoEvento(
    QnaAplicacionIntentoEventoId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaAplicacionIntentoEvento PRIMARY KEY,
    QnaAplicacionIntentoId BIGINT NOT NULL,TipoEvento VARCHAR(30) NOT NULL,Estado VARCHAR(30) NOT NULL,Fase VARCHAR(30) NOT NULL,
    ClaimToken UNIQUEIDENTIFIER NULL,Motivo NVARCHAR(500) NULL,EvidenciaHash CHAR(64) NULL,Actor NVARCHAR(100) NOT NULL,FechaCreacion DATETIME2(3) NOT NULL
  );
END;
GO

IF OBJECT_ID(N'liquidacion.QnaAplicacionResolucion',N'U') IS NULL
BEGIN
  CREATE TABLE liquidacion.QnaAplicacionResolucion(
    QnaAplicacionResolucionId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaAplicacionResolucion PRIMARY KEY,
    QnaAplicacionIntentoId BIGINT NOT NULL,Resolucion VARCHAR(20) NOT NULL,MotivoNormalizado NVARCHAR(150) NOT NULL,
    Evidencia NVARCHAR(150) NOT NULL,EvidenciaHash CHAR(64) NOT NULL,Actor NVARCHAR(100) NOT NULL,FechaCreacion DATETIME2(3) NOT NULL
  );
END;
GO

IF EXISTS(SELECT 1 FROM liquidacion.QnaAplicacionIntento WHERE NOT(
  (Estado='ACTIVO' AND Fase='FIREBIRD' AND Activo=1 AND ClaimToken IS NOT NULL AND ClaimTipo='FIREBIRD' AND LeaseExpiraEn IS NOT NULL) OR
  (Estado='INCIERTO' AND Fase='FIREBIRD' AND Activo=1 AND ClaimToken IS NULL AND ClaimTipo IS NULL AND LeaseExpiraEn IS NULL) OR
  (Estado='REVERTIDO' AND Fase='FIREBIRD' AND Activo=0 AND ClaimToken IS NULL AND ClaimTipo IS NULL AND LeaseExpiraEn IS NULL) OR
  (Estado='CONFIRMADO' AND Fase IN('LINEA','REVISA','BITACORA') AND Activo=1 AND ((ClaimToken IS NULL AND ClaimTipo IS NULL AND LeaseExpiraEn IS NULL) OR (ClaimToken IS NOT NULL AND ClaimTipo='RECUPERACION' AND LeaseExpiraEn IS NOT NULL))) OR
  (Estado='TERMINADO' AND Fase='TERMINADO' AND Activo=0 AND ClaimToken IS NULL AND ClaimTipo IS NULL AND LeaseExpiraEn IS NULL)))
  THROW 51633,'QNA_APLICACION_INTENTO_DATOS_INCOMPATIBLES',1;

DECLARE @DropDefaults NVARCHAR(MAX)=N'';
SELECT @DropDefaults=@DropDefaults+N'ALTER TABLE '+QUOTENAME(OBJECT_SCHEMA_NAME(dc.parent_object_id))+N'.'+QUOTENAME(OBJECT_NAME(dc.parent_object_id))+N' DROP CONSTRAINT '+QUOTENAME(dc.name)+N';'
FROM sys.default_constraints dc JOIN sys.columns c ON c.object_id=dc.parent_object_id AND c.column_id=dc.parent_column_id
WHERE (dc.parent_object_id=OBJECT_ID('liquidacion.QnaAplicacionIntento') AND c.name IN('FechaCreacion','FechaActualizacion'))
   OR (dc.parent_object_id=OBJECT_ID('liquidacion.QnaAplicacionIntentoEvento') AND c.name='FechaCreacion')
   OR (dc.parent_object_id=OBJECT_ID('liquidacion.QnaAplicacionResolucion') AND c.name='FechaCreacion');
IF @DropDefaults<>N'' EXEC sys.sp_executesql @DropDefaults;
ALTER TABLE liquidacion.QnaAplicacionIntento ADD CONSTRAINT DF_QnaAplicacionIntento_Creacion DEFAULT SYSUTCDATETIME() FOR FechaCreacion;
ALTER TABLE liquidacion.QnaAplicacionIntento ADD CONSTRAINT DF_QnaAplicacionIntento_Actualizacion DEFAULT SYSUTCDATETIME() FOR FechaActualizacion;
ALTER TABLE liquidacion.QnaAplicacionIntentoEvento ADD CONSTRAINT DF_QnaAplicacionIntentoEvento_Creacion DEFAULT SYSUTCDATETIME() FOR FechaCreacion;
ALTER TABLE liquidacion.QnaAplicacionResolucion ADD CONSTRAINT DF_QnaAplicacionResolucion_Creacion DEFAULT SYSUTCDATETIME() FOR FechaCreacion;
GO

IF OBJECT_ID('liquidacion.CK_QnaAplicacionIntento_Estado','C') IS NOT NULL ALTER TABLE liquidacion.QnaAplicacionIntento DROP CONSTRAINT CK_QnaAplicacionIntento_Estado;
ALTER TABLE liquidacion.QnaAplicacionIntento WITH CHECK ADD CONSTRAINT CK_QnaAplicacionIntento_Estado CHECK(Estado IN('ACTIVO','INCIERTO','REVERTIDO','CONFIRMADO','TERMINADO'));
IF OBJECT_ID('liquidacion.CK_QnaAplicacionIntento_Fase','C') IS NOT NULL ALTER TABLE liquidacion.QnaAplicacionIntento DROP CONSTRAINT CK_QnaAplicacionIntento_Fase;
ALTER TABLE liquidacion.QnaAplicacionIntento WITH CHECK ADD CONSTRAINT CK_QnaAplicacionIntento_Fase CHECK(Fase IN('FIREBIRD','LINEA','REVISA','BITACORA','TERMINADO'));
IF OBJECT_ID('liquidacion.CK_QnaAplicacionIntento_Claim','C') IS NOT NULL ALTER TABLE liquidacion.QnaAplicacionIntento DROP CONSTRAINT CK_QnaAplicacionIntento_Claim;
ALTER TABLE liquidacion.QnaAplicacionIntento WITH CHECK ADD CONSTRAINT CK_QnaAplicacionIntento_Claim CHECK((ClaimToken IS NULL AND ClaimTipo IS NULL AND LeaseExpiraEn IS NULL) OR (ClaimToken IS NOT NULL AND ClaimTipo IN('FIREBIRD','RECUPERACION') AND LeaseExpiraEn IS NOT NULL));
IF OBJECT_ID('liquidacion.CK_QnaAplicacionIntento_Invariante','C') IS NOT NULL ALTER TABLE liquidacion.QnaAplicacionIntento DROP CONSTRAINT CK_QnaAplicacionIntento_Invariante;
ALTER TABLE liquidacion.QnaAplicacionIntento WITH CHECK ADD CONSTRAINT CK_QnaAplicacionIntento_Invariante CHECK(
  (Estado='ACTIVO' AND Fase='FIREBIRD' AND Activo=1 AND ClaimToken IS NOT NULL AND ClaimTipo='FIREBIRD' AND LeaseExpiraEn IS NOT NULL) OR
  (Estado='INCIERTO' AND Fase='FIREBIRD' AND Activo=1 AND ClaimToken IS NULL AND ClaimTipo IS NULL AND LeaseExpiraEn IS NULL) OR
  (Estado='REVERTIDO' AND Fase='FIREBIRD' AND Activo=0 AND ClaimToken IS NULL AND ClaimTipo IS NULL AND LeaseExpiraEn IS NULL) OR
  (Estado='CONFIRMADO' AND Fase IN('LINEA','REVISA','BITACORA') AND Activo=1 AND ((ClaimToken IS NULL AND ClaimTipo IS NULL AND LeaseExpiraEn IS NULL) OR (ClaimToken IS NOT NULL AND ClaimTipo='RECUPERACION' AND LeaseExpiraEn IS NOT NULL))) OR
  (Estado='TERMINADO' AND Fase='TERMINADO' AND Activo=0 AND ClaimToken IS NULL AND ClaimTipo IS NULL AND LeaseExpiraEn IS NULL));
IF OBJECT_ID('liquidacion.CK_QnaAplicacionIntentoEvento_Tipo','C') IS NOT NULL ALTER TABLE liquidacion.QnaAplicacionIntentoEvento DROP CONSTRAINT CK_QnaAplicacionIntentoEvento_Tipo;
ALTER TABLE liquidacion.QnaAplicacionIntentoEvento WITH CHECK ADD CONSTRAINT CK_QnaAplicacionIntentoEvento_Tipo CHECK(TipoEvento IN('CREADO','CLAIM_ADQUIRIDO','CLAIM_RENOVADO','CLAIM_LIBERADO','CLAIM_EXPIRADO','FIREBIRD_CONFIRMADO','FIREBIRD_REVERTIDO','APLICACION_INCIERTA','LINEA_CONFIRMADA','REVISA_PROGRAMADA','BITACORA_CONFIRMADA','TERMINADO','RESOLUCION_MANUAL'));
IF OBJECT_ID('liquidacion.CK_QnaAplicacionResolucion_Valor','C') IS NOT NULL ALTER TABLE liquidacion.QnaAplicacionResolucion DROP CONSTRAINT CK_QnaAplicacionResolucion_Valor;
ALTER TABLE liquidacion.QnaAplicacionResolucion WITH CHECK ADD CONSTRAINT CK_QnaAplicacionResolucion_Valor CHECK(Resolucion IN('CONFIRMADA','REVERTIDA'));
GO

IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID('liquidacion.QnaAplicacionIntento') AND type='PK')
  ALTER TABLE liquidacion.QnaAplicacionIntento ADD CONSTRAINT PK_QnaAplicacionIntento PRIMARY KEY(QnaAplicacionIntentoId);
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID('liquidacion.QnaAplicacionIntentoEvento') AND type='PK')
  ALTER TABLE liquidacion.QnaAplicacionIntentoEvento ADD CONSTRAINT PK_QnaAplicacionIntentoEvento PRIMARY KEY(QnaAplicacionIntentoEventoId);
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID('liquidacion.QnaAplicacionResolucion') AND type='PK')
  ALTER TABLE liquidacion.QnaAplicacionResolucion ADD CONSTRAINT PK_QnaAplicacionResolucion PRIMARY KEY(QnaAplicacionResolucionId);
GO

IF OBJECT_ID('liquidacion.FK_QnaAplicacionIntento_Proceso','F') IS NOT NULL ALTER TABLE liquidacion.QnaAplicacionIntento DROP CONSTRAINT FK_QnaAplicacionIntento_Proceso;
ALTER TABLE liquidacion.QnaAplicacionIntento WITH CHECK ADD CONSTRAINT FK_QnaAplicacionIntento_Proceso FOREIGN KEY(QnaProcesoId) REFERENCES liquidacion.QnaProceso(QnaProcesoId);
IF OBJECT_ID('liquidacion.FK_QnaAplicacionIntento_Snapshot','F') IS NOT NULL ALTER TABLE liquidacion.QnaAplicacionIntento DROP CONSTRAINT FK_QnaAplicacionIntento_Snapshot;
ALTER TABLE liquidacion.QnaAplicacionIntento WITH CHECK ADD CONSTRAINT FK_QnaAplicacionIntento_Snapshot FOREIGN KEY(LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot(LiquidacionSnapshotId);
IF OBJECT_ID('liquidacion.FK_QnaAplicacionIntento_Afectacion','F') IS NOT NULL ALTER TABLE liquidacion.QnaAplicacionIntento DROP CONSTRAINT FK_QnaAplicacionIntento_Afectacion;
ALTER TABLE liquidacion.QnaAplicacionIntento WITH CHECK ADD CONSTRAINT FK_QnaAplicacionIntento_Afectacion FOREIGN KEY(AfectacionId) REFERENCES afec.BitacoraAfectacionOrg(AfectacionId);
IF OBJECT_ID('liquidacion.FK_QnaAplicacionIntentoEvento_Intento','F') IS NOT NULL ALTER TABLE liquidacion.QnaAplicacionIntentoEvento DROP CONSTRAINT FK_QnaAplicacionIntentoEvento_Intento;
ALTER TABLE liquidacion.QnaAplicacionIntentoEvento WITH CHECK ADD CONSTRAINT FK_QnaAplicacionIntentoEvento_Intento FOREIGN KEY(QnaAplicacionIntentoId) REFERENCES liquidacion.QnaAplicacionIntento(QnaAplicacionIntentoId);
IF OBJECT_ID('liquidacion.FK_QnaAplicacionResolucion_Intento','F') IS NOT NULL ALTER TABLE liquidacion.QnaAplicacionResolucion DROP CONSTRAINT FK_QnaAplicacionResolucion_Intento;
ALTER TABLE liquidacion.QnaAplicacionResolucion WITH CHECK ADD CONSTRAINT FK_QnaAplicacionResolucion_Intento FOREIGN KEY(QnaAplicacionIntentoId) REFERENCES liquidacion.QnaAplicacionIntento(QnaAplicacionIntentoId);
GO

IF OBJECT_ID('liquidacion.UQ_QnaAplicacionIntento_Uuid','UQ') IS NOT NULL ALTER TABLE liquidacion.QnaAplicacionIntento DROP CONSTRAINT UQ_QnaAplicacionIntento_Uuid;
ALTER TABLE liquidacion.QnaAplicacionIntento ADD CONSTRAINT UQ_QnaAplicacionIntento_Uuid UNIQUE(IntentoUuid);
IF OBJECT_ID('liquidacion.UQ_QnaAplicacionIntento_Numero','UQ') IS NOT NULL ALTER TABLE liquidacion.QnaAplicacionIntento DROP CONSTRAINT UQ_QnaAplicacionIntento_Numero;
ALTER TABLE liquidacion.QnaAplicacionIntento ADD CONSTRAINT UQ_QnaAplicacionIntento_Numero UNIQUE(QnaProcesoId,NumeroIntento);
IF OBJECT_ID('liquidacion.UQ_QnaAplicacionResolucion_Intento','UQ') IS NOT NULL ALTER TABLE liquidacion.QnaAplicacionResolucion DROP CONSTRAINT UQ_QnaAplicacionResolucion_Intento;
ALTER TABLE liquidacion.QnaAplicacionResolucion ADD CONSTRAINT UQ_QnaAplicacionResolucion_Intento UNIQUE(QnaAplicacionIntentoId);
IF EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('liquidacion.QnaAplicacionIntento') AND name='UX_QnaAplicacionIntento_Activo') DROP INDEX UX_QnaAplicacionIntento_Activo ON liquidacion.QnaAplicacionIntento;
CREATE UNIQUE INDEX UX_QnaAplicacionIntento_Activo ON liquidacion.QnaAplicacionIntento(QnaProcesoId) WHERE Activo=1;
IF EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('liquidacion.QnaAplicacionIntento') AND name='UX_QnaAplicacionIntento_Claim') DROP INDEX UX_QnaAplicacionIntento_Claim ON liquidacion.QnaAplicacionIntento;
CREATE UNIQUE INDEX UX_QnaAplicacionIntento_Claim ON liquidacion.QnaAplicacionIntento(QnaProcesoId) WHERE ClaimToken IS NOT NULL;
IF EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('liquidacion.QnaAplicacionIntento') AND name='IX_QnaAplicacionIntento_ProcesoFecha') DROP INDEX IX_QnaAplicacionIntento_ProcesoFecha ON liquidacion.QnaAplicacionIntento;
CREATE INDEX IX_QnaAplicacionIntento_ProcesoFecha ON liquidacion.QnaAplicacionIntento(QnaProcesoId,FechaCreacion DESC,QnaAplicacionIntentoId DESC);
IF EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('liquidacion.QnaAplicacionIntentoEvento') AND name='IX_QnaAplicacionIntentoEvento_IntentoFecha') DROP INDEX IX_QnaAplicacionIntentoEvento_IntentoFecha ON liquidacion.QnaAplicacionIntentoEvento;
CREATE INDEX IX_QnaAplicacionIntentoEvento_IntentoFecha ON liquidacion.QnaAplicacionIntentoEvento(QnaAplicacionIntentoId,FechaCreacion,QnaAplicacionIntentoEventoId);
GO

CREATE OR ALTER TRIGGER liquidacion.TR_QnaAplicacionIntentoEvento_Inmutable ON liquidacion.QnaAplicacionIntentoEvento AFTER UPDATE,DELETE AS
BEGIN SET NOCOUNT ON; THROW 51631,'QNA_APLICACION_INTENTO_EVENTO_APPEND_ONLY',1; END;
GO
CREATE OR ALTER TRIGGER liquidacion.TR_QnaAplicacionResolucion_Inmutable ON liquidacion.QnaAplicacionResolucion AFTER UPDATE,DELETE AS
BEGIN SET NOCOUNT ON; THROW 51632,'QNA_APLICACION_RESOLUCION_INMUTABLE',1; END;
GO
