SET NOCOUNT ON;

IF OBJECT_ID(N'config.FirebirdOrganicaCredential', N'U') IS NULL
  THROW 51900, 'FIREBIRD_CATALOG_TABLA_FALTANTE', 1;

IF COL_LENGTH(N'config.FirebirdOrganicaCredential', N'RolFirebirdEntidad') IS NULL
BEGIN
  ALTER TABLE config.FirebirdOrganicaCredential
    ADD RolFirebirdEntidad VARCHAR(64) NULL;
END
ELSE
BEGIN
  IF EXISTS(
    SELECT 1 FROM sys.columns c
    JOIN sys.types t ON t.user_type_id=c.user_type_id
    WHERE c.object_id=OBJECT_ID(N'config.FirebirdOrganicaCredential')
      AND c.name=N'RolFirebirdEntidad'
      AND (t.name<>N'varchar' OR c.max_length<>64 OR CONVERT(BIT, c.is_nullable)<>1)
  ) THROW 51901, 'FIREBIRD_CATALOG_ROL_ENTIDAD_FIRMA_INVALIDA', 1;
END

PRINT 'FIREBIRD_CATALOG_ROL_ENTIDAD_MIGRATION_OK';
