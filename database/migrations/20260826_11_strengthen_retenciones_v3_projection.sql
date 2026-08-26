/* Retenciones V3 desde evidencia oficial V5. Aditiva, idempotente y sin backfill vivo. */
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

BEGIN TRY
  BEGIN TRANSACTION;
  IF OBJECT_ID(N'retenciones.RetencionPCPHistoricoV3',N'U') IS NULL
    OR OBJECT_ID(N'retenciones.RetencionPMPHistoricoV3',N'U') IS NULL
    OR OBJECT_ID(N'retenciones.RetencionHIPHistoricoV3',N'U') IS NULL
    THROW 51680,'Faltan tablas RetencionHistoricoV3.',1;

  IF OBJECT_ID(N'retenciones.RetencionHistoricoLoteV3',N'U') IS NULL
  BEGIN
    CREATE TABLE retenciones.RetencionHistoricoLoteV3 (
      RetencionHistoricoLoteV3Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_RetencionHistoricoLoteV3 PRIMARY KEY,
      LiquidacionSnapshotId BIGINT NOT NULL,
      Dominio VARCHAR(3) NOT NULL,
      EstadoFuente VARCHAR(20) NOT NULL,
      Registros INT NOT NULL,
      HashFuente CHAR(64) NULL,
      TotalA2 DECIMAL(19,2) NOT NULL,
      SourceScale TINYINT NOT NULL,
      IdentificadorFuente NVARCHAR(300) NOT NULL,
      UsuarioId NVARCHAR(100) NOT NULL,
      FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_RetencionHistoricoLoteV3_FechaCreacion DEFAULT(SYSDATETIME()),
      CONSTRAINT FK_RetencionHistoricoLoteV3_Snapshot FOREIGN KEY(LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot(LiquidacionSnapshotId),
      CONSTRAINT UQ_RetencionHistoricoLoteV3_SnapshotDominio UNIQUE(LiquidacionSnapshotId,Dominio)
    );
  END;

  DECLARE @PkEsperadas TABLE(Tabla SYSNAME,Nombre SYSNAME,Claves NVARCHAR(200));
  INSERT @PkEsperadas VALUES
    (N'retenciones.RetencionHistoricoLoteV3',N'PK_RetencionHistoricoLoteV3',N'RetencionHistoricoLoteV3Id'),
    (N'retenciones.RetencionPCPHistoricoV3',N'PK_RetencionPCPHistoricoV3',N'RetencionPCPHistoricoV3Id'),
    (N'retenciones.RetencionPMPHistoricoV3',N'PK_RetencionPMPHistoricoV3',N'RetencionPMPHistoricoV3Id'),
    (N'retenciones.RetencionHIPHistoricoV3',N'PK_RetencionHIPHistoricoV3',N'RetencionHIPHistoricoV3Id');
  IF EXISTS(SELECT 1 FROM @PkEsperadas e WHERE NOT EXISTS(SELECT 1 FROM sys.key_constraints k JOIN sys.indexes i ON i.object_id=k.parent_object_id AND i.index_id=k.unique_index_id
    WHERE k.parent_object_id=OBJECT_ID(e.Tabla) AND k.name=e.Nombre AND k.type='PK' AND
      (SELECT STRING_AGG(CONVERT(NVARCHAR(MAX),c.name),N'|') WITHIN GROUP(ORDER BY ic.key_ordinal) FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0)=e.Claves))
    THROW 51728,'RETENCION_V3_PK_INCOMPATIBLE',1;

  DECLARE @Tablas TABLE (Tabla SYSNAME NOT NULL);
  INSERT @Tablas VALUES(N'retenciones.RetencionPCPHistoricoV3'),(N'retenciones.RetencionPMPHistoricoV3'),(N'retenciones.RetencionHIPHistoricoV3');
  DECLARE @Tabla SYSNAME;
  DECLARE c CURSOR LOCAL FAST_FORWARD FOR SELECT Tabla FROM @Tablas;
  OPEN c; FETCH NEXT FROM c INTO @Tabla;
  WHILE @@FETCH_STATUS=0
  BEGIN
    IF COL_LENGTH(@Tabla,N'RetencionHistoricoLoteV3Id') IS NULL EXEC(N'ALTER TABLE '+@Tabla+N' ADD RetencionHistoricoLoteV3Id BIGINT NULL;');
    IF COL_LENGTH(@Tabla,N'Interno') IS NULL EXEC(N'ALTER TABLE '+@Tabla+N' ADD Interno INT NULL;');
    IF COL_LENGTH(@Tabla,N'Nombre') IS NULL EXEC(N'ALTER TABLE '+@Tabla+N' ADD Nombre NVARCHAR(255) NULL;');
    IF COL_LENGTH(@Tabla,N'ClaveFilaHash') IS NULL EXEC(N'ALTER TABLE '+@Tabla+N' ADD ClaveFilaHash CHAR(64) NULL;');
    IF COL_LENGTH(@Tabla,N'HashFila') IS NULL EXEC(N'ALTER TABLE '+@Tabla+N' ADD HashFila CHAR(64) NULL;');
    IF COL_LENGTH(@Tabla,N'PayloadCanonico') IS NULL EXEC(N'ALTER TABLE '+@Tabla+N' ADD PayloadCanonico NVARCHAR(MAX) NULL;');
    IF COL_LENGTH(@Tabla,N'PayloadVersion') IS NULL EXEC(N'ALTER TABLE '+@Tabla+N' ADD PayloadVersion SMALLINT NULL;');
    IF COL_LENGTH(@Tabla,N'IdentificadorFuente') IS NULL EXEC(N'ALTER TABLE '+@Tabla+N' ADD IdentificadorFuente NVARCHAR(300) NULL;');
    IF COL_LENGTH(@Tabla,N'QnaSnapshotDetalleId') IS NULL EXEC(N'ALTER TABLE '+@Tabla+N' ADD QnaSnapshotDetalleId BIGINT NULL;');
    IF COL_LENGTH(@Tabla,N'EsHuerfano') IS NULL EXEC(N'ALTER TABLE '+@Tabla+N' ADD EsHuerfano BIT NULL;');
    FETCH NEXT FROM c INTO @Tabla;
  END;
  CLOSE c; DEALLOCATE c;

  /* Claves y componentes fuente son nullable; el importe oficial permanece NOT NULL. */
  ALTER TABLE retenciones.RetencionPCPHistoricoV3 ALTER COLUMN Prestamo INT NULL;
  ALTER TABLE retenciones.RetencionPCPHistoricoV3 ALTER COLUMN CapitalD6 DECIMAL(19,6) NULL;
  ALTER TABLE retenciones.RetencionPCPHistoricoV3 ALTER COLUMN InteresD6 DECIMAL(19,6) NULL;
  ALTER TABLE retenciones.RetencionPCPHistoricoV3 ALTER COLUMN MontoD6 DECIMAL(19,6) NULL;
  ALTER TABLE retenciones.RetencionPCPHistoricoV3 ALTER COLUMN MoratoriosD6 DECIMAL(19,6) NULL;
  ALTER TABLE retenciones.RetencionPMPHistoricoV3 ALTER COLUMN Prestamo INT NULL;
  ALTER TABLE retenciones.RetencionPMPHistoricoV3 ALTER COLUMN CapitalD6 DECIMAL(19,6) NULL;
  ALTER TABLE retenciones.RetencionPMPHistoricoV3 ALTER COLUMN InteresD6 DECIMAL(19,6) NULL;
  ALTER TABLE retenciones.RetencionPMPHistoricoV3 ALTER COLUMN MoratoriosD6 DECIMAL(19,6) NULL;
  ALTER TABLE retenciones.RetencionPMPHistoricoV3 ALTER COLUMN SeguroD6 DECIMAL(19,6) NULL;
  ALTER TABLE retenciones.RetencionHIPHistoricoV3 ALTER COLUMN Solicitud INT NULL;
  ALTER TABLE retenciones.RetencionHIPHistoricoV3 ALTER COLUMN DescuentoD6 DECIMAL(19,6) NULL;
  ALTER TABLE retenciones.RetencionHIPHistoricoV3 ALTER COLUMN CapitalD6 DECIMAL(19,6) NULL;
  ALTER TABLE retenciones.RetencionHIPHistoricoV3 ALTER COLUMN InteresD6 DECIMAL(19,6) NULL;
  ALTER TABLE retenciones.RetencionHIPHistoricoV3 ALTER COLUMN InteresDiferidoD6 DECIMAL(19,6) NULL;
  ALTER TABLE retenciones.RetencionHIPHistoricoV3 ALTER COLUMN SeguroD6 DECIMAL(19,6) NULL;
  ALTER TABLE retenciones.RetencionHIPHistoricoV3 ALTER COLUMN MoratorioD6 DECIMAL(19,6) NULL;

  IF EXISTS(SELECT 1 FROM retenciones.RetencionPCPHistoricoV3 WHERE RetencionHistoricoLoteV3Id IS NULL AND (Prestamo IS NULL OR CapitalD6 IS NULL OR InteresD6 IS NULL OR MontoD6 IS NULL OR MoratoriosD6 IS NULL))
    THROW 51725,'RETENCION_PCP_V4_EXISTENTE_INCOMPATIBLE_CON_NO_NULOS',1;
  IF EXISTS(SELECT 1 FROM retenciones.RetencionPMPHistoricoV3 WHERE RetencionHistoricoLoteV3Id IS NULL AND (Prestamo IS NULL OR CapitalD6 IS NULL OR InteresD6 IS NULL OR MoratoriosD6 IS NULL OR SeguroD6 IS NULL))
    THROW 51726,'RETENCION_PMP_V4_EXISTENTE_INCOMPATIBLE_CON_NO_NULOS',1;
  IF EXISTS(SELECT 1 FROM retenciones.RetencionHIPHistoricoV3 WHERE RetencionHistoricoLoteV3Id IS NULL AND (Solicitud IS NULL OR DescuentoD6 IS NULL OR CapitalD6 IS NULL OR InteresD6 IS NULL OR InteresDiferidoD6 IS NULL OR SeguroD6 IS NULL OR MoratorioD6 IS NULL))
    THROW 51727,'RETENCION_HIP_V4_EXISTENTE_INCOMPATIBLE_CON_NO_NULOS',1;
  IF OBJECT_ID(N'retenciones.CK_RetencionPCPHistoricoV3_LegacyNoNulo',N'C') IS NOT NULL ALTER TABLE retenciones.RetencionPCPHistoricoV3 DROP CONSTRAINT CK_RetencionPCPHistoricoV3_LegacyNoNulo;
  ALTER TABLE retenciones.RetencionPCPHistoricoV3 WITH CHECK ADD CONSTRAINT CK_RetencionPCPHistoricoV3_LegacyNoNulo CHECK(RetencionHistoricoLoteV3Id IS NOT NULL OR (Prestamo IS NOT NULL AND CapitalD6 IS NOT NULL AND InteresD6 IS NOT NULL AND MontoD6 IS NOT NULL AND MoratoriosD6 IS NOT NULL));
  IF OBJECT_ID(N'retenciones.CK_RetencionPMPHistoricoV3_LegacyNoNulo',N'C') IS NOT NULL ALTER TABLE retenciones.RetencionPMPHistoricoV3 DROP CONSTRAINT CK_RetencionPMPHistoricoV3_LegacyNoNulo;
  ALTER TABLE retenciones.RetencionPMPHistoricoV3 WITH CHECK ADD CONSTRAINT CK_RetencionPMPHistoricoV3_LegacyNoNulo CHECK(RetencionHistoricoLoteV3Id IS NOT NULL OR (Prestamo IS NOT NULL AND CapitalD6 IS NOT NULL AND InteresD6 IS NOT NULL AND MoratoriosD6 IS NOT NULL AND SeguroD6 IS NOT NULL));
  IF OBJECT_ID(N'retenciones.CK_RetencionHIPHistoricoV3_LegacyNoNulo',N'C') IS NOT NULL ALTER TABLE retenciones.RetencionHIPHistoricoV3 DROP CONSTRAINT CK_RetencionHIPHistoricoV3_LegacyNoNulo;
  ALTER TABLE retenciones.RetencionHIPHistoricoV3 WITH CHECK ADD CONSTRAINT CK_RetencionHIPHistoricoV3_LegacyNoNulo CHECK(RetencionHistoricoLoteV3Id IS NOT NULL OR (Solicitud IS NOT NULL AND DescuentoD6 IS NOT NULL AND CapitalD6 IS NOT NULL AND InteresD6 IS NOT NULL AND InteresDiferidoD6 IS NOT NULL AND SeguroD6 IS NOT NULL AND MoratorioD6 IS NOT NULL));

  DECLARE @Esperadas TABLE(Tabla SYSNAME,Columna SYSNAME,Tipo SYSNAME,Longitud SMALLINT,Precision TINYINT,Escala TINYINT,Nullable BIT);
  INSERT @Esperadas VALUES
    (N'retenciones.RetencionHistoricoLoteV3',N'RetencionHistoricoLoteV3Id',N'bigint',8,19,0,0),(N'retenciones.RetencionHistoricoLoteV3',N'LiquidacionSnapshotId',N'bigint',8,19,0,0),
    (N'retenciones.RetencionHistoricoLoteV3',N'Dominio',N'varchar',3,0,0,0),(N'retenciones.RetencionHistoricoLoteV3',N'EstadoFuente',N'varchar',20,0,0,0),
    (N'retenciones.RetencionHistoricoLoteV3',N'Registros',N'int',4,10,0,0),(N'retenciones.RetencionHistoricoLoteV3',N'HashFuente',N'char',64,0,0,1),
    (N'retenciones.RetencionHistoricoLoteV3',N'TotalA2',N'decimal',9,19,2,0),(N'retenciones.RetencionHistoricoLoteV3',N'SourceScale',N'tinyint',1,3,0,0),
    (N'retenciones.RetencionHistoricoLoteV3',N'IdentificadorFuente',N'nvarchar',600,0,0,0),(N'retenciones.RetencionHistoricoLoteV3',N'UsuarioId',N'nvarchar',200,0,0,0),
    (N'retenciones.RetencionHistoricoLoteV3',N'FechaCreacion',N'datetime2',7,23,3,0);
  INSERT @Esperadas
  SELECT t.Tabla,v.Columna,v.Tipo,v.Longitud,v.Precision,v.Escala,v.Nullable FROM @Tablas t CROSS JOIN(VALUES
    (N'RetencionHistoricoLoteV3Id',N'bigint',CAST(8 AS SMALLINT),CAST(19 AS TINYINT),CAST(0 AS TINYINT),CAST(1 AS BIT)),
    (N'Interno',N'int',4,10,0,1),(N'Nombre',N'nvarchar',510,0,0,1),(N'ClaveFilaHash',N'char',64,0,0,1),(N'HashFila',N'char',64,0,0,1),
    (N'PayloadCanonico',N'nvarchar',-1,0,0,1),(N'PayloadVersion',N'smallint',2,5,0,1),(N'IdentificadorFuente',N'nvarchar',600,0,0,1),
    (N'QnaSnapshotDetalleId',N'bigint',8,19,0,1),(N'EsHuerfano',N'bit',1,1,0,1)
  )v(Columna,Tipo,Longitud,Precision,Escala,Nullable);
  DECLARE @ColumnasIncompatibles NVARCHAR(2048);
  SELECT @ColumnasIncompatibles=LEFT(STRING_AGG(CONVERT(NVARCHAR(MAX),CONCAT(e.Tabla,N'.',e.Columna,N' esperado=',e.Tipo,N'/',e.Longitud,N'/',e.Precision,N'/',e.Escala,N'/',e.Nullable,
    N' actual=',COALESCE(st.name,N'FALTA'),N'/',COALESCE(CONVERT(VARCHAR(10),sc.max_length),N'-'),N'/',COALESCE(CONVERT(VARCHAR(10),sc.precision),N'-'),N'/',COALESCE(CONVERT(VARCHAR(10),sc.scale),N'-'),N'/',COALESCE(CONVERT(VARCHAR(10),sc.is_nullable),N'-'))),N' | '),2048)
  FROM @Esperadas e LEFT JOIN sys.columns sc ON sc.object_id=OBJECT_ID(e.Tabla) AND sc.name=e.Columna LEFT JOIN sys.types st ON st.user_type_id=sc.user_type_id
  WHERE sc.column_id IS NULL OR st.name<>e.Tipo OR sc.max_length<>e.Longitud OR sc.precision<>e.Precision OR sc.scale<>e.Escala OR sc.is_nullable<>e.Nullable;
  IF @ColumnasIncompatibles IS NOT NULL THROW 51693,@ColumnasIncompatibles,1;

  IF OBJECT_ID(N'retenciones.CK_RetencionHistoricoLoteV3_Contrato',N'C') IS NOT NULL ALTER TABLE retenciones.RetencionHistoricoLoteV3 DROP CONSTRAINT CK_RetencionHistoricoLoteV3_Contrato;
  ALTER TABLE retenciones.RetencionHistoricoLoteV3 WITH CHECK ADD CONSTRAINT CK_RetencionHistoricoLoteV3_Contrato CHECK(
    Dominio IN('PCP','PMP','HIP') AND SourceScale=2 AND Registros>=0 AND
    ((EstadoFuente='COMPLETE' AND Registros>0 AND LEN(HashFuente)=64 AND HashFuente COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9A-F]%')
      OR (EstadoFuente IN('EMPTY','NOT_APPLICABLE') AND Registros=0 AND HashFuente IS NULL)));

  IF OBJECT_ID(N'retenciones.CK_RetencionPCPHistoricoV3_CompletoV5',N'C') IS NOT NULL ALTER TABLE retenciones.RetencionPCPHistoricoV3 DROP CONSTRAINT CK_RetencionPCPHistoricoV3_CompletoV5;
  ALTER TABLE retenciones.RetencionPCPHistoricoV3 WITH CHECK ADD CONSTRAINT CK_RetencionPCPHistoricoV3_CompletoV5 CHECK(RetencionHistoricoLoteV3Id IS NULL OR
    (Interno IS NOT NULL AND EmpleadoClave=CONVERT(NVARCHAR(50),Interno) AND Nombre IS NOT NULL AND ClaveFilaHash IS NOT NULL AND HashFila IS NOT NULL AND LEN(ClaveFilaHash)=64 AND ClaveFilaHash COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9A-F]%' AND LEN(HashFila)=64 AND HashFila COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9A-F]%'
      AND PayloadCanonico IS NOT NULL AND PayloadVersion=1 AND IdentificadorFuente IS NOT NULL AND EsHuerfano IS NOT NULL
      AND ((EsHuerfano=1 AND QnaSnapshotDetalleId IS NULL) OR (EsHuerfano=0 AND QnaSnapshotDetalleId IS NOT NULL))));
  IF OBJECT_ID(N'retenciones.CK_RetencionPMPHistoricoV3_CompletoV5',N'C') IS NOT NULL ALTER TABLE retenciones.RetencionPMPHistoricoV3 DROP CONSTRAINT CK_RetencionPMPHistoricoV3_CompletoV5;
  ALTER TABLE retenciones.RetencionPMPHistoricoV3 WITH CHECK ADD CONSTRAINT CK_RetencionPMPHistoricoV3_CompletoV5 CHECK(RetencionHistoricoLoteV3Id IS NULL OR
    (Interno IS NOT NULL AND EmpleadoClave=CONVERT(NVARCHAR(50),Interno) AND Nombre IS NOT NULL AND ClaveFilaHash IS NOT NULL AND HashFila IS NOT NULL AND LEN(ClaveFilaHash)=64 AND ClaveFilaHash COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9A-F]%' AND LEN(HashFila)=64 AND HashFila COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9A-F]%'
      AND PayloadCanonico IS NOT NULL AND PayloadVersion=1 AND IdentificadorFuente IS NOT NULL AND EsHuerfano IS NOT NULL
      AND ((EsHuerfano=1 AND QnaSnapshotDetalleId IS NULL) OR (EsHuerfano=0 AND QnaSnapshotDetalleId IS NOT NULL))));
  IF OBJECT_ID(N'retenciones.CK_RetencionHIPHistoricoV3_CompletoV5',N'C') IS NOT NULL ALTER TABLE retenciones.RetencionHIPHistoricoV3 DROP CONSTRAINT CK_RetencionHIPHistoricoV3_CompletoV5;
  ALTER TABLE retenciones.RetencionHIPHistoricoV3 WITH CHECK ADD CONSTRAINT CK_RetencionHIPHistoricoV3_CompletoV5 CHECK(RetencionHistoricoLoteV3Id IS NULL OR
    (Interno IS NOT NULL AND EmpleadoClave=CONVERT(NVARCHAR(50),Interno) AND Nombre IS NOT NULL AND ClaveFilaHash IS NOT NULL AND HashFila IS NOT NULL AND LEN(ClaveFilaHash)=64 AND ClaveFilaHash COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9A-F]%' AND LEN(HashFila)=64 AND HashFila COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9A-F]%'
      AND PayloadCanonico IS NOT NULL AND PayloadVersion=1 AND IdentificadorFuente IS NOT NULL AND EsHuerfano IS NOT NULL
      AND ((EsHuerfano=1 AND QnaSnapshotDetalleId IS NULL) OR (EsHuerfano=0 AND QnaSnapshotDetalleId IS NOT NULL))));

  IF OBJECT_ID(N'retenciones.FK_RetencionPCPHistoricoV3_Lote',N'F') IS NULL ALTER TABLE retenciones.RetencionPCPHistoricoV3 WITH CHECK ADD CONSTRAINT FK_RetencionPCPHistoricoV3_Lote FOREIGN KEY(RetencionHistoricoLoteV3Id) REFERENCES retenciones.RetencionHistoricoLoteV3(RetencionHistoricoLoteV3Id);
  IF OBJECT_ID(N'retenciones.FK_RetencionPMPHistoricoV3_Lote',N'F') IS NULL ALTER TABLE retenciones.RetencionPMPHistoricoV3 WITH CHECK ADD CONSTRAINT FK_RetencionPMPHistoricoV3_Lote FOREIGN KEY(RetencionHistoricoLoteV3Id) REFERENCES retenciones.RetencionHistoricoLoteV3(RetencionHistoricoLoteV3Id);
  IF OBJECT_ID(N'retenciones.FK_RetencionHIPHistoricoV3_Lote',N'F') IS NULL ALTER TABLE retenciones.RetencionHIPHistoricoV3 WITH CHECK ADD CONSTRAINT FK_RetencionHIPHistoricoV3_Lote FOREIGN KEY(RetencionHistoricoLoteV3Id) REFERENCES retenciones.RetencionHistoricoLoteV3(RetencionHistoricoLoteV3Id);
  IF OBJECT_ID(N'retenciones.FK_RetencionPCPHistoricoV3_QnaDetalle',N'F') IS NULL ALTER TABLE retenciones.RetencionPCPHistoricoV3 WITH CHECK ADD CONSTRAINT FK_RetencionPCPHistoricoV3_QnaDetalle FOREIGN KEY(QnaSnapshotDetalleId) REFERENCES liquidacion.QnaSnapshotDetalle(QnaSnapshotDetalleId);
  IF OBJECT_ID(N'retenciones.FK_RetencionPMPHistoricoV3_QnaDetalle',N'F') IS NULL ALTER TABLE retenciones.RetencionPMPHistoricoV3 WITH CHECK ADD CONSTRAINT FK_RetencionPMPHistoricoV3_QnaDetalle FOREIGN KEY(QnaSnapshotDetalleId) REFERENCES liquidacion.QnaSnapshotDetalle(QnaSnapshotDetalleId);
  IF OBJECT_ID(N'retenciones.FK_RetencionHIPHistoricoV3_QnaDetalle',N'F') IS NULL ALTER TABLE retenciones.RetencionHIPHistoricoV3 WITH CHECK ADD CONSTRAINT FK_RetencionHIPHistoricoV3_QnaDetalle FOREIGN KEY(QnaSnapshotDetalleId) REFERENCES liquidacion.QnaSnapshotDetalle(QnaSnapshotDetalleId);
  DECLARE @FkEsperadas TABLE(Tabla SYSNAME,Nombre SYSNAME,Columna SYSNAME,TablaReferida SYSNAME,ColumnaReferida SYSNAME);
  INSERT @FkEsperadas VALUES
    (N'retenciones.RetencionHistoricoLoteV3',N'FK_RetencionHistoricoLoteV3_Snapshot',N'LiquidacionSnapshotId',N'liquidacion.QnaSnapshot',N'LiquidacionSnapshotId'),
    (N'retenciones.RetencionPCPHistoricoV3',N'FK_RetencionPCPHistoricoV3_Snapshot',N'LiquidacionSnapshotId',N'liquidacion.QnaSnapshot',N'LiquidacionSnapshotId'),
    (N'retenciones.RetencionPMPHistoricoV3',N'FK_RetencionPMPHistoricoV3_Snapshot',N'LiquidacionSnapshotId',N'liquidacion.QnaSnapshot',N'LiquidacionSnapshotId'),
    (N'retenciones.RetencionHIPHistoricoV3',N'FK_RetencionHIPHistoricoV3_Snapshot',N'LiquidacionSnapshotId',N'liquidacion.QnaSnapshot',N'LiquidacionSnapshotId'),
    (N'retenciones.RetencionPCPHistoricoV3',N'FK_RetencionPCPHistoricoV3_Lote',N'RetencionHistoricoLoteV3Id',N'retenciones.RetencionHistoricoLoteV3',N'RetencionHistoricoLoteV3Id'),
    (N'retenciones.RetencionPMPHistoricoV3',N'FK_RetencionPMPHistoricoV3_Lote',N'RetencionHistoricoLoteV3Id',N'retenciones.RetencionHistoricoLoteV3',N'RetencionHistoricoLoteV3Id'),
    (N'retenciones.RetencionHIPHistoricoV3',N'FK_RetencionHIPHistoricoV3_Lote',N'RetencionHistoricoLoteV3Id',N'retenciones.RetencionHistoricoLoteV3',N'RetencionHistoricoLoteV3Id'),
    (N'retenciones.RetencionPCPHistoricoV3',N'FK_RetencionPCPHistoricoV3_QnaDetalle',N'QnaSnapshotDetalleId',N'liquidacion.QnaSnapshotDetalle',N'QnaSnapshotDetalleId'),
    (N'retenciones.RetencionPMPHistoricoV3',N'FK_RetencionPMPHistoricoV3_QnaDetalle',N'QnaSnapshotDetalleId',N'liquidacion.QnaSnapshotDetalle',N'QnaSnapshotDetalleId'),
    (N'retenciones.RetencionHIPHistoricoV3',N'FK_RetencionHIPHistoricoV3_QnaDetalle',N'QnaSnapshotDetalleId',N'liquidacion.QnaSnapshotDetalle',N'QnaSnapshotDetalleId');
  IF EXISTS(SELECT 1 FROM @FkEsperadas e WHERE NOT EXISTS(SELECT 1 FROM sys.foreign_keys f JOIN sys.foreign_key_columns fc ON fc.constraint_object_id=f.object_id
    WHERE f.parent_object_id=OBJECT_ID(e.Tabla) AND f.name=e.Nombre AND f.referenced_object_id=OBJECT_ID(e.TablaReferida)
      AND COL_NAME(fc.parent_object_id,fc.parent_column_id)=e.Columna AND COL_NAME(fc.referenced_object_id,fc.referenced_column_id)=e.ColumnaReferida
      AND (SELECT COUNT(*) FROM sys.foreign_key_columns x WHERE x.constraint_object_id=f.object_id)=1))
    THROW 51729,'RETENCION_V3_FK_INCOMPATIBLE',1;
  ALTER TABLE retenciones.RetencionHistoricoLoteV3 WITH CHECK CHECK CONSTRAINT FK_RetencionHistoricoLoteV3_Snapshot;
  ALTER TABLE retenciones.RetencionPCPHistoricoV3 WITH CHECK CHECK CONSTRAINT FK_RetencionPCPHistoricoV3_Lote,FK_RetencionPCPHistoricoV3_QnaDetalle;
  ALTER TABLE retenciones.RetencionPMPHistoricoV3 WITH CHECK CHECK CONSTRAINT FK_RetencionPMPHistoricoV3_Lote,FK_RetencionPMPHistoricoV3_QnaDetalle;
  ALTER TABLE retenciones.RetencionHIPHistoricoV3 WITH CHECK CHECK CONSTRAINT FK_RetencionHIPHistoricoV3_Lote,FK_RetencionHIPHistoricoV3_QnaDetalle;

  IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'retenciones.RetencionPCPHistoricoV3') AND name=N'IX_RetencionPCPHistoricoV3_ClaveFilaHash') CREATE INDEX IX_RetencionPCPHistoricoV3_ClaveFilaHash ON retenciones.RetencionPCPHistoricoV3(LiquidacionSnapshotId,ClaveFilaHash) WHERE ClaveFilaHash IS NOT NULL;
  IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'retenciones.RetencionPMPHistoricoV3') AND name=N'IX_RetencionPMPHistoricoV3_ClaveFilaHash') CREATE INDEX IX_RetencionPMPHistoricoV3_ClaveFilaHash ON retenciones.RetencionPMPHistoricoV3(LiquidacionSnapshotId,ClaveFilaHash) WHERE ClaveFilaHash IS NOT NULL;
  IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'retenciones.RetencionHIPHistoricoV3') AND name=N'IX_RetencionHIPHistoricoV3_ClaveFilaHash') CREATE INDEX IX_RetencionHIPHistoricoV3_ClaveFilaHash ON retenciones.RetencionHIPHistoricoV3(LiquidacionSnapshotId,ClaveFilaHash) WHERE ClaveFilaHash IS NOT NULL;
  IF EXISTS(SELECT 1 FROM @Tablas t JOIN sys.indexes i ON i.object_id=OBJECT_ID(t.Tabla) AND i.name=N'IX_Retencion'+REPLACE(REPLACE(t.Tabla,N'retenciones.Retencion',N''),N'HistoricoV3',N'')+N'HistoricoV3_ClaveFilaHash'
    WHERE i.is_unique=1 OR i.is_disabled=1 OR i.has_filter<>1 OR i.filter_definition NOT LIKE N'%ClaveFilaHash%IS NOT NULL%')
    THROW 51721,'RETENCION_V3_INDICE_CLAVE_INCOMPATIBLE',1;
  DECLARE @IndicesEsperados TABLE(Tabla SYSNAME,Nombre SYSNAME,Claves NVARCHAR(200),Unico BIT);
  INSERT @IndicesEsperados VALUES
    (N'retenciones.RetencionHistoricoLoteV3',N'UQ_RetencionHistoricoLoteV3_SnapshotDominio',N'LiquidacionSnapshotId|Dominio',1),
    (N'retenciones.RetencionPCPHistoricoV3',N'UQ_RetencionPCPHistoricoV3_Orden',N'LiquidacionSnapshotId|Orden',1),
    (N'retenciones.RetencionPMPHistoricoV3',N'UQ_RetencionPMPHistoricoV3_Orden',N'LiquidacionSnapshotId|Orden',1),
    (N'retenciones.RetencionHIPHistoricoV3',N'UQ_RetencionHIPHistoricoV3_Orden',N'LiquidacionSnapshotId|Orden',1),
    (N'retenciones.RetencionPCPHistoricoV3',N'IX_RetencionPCPHistoricoV3_ClaveFilaHash',N'LiquidacionSnapshotId|ClaveFilaHash',0),
    (N'retenciones.RetencionPMPHistoricoV3',N'IX_RetencionPMPHistoricoV3_ClaveFilaHash',N'LiquidacionSnapshotId|ClaveFilaHash',0),
    (N'retenciones.RetencionHIPHistoricoV3',N'IX_RetencionHIPHistoricoV3_ClaveFilaHash',N'LiquidacionSnapshotId|ClaveFilaHash',0);
  IF EXISTS(SELECT 1 FROM @IndicesEsperados e WHERE NOT EXISTS(SELECT 1 FROM sys.indexes i WHERE i.object_id=OBJECT_ID(e.Tabla) AND i.name=e.Nombre AND i.is_unique=e.Unico AND i.is_disabled=0 AND
    (SELECT STRING_AGG(CONVERT(NVARCHAR(MAX),c.name),N'|') WITHIN GROUP(ORDER BY ic.key_ordinal) FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0)=e.Claves))
    THROW 51731,'RETENCION_V3_INDICE_ESTRUCTURA_INCOMPATIBLE',1;
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO

CREATE OR ALTER PROCEDURE retenciones.spGuardarRetencionPCPHistorico_V3
  @Header retenciones.TVP_RetencionPCPHeader_V3 READONLY,
  @Detalle retenciones.TVP_RetencionPCPDetalle_V3 READONLY
AS
BEGIN
  SET NOCOUNT ON;
  IF EXISTS(SELECT 1 FROM @Header h JOIN liquidacion.QnaSnapshot q ON q.LiquidacionSnapshotId=h.LiquidacionSnapshotId WHERE q.VersionEsquema>=5)
    THROW 51732,'RETENCION_PCP_V5_REQUIERE_PROYECTOR',1;
  SET XACT_ABORT ON;
  IF (SELECT COUNT(*) FROM @Header)<>1 THROW 51621,'RETENCION_PCP_V3_REQUIERE_UN_HEADER',1;
  IF EXISTS(SELECT 1 FROM @Header WHERE SourceScale<>2 OR Registros<0) THROW 51622,'RETENCION_PCP_V3_HEADER_INVALIDO',1;
  IF (SELECT Registros FROM @Header)<>(SELECT COUNT(*) FROM @Detalle) THROW 51623,'RETENCION_PCP_V3_CONTEO_INVALIDO',1;
  IF NOT EXISTS(SELECT 1 FROM @Header h JOIN liquidacion.QnaSnapshotOficialActual o ON o.LiquidacionSnapshotId=h.LiquidacionSnapshotId
    JOIN liquidacion.QnaSnapshotFuente f ON f.LiquidacionSnapshotId=h.LiquidacionSnapshotId AND f.Dominio='PCP' AND f.Registros=h.Registros
    JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=h.LiquidacionSnapshotId AND t.RetencionPCPA2=h.TotalA2)
    THROW 51624,'RETENCION_PCP_V3_SNAPSHOT_NO_COINCIDE',1;
  IF (SELECT TotalA2 FROM @Header)<>ROUND(COALESCE((SELECT SUM(TotalD6) FROM @Detalle),0),2,1) THROW 51633,'RETENCION_PCP_V3_TOTAL_INVALIDO',1;
  IF EXISTS(SELECT TotalD6,COUNT_BIG(*) FROM @Detalle GROUP BY TotalD6 EXCEPT SELECT ImporteOficialD6,COUNT_BIG(*) FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header) AND Dominio='PCP' GROUP BY ImporteOficialD6)
    OR EXISTS(SELECT ImporteOficialD6,COUNT_BIG(*) FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header) AND Dominio='PCP' GROUP BY ImporteOficialD6 EXCEPT SELECT TotalD6,COUNT_BIG(*) FROM @Detalle GROUP BY TotalD6)
    THROW 51634,'RETENCION_PCP_V3_DETALLE_NO_COINCIDE',1;
  IF EXISTS(SELECT 1 FROM retenciones.RetencionPCPHistoricoV3 WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header)) RETURN;
  INSERT retenciones.RetencionPCPHistoricoV3(LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Prestamo,Letra,Plazo,CapitalD6,InteresD6,MontoD6,MoratoriosD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId)
  SELECT h.LiquidacionSnapshotId,d.Orden,d.EmpleadoClave,d.Rfc,d.Prestamo,d.Letra,d.Plazo,d.CapitalD6,d.InteresD6,d.MontoD6,d.MoratoriosD6,d.TotalD6,h.SourceScale,h.TotalA2,h.UsuarioId FROM @Detalle d CROSS JOIN @Header h;
