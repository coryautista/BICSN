SET NOCOUNT ON;

IF OBJECT_ID(N'config.FirebirdOrganicaCredential', N'U') IS NULL
  THROW 51900, 'FIREBIRD_CATALOG_TABLA_FALTANTE', 1;

IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'config.FirebirdOrganicaCredential') AND type=N'PK' AND name=N'PK_FirebirdOrganicaCredential')
  THROW 51901, 'FIREBIRD_CATALOG_PK_FALTANTE', 1;

DECLARE @Columnas TABLE(Columna SYSNAME, Tipo SYSNAME, Nulleable BIT);
INSERT @Columnas VALUES
  (N'Org0', N'varchar', 0), (N'Org1', N'varchar', 0),
  (N'UsuarioFirebird', N'varchar', 0), (N'SecretoCifrado', N'varbinary', 0),
  (N'RolFirebird', N'varchar', 1), (N'Activo', N'bit', 0),
  (N'FechaAlta', N'datetime2', 0), (N'FechaRotacion', N'datetime2', 1);

IF EXISTS(
  SELECT 1 FROM @Columnas e
  LEFT JOIN sys.columns c ON c.object_id=OBJECT_ID(N'config.FirebirdOrganicaCredential') AND c.name=e.Columna
  LEFT JOIN sys.types t ON t.user_type_id=c.user_type_id
  WHERE c.column_id IS NULL OR t.name<>e.Tipo OR CONVERT(BIT, c.is_nullable)<>e.Nulleable
) THROW 51902, 'FIREBIRD_CATALOG_FIRMA_INVALIDA', 1;

PRINT 'FIREBIRD_ORGANICA_CREDENTIAL_MIGRATION_OK';
