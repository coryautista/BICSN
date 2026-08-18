/*
  Ejecutar manualmente en la base SQL Server del ambiente objetivo.
  No se ejecuta desde el backend ni desde el script de deploy.
*/

IF SCHEMA_ID(N'reportes') IS NULL
  EXEC(N'CREATE SCHEMA reportes');
GO

SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRANSACTION;

IF OBJECT_ID(N'reportes.EstadoCuentaAhorroHistorico', N'U') IS NULL
BEGIN
  CREATE TABLE reportes.EstadoCuentaAhorroHistorico (
    EstadoCuentaAhorroHistoricoId BIGINT IDENTITY(1, 1) NOT NULL,
    Version INT NOT NULL,
    Estatus VARCHAR(20) NOT NULL CONSTRAINT DF_ECAH_Estatus DEFAULT ('GENERADO'),
    Periodo CHAR(4) NOT NULL,
    Quincena TINYINT NOT NULL,
    Anio SMALLINT NOT NULL,
    FechaCorte DATE NOT NULL,
    Org0 CHAR(2) NOT NULL,
    Org1 CHAR(2) NOT NULL,
    Org2 CHAR(2) NOT NULL CONSTRAINT DF_ECAH_Org2 DEFAULT ('01'),
    Org3 CHAR(2) NOT NULL CONSTRAINT DF_ECAH_Org3 DEFAULT ('01'),
    DependenciaClave NVARCHAR(50) NULL,
    DependenciaNombre NVARCHAR(250) NULL,
    OrganismoNombre NVARCHAR(250) NULL,
    Titulo NVARCHAR(250) NOT NULL CONSTRAINT DF_ECAH_Titulo DEFAULT (N'REVISION DEL ESTADO DE CUENTA DE AHORRO'),
    ParametrosJson NVARCHAR(MAX) NULL,

    SaldoAnteriorCAIR DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAH_SaldoAnteriorCAIR DEFAULT (0),
    SaldoAnteriorFRA DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAH_SaldoAnteriorFRA DEFAULT (0),
    SaldoAnteriorFRE DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAH_SaldoAnteriorFRE DEFAULT (0),
    SaldoAnteriorFH DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAH_SaldoAnteriorFH DEFAULT (0),
    SaldoAnteriorFV DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAH_SaldoAnteriorFV DEFAULT (0),
    SaldoAnteriorFAA DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAH_SaldoAnteriorFAA DEFAULT (0),
    SaldoAnteriorFAE DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAH_SaldoAnteriorFAE DEFAULT (0),
    SaldoAnteriorFAT DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAH_SaldoAnteriorFAT DEFAULT (0),
    SaldoAnteriorFAI DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAH_SaldoAnteriorFAI DEFAULT (0),
    SaldoAnteriorTotal DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAH_SaldoAnteriorTotal DEFAULT (0),

    SaldoCalculadoCAIR DECIMAL(19, 2) NULL,
    SaldoCalculadoFRA DECIMAL(19, 2) NULL,
    SaldoCalculadoFRE DECIMAL(19, 2) NULL,
    SaldoCalculadoFH DECIMAL(19, 2) NULL,
    SaldoCalculadoFV DECIMAL(19, 2) NULL,
    SaldoCalculadoFAA DECIMAL(19, 2) NULL,
    SaldoCalculadoFAE DECIMAL(19, 2) NULL,
    SaldoCalculadoFAT DECIMAL(19, 2) NULL,
    SaldoCalculadoFAI DECIMAL(19, 2) NULL,
    SaldoCalculadoTotal DECIMAL(19, 2) NULL,

    SaldoReportadoCAIR DECIMAL(19, 2) NULL,
    SaldoReportadoFRA DECIMAL(19, 2) NULL,
    SaldoReportadoFRE DECIMAL(19, 2) NULL,
    SaldoReportadoFH DECIMAL(19, 2) NULL,
    SaldoReportadoFV DECIMAL(19, 2) NULL,
    SaldoReportadoFAA DECIMAL(19, 2) NULL,
    SaldoReportadoFAE DECIMAL(19, 2) NULL,
    SaldoReportadoFAT DECIMAL(19, 2) NULL,
    SaldoReportadoFAI DECIMAL(19, 2) NULL,
    SaldoReportadoTotal DECIMAL(19, 2) NULL,

    DiferenciaCAIR DECIMAL(19, 2) NULL,
    DiferenciaFRA DECIMAL(19, 2) NULL,
    DiferenciaFRE DECIMAL(19, 2) NULL,
    DiferenciaFH DECIMAL(19, 2) NULL,
    DiferenciaFV DECIMAL(19, 2) NULL,
    DiferenciaFAA DECIMAL(19, 2) NULL,
    DiferenciaFAE DECIMAL(19, 2) NULL,
    DiferenciaFAT DECIMAL(19, 2) NULL,
    DiferenciaFAI DECIMAL(19, 2) NULL,
    DiferenciaTotal DECIMAL(19, 2) NULL,
    TotalGeneral DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAH_TotalGeneral DEFAULT (0),
    EstadoConciliacion VARCHAR(20) NOT NULL CONSTRAINT DF_ECAH_EstadoConciliacion DEFAULT ('NO_VERIFICABLE'),
    GeneradoPor NVARCHAR(100) NULL,
    GeneradoAt DATETIME2(0) NOT NULL CONSTRAINT DF_ECAH_GeneradoAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT PK_ECAH PRIMARY KEY (EstadoCuentaAhorroHistoricoId),
    CONSTRAINT CK_ECAH_Periodo CHECK (Periodo NOT LIKE '%[^0-9]%' AND LEN(Periodo) = 4),
    CONSTRAINT CK_ECAH_Quincena CHECK (Quincena BETWEEN 1 AND 24),
    CONSTRAINT CK_ECAH_Estatus CHECK (Estatus IN ('GENERADO', 'INCOMPLETO', 'ERROR')),
    CONSTRAINT CK_ECAH_EstadoConciliacion CHECK (EstadoConciliacion IN ('CONCILIADO', 'CON_DIFERENCIA', 'NO_VERIFICABLE'))
  );