END;
GO

CREATE OR ALTER PROCEDURE retenciones.spGuardarRetencionPMPHistorico_V3
  @Header retenciones.TVP_RetencionPMPHeader_V3 READONLY,
  @Detalle retenciones.TVP_RetencionPMPDetalle_V3 READONLY
AS
BEGIN
  SET NOCOUNT ON;
  IF EXISTS(SELECT 1 FROM @Header h JOIN liquidacion.QnaSnapshot q ON q.LiquidacionSnapshotId=h.LiquidacionSnapshotId WHERE q.VersionEsquema>=5)
    THROW 51733,'RETENCION_PMP_V5_REQUIERE_PROYECTOR',1;
  SET XACT_ABORT ON;
  IF (SELECT COUNT(*) FROM @Header)<>1 THROW 51625,'RETENCION_PMP_V3_REQUIERE_UN_HEADER',1;
  IF EXISTS(SELECT 1 FROM @Header WHERE SourceScale<>2 OR Registros<0) THROW 51626,'RETENCION_PMP_V3_HEADER_INVALIDO',1;
  IF (SELECT Registros FROM @Header)<>(SELECT COUNT(*) FROM @Detalle) THROW 51627,'RETENCION_PMP_V3_CONTEO_INVALIDO',1;
  IF NOT EXISTS(SELECT 1 FROM @Header h JOIN liquidacion.QnaSnapshotOficialActual o ON o.LiquidacionSnapshotId=h.LiquidacionSnapshotId
    JOIN liquidacion.QnaSnapshotFuente f ON f.LiquidacionSnapshotId=h.LiquidacionSnapshotId AND f.Dominio='PMP' AND f.Registros=h.Registros
    JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=h.LiquidacionSnapshotId AND t.RetencionPMPA2=h.TotalA2)
    THROW 51628,'RETENCION_PMP_V3_SNAPSHOT_NO_COINCIDE',1;
  IF (SELECT TotalA2 FROM @Header)<>ROUND(COALESCE((SELECT SUM(TotalD6) FROM @Detalle),0),2,1) THROW 51635,'RETENCION_PMP_V3_TOTAL_INVALIDO',1;
  IF EXISTS(SELECT TotalD6,COUNT_BIG(*) FROM @Detalle GROUP BY TotalD6 EXCEPT SELECT ImporteOficialD6,COUNT_BIG(*) FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header) AND Dominio='PMP' GROUP BY ImporteOficialD6)
    OR EXISTS(SELECT ImporteOficialD6,COUNT_BIG(*) FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header) AND Dominio='PMP' GROUP BY ImporteOficialD6 EXCEPT SELECT TotalD6,COUNT_BIG(*) FROM @Detalle GROUP BY TotalD6)
    THROW 51636,'RETENCION_PMP_V3_DETALLE_NO_COINCIDE',1;
  IF EXISTS(SELECT 1 FROM retenciones.RetencionPMPHistoricoV3 WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header)) RETURN;
  INSERT retenciones.RetencionPMPHistoricoV3(LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Prestamo,Letra,Plazo,CapitalD6,InteresD6,MoratoriosD6,SeguroD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId)
  SELECT h.LiquidacionSnapshotId,d.Orden,d.EmpleadoClave,d.Rfc,d.Prestamo,d.Letra,d.Plazo,d.CapitalD6,d.InteresD6,d.MoratoriosD6,d.SeguroD6,d.TotalD6,h.SourceScale,h.TotalA2,h.UsuarioId FROM @Detalle d CROSS JOIN @Header h;
