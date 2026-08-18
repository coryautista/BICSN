BEGIN TRY
  BEGIN TRAN;

  /* 1) Borrar datos en orden hijo → padre */
  DELETE FROM [afi].[Movimiento];   -- FK a Afiliado
  DELETE FROM [afi].[AfiliadoOrg];  -- FK a Afiliado
  DELETE FROM [afi].[Afiliado];     -- Padre

  /* 2) Reiniciar IDENTITY (si existiera) */
  IF EXISTS (
      SELECT 1 FROM sys.identity_columns ic
      WHERE ic.object_id = OBJECT_ID(N'afi.Movimiento')
  ) DBCC CHECKIDENT ('afi.Movimiento', RESEED, 0);

  IF EXISTS (
      SELECT 1 FROM sys.identity_columns ic
      WHERE ic.object_id = OBJECT_ID(N'afi.AfiliadoOrg')
  ) DBCC CHECKIDENT ('afi.AfiliadoOrg', RESEED, 0);

  IF EXISTS (
      SELECT 1 FROM sys.identity_columns ic
      WHERE ic.object_id = OBJECT_ID(N'afi.Afiliado')
  ) DBCC CHECKIDENT ('afi.Afiliado', RESEED, 0);

  /* 3) Reiniciar SEQUENCE usadas como “autoincremento” (si existen) */
  IF EXISTS (SELECT 1 FROM sys.sequences WHERE name = N'seq_afi_Movimiento_id'    AND SCHEMA_NAME(schema_id)='afi')
    ALTER SEQUENCE [afi].[seq_afi_Movimiento_id]     RESTART WITH 1;

  IF EXISTS (SELECT 1 FROM sys.sequences WHERE name = N'seq_afi_AfiliadoOrg_id'   AND SCHEMA_NAME(schema_id)='afi')
    ALTER SEQUENCE [afi].[seq_afi_AfiliadoOrg_id]    RESTART WITH 1;

  IF EXISTS (SELECT 1 FROM sys.sequences WHERE name = N'seq_afi_Afiliado_id'      AND SCHEMA_NAME(schema_id)='afi')
    ALTER SEQUENCE [afi].[seq_afi_Afiliado_id]       RESTART WITH 1;

  COMMIT;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK;
  THROW;
END CATCH;