END;

IF OBJECT_ID(N'reportes.EstadoCuentaAhorroHistoricoConcepto', N'U') IS NULL
BEGIN
  CREATE TABLE reportes.EstadoCuentaAhorroHistoricoConcepto (
    EstadoCuentaAhorroHistoricoConceptoId BIGINT IDENTITY(1, 1) NOT NULL,
    EstadoCuentaAhorroHistoricoId BIGINT NOT NULL,
    Orden SMALLINT NOT NULL,
    Clave VARCHAR(60) NOT NULL,
    Concepto NVARCHAR(250) NOT NULL,
    TipoMovimiento VARCHAR(20) NOT NULL,
    Signo SMALLINT NOT NULL,
    CAIR DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAHC_CAIR DEFAULT (0),
    FRA DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAHC_FRA DEFAULT (0),
    FRE DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAHC_FRE DEFAULT (0),
    FH DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAHC_FH DEFAULT (0),
    FV DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAHC_FV DEFAULT (0),
    FAA DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAHC_FAA DEFAULT (0),
    FAE DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAHC_FAE DEFAULT (0),
    FAT DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAHC_FAT DEFAULT (0),
    FAI DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAHC_FAI DEFAULT (0),
    Total DECIMAL(19, 2) NOT NULL CONSTRAINT DF_ECAHC_Total DEFAULT (0),
    ProcedimientoOrigen NVARCHAR(150) NULL,
    CampoOrigen NVARCHAR(150) NULL,
    TieneAdvertencia BIT NOT NULL CONSTRAINT DF_ECAHC_TieneAdvertencia DEFAULT (0),
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ECAHC_CreatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT PK_ECAHC PRIMARY KEY (EstadoCuentaAhorroHistoricoConceptoId),
    CONSTRAINT FK_ECAHC_Historico FOREIGN KEY (EstadoCuentaAhorroHistoricoId)
      REFERENCES reportes.EstadoCuentaAhorroHistorico (EstadoCuentaAhorroHistoricoId) ON DELETE CASCADE,
    CONSTRAINT UQ_ECAHC_Historico_Orden UNIQUE (EstadoCuentaAhorroHistoricoId, Orden),
    CONSTRAINT CK_ECAHC_Signo CHECK (Signo IN (-1, 0, 1)),
    CONSTRAINT CK_ECAHC_TipoMovimiento CHECK (TipoMovimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'INFORMATIVO'))
  );
END;