END;
GO

CREATE OR ALTER PROCEDURE retenciones.spGuardarRetencionHIPHistorico_V3
  @Header retenciones.TVP_RetencionHIPHeader_V3 READONLY,
  @Detalle retenciones.TVP_RetencionHIPDetalle_V3 READONLY
AS
BEGIN
  SET NOCOUNT ON;
  IF EXISTS(SELECT 1 FROM @Header h JOIN liquidacion.QnaSnapshot q ON q.LiquidacionSnapshotId=h.LiquidacionSnapshotId WHERE q.VersionEsquema>=5)
    THROW 51734,'RETENCION_HIP_V5_REQUIERE_PROYECTOR',1;
  SET XACT_ABORT ON;
  IF (SELECT COUNT(*) FROM @Header)<>1 THROW 51629,'RETENCION_HIP_V3_REQUIERE_UN_HEADER',1;
  IF EXISTS(SELECT 1 FROM @Header WHERE SourceScale<>2 OR Registros<0) THROW 51630,'RETENCION_HIP_V3_HEADER_INVALIDO',1;
  IF (SELECT Registros FROM @Header)<>(SELECT COUNT(*) FROM @Detalle) THROW 51631,'RETENCION_HIP_V3_CONTEO_INVALIDO',1;
  IF NOT EXISTS(SELECT 1 FROM @Header h JOIN liquidacion.QnaSnapshotOficialActual o ON o.LiquidacionSnapshotId=h.LiquidacionSnapshotId
    JOIN liquidacion.QnaSnapshotFuente f ON f.LiquidacionSnapshotId=h.LiquidacionSnapshotId AND f.Dominio='HIP' AND f.Registros=h.Registros
    JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=h.LiquidacionSnapshotId AND t.RetencionHIPA2=h.TotalA2)
    THROW 51632,'RETENCION_HIP_V3_SNAPSHOT_NO_COINCIDE',1;
  IF (SELECT TotalA2 FROM @Header)<>ROUND(COALESCE((SELECT SUM(TotalD6) FROM @Detalle),0),2,1) THROW 51637,'RETENCION_HIP_V3_TOTAL_INVALIDO',1;
  IF EXISTS(SELECT TotalD6,COUNT_BIG(*) FROM @Detalle GROUP BY TotalD6 EXCEPT SELECT ImporteOficialD6,COUNT_BIG(*) FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header) AND Dominio='HIP' GROUP BY ImporteOficialD6)
    OR EXISTS(SELECT ImporteOficialD6,COUNT_BIG(*) FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header) AND Dominio='HIP' GROUP BY ImporteOficialD6 EXCEPT SELECT TotalD6,COUNT_BIG(*) FROM @Detalle GROUP BY TotalD6)
    THROW 51638,'RETENCION_HIP_V3_DETALLE_NO_COINCIDE',1;
  IF EXISTS(SELECT 1 FROM retenciones.RetencionHIPHistoricoV3 WHERE LiquidacionSnapshotId=(SELECT LiquidacionSnapshotId FROM @Header)) RETURN;
  INSERT retenciones.RetencionHIPHistoricoV3(LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Solicitud,AnioPrestamo,Plazo,CantidadD6,DescuentoD6,CapitalD6,InteresD6,InteresDiferidoD6,SeguroD6,MoratorioD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId)
  SELECT h.LiquidacionSnapshotId,d.Orden,d.EmpleadoClave,d.Rfc,d.Solicitud,d.AnioPrestamo,d.Plazo,d.CantidadD6,d.DescuentoD6,d.CapitalD6,d.InteresD6,d.InteresDiferidoD6,d.SeguroD6,d.MoratorioD6,d.TotalD6,h.SourceScale,h.TotalA2,h.UsuarioId FROM @Detalle d CROSS JOIN @Header h;
