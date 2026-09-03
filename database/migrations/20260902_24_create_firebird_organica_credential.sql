SET XACT_ABORT ON;

IF SCHEMA_ID(N'config') IS NULL EXEC(N'CREATE SCHEMA config;');

IF OBJECT_ID(N'config.FirebirdOrganicaCredential', N'U') IS NULL
BEGIN
  CREATE TABLE config.FirebirdOrganicaCredential(
    Org0 VARCHAR(2) NOT NULL,
    Org1 VARCHAR(2) NOT NULL,
    UsuarioFirebird VARCHAR(64) NOT NULL,
    SecretoCifrado VARBINARY(MAX) NOT NULL,
    RolFirebird VARCHAR(64) NULL,
    Activo BIT NOT NULL CONSTRAINT DF_FirebirdOrganicaCredential_Activo DEFAULT(1),
    FechaAlta DATETIME2(3) NOT NULL CONSTRAINT DF_FirebirdOrganicaCredential_FechaAlta DEFAULT SYSUTCDATETIME(),
    FechaRotacion DATETIME2(3) NULL,
    CONSTRAINT PK_FirebirdOrganicaCredential PRIMARY KEY CLUSTERED (Org0, Org1)
  );
END;
