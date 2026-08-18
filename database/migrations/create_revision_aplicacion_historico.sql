IF OBJECT_ID(N'conciliacion.RevisionAplicacionHistorico', N'U') IS NULL
BEGIN
  CREATE TABLE conciliacion.RevisionAplicacionHistorico (
    IdRevisionAplicacionHistorico BIGINT IDENTITY(1,1) NOT NULL
      CONSTRAINT PK_RevisionAplicacionHistorico PRIMARY KEY,
    Organica0 CHAR(2) NOT NULL,
    Organica1 CHAR(2) NOT NULL,
    Organica2 CHAR(2) NOT NULL CONSTRAINT DF_RevisionAplicacionHistorico_Organica2 DEFAULT ('01'),
    Organica3 CHAR(2) NOT NULL CONSTRAINT DF_RevisionAplicacionHistorico_Organica3 DEFAULT ('01'),
    Periodo CHAR(4) NOT NULL,
    CAIR DECIMAL(19,2) NOT NULL,
    FRA DECIMAL(19,2) NOT NULL,
    FRE DECIMAL(19,2) NOT NULL,
    FH DECIMAL(19,2) NOT NULL,
    FV DECIMAL(19,2) NOT NULL,
    FAA DECIMAL(19,2) NOT NULL,
    FAE DECIMAL(19,2) NOT NULL,
    FAT DECIMAL(19,2) NOT NULL,
    FAI DECIMAL(19,2) NOT NULL,
    RegistrosOrigen INT NOT NULL,
    UsuarioId UNIQUEIDENTIFIER NOT NULL,
    FechaAlta DATETIME2(3) NOT NULL CONSTRAINT DF_RevisionAplicacionHistorico_FechaAlta DEFAULT (SYSDATETIME()),
    FechaActualizacion DATETIME2(3) NULL,
    CONSTRAINT UQ_RevisionAplicacionHistorico_OrganicaPeriodo UNIQUE
      (Organica0, Organica1, Organica2, Organica3, Periodo)
  );
END;