END;
GO

CREATE OR ALTER TRIGGER retenciones.TR_RetencionHistoricoLoteV3_Inmutable ON retenciones.RetencionHistoricoLoteV3 AFTER UPDATE,DELETE AS
BEGIN SET NOCOUNT ON; THROW 51691,'RETENCION_LOTE_V3_APPEND_ONLY',1; END;
GO

CREATE OR ALTER TRIGGER retenciones.TR_RetencionPCPHistoricoV3_GuardarV5 ON retenciones.RetencionPCPHistoricoV3 AFTER INSERT AS
BEGIN SET NOCOUNT ON;
  IF EXISTS(SELECT 1 FROM inserted i JOIN liquidacion.QnaSnapshot q ON q.LiquidacionSnapshotId=i.LiquidacionSnapshotId WHERE q.VersionEsquema>=5 AND i.RetencionHistoricoLoteV3Id IS NULL) THROW 51694,'RETENCION_PCP_V5_REQUIERE_PROYECTOR',1;
  IF EXISTS(SELECT 1 FROM inserted i JOIN retenciones.RetencionHistoricoLoteV3 l ON l.RetencionHistoricoLoteV3Id=i.RetencionHistoricoLoteV3Id JOIN liquidacion.QnaSnapshot q ON q.LiquidacionSnapshotId=i.LiquidacionSnapshotId WHERE l.Dominio<>'PCP' OR l.LiquidacionSnapshotId<>i.LiquidacionSnapshotId OR q.VersionEsquema<5) THROW 51695,'RETENCION_PCP_V5_LOTE_INVALIDO',1;
