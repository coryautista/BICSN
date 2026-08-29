SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.NominaAplicacionQnalCarga', N'U') IS NULL
  THROW 51830, 'No existe dbo.NominaAplicacionQnalCarga.', 1;

IF OBJECT_ID(N'dbo.NominaAplicacionQnalSincronizacion', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.NominaAplicacionQnalSincronizacion (
    SincronizacionId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_NominaAplicacionQnalSincronizacion PRIMARY KEY,
    IntentoUuid UNIQUEIDENTIFIER NOT NULL CONSTRAINT UQ_NominaAplicacionQnalSincronizacion_Uuid UNIQUE,
    EntidadId INT NOT NULL,
    Anio SMALLINT NOT NULL,
    Quincena TINYINT NOT NULL,
    Organica0 CHAR(2) NOT NULL,
    Organica1 CHAR(2) NOT NULL,
    Organica2 CHAR(2) NOT NULL,
    Organica3 CHAR(2) NOT NULL,
    ArchivoNombre NVARCHAR(255) NOT NULL,
    ArchivoHash CHAR(64) NOT NULL,
    LayoutVersion TINYINT NOT NULL,
    TotalLineas INT NOT NULL,
    TotalDetalles INT NOT NULL,
    Estado VARCHAR(30) NOT NULL,
    Activo BIT NOT NULL CONSTRAINT DF_NominaAplicacionQnalSincronizacion_Activo DEFAULT (1),
    ClaimToken UNIQUEIDENTIFIER NULL,
    LeaseExpiraEn DATETIME2(3) NULL,
    ResultadoFirebird VARCHAR(30) NULL,
    EvidenciaHash CHAR(64) NULL,
    ConteoFirebirdP INT NULL,
    ConteoResumen INT NULL,
    CargaId BIGINT NULL,
    ErrorCodigo VARCHAR(100) NULL,
    ErrorPaso VARCHAR(100) NULL,
    ErrorNormalizado NVARCHAR(500) NULL,
    UsuarioRegistro NVARCHAR(100) NOT NULL,
    FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_NominaAplicacionQnalSincronizacion_FechaCreacion DEFAULT SYSUTCDATETIME(),
    FechaActualizacion DATETIME2(3) NOT NULL CONSTRAINT DF_NominaAplicacionQnalSincronizacion_FechaActualizacion DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_NominaAplicacionQnalSincronizacion_Carga FOREIGN KEY (CargaId) REFERENCES dbo.NominaAplicacionQnalCarga(Id),
    CONSTRAINT CK_NominaAplicacionQnalSincronizacion_Quincena CHECK (Quincena BETWEEN 1 AND 24),
    CONSTRAINT CK_NominaAplicacionQnalSincronizacion_Layout CHECK (LayoutVersion = 20),
    CONSTRAINT CK_NominaAplicacionQnalSincronizacion_Conteos CHECK (TotalLineas > 0 AND TotalDetalles > 0 AND TotalLineas >= TotalDetalles AND (ConteoFirebirdP IS NULL OR ConteoFirebirdP >= 0) AND (ConteoResumen IS NULL OR ConteoResumen >= 0)),
    CONSTRAINT CK_NominaAplicacionQnalSincronizacion_Hashes CHECK (ArchivoHash NOT LIKE '%[^0-9A-F]%' AND LEN(ArchivoHash) = 64 AND (EvidenciaHash IS NULL OR (EvidenciaHash NOT LIKE '%[^0-9A-F]%' AND LEN(EvidenciaHash) = 64))),
    CONSTRAINT CK_NominaAplicacionQnalSincronizacion_Estado CHECK (Estado IN ('PREPARADA','FIREBIRD_EN_PROGRESO','FIREBIRD_CONFIRMADO','FIREBIRD_REVERTIDO','FIREBIRD_INCIERTO','SQL_FINALIZADO','TERMINADO')),
    CONSTRAINT CK_NominaAplicacionQnalSincronizacion_Resultado CHECK (ResultadoFirebird IS NULL OR ResultadoFirebird IN ('NO_INICIADA','COMMIT_CONFIRMADO','ROLLBACK_CONFIRMADO','RESULTADO_INCIERTO')),
    CONSTRAINT CK_NominaAplicacionQnalSincronizacion_Activo CHECK ((Estado = 'TERMINADO' AND Activo = 0) OR (Estado <> 'TERMINADO' AND Activo = 1)),
    CONSTRAINT CK_NominaAplicacionQnalSincronizacion_Claim CHECK ((Estado = 'FIREBIRD_EN_PROGRESO' AND ClaimToken IS NOT NULL AND LeaseExpiraEn IS NOT NULL) OR (Estado <> 'FIREBIRD_EN_PROGRESO' AND ClaimToken IS NULL AND LeaseExpiraEn IS NULL)),
    CONSTRAINT CK_NominaAplicacionQnalSincronizacion_Final CHECK ((Estado = 'TERMINADO' AND CargaId IS NOT NULL AND ResultadoFirebird = 'COMMIT_CONFIRMADO') OR Estado <> 'TERMINADO')
  );

  CREATE UNIQUE INDEX UX_NominaAplicacionQnalSincronizacion_Activa
    ON dbo.NominaAplicacionQnalSincronizacion (EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3)
    WHERE Activo = 1;

  CREATE UNIQUE INDEX UX_NominaAplicacionQnalSincronizacion_Archivo
    ON dbo.NominaAplicacionQnalSincronizacion (EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, ArchivoHash);
END;

IF OBJECT_ID(N'dbo.NominaAplicacionQnalStagingCarga', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.NominaAplicacionQnalStagingCarga (
    SincronizacionId BIGINT NOT NULL CONSTRAINT PK_NominaAplicacionQnalStagingCarga PRIMARY KEY,
    LineaEncabezado INT NULL,
    Lote NVARCHAR(50) NULL,
    FechaInicio DATE NULL,
    FechaFin DATE NULL,
    FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_NominaAplicacionQnalStagingCarga_FechaCreacion DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_NominaAplicacionQnalStagingCarga_Sincronizacion FOREIGN KEY (SincronizacionId) REFERENCES dbo.NominaAplicacionQnalSincronizacion(SincronizacionId) ON DELETE CASCADE
  );
END;

IF OBJECT_ID(N'dbo.NominaAplicacionQnalStagingDetalle', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.NominaAplicacionQnalStagingDetalle (
    StagingDetalleId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_NominaAplicacionQnalStagingDetalle PRIMARY KEY,
    SincronizacionId BIGINT NOT NULL,
    LineaNumero INT NOT NULL,
    LineaOriginal NVARCHAR(MAX) NOT NULL,
    Lote NVARCHAR(50) NOT NULL,
    TipoRegistro VARCHAR(1) NOT NULL,
    ClavePersonal NVARCHAR(50) NOT NULL,
    RFC NVARCHAR(20) NOT NULL,
    RfcNormalizado AS NULLIF(UPPER(LTRIM(RTRIM(RFC))), '') PERSISTED,
    NombreAfiliado NVARCHAR(250) NOT NULL,
    AportacionAfiliadoFondoAhorro DECIMAL(12,2) NULL,
    AportacionEntidadFondoAhorro DECIMAL(12,2) NULL,
    AportacionAfiliadoEBI DECIMAL(12,2) NULL,
    AportacionEntidadEBI DECIMAL(12,2) NULL,
    BaseCotizacionSueldo DECIMAL(12,2) NULL,
    BaseCotizacionQuinquenios DECIMAL(12,2) NULL,
    SueldoMensual DECIMAL(12,2) NULL,
    DescuentoPrestamoCortoPlazo DECIMAL(12,2) NULL,
    DescuentoPrestamoHipotecario DECIMAL(12,2) NULL,
    FechaMovimiento DATE NULL,
    CAIR DECIMAL(12,2) NULL,
    DiasLaborados DECIMAL(5,2) NULL,
    FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_NominaAplicacionQnalStagingDetalle_FechaCreacion DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_NominaAplicacionQnalStagingDetalle_Sincronizacion FOREIGN KEY (SincronizacionId) REFERENCES dbo.NominaAplicacionQnalSincronizacion(SincronizacionId) ON DELETE CASCADE,
    CONSTRAINT CK_NominaAplicacionQnalStagingDetalle_Tipo CHECK (TipoRegistro = '2'),
    CONSTRAINT CK_NominaAplicacionQnalStagingDetalle_Linea CHECK (LineaNumero > 0),
    CONSTRAINT CK_NominaAplicacionQnalStagingDetalle_Rfc CHECK (LEN(LTRIM(RTRIM(RFC))) > 0),
    CONSTRAINT CK_NominaAplicacionQnalStagingDetalle_Dias CHECK (DiasLaborados IS NULL OR DiasLaborados BETWEEN 0 AND 15)
  );

  CREATE UNIQUE INDEX UX_NominaAplicacionQnalStagingDetalle_Linea
    ON dbo.NominaAplicacionQnalStagingDetalle (SincronizacionId, LineaNumero);
  CREATE UNIQUE INDEX UX_NominaAplicacionQnalStagingDetalle_Rfc
    ON dbo.NominaAplicacionQnalStagingDetalle (SincronizacionId, RfcNormalizado);
END;