IF OBJECT_ID(N'reportes.EstadoCuentaAhorroHistoricoDetalle', N'U') IS NULL
BEGIN
  CREATE TABLE reportes.EstadoCuentaAhorroHistoricoDetalle (
    EstadoCuentaAhorroHistoricoDetalleId BIGINT IDENTITY(1, 1) NOT NULL,
    EstadoCuentaAhorroHistoricoId BIGINT NOT NULL,
    EstadoCuentaAhorroHistoricoConceptoId BIGINT NULL,
    ProcedimientoOrigen NVARCHAR(150) NOT NULL,
    CampoOrigen NVARCHAR(150) NULL,
    RegistroOrigenClave NVARCHAR(250) NULL,
    RegistroOrigenJson NVARCHAR(MAX) NULL,
    ConceptoClave VARCHAR(60) NOT NULL,
    Interno INT NULL,
    RFC VARCHAR(13) NULL,
    Afiliado NVARCHAR(250) NULL,
    Periodo CHAR(4) NOT NULL,
    Quincena TINYINT NOT NULL,
    Org0 CHAR(2) NOT NULL,
    Org1 CHAR(2) NOT NULL,
    Org2 CHAR(2) NOT NULL,
    Org3 CHAR(2) NOT NULL,
    OrganismoOrigen NVARCHAR(100) NULL,
    OrganismoDestino NVARCHAR(100) NULL,
    Fondo VARCHAR(10) NOT NULL,
    Importe DECIMAL(19, 2) NULL,
    Signo SMALLINT NOT NULL,
    TipoMovimiento VARCHAR(20) NOT NULL,
    Fecha DATE NULL,
    EsDuplicado BIT NOT NULL CONSTRAINT DF_ECAHD_EsDuplicado DEFAULT (0),
    DetalleDuplicadoDeId BIGINT NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ECAHD_CreatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT PK_ECAHD PRIMARY KEY (EstadoCuentaAhorroHistoricoDetalleId),
    CONSTRAINT FK_ECAHD_Historico FOREIGN KEY (EstadoCuentaAhorroHistoricoId)
      REFERENCES reportes.EstadoCuentaAhorroHistorico (EstadoCuentaAhorroHistoricoId) ON DELETE CASCADE,
    CONSTRAINT FK_ECAHD_Concepto FOREIGN KEY (EstadoCuentaAhorroHistoricoConceptoId)
      REFERENCES reportes.EstadoCuentaAhorroHistoricoConcepto (EstadoCuentaAhorroHistoricoConceptoId),
    CONSTRAINT FK_ECAHD_Duplicado FOREIGN KEY (DetalleDuplicadoDeId)
      REFERENCES reportes.EstadoCuentaAhorroHistoricoDetalle (EstadoCuentaAhorroHistoricoDetalleId),
    CONSTRAINT CK_ECAHD_Signo CHECK (Signo IN (-1, 0, 1)),
    CONSTRAINT CK_ECAHD_TipoMovimiento CHECK (TipoMovimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'INFORMATIVO'))
  );
END;

IF OBJECT_ID(N'reportes.EstadoCuentaAhorroHistoricoIncidencia', N'U') IS NULL
BEGIN
  CREATE TABLE reportes.EstadoCuentaAhorroHistoricoIncidencia (
    EstadoCuentaAhorroHistoricoIncidenciaId BIGINT IDENTITY(1, 1) NOT NULL,
    EstadoCuentaAhorroHistoricoId BIGINT NOT NULL,
    Severidad VARCHAR(20) NOT NULL,
    Codigo VARCHAR(80) NOT NULL,
    Mensaje NVARCHAR(2000) NOT NULL,
    ProcedimientoOrigen NVARCHAR(150) NULL,
    ParametrosJson NVARCHAR(MAX) NULL,
    RegistroOrigenClave NVARCHAR(250) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ECAHI_CreatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT PK_ECAHI PRIMARY KEY (EstadoCuentaAhorroHistoricoIncidenciaId),
    CONSTRAINT FK_ECAHI_Historico FOREIGN KEY (EstadoCuentaAhorroHistoricoId)
      REFERENCES reportes.EstadoCuentaAhorroHistorico (EstadoCuentaAhorroHistoricoId) ON DELETE CASCADE,
    CONSTRAINT CK_ECAHI_Severidad CHECK (Severidad IN ('INFO', 'ADVERTENCIA', 'ERROR'))
  );
END;

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID(N'reportes.EstadoCuentaAhorroHistorico')
    AND name = N'IX_ECAH_Consulta'
)
  CREATE INDEX IX_ECAH_Consulta
    ON reportes.EstadoCuentaAhorroHistorico (Periodo, Org0, Org1, Org2, Org3, Version DESC);

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID(N'reportes.EstadoCuentaAhorroHistoricoDetalle')
    AND name = N'IX_ECAHD_Historico_Concepto'
)
  CREATE INDEX IX_ECAHD_Historico_Concepto
    ON reportes.EstadoCuentaAhorroHistoricoDetalle (EstadoCuentaAhorroHistoricoId, ConceptoClave, Fondo);

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0
    ROLLBACK TRANSACTION;
  THROW;
END CATCH;