END;
GO
CREATE OR ALTER TRIGGER retenciones.TR_RetencionPMPHistoricoV3_GuardarV5 ON retenciones.RetencionPMPHistoricoV3 AFTER INSERT AS
BEGIN SET NOCOUNT ON;
  IF EXISTS(SELECT 1 FROM inserted i JOIN liquidacion.QnaSnapshot q ON q.LiquidacionSnapshotId=i.LiquidacionSnapshotId WHERE q.VersionEsquema>=5 AND i.RetencionHistoricoLoteV3Id IS NULL) THROW 51696,'RETENCION_PMP_V5_REQUIERE_PROYECTOR',1;
  IF EXISTS(SELECT 1 FROM inserted i JOIN retenciones.RetencionHistoricoLoteV3 l ON l.RetencionHistoricoLoteV3Id=i.RetencionHistoricoLoteV3Id JOIN liquidacion.QnaSnapshot q ON q.LiquidacionSnapshotId=i.LiquidacionSnapshotId WHERE l.Dominio<>'PMP' OR l.LiquidacionSnapshotId<>i.LiquidacionSnapshotId OR q.VersionEsquema<5) THROW 51697,'RETENCION_PMP_V5_LOTE_INVALIDO',1;
END;
GO
CREATE OR ALTER TRIGGER retenciones.TR_RetencionHIPHistoricoV3_GuardarV5 ON retenciones.RetencionHIPHistoricoV3 AFTER INSERT AS
BEGIN SET NOCOUNT ON;
  IF EXISTS(SELECT 1 FROM inserted i JOIN liquidacion.QnaSnapshot q ON q.LiquidacionSnapshotId=i.LiquidacionSnapshotId WHERE q.VersionEsquema>=5 AND i.RetencionHistoricoLoteV3Id IS NULL) THROW 51698,'RETENCION_HIP_V5_REQUIERE_PROYECTOR',1;
  IF EXISTS(SELECT 1 FROM inserted i JOIN retenciones.RetencionHistoricoLoteV3 l ON l.RetencionHistoricoLoteV3Id=i.RetencionHistoricoLoteV3Id JOIN liquidacion.QnaSnapshot q ON q.LiquidacionSnapshotId=i.LiquidacionSnapshotId WHERE l.Dominio<>'HIP' OR l.LiquidacionSnapshotId<>i.LiquidacionSnapshotId OR q.VersionEsquema<5) THROW 51699,'RETENCION_HIP_V5_LOTE_INVALIDO',1;
END;
GO

CREATE OR ALTER PROCEDURE retenciones.spProyectarRetencionesV3DesdeSnapshotV5
  @LiquidacionSnapshotId BIGINT,
  @UsuarioId NVARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @XactAbortOriginal BIT=CASE WHEN (16384 & @@OPTIONS)=16384 THEN 1 ELSE 0 END,@InicioTransaccion BIT=0,@LotesExistentes INT;
  SET XACT_ABORT OFF;
  IF @@TRANCOUNT=0 BEGIN SET @InicioTransaccion=1; BEGIN TRANSACTION; END ELSE SAVE TRANSACTION RetencionV3Proyector;
  BEGIN TRY
    IF NULLIF(LTRIM(RTRIM(@UsuarioId)),N'') IS NULL THROW 51700,'RETENCION_V3_USUARIO_REQUERIDO',1;
    IF NOT EXISTS(SELECT 1 FROM liquidacion.QnaSnapshot q WITH(UPDLOCK,HOLDLOCK) JOIN liquidacion.QnaSnapshotOficialActual o WITH(UPDLOCK,HOLDLOCK) ON o.LiquidacionSnapshotId=q.LiquidacionSnapshotId WHERE q.LiquidacionSnapshotId=@LiquidacionSnapshotId AND q.VersionEsquema>=5)
      THROW 51701,'RETENCION_V3_REQUIERE_SNAPSHOT_V5_OFICIAL',1;
    IF (SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuente WITH(UPDLOCK,HOLDLOCK) WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId AND Dominio IN('PCP','PMP','HIP'))<>3
      THROW 51702,'RETENCION_V3_FUENTES_INCOMPLETAS',1;
    IF EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotFuente f JOIN liquidacion.QnaSnapshot q ON q.LiquidacionSnapshotId=f.LiquidacionSnapshotId WHERE f.LiquidacionSnapshotId=@LiquidacionSnapshotId AND
      ((f.Dominio='PCP' AND f.IdentificadorFuente<>CONCAT('FIREBIRD:AP_S_PCP:',q.Ambiente,':',q.Periodo,':',q.Organica0,':',q.Organica1)) OR
       (f.Dominio='PMP' AND f.IdentificadorFuente<>CONCAT('FIREBIRD:AP_S_VIV:',q.Ambiente,':',q.Periodo,':',q.Organica0,':',q.Organica1)) OR
       (f.Dominio='HIP' AND f.IdentificadorFuente NOT IN(CONCAT('FIREBIRD:AP_S_HIP_QNA:',q.Ambiente,':',q.Periodo,':',q.Organica0,':',q.Organica1),CONCAT('FIREBIRD:AP_S_COMP_QNA:',q.Ambiente,':',q.Periodo,':',q.Organica0,':',q.Organica1)))))
      THROW 51703,'RETENCION_V3_PROCEDENCIA_INVALIDA',1;
    IF EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotFuente f WHERE f.LiquidacionSnapshotId=@LiquidacionSnapshotId AND f.Dominio IN('PCP','PMP','HIP') AND
      (f.SourceScale<>2 OR f.Registros<>(SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=f.LiquidacionSnapshotId AND d.Dominio=f.Dominio)))
      THROW 51704,'RETENCION_V3_CONTEO_O_ESCALA_INVALIDO',1;

    /* Componentes no nulos deben ser strings D6 canonicos; null se conserva. */
    IF EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotFuenteDetalle d CROSS APPLY OPENJSON(d.PayloadCanonico) j
      JOIN(VALUES('PCP','capital_d6'),('PCP','interes_d6'),('PCP','monto_d6'),('PCP','moratorios_d6'),
        ('PMP','capital_d6'),('PMP','interes_d6'),('PMP','moratorios_d6'),('PMP','seguro_d6'),
        ('HIP','descto_d6'),('HIP','capital_pagar_d6'),('HIP','interes_pagar_d6'),('HIP','interes_diferido_pagar_d6'),('HIP','seguro_pagar_d6'),('HIP','moratorio_pagar_d6'))v(Dominio,Campo)
        ON v.Dominio=d.Dominio AND v.Campo=j.[key]
      WHERE d.LiquidacionSnapshotId=@LiquidacionSnapshotId AND j.[type]<>0 AND
        (j.[type]<>1 OR TRY_CONVERT(DECIMAL(19,6),j.value) IS NULL OR j.value<>CONVERT(VARCHAR(40),TRY_CONVERT(DECIMAL(19,6),j.value))))
      THROW 51705,'RETENCION_V3_COMPONENTE_D6_MALFORMADO',1;
    /* Cada entero se valida directamente contra el tipo final de su columna destino. */
    IF EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotFuenteDetalle d CROSS APPLY OPENJSON(d.PayloadCanonico) j
      JOIN(VALUES('PCP','interno'),('PCP','prestamo'),('PCP','letra'),('PCP','plazo'),
        ('PMP','interno'),('PMP','prestamo'),('PMP','letra'),('PMP','plazo'),('PMP','folio'),
        ('HIP','interno'),('HIP','pno_solicitud'),('HIP','plazo'))v(Dominio,Campo)
        ON v.Dominio=d.Dominio AND v.Campo=j.[key]
      WHERE d.LiquidacionSnapshotId=@LiquidacionSnapshotId AND j.[type]<>0 AND
        (j.[type]<>2 OR TRY_CONVERT(INT,j.value) IS NULL OR j.value<>CONVERT(VARCHAR(20),TRY_CONVERT(INT,j.value))))
      THROW 51723,'RETENCION_V3_ENTERO_INT_DESTINO_INVALIDO',1;
    IF EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotFuenteDetalle d CROSS APPLY OPENJSON(d.PayloadCanonico) j
      WHERE d.LiquidacionSnapshotId=@LiquidacionSnapshotId AND d.Dominio='HIP' AND j.[key]='pano' AND j.[type]<>0 AND
        (j.[type]<>2 OR TRY_CONVERT(SMALLINT,j.value) IS NULL OR j.value<>CONVERT(VARCHAR(20),TRY_CONVERT(SMALLINT,j.value))))
      THROW 51725,'RETENCION_V3_ENTERO_SMALLINT_DESTINO_INVALIDO',1;
    IF EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=@LiquidacionSnapshotId AND d.Dominio IN('PCP','PMP','HIP') AND
      (JSON_VALUE(d.PayloadCanonico,CASE d.Dominio WHEN 'HIP' THEN '$.cantidad_d6' ELSE '$.total_d6' END) IS NULL
       OR TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,CASE d.Dominio WHEN 'HIP' THEN '$.cantidad_d6' ELSE '$.total_d6' END)) IS NULL
       OR JSON_VALUE(d.PayloadCanonico,CASE d.Dominio WHEN 'HIP' THEN '$.cantidad_d6' ELSE '$.total_d6' END)
          <>CONVERT(VARCHAR(40),TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,CASE d.Dominio WHEN 'HIP' THEN '$.cantidad_d6' ELSE '$.total_d6' END)))))
      THROW 51724,'RETENCION_V3_IMPORTE_OFICIAL_MALFORMADO',1;
    IF EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=@LiquidacionSnapshotId AND d.Dominio IN('PCP','PMP','HIP') AND
      (d.PayloadVersion<>1 OR d.EmpleadoClave<>JSON_VALUE(d.PayloadCanonico,'$.interno') OR d.Nombre<>JSON_VALUE(d.PayloadCanonico,'$.nombre')
       OR ISNULL(d.Rfc,N'#NULL#')<>ISNULL(JSON_VALUE(d.PayloadCanonico,'$.rfc'),N'#NULL#')
       OR d.ImporteOficialD6<>TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,CASE d.Dominio WHEN 'HIP' THEN '$.cantidad_d6' ELSE '$.total_d6' END))))
      THROW 51706,'RETENCION_V3_IDENTIDAD_O_IMPORTE_INVALIDO',1;

    SELECT @LotesExistentes=COUNT(*) FROM retenciones.RetencionHistoricoLoteV3 WITH(UPDLOCK,HOLDLOCK) WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId;
    IF @LotesExistentes NOT IN(0,3) THROW 51707,'RETENCION_V3_LOTES_PARCIALES',1;
    IF @LotesExistentes=0
      INSERT retenciones.RetencionHistoricoLoteV3(LiquidacionSnapshotId,Dominio,EstadoFuente,Registros,HashFuente,TotalA2,SourceScale,IdentificadorFuente,UsuarioId)
      SELECT f.LiquidacionSnapshotId,f.Dominio,f.Estado,f.Registros,f.HashFuente,
        CASE f.Dominio WHEN 'PCP' THEN t.RetencionPCPA2 WHEN 'PMP' THEN t.RetencionPMPA2 ELSE t.RetencionHIPA2 END,
        f.SourceScale,f.IdentificadorFuente,@UsuarioId FROM liquidacion.QnaSnapshotFuente f JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=f.LiquidacionSnapshotId
      WHERE f.LiquidacionSnapshotId=@LiquidacionSnapshotId AND f.Dominio IN('PCP','PMP','HIP');

    IF EXISTS(SELECT f.LiquidacionSnapshotId,f.Dominio,f.Estado,f.Registros,f.HashFuente,
        CASE f.Dominio WHEN 'PCP' THEN t.RetencionPCPA2 WHEN 'PMP' THEN t.RetencionPMPA2 ELSE t.RetencionHIPA2 END,f.SourceScale,f.IdentificadorFuente
      FROM liquidacion.QnaSnapshotFuente f JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=f.LiquidacionSnapshotId WHERE f.LiquidacionSnapshotId=@LiquidacionSnapshotId AND f.Dominio IN('PCP','PMP','HIP')
      EXCEPT SELECT LiquidacionSnapshotId,Dominio,EstadoFuente,Registros,HashFuente,TotalA2,SourceScale,IdentificadorFuente FROM retenciones.RetencionHistoricoLoteV3 WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId)
      OR EXISTS(SELECT LiquidacionSnapshotId,Dominio,EstadoFuente,Registros,HashFuente,TotalA2,SourceScale,IdentificadorFuente FROM retenciones.RetencionHistoricoLoteV3 WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId
      EXCEPT SELECT f.LiquidacionSnapshotId,f.Dominio,f.Estado,f.Registros,f.HashFuente,CASE f.Dominio WHEN 'PCP' THEN t.RetencionPCPA2 WHEN 'PMP' THEN t.RetencionPMPA2 ELSE t.RetencionHIPA2 END,f.SourceScale,f.IdentificadorFuente FROM liquidacion.QnaSnapshotFuente f JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=f.LiquidacionSnapshotId WHERE f.LiquidacionSnapshotId=@LiquidacionSnapshotId AND f.Dominio IN('PCP','PMP','HIP'))
      THROW 51708,'RETENCION_V3_REINTENTO_LOTE_DIFERENTE',1;

    IF TRY_CONVERT(BIT,SESSION_CONTEXT(N'RETENCION_V3_FAIL_AFTER_LOTES'))=1
      THROW 51722,'RETENCION_V3_FALLO_INYECTADO_DESPUES_LOTES',1;

    CREATE TABLE #Esperado(Dominio VARCHAR(3),LoteId BIGINT,LiquidacionSnapshotId BIGINT,Orden INT,EmpleadoClave NVARCHAR(50),Rfc NVARCHAR(20) NULL,Interno INT,Nombre NVARCHAR(255),K1 INT NULL,K2 INT NULL,Plazo INT NULL,Anio SMALLINT NULL,
      C1 DECIMAL(19,6) NULL,C2 DECIMAL(19,6) NULL,C3 DECIMAL(19,6) NULL,C4 DECIMAL(19,6) NULL,C5 DECIMAL(19,6) NULL,C6 DECIMAL(19,6) NULL,Oficial1 DECIMAL(19,6),Oficial2 DECIMAL(19,6),SourceScale TINYINT,TotalA2 DECIMAL(19,2),UsuarioId NVARCHAR(100),
      ClaveFilaHash CHAR(64),HashFila CHAR(64),PayloadCanonico NVARCHAR(MAX),PayloadVersion SMALLINT,IdentificadorFuente NVARCHAR(300),QnaSnapshotDetalleId BIGINT NULL,EsHuerfano BIT);
    INSERT #Esperado
    SELECT d.Dominio,l.RetencionHistoricoLoteV3Id,d.LiquidacionSnapshotId,d.Orden,d.EmpleadoClave,d.Rfc,TRY_CONVERT(INT,d.EmpleadoClave),d.Nombre,
      TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,CASE d.Dominio WHEN 'HIP' THEN '$.pno_solicitud' ELSE '$.prestamo' END)),
      CASE WHEN d.Dominio IN('PCP','PMP') THEN TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.letra')) END,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.plazo')),
      CASE WHEN d.Dominio='HIP' THEN TRY_CONVERT(SMALLINT,JSON_VALUE(d.PayloadCanonico,'$.pano')) END,
      TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,CASE d.Dominio WHEN 'PCP' THEN '$.capital_d6' WHEN 'PMP' THEN '$.capital_d6' ELSE '$.descto_d6' END)),
      TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,CASE d.Dominio WHEN 'PCP' THEN '$.interes_d6' WHEN 'PMP' THEN '$.interes_d6' ELSE '$.capital_pagar_d6' END)),
      TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,CASE d.Dominio WHEN 'PCP' THEN '$.monto_d6' WHEN 'PMP' THEN '$.moratorios_d6' ELSE '$.interes_pagar_d6' END)),
      TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,CASE d.Dominio WHEN 'PCP' THEN '$.moratorios_d6' WHEN 'PMP' THEN '$.seguro_d6' ELSE '$.interes_diferido_pagar_d6' END)),
      CASE WHEN d.Dominio='HIP' THEN TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.seguro_pagar_d6')) END,
      CASE WHEN d.Dominio='HIP' THEN TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.moratorio_pagar_d6')) END,
      d.ImporteOficialD6,d.ImporteOficialD6,l.SourceScale,l.TotalA2,l.UsuarioId,d.ClaveFilaHash,d.HashFila,d.PayloadCanonico,d.PayloadVersion,l.IdentificadorFuente,e.QnaSnapshotDetalleId,IIF(e.QnaSnapshotDetalleId IS NULL,1,0)
    FROM liquidacion.QnaSnapshotFuenteDetalle d JOIN retenciones.RetencionHistoricoLoteV3 l ON l.LiquidacionSnapshotId=d.LiquidacionSnapshotId AND l.Dominio=d.Dominio
    LEFT JOIN liquidacion.QnaSnapshotDetalle e ON e.LiquidacionSnapshotId=d.LiquidacionSnapshotId AND e.Interno=TRY_CONVERT(INT,d.EmpleadoClave)
    WHERE d.LiquidacionSnapshotId=@LiquidacionSnapshotId AND d.Dominio IN('PCP','PMP','HIP');

    IF @LotesExistentes=0
    BEGIN
      INSERT retenciones.RetencionPCPHistoricoV3(LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Prestamo,Letra,Plazo,CapitalD6,InteresD6,MontoD6,MoratoriosD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId,RetencionHistoricoLoteV3Id,Interno,Nombre,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano)
      SELECT LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,K1,K2,Plazo,C1,C2,C3,C4,Oficial1,SourceScale,TotalA2,UsuarioId,LoteId,Interno,Nombre,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano FROM #Esperado WHERE Dominio='PCP';
      INSERT retenciones.RetencionPMPHistoricoV3(LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Prestamo,Letra,Plazo,CapitalD6,InteresD6,MoratoriosD6,SeguroD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId,RetencionHistoricoLoteV3Id,Interno,Nombre,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano)
      SELECT LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,K1,K2,Plazo,C1,C2,C3,C4,Oficial1,SourceScale,TotalA2,UsuarioId,LoteId,Interno,Nombre,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano FROM #Esperado WHERE Dominio='PMP';
      INSERT retenciones.RetencionHIPHistoricoV3(LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Solicitud,AnioPrestamo,Plazo,CantidadD6,DescuentoD6,CapitalD6,InteresD6,InteresDiferidoD6,SeguroD6,MoratorioD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId,RetencionHistoricoLoteV3Id,Interno,Nombre,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano)
      SELECT LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,K1,Anio,Plazo,Oficial1,C1,C2,C3,C4,C5,C6,Oficial2,SourceScale,TotalA2,UsuarioId,LoteId,Interno,Nombre,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano FROM #Esperado WHERE Dominio='HIP';
    END;

    /* EXCEPT es null-safe y cubre todo el contrato de fila en ambos sentidos. */
    IF EXISTS(SELECT LoteId,LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Interno,Nombre,K1,K2,Plazo,C1,C2,C3,C4,Oficial1,SourceScale,TotalA2,UsuarioId,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano FROM #Esperado WHERE Dominio='PCP'
      EXCEPT SELECT RetencionHistoricoLoteV3Id,LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Interno,Nombre,Prestamo,Letra,Plazo,CapitalD6,InteresD6,MontoD6,MoratoriosD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano FROM retenciones.RetencionPCPHistoricoV3 WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId)
      OR EXISTS(SELECT RetencionHistoricoLoteV3Id,LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Interno,Nombre,Prestamo,Letra,Plazo,CapitalD6,InteresD6,MontoD6,MoratoriosD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano FROM retenciones.RetencionPCPHistoricoV3 WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId
      EXCEPT SELECT LoteId,LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Interno,Nombre,K1,K2,Plazo,C1,C2,C3,C4,Oficial1,SourceScale,TotalA2,UsuarioId,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano FROM #Esperado WHERE Dominio='PCP') THROW 51709,'RETENCION_PCP_V3_REINTENTO_DIFERENTE',1;
    IF EXISTS(SELECT LoteId,LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Interno,Nombre,K1,K2,Plazo,C1,C2,C3,C4,Oficial1,SourceScale,TotalA2,UsuarioId,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano FROM #Esperado WHERE Dominio='PMP'
      EXCEPT SELECT RetencionHistoricoLoteV3Id,LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Interno,Nombre,Prestamo,Letra,Plazo,CapitalD6,InteresD6,MoratoriosD6,SeguroD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano FROM retenciones.RetencionPMPHistoricoV3 WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId)
      OR EXISTS(SELECT RetencionHistoricoLoteV3Id,LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Interno,Nombre,Prestamo,Letra,Plazo,CapitalD6,InteresD6,MoratoriosD6,SeguroD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano FROM retenciones.RetencionPMPHistoricoV3 WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId
      EXCEPT SELECT LoteId,LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Interno,Nombre,K1,K2,Plazo,C1,C2,C3,C4,Oficial1,SourceScale,TotalA2,UsuarioId,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano FROM #Esperado WHERE Dominio='PMP') THROW 51710,'RETENCION_PMP_V3_REINTENTO_DIFERENTE',1;
    IF EXISTS(SELECT LoteId,LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Interno,Nombre,K1,Anio,Plazo,Oficial1,C1,C2,C3,C4,C5,C6,Oficial2,SourceScale,TotalA2,UsuarioId,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano FROM #Esperado WHERE Dominio='HIP'
      EXCEPT SELECT RetencionHistoricoLoteV3Id,LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Interno,Nombre,Solicitud,AnioPrestamo,Plazo,CantidadD6,DescuentoD6,CapitalD6,InteresD6,InteresDiferidoD6,SeguroD6,MoratorioD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano FROM retenciones.RetencionHIPHistoricoV3 WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId)
      OR EXISTS(SELECT RetencionHistoricoLoteV3Id,LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Interno,Nombre,Solicitud,AnioPrestamo,Plazo,CantidadD6,DescuentoD6,CapitalD6,InteresD6,InteresDiferidoD6,SeguroD6,MoratorioD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano FROM retenciones.RetencionHIPHistoricoV3 WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId
      EXCEPT SELECT LoteId,LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Interno,Nombre,K1,Anio,Plazo,Oficial1,C1,C2,C3,C4,C5,C6,Oficial2,SourceScale,TotalA2,UsuarioId,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano FROM #Esperado WHERE Dominio='HIP') THROW 51711,'RETENCION_HIP_V3_REINTENTO_DIFERENTE',1;

    IF @InicioTransaccion=1 COMMIT TRANSACTION;
    IF @XactAbortOriginal=1 SET XACT_ABORT ON;
  END TRY
  BEGIN CATCH
    IF XACT_STATE()<>0
    BEGIN
      IF @InicioTransaccion=1 OR XACT_STATE()=-1 ROLLBACK TRANSACTION;
      ELSE ROLLBACK TRANSACTION RetencionV3Proyector;
    END;
    IF @XactAbortOriginal=1 SET XACT_ABORT ON;
    THROW;
  END CATCH;
END;
GO

IF OBJECT_ID(N'retenciones.spProyectarRetencionesHistoricoV3DesdeSnapshotV5',N'P') IS NOT NULL DROP PROCEDURE retenciones.spProyectarRetencionesHistoricoV3DesdeSnapshotV5;
GO
