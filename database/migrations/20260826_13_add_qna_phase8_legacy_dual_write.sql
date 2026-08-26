/* Fase 8: dual-write legacy derivado exclusivamente de evidencia V5 persistida. */
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

BEGIN TRY
  BEGIN TRANSACTION;

  DECLARE @Firmas TABLE(Tabla SYSNAME NOT NULL PRIMARY KEY,Firma CHAR(64) NOT NULL);
  INSERT @Firmas VALUES
    (N'aportaciones.IndividualesAhorroHistorico','E6535BBC747A656828D164C73CBB69A4408D901FA4D54E1A6AD54E5272448762'),
    (N'aportaciones.IndividualesViviendaHistorico','3854BC085CED6F2C378362FF63793133877C26F819E5489A33F0360908DBD036'),
    (N'aportaciones.IndividualesPrestacionesHistorico','7F19A377C521A4CC204F6DC95FB5E0FF653DA8117895D97D220A2024CDECC18A'),
    (N'aportaciones.IndividualesCairHistorico','33B28E1201D2EB7D71A609B3D24D5FBF83555880915479DD1EC882A0643D3495'),
    (N'aportaciones.PensionNominaTransitorioHistorico','447BC79736F44BB4D63692CBC624F21CDFB5D696E99317B562C9623634EAB358'),
    (N'aportaciones.GuarderiasHistorico','2B6B270C4ADD793CC4FCF841BBA75D9CFFB8CB432BC60F760AE3119C5A23F000'),
    (N'aportaciones.AguinaldoHistorico','2C6859DA2C729C56DBBFF4A8A4294B4AE4D18E16751DF93E881F2FC583BC94AC'),
    (N'retenciones.PrestamosCortoPlazoHistorico','56BF1684AB7499EB432729E72718EF7F7654BADAB991E49ED7894F7B34831881'),
    (N'retenciones.PrestamosMedianoPlazoHistorico','1A57593DF1F61288DC94CCE760380B63B25CD0385C727CC01A1FAECA7F20735F'),
    (N'retenciones.PrestamosHipotecariosHistorico','813A86E952FAB69B6E663A66C402F13C5524B676D22BE84DF78EB725286B2A28'),
    (N'aportaciones.ResumenHistorico','F1588AA4F91B3D3CBF5DC94253F23B45A6B09C6893B12029A845D11AA0B27ABB'),
    (N'conciliacion.RevisionAplicacionHistorico','B14B66F4FB7179CF4B46DFAA025A3E4DDDC9A410BECD207A2547637CC4FCF8AD');
  DECLARE @Tabla SYSNAME,@Firma CHAR(64),@Actual CHAR(64),@Cadena NVARCHAR(MAX);
  DECLARE firmas CURSOR LOCAL FAST_FORWARD FOR SELECT Tabla,Firma FROM @Firmas;
  OPEN firmas; FETCH NEXT FROM firmas INTO @Tabla,@Firma;
  WHILE @@FETCH_STATUS=0
  BEGIN
    IF OBJECT_ID(@Tabla,N'U') IS NULL THROW 51740,'QNA_PHASE8_TABLA_LEGACY_FALTANTE',1;
    SELECT @Cadena=STRING_AGG(CONVERT(NVARCHAR(MAX),CONCAT(c.column_id,':',c.name,':',t.name,':',c.max_length,':',c.precision,':',c.scale,':',CONVERT(INT,c.is_nullable),':',CONVERT(INT,c.is_identity))),'|') WITHIN GROUP(ORDER BY c.column_id)
      FROM sys.columns c JOIN sys.types t ON t.user_type_id=c.user_type_id
      WHERE c.object_id=OBJECT_ID(@Tabla) AND c.name NOT IN(N'QnaLiquidacionSnapshotId',N'QnaSourceOrden');
    SET @Actual=CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),CONVERT(VARCHAR(MAX),@Cadena))),2);
    IF @Actual<>@Firma THROW 51741,'QNA_PHASE8_FIRMA_LEGACY_INCOMPATIBLE',1;
    FETCH NEXT FROM firmas INTO @Tabla,@Firma;
  END;
  CLOSE firmas; DEALLOCATE firmas;
  IF COLUMNPROPERTY(OBJECT_ID(N'aportaciones.ResumenHistorico'),N'periodo',N'IsComputed')<>1 THROW 51754,'QNA_PHASE8_RESUMEN_PERIODO_DEBE_SER_CALCULADO',1;
  IF COLUMNPROPERTY(OBJECT_ID(N'aportaciones.IndividualesViviendaHistorico'),N'periodo',N'IsComputed')<>1 THROW 51755,'QNA_PHASE8_VIVIENDA_PERIODO_DEBE_SER_CALCULADO',1;
  IF COLUMNPROPERTY(OBJECT_ID(N'aportaciones.IndividualesAhorroHistorico'),N'periodo',N'IsComputed')<>1 THROW 51756,'QNA_PHASE8_AHORRO_PERIODO_DEBE_SER_CALCULADO',1;

  IF OBJECT_ID(N'liquidacion.QnaLegacyProjection',N'U') IS NULL
  BEGIN
    CREATE TABLE liquidacion.QnaLegacyProjection(
      QnaLegacyProjectionId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaLegacyProjection PRIMARY KEY,
      LiquidacionSnapshotId BIGINT NOT NULL,
      PoliticaVersion VARCHAR(40) NOT NULL,
      NormalizacionVersion VARCHAR(40) NOT NULL,
      Autoritativo VARCHAR(20) NOT NULL,
      Estado VARCHAR(20) NOT NULL CONSTRAINT DF_QnaLegacyProjection_Estado DEFAULT('PENDING'),
      Detalle NVARCHAR(2000) NULL,
      UsuarioId NVARCHAR(100) NOT NULL,
      FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaLegacyProjection_FechaCreacion DEFAULT(SYSDATETIME()),
      FechaActualizacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaLegacyProjection_FechaActualizacion DEFAULT(SYSDATETIME()),
      CONSTRAINT FK_QnaLegacyProjection_Snapshot FOREIGN KEY(LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot(LiquidacionSnapshotId),
      CONSTRAINT UQ_QnaLegacyProjection_Snapshot UNIQUE(LiquidacionSnapshotId),
      CONSTRAINT CK_QnaLegacyProjection_Contrato CHECK(PoliticaVersion='QNA-LEGACY-DUAL-WRITE-V1' AND NormalizacionVersion='LEGACY-PROJECTION-v1' AND Autoritativo='V5' AND Estado IN('PENDING','COMPLETE','WARNING','ERROR','SUPERSEDED'))
    );
  END;

  IF OBJECT_ID(N'liquidacion.QnaLegacyReconciliacion',N'U') IS NULL
  BEGIN
    CREATE TABLE liquidacion.QnaLegacyReconciliacion(
      QnaLegacyReconciliacionId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaLegacyReconciliacion PRIMARY KEY,
      QnaLegacyProjectionId BIGINT NOT NULL,
      Dominio VARCHAR(20) NOT NULL,
      Estado VARCHAR(10) NOT NULL,
      EstadoDominio VARCHAR(20) NOT NULL,
      RegistrosEsperados INT NOT NULL,
      RegistrosActuales INT NOT NULL,
      TotalEsperadoA2 DECIMAL(19,2) NOT NULL,
      TotalActualA2 DECIMAL(19,2) NOT NULL,
      TotalV5A2 DECIMAL(19,2) NOT NULL CONSTRAINT DF_QnaLegacyReconciliacion_TotalV5 DEFAULT(0),
      DiferenciaNormalizacionA2 DECIMAL(19,2) NOT NULL CONSTRAINT DF_QnaLegacyReconciliacion_DiferenciaNormalizacion DEFAULT(0),
      NormalizacionVersion VARCHAR(40) NOT NULL CONSTRAINT DF_QnaLegacyReconciliacion_Normalizacion DEFAULT('LEGACY-PROJECTION-v1'),
      HashEsperado CHAR(64) NULL,
      HashActual CHAR(64) NULL,
      Diferencias NVARCHAR(2000) NULL,
      ErrorDetalle NVARCHAR(2000) NULL,
      Huella CHAR(64) NOT NULL,
      UsuarioId NVARCHAR(100) NOT NULL,
      FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaLegacyReconciliacion_FechaCreacion DEFAULT(SYSDATETIME()),
       CONSTRAINT FK_QnaLegacyReconciliacion_Projection FOREIGN KEY(QnaLegacyProjectionId) REFERENCES liquidacion.QnaLegacyProjection(QnaLegacyProjectionId),
      CONSTRAINT CK_QnaLegacyReconciliacion_Contrato CHECK(Dominio IN('AHORRO','VIVIENDA','PRESTACIONES','CAIR','TRANSITORIO','GUARDERIAS','AGUINALDO','PCP','PMP','HIP','RESUMEN','REVISION') AND Estado IN('COMPLETE','WARNING','ERROR','SUPERSEDED') AND EstadoDominio IN('COMPLETE','EMPTY','NOT_APPLICABLE') AND RegistrosEsperados>=0 AND RegistrosActuales>=0 AND NormalizacionVersion='LEGACY-PROJECTION-v1')
    );
  END;
  IF OBJECT_ID(N'liquidacion.QnaLegacyReconciliacion',N'U') IS NOT NULL AND EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'liquidacion.QnaLegacyReconciliacion') AND name=N'UQ_QnaLegacyReconciliacion_Huella')
    ALTER TABLE liquidacion.QnaLegacyReconciliacion DROP CONSTRAINT UQ_QnaLegacyReconciliacion_Huella;
  IF OBJECT_ID(N'liquidacion.QnaLegacyReconciliacion',N'U') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'liquidacion.QnaLegacyReconciliacion') AND name=N'IX_QnaLegacyReconciliacion_ProjectionDominio')
    CREATE INDEX IX_QnaLegacyReconciliacion_ProjectionDominio ON liquidacion.QnaLegacyReconciliacion(QnaLegacyProjectionId,Dominio,QnaLegacyReconciliacionId);

  IF OBJECT_ID(N'liquidacion.QnaLegacyRepairAudit',N'U') IS NULL
  BEGIN
    CREATE TABLE liquidacion.QnaLegacyRepairAudit(
      QnaLegacyRepairAuditId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaLegacyRepairAudit PRIMARY KEY,
      LiquidacionSnapshotId BIGINT NOT NULL,
      UsuarioId NVARCHAR(100) NOT NULL,
      Motivo NVARCHAR(1000) NOT NULL,
      Resultado VARCHAR(10) NOT NULL,
      Detalle NVARCHAR(2000) NULL,
      FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaLegacyRepairAudit_FechaCreacion DEFAULT(SYSDATETIME()),
      CONSTRAINT FK_QnaLegacyRepairAudit_Snapshot FOREIGN KEY(LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot(LiquidacionSnapshotId),
      CONSTRAINT CK_QnaLegacyRepairAudit_Resultado CHECK(Resultado IN('COMPLETE','WARNING','ERROR'))
    );
  END;

  IF OBJECT_ID(N'liquidacion.QnaLegacyScopeOwnership',N'U') IS NULL
  BEGIN
    CREATE TABLE liquidacion.QnaLegacyScopeOwnership(
      QnaLegacyScopeOwnershipId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaLegacyScopeOwnership PRIMARY KEY,
      Organica0 CHAR(2) NOT NULL,Organica1 CHAR(2) NOT NULL,Anio INT NOT NULL,Quincena INT NOT NULL,
      EntidadId INT NOT NULL,Organica2 CHAR(2) NOT NULL,Organica3 CHAR(2) NOT NULL,
      QnaLegacyProjectionId BIGINT NOT NULL,LiquidacionSnapshotId BIGINT NOT NULL,
      FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaLegacyScopeOwnership_FechaCreacion DEFAULT(SYSDATETIME()),
      CONSTRAINT FK_QnaLegacyScopeOwnership_Projection FOREIGN KEY(QnaLegacyProjectionId) REFERENCES liquidacion.QnaLegacyProjection(QnaLegacyProjectionId),
      CONSTRAINT FK_QnaLegacyScopeOwnership_Snapshot FOREIGN KEY(LiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot(LiquidacionSnapshotId),
      CONSTRAINT UQ_QnaLegacyScopeOwnership_Reduced UNIQUE(Organica0,Organica1,Anio,Quincena),
      CONSTRAINT UQ_QnaLegacyScopeOwnership_Projection UNIQUE(QnaLegacyProjectionId)
    );
  END;

  IF OBJECT_ID(N'liquidacion.QnaLegacyExpectedDomain',N'U') IS NULL
  BEGIN
    CREATE TABLE liquidacion.QnaLegacyExpectedDomain(
      QnaLegacyExpectedDomainId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaLegacyExpectedDomain PRIMARY KEY,
      QnaLegacyProjectionId BIGINT NOT NULL,Dominio VARCHAR(20) NOT NULL,Registros INT NOT NULL,
      TotalV5A2 DECIMAL(19,2) NOT NULL,TotalNormalizadoA2 DECIMAL(19,2) NOT NULL,DiferenciaNormalizacionA2 AS (TotalNormalizadoA2-TotalV5A2) PERSISTED,
      HashEsperado CHAR(64) NOT NULL,NormalizacionVersion VARCHAR(40) NOT NULL,
      FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaLegacyExpectedDomain_FechaCreacion DEFAULT(SYSDATETIME()),
      CONSTRAINT FK_QnaLegacyExpectedDomain_Projection FOREIGN KEY(QnaLegacyProjectionId) REFERENCES liquidacion.QnaLegacyProjection(QnaLegacyProjectionId),
      CONSTRAINT UQ_QnaLegacyExpectedDomain_ProjectionDominio UNIQUE(QnaLegacyProjectionId,Dominio),
      CONSTRAINT CK_QnaLegacyExpectedDomain_Contrato CHECK(Dominio IN('AHORRO','VIVIENDA','PRESTACIONES','CAIR','TRANSITORIO','GUARDERIAS','AGUINALDO','PCP','PMP','HIP','RESUMEN','REVISION') AND Registros>=0 AND NormalizacionVersion='LEGACY-PROJECTION-v1')
    );
  END;
  IF OBJECT_ID(N'liquidacion.QnaLegacyExpectedRow',N'U') IS NULL
  BEGIN
    CREATE TABLE liquidacion.QnaLegacyExpectedRow(
      QnaLegacyExpectedRowId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QnaLegacyExpectedRow PRIMARY KEY,
      QnaLegacyProjectionId BIGINT NOT NULL,Dominio VARCHAR(20) NOT NULL,SourceOrden INT NOT NULL,RowHash CHAR(64) NOT NULL,
      NormalizacionVersion VARCHAR(40) NOT NULL CONSTRAINT DF_QnaLegacyExpectedRow_Normalizacion DEFAULT('LEGACY-PROJECTION-v1'),
      FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaLegacyExpectedRow_FechaCreacion DEFAULT(SYSDATETIME()),
      CONSTRAINT FK_QnaLegacyExpectedRow_Projection FOREIGN KEY(QnaLegacyProjectionId) REFERENCES liquidacion.QnaLegacyProjection(QnaLegacyProjectionId),
      CONSTRAINT UQ_QnaLegacyExpectedRow_ProjectionDomainOrder UNIQUE(QnaLegacyProjectionId,Dominio,SourceOrden),
      CONSTRAINT CK_QnaLegacyExpectedRow_Contrato CHECK(SourceOrden>0 AND LEN(RowHash)=64 AND NormalizacionVersion='LEGACY-PROJECTION-v1')
    );
  END;
  IF OBJECT_ID(N'liquidacion.QnaLegacyCapabilityLease',N'U') IS NULL
  BEGIN
    CREATE TABLE liquidacion.QnaLegacyCapabilityLease(
      SessionId SMALLINT NOT NULL CONSTRAINT PK_QnaLegacyCapabilityLease PRIMARY KEY,
      Depth INT NOT NULL CONSTRAINT DF_QnaLegacyCapabilityLease_Depth DEFAULT(1),
      FechaCreacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaLegacyCapabilityLease_FechaCreacion DEFAULT(SYSDATETIME())
    );
  END;
  IF COL_LENGTH(N'liquidacion.QnaLegacyCapabilityLease',N'Depth') IS NULL
    ALTER TABLE liquidacion.QnaLegacyCapabilityLease ADD Depth INT NOT NULL CONSTRAINT DF_QnaLegacyCapabilityLease_Depth DEFAULT(1);

  IF COL_LENGTH(N'liquidacion.QnaLegacyProjection',N'Estado') IS NULL ALTER TABLE liquidacion.QnaLegacyProjection ADD Estado VARCHAR(20) NOT NULL CONSTRAINT DF_QnaLegacyProjection_Estado DEFAULT('PENDING');
  IF COL_LENGTH(N'liquidacion.QnaLegacyProjection',N'Detalle') IS NULL ALTER TABLE liquidacion.QnaLegacyProjection ADD Detalle NVARCHAR(2000) NULL;
  IF COL_LENGTH(N'liquidacion.QnaLegacyProjection',N'FechaActualizacion') IS NULL ALTER TABLE liquidacion.QnaLegacyProjection ADD FechaActualizacion DATETIME2(3) NOT NULL CONSTRAINT DF_QnaLegacyProjection_FechaActualizacion DEFAULT(SYSDATETIME());
  IF COL_LENGTH(N'liquidacion.QnaLegacyReconciliacion',N'TotalV5A2') IS NULL ALTER TABLE liquidacion.QnaLegacyReconciliacion ADD TotalV5A2 DECIMAL(19,2) NOT NULL CONSTRAINT DF_QnaLegacyReconciliacion_TotalV5 DEFAULT(0);
  IF COL_LENGTH(N'liquidacion.QnaLegacyReconciliacion',N'DiferenciaNormalizacionA2') IS NULL ALTER TABLE liquidacion.QnaLegacyReconciliacion ADD DiferenciaNormalizacionA2 DECIMAL(19,2) NOT NULL CONSTRAINT DF_QnaLegacyReconciliacion_DiferenciaNormalizacion DEFAULT(0);
  IF COL_LENGTH(N'liquidacion.QnaLegacyReconciliacion',N'NormalizacionVersion') IS NULL ALTER TABLE liquidacion.QnaLegacyReconciliacion ADD NormalizacionVersion VARCHAR(40) NOT NULL CONSTRAINT DF_QnaLegacyReconciliacion_Normalizacion DEFAULT('LEGACY-PROJECTION-v1');
  IF COL_LENGTH(N'liquidacion.QnaLegacyRepairAudit',N'Detalle') IS NULL ALTER TABLE liquidacion.QnaLegacyRepairAudit ADD Detalle NVARCHAR(2000) NULL;
  IF OBJECT_ID(N'liquidacion.TR_QnaLegacyProjection_Inmutable',N'TR') IS NOT NULL DISABLE TRIGGER liquidacion.TR_QnaLegacyProjection_Inmutable ON liquidacion.QnaLegacyProjection;
  IF EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'liquidacion.QnaLegacyProjection') AND name=N'CK_QnaLegacyProjection_Contrato') ALTER TABLE liquidacion.QnaLegacyProjection DROP CONSTRAINT CK_QnaLegacyProjection_Contrato;
  EXEC(N'ALTER TABLE liquidacion.QnaLegacyProjection WITH CHECK ADD CONSTRAINT CK_QnaLegacyProjection_Contrato CHECK(PoliticaVersion=''QNA-LEGACY-DUAL-WRITE-V1'' AND NormalizacionVersion=''LEGACY-PROJECTION-v1'' AND Autoritativo=''V5'' AND Estado IN(''PENDING'',''COMPLETE'',''WARNING'',''ERROR'',''SUPERSEDED''))');
  IF EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'liquidacion.QnaLegacyReconciliacion') AND name=N'CK_QnaLegacyReconciliacion_Contrato') ALTER TABLE liquidacion.QnaLegacyReconciliacion DROP CONSTRAINT CK_QnaLegacyReconciliacion_Contrato;
  EXEC(N'ALTER TABLE liquidacion.QnaLegacyReconciliacion WITH CHECK ADD CONSTRAINT CK_QnaLegacyReconciliacion_Contrato CHECK(Dominio IN(''AHORRO'',''VIVIENDA'',''PRESTACIONES'',''CAIR'',''TRANSITORIO'',''GUARDERIAS'',''AGUINALDO'',''PCP'',''PMP'',''HIP'',''RESUMEN'',''REVISION'') AND Estado IN(''COMPLETE'',''WARNING'',''ERROR'',''SUPERSEDED'') AND EstadoDominio IN(''COMPLETE'',''EMPTY'',''NOT_APPLICABLE'') AND RegistrosEsperados>=0 AND RegistrosActuales>=0 AND NormalizacionVersion=''LEGACY-PROJECTION-v1'')');
  IF EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'liquidacion.QnaLegacyRepairAudit') AND name=N'CK_QnaLegacyRepairAudit_Resultado') ALTER TABLE liquidacion.QnaLegacyRepairAudit DROP CONSTRAINT CK_QnaLegacyRepairAudit_Resultado;
  ALTER TABLE liquidacion.QnaLegacyRepairAudit WITH CHECK ADD CONSTRAINT CK_QnaLegacyRepairAudit_Resultado CHECK(Resultado IN('COMPLETE','WARNING','ERROR'));
  IF OBJECT_ID(N'liquidacion.TR_QnaLegacyProjection_Inmutable',N'TR') IS NOT NULL ENABLE TRIGGER liquidacion.TR_QnaLegacyProjection_Inmutable ON liquidacion.QnaLegacyProjection;

  DECLARE @Provenance TABLE(Tabla SYSNAME PRIMARY KEY);
  INSERT @Provenance VALUES
    (N'aportaciones.IndividualesAhorroHistorico'),(N'aportaciones.IndividualesViviendaHistorico'),(N'aportaciones.IndividualesPrestacionesHistorico'),(N'aportaciones.IndividualesCairHistorico'),
    (N'aportaciones.PensionNominaTransitorioHistorico'),(N'aportaciones.GuarderiasHistorico'),(N'aportaciones.AguinaldoHistorico'),
    (N'retenciones.PrestamosCortoPlazoHistorico'),(N'retenciones.PrestamosMedianoPlazoHistorico'),(N'retenciones.PrestamosHipotecariosHistorico'),
    (N'aportaciones.ResumenHistorico'),(N'conciliacion.RevisionAplicacionHistorico');
  DECLARE @ProvenanceTable SYSNAME,@ProvenanceSql NVARCHAR(MAX),@ProvenanceObject SYSNAME;
  DECLARE provenance_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT Tabla FROM @Provenance;
  OPEN provenance_cursor; FETCH NEXT FROM provenance_cursor INTO @ProvenanceTable;
  WHILE @@FETCH_STATUS=0
  BEGIN
    SET @ProvenanceObject=PARSENAME(@ProvenanceTable,1);
    SET @ProvenanceSql=N'';
    IF COL_LENGTH(@ProvenanceTable,N'QnaLiquidacionSnapshotId') IS NULL SET @ProvenanceSql+=N'ALTER TABLE '+QUOTENAME(PARSENAME(@ProvenanceTable,2))+N'.'+QUOTENAME(@ProvenanceObject)+N' ADD QnaLiquidacionSnapshotId BIGINT NULL;';
    IF COL_LENGTH(@ProvenanceTable,N'QnaSourceOrden') IS NULL SET @ProvenanceSql+=N'ALTER TABLE '+QUOTENAME(PARSENAME(@ProvenanceTable,2))+N'.'+QUOTENAME(@ProvenanceObject)+N' ADD QnaSourceOrden INT NULL;';
    IF @ProvenanceSql<>N'' EXEC sys.sp_executesql @ProvenanceSql;
    IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID(@ProvenanceTable) AND name=N'FK_'+@ProvenanceObject+N'_QnaSnapshot')
    BEGIN
      SET @ProvenanceSql=N'ALTER TABLE '+QUOTENAME(PARSENAME(@ProvenanceTable,2))+N'.'+QUOTENAME(@ProvenanceObject)+N' WITH CHECK ADD CONSTRAINT '+QUOTENAME(N'FK_'+@ProvenanceObject+N'_QnaSnapshot')+N' FOREIGN KEY(QnaLiquidacionSnapshotId) REFERENCES liquidacion.QnaSnapshot(LiquidacionSnapshotId);';
      EXEC sys.sp_executesql @ProvenanceSql;
    END;
    IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(@ProvenanceTable) AND name=N'IX_'+@ProvenanceObject+N'_QnaProvenance')
    BEGIN
      SET @ProvenanceSql=N'CREATE INDEX '+QUOTENAME(N'IX_'+@ProvenanceObject+N'_QnaProvenance')+N' ON '+QUOTENAME(PARSENAME(@ProvenanceTable,2))+N'.'+QUOTENAME(@ProvenanceObject)+N'(QnaLiquidacionSnapshotId,QnaSourceOrden) WHERE QnaLiquidacionSnapshotId IS NOT NULL;';
      EXEC sys.sp_executesql @ProvenanceSql;
    END;
    FETCH NEXT FROM provenance_cursor INTO @ProvenanceTable;
  END;
  CLOSE provenance_cursor; DEALLOCATE provenance_cursor;

  IF DATABASE_PRINCIPAL_ID(N'qna_legacy_projector_executor') IS NULL EXEC(N'CREATE ROLE qna_legacy_projector_executor AUTHORIZATION dbo');
  IF DATABASE_PRINCIPAL_ID(N'qna_legacy_repair_executor') IS NULL EXEC(N'CREATE ROLE qna_legacy_repair_executor AUTHORIZATION dbo');
  IF OBJECT_ID(N'liquidacion.spQnaLegacyCapabilityMarker',N'P') IS NULL EXEC(N'CREATE PROCEDURE liquidacion.spQnaLegacyCapabilityMarker AS RETURN 0;');
  IF NOT EXISTS(SELECT 1 FROM sys.certificates WHERE name=N'QnaLegacyProjectorCertificate')
    CREATE CERTIFICATE QnaLegacyProjectorCertificate ENCRYPTION BY PASSWORD='BICSN-QNA-Legacy-Projection-v1-Certificate' WITH SUBJECT='BICSN Phase 8 signed legacy projection capability';
  IF DATABASE_PRINCIPAL_ID(N'QnaLegacyProjectorCertificateUser') IS NULL CREATE USER QnaLegacyProjectorCertificateUser FOR CERTIFICATE QnaLegacyProjectorCertificate;
  IF NOT EXISTS(SELECT 1 FROM sys.certificates WHERE name=N'QnaLegacyGuardCertificate') CREATE CERTIFICATE QnaLegacyGuardCertificate ENCRYPTION BY PASSWORD='BICSN-QNA-Legacy-Guard-v1-Certificate' WITH SUBJECT='BICSN Phase 8 guard trigger signature';
  IF DATABASE_PRINCIPAL_ID(N'QnaLegacyGuardCertificateUser') IS NULL CREATE USER QnaLegacyGuardCertificateUser FOR CERTIFICATE QnaLegacyGuardCertificate;
  REVOKE EXECUTE ON OBJECT::liquidacion.spQnaLegacyCapabilityMarker FROM public;
  GRANT CONTROL ON OBJECT::liquidacion.spQnaLegacyCapabilityMarker TO QnaLegacyProjectorCertificateUser;
  DECLARE @CapabilityTable SYSNAME,@CapabilitySql NVARCHAR(MAX);
  DECLARE capability_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT Tabla FROM @Provenance;
  OPEN capability_cursor; FETCH NEXT FROM capability_cursor INTO @CapabilityTable;
  WHILE @@FETCH_STATUS=0
  BEGIN
    SET @CapabilitySql=N'GRANT SELECT,INSERT,UPDATE,DELETE ON OBJECT::'+QUOTENAME(PARSENAME(@CapabilityTable,2))+N'.'+QUOTENAME(PARSENAME(@CapabilityTable,1))+N' TO QnaLegacyProjectorCertificateUser;';
    EXEC sys.sp_executesql @CapabilitySql;
    FETCH NEXT FROM capability_cursor INTO @CapabilityTable;
  END;
  CLOSE capability_cursor; DEALLOCATE capability_cursor;
  IF OBJECT_ID(N'liquidacion.QnaLegacyModuleGate',N'U') IS NOT NULL DROP TABLE liquidacion.QnaLegacyModuleGate;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO

CREATE OR ALTER PROCEDURE liquidacion.spQnaLegacyCapabilityMarker
  @Acquire BIT
AS
BEGIN
  SET NOCOUNT ON;
  IF @Acquire=1
  BEGIN
    IF EXISTS(SELECT 1 FROM liquidacion.QnaLegacyCapabilityLease WHERE SessionId=@@SPID)
      UPDATE liquidacion.QnaLegacyCapabilityLease SET Depth=Depth+1 WHERE SessionId=@@SPID;
    ELSE
      INSERT liquidacion.QnaLegacyCapabilityLease(SessionId) VALUES(CONVERT(SMALLINT,@@SPID));
  END
  ELSE
  BEGIN
    IF EXISTS(SELECT 1 FROM liquidacion.QnaLegacyCapabilityLease WHERE SessionId=@@SPID AND Depth=1)
      DELETE liquidacion.QnaLegacyCapabilityLease WHERE SessionId=@@SPID;
    ELSE
      UPDATE liquidacion.QnaLegacyCapabilityLease SET Depth=Depth-1 WHERE SessionId=@@SPID AND Depth>1;
  END;
END;
GO

CREATE OR ALTER PROCEDURE liquidacion.spQnaLegacyCapabilityProbe
AS
BEGIN
  SET NOCOUNT ON;
  EXEC liquidacion.spQnaLegacyCapabilityMarker 1;
  SELECT CONVERT(BIT,IIF(EXISTS(SELECT 1 FROM liquidacion.QnaLegacyCapabilityLease WHERE SessionId=@@SPID),1,0)) CapabilityGranted;
  EXEC liquidacion.spQnaLegacyCapabilityMarker 0;
END;
GO

CREATE OR ALTER TRIGGER liquidacion.TR_QnaLegacyProjection_Inmutable ON liquidacion.QnaLegacyProjection AFTER INSERT,UPDATE,DELETE AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS(SELECT 1 FROM liquidacion.QnaLegacyCapabilityLease WHERE SessionId=@@SPID) THROW 51742,'QNA_LEGACY_PROJECTION_DML_REQUIERE_CAPACIDAD_FIRMADA',1;
  IF EXISTS(SELECT 1 FROM deleted) AND NOT EXISTS(SELECT 1 FROM inserted) THROW 51742,'QNA_LEGACY_PROJECTION_DELETE_PROHIBIDO',1;
  IF EXISTS(SELECT 1 FROM inserted i JOIN deleted d ON d.QnaLegacyProjectionId=i.QnaLegacyProjectionId
    WHERE i.LiquidacionSnapshotId<>d.LiquidacionSnapshotId OR i.PoliticaVersion<>d.PoliticaVersion OR i.NormalizacionVersion<>d.NormalizacionVersion
      OR i.Autoritativo<>d.Autoritativo OR i.UsuarioId<>d.UsuarioId OR i.FechaCreacion<>d.FechaCreacion)
    THROW 51742,'QNA_LEGACY_PROJECTION_CABECERA_INMUTABLE',1;
END;
GO

CREATE OR ALTER PROCEDURE liquidacion.spCargarFilasLegacyCanonicasActuales
  @Tabla SYSNAME,@LiquidacionSnapshotId BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  IF OBJECT_ID(@Tabla,N'U') IS NULL OR NOT EXISTS(SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(@Tabla) AND name=N'QnaLiquidacionSnapshotId') THROW 51759,'QNA_LEGACY_CANONICAL_STORE_INVALIDO',1;
  DECLARE @Identity SYSNAME=(SELECT name FROM sys.columns WHERE object_id=OBJECT_ID(@Tabla) AND is_identity=1);
  DECLARE @Columns NVARCHAR(MAX)=(SELECT STRING_AGG(CONVERT(NVARCHAR(MAX),N'r2.'+QUOTENAME(name)),N',') WITHIN GROUP(ORDER BY column_id)
    FROM sys.columns WHERE object_id=OBJECT_ID(@Tabla) AND is_identity=0
      AND name NOT IN(N'fecha_consulta',N'usuario_id',N'FechaAlta',N'FechaActualizacion',N'UsuarioId',N'QnaLiquidacionSnapshotId',N'QnaSourceOrden'));
  IF @Identity IS NULL OR @Columns IS NULL THROW 51759,'QNA_LEGACY_CANONICAL_COLUMNS_INVALIDAS',1;
  DECLARE @Sql NVARCHAR(MAX)=N'INSERT #ActualCanonical(PhysicalId,SourceOrden,RowHash)
    SELECT CONVERT(BIGINT,r.'+QUOTENAME(@Identity)+N'),r.QnaSourceOrden,
      CONVERT(CHAR(64),HASHBYTES(''SHA2_256'',CONVERT(VARBINARY(MAX),(SELECT '+@Columns+N' FROM '+QUOTENAME(PARSENAME(@Tabla,2))+N'.'+QUOTENAME(PARSENAME(@Tabla,1))+N' r2 WHERE r2.'+QUOTENAME(@Identity)+N'=r.'+QUOTENAME(@Identity)+N' FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES))),2)
    FROM '+QUOTENAME(PARSENAME(@Tabla,2))+N'.'+QUOTENAME(PARSENAME(@Tabla,1))+N' r WHERE r.QnaLiquidacionSnapshotId=@Id;';
  EXEC sys.sp_executesql @Sql,N'@Id BIGINT',@LiquidacionSnapshotId;
END;
GO

CREATE OR ALTER PROCEDURE liquidacion.spConstruirOracleLegacyV5
  @LiquidacionSnapshotId BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @P BIGINT,@O0 CHAR(2),@O1 CHAR(2),@O2 CHAR(2),@O3 CHAR(2),@A INT,@Q INT,@Per CHAR(4),@HipComp BIT,@BaseSueldo DECIMAL(19,6);
  SELECT @P=p.QnaLegacyProjectionId,@O0=s.Organica0,@O1=s.Organica1,@O2=s.Organica2,@O3=s.Organica3,@A=s.Anio,@Q=s.Quincena,@Per=s.Periodo
    FROM liquidacion.QnaLegacyProjection p JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=p.LiquidacionSnapshotId WHERE p.LiquidacionSnapshotId=@LiquidacionSnapshotId;
  IF @P IS NULL THROW 51758,'QNA_LEGACY_ORACLE_HEADER_REQUERIDO',1;
  SELECT @HipComp=IIF(IdentificadorFuente LIKE 'FIREBIRD:AP_S_COMP_QNA:%',1,0) FROM liquidacion.QnaSnapshotFuente WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId AND Dominio='HIP';
  SELECT @BaseSueldo=COALESCE(SUM(BaseCotizacionSueldoD6),0) FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId;
  DELETE liquidacion.QnaLegacyExpectedRow WHERE QnaLegacyProjectionId=@P;
  DELETE liquidacion.QnaLegacyExpectedDomain WHERE QnaLegacyProjectionId=@P;
  DECLARE @Rows TABLE(Dominio VARCHAR(20),SourceOrden INT,RowHash CHAR(64),PRIMARY KEY(Dominio,SourceOrden));

  INSERT @Rows
  SELECT v.Dominio,d.Orden,CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),CASE v.Dominio
    WHEN 'AHORRO' THEN (SELECT @O0 clave_organica_0,@O1 clave_organica_1,@Q quincena,@A anio,@Per periodo,d.Interno interno,d.Nombre nombre,d.SueldoD6 sueldo,d.QuinqueniosD6 quinquenios,d.OtrasPrestacionesD6 otras_prestaciones,d.BaseCotizacionSueldoD6 sueldo_base,d.FAED6 afae,d.FAAD6 afaa,d.FATD6 total FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES)
    WHEN 'VIVIENDA' THEN (SELECT @O0 clave_organica_0,@O1 clave_organica_1,@Q quincena,@A anio,@Per periodo,d.Interno interno,d.Nombre nombre,d.SueldoD6 sueldo,d.QuinqueniosD6 quinquenios,d.OtrasPrestacionesD6 otras_prestaciones,d.BaseCotizacionSueldoD6 sueldo_base,d.ViviendaD6 afe,d.ViviendaD6 total FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES)
    WHEN 'PRESTACIONES' THEN (SELECT @O0 clave_organica_0,@O1 clave_organica_1,@Q quincena,@A anio,@Per periodo,d.Interno interno,d.Nombre nombre,d.SueldoD6 sueldo,d.QuinqueniosD6 quinquenios,d.OtrasPrestacionesD6 otras_prestaciones,COALESCE(d.BaseCotizacionSueldoD6,0) sueldo_base,d.FRED6 afpe,d.FRAD6 afpa,d.PrestacionesD6 total FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES)
    ELSE (SELECT @O0 clave_organica_0,@O1 clave_organica_1,@Q quincena,@A anio,@Per periodo,d.Interno interno,d.Nombre nombre,d.SueldoD6 sueldo,d.QuinqueniosD6 quinquenios,d.OtrasPrestacionesD6 otras_prestaciones,d.BaseCotizacionSueldoD6 sueldo_base,d.CAIRD6 afe,d.CAIRFondoD6 total FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES) END)),2)
  FROM liquidacion.QnaSnapshotDetalle d CROSS JOIN(VALUES('AHORRO'),('VIVIENDA'),('PRESTACIONES'),('CAIR'))v(Dominio)
  WHERE d.LiquidacionSnapshotId=@LiquidacionSnapshotId;

  INSERT @Rows
  SELECT d.Dominio,d.Orden,CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),CASE d.Dominio
    WHEN 'GUARDERIAS' THEN (SELECT @O0 clave_organica_0,@O1 clave_organica_1,@Q quincena,@A anio,@Per periodo,
      JSON_VALUE(d.PayloadCanonico,'$.titular_nombre') titular_nombre,JSON_VALUE(d.PayloadCanonico,'$.titular_no_empleado') titular_no_empleado,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.titular_monto')) titular_monto,JSON_VALUE(d.PayloadCanonico,'$.titular_rfc') titular_rfc,JSON_VALUE(d.PayloadCanonico,'$.titular_monto_texto') titular_monto_texto,
      CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.titular_org0')) titular_org0,JSON_VALUE(d.PayloadCanonico,'$.titular_org0_nombre') titular_org0_nombre,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.titular_org1')) titular_org1,JSON_VALUE(d.PayloadCanonico,'$.titular_org1_nombre') titular_org1_nombre,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.titular_org2')) titular_org2,JSON_VALUE(d.PayloadCanonico,'$.titular_org2_nombre') titular_org2_nombre,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.titular_org3')) titular_org3,JSON_VALUE(d.PayloadCanonico,'$.titular_org3_nombre') titular_org3_nombre,
      TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.entidad_monto')) entidad_monto,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.recibo_ajuste')) recibo_ajuste,CONVERT(DECIMAL(18,2),ROUND(d.ImporteOficialD6,2,1)) recibo_total,JSON_VALUE(d.PayloadCanonico,'$.recibo_mes_ano') recibo_mes_ano,TRY_CONVERT(DATETIME2,JSON_VALUE(d.PayloadCanonico,'$.recibo_fecha_venc')) recibo_fecha_venc,JSON_VALUE(d.PayloadCanonico,'$.recibo_folio') recibo_folio,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.menor_id')) menor_id,JSON_VALUE(d.PayloadCanonico,'$.menor_nombre') menor_nombre,JSON_VALUE(d.PayloadCanonico,'$.menor_rfc') menor_rfc,JSON_VALUE(d.PayloadCanonico,'$.menor_nivel') menor_nivel,JSON_VALUE(d.PayloadCanonico,'$.menor_sala') menor_sala,JSON_VALUE(d.PayloadCanonico,'$.estatus') estatus FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES)
    WHEN 'AGUINALDO' THEN (SELECT @O0 clave_organica_0,@O1 clave_organica_1,@Q quincena,@A anio,@Per periodo,
      TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.interno')) interno,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org0')) org0,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org1')) org1,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org2')) org2,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org3')) org3,JSON_VALUE(d.PayloadCanonico,'$.movimiento') movimiento,JSON_VALUE(d.PayloadCanonico,'$.noempleado') noempleado,JSON_VALUE(d.PayloadCanonico,'$.tipomovimiento') tipomovimiento,JSON_VALUE(d.PayloadCanonico,'$.nombres') nombres,JSON_VALUE(d.PayloadCanonico,'$.rfc') rfc,JSON_VALUE(d.PayloadCanonico,'$.curp') curp,TRY_CONVERT(DATETIME2,JSON_VALUE(d.PayloadCanonico,'$.fecha')) fecha,
      TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.dias_aguinaldo')) dias_aguinaldo,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.cuantos')) cuantos,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.cuantos_ori')) cuantos_ori,JSON_VALUE(d.PayloadCanonico,'$.nocontar') nocontar,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.sdo')) sdo,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.op')) op,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.q')) q,JSON_VALUE(d.PayloadCanonico,'$.activo') activo,JSON_VALUE(d.PayloadCanonico,'$.nom_activo') nom_activo,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.qna_a')) qna_a,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.porcentaje_a')) porcentaje_a,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.diario')) diario,CONVERT(DECIMAL(18,2),ROUND(d.ImporteOficialD6,2,1)) general,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.porcentaje')) porcentaje,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.proporcion')) proporcion,JSON_VALUE(d.PayloadCanonico,'$.mensaje') mensaje,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.dias_gral_agui')) dias_gral_agui,TRY_CONVERT(DATETIME2,JSON_VALUE(d.PayloadCanonico,'$.fecha_lf')) fecha_lf,TRY_CONVERT(DATETIME2,JSON_VALUE(d.PayloadCanonico,'$.fecha_li')) fecha_li,TRY_CONVERT(DATETIME2,JSON_VALUE(d.PayloadCanonico,'$.f_inicio')) f_inicio,TRY_CONVERT(DATETIME2,JSON_VALUE(d.PayloadCanonico,'$.f_fin')) f_fin,JSON_VALUE(d.PayloadCanonico,'$.norg0') norg0,JSON_VALUE(d.PayloadCanonico,'$.norg1') norg1,JSON_VALUE(d.PayloadCanonico,'$.norg2') norg2,JSON_VALUE(d.PayloadCanonico,'$.norg3') norg3 FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES)
    WHEN 'PCP' THEN (SELECT @O0 clave_organica_0,@O1 clave_organica_1,@Q quincena,@A anio,@Per periodo,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.interno')) interno,JSON_VALUE(d.PayloadCanonico,'$.rfc') rfc,JSON_VALUE(d.PayloadCanonico,'$.nombre') nombre,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.prestamo')) prestamo,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.letra')) letra,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.plazo')) plazo,JSON_VALUE(d.PayloadCanonico,'$.periodo_c') periodo_c,TRY_CONVERT(DATETIME2,JSON_VALUE(d.PayloadCanonico,'$.fecha_c')) fecha_c,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.capital_d6')),2,1)) capital,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.interes_d6')),2,1)) interes,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.monto_d6')),2,1)) monto,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.moratorios_d6')),2,1)) moratorios,CONVERT(DECIMAL(18,2),ROUND(d.ImporteOficialD6,2,1)) total,JSON_VALUE(d.PayloadCanonico,'$.resultado') resultado,JSON_VALUE(d.PayloadCanonico,'$.td') td,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org0')) org0,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org1')) org1,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org2')) org2,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org3')) org3,JSON_VALUE(d.PayloadCanonico,'$.norg0') norg0,JSON_VALUE(d.PayloadCanonico,'$.norg1') norg1,JSON_VALUE(d.PayloadCanonico,'$.norg2') norg2,JSON_VALUE(d.PayloadCanonico,'$.norg3') norg3 FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES)
    WHEN 'PMP' THEN (SELECT @O0 clave_organica_0,@O1 clave_organica_1,@Q quincena,@A anio,@Per periodo,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.interno')) interno,JSON_VALUE(d.PayloadCanonico,'$.rfc') rfc,JSON_VALUE(d.PayloadCanonico,'$.nombre') nombre,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.prestamo')) prestamo,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.letra')) letra,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.plazo')) plazo,JSON_VALUE(d.PayloadCanonico,'$.periodo_c') periodo_c,TRY_CONVERT(DATETIME2,JSON_VALUE(d.PayloadCanonico,'$.fecha_c')) fecha_c,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.capital_d6')),2,1)) capital,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.moratorios_d6')),2,1)) moratorios,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.interes_d6')),2,1)) interes,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.seguro_d6')),2,1)) seguro,CONVERT(DECIMAL(18,2),ROUND(d.ImporteOficialD6,2,1)) total,JSON_VALUE(d.PayloadCanonico,'$.resultado') resultado,JSON_VALUE(d.PayloadCanonico,'$.clase') clase,JSON_VALUE(d.PayloadCanonico,'$.desc_clase') desc_clase,JSON_VALUE(d.PayloadCanonico,'$.desc_prestamo') desc_prestamo,JSON_VALUE(d.PayloadCanonico,'$.clave_p') clave_p,JSON_VALUE(d.PayloadCanonico,'$.noemple') noemple,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.folio')) folio,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.anio')) anio_prestamo,JSON_VALUE(d.PayloadCanonico,'$.po') po,TRY_CONVERT(DATETIME2,JSON_VALUE(d.PayloadCanonico,'$.fecha_origen')) fecha_origen,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org0')) org0,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org1')) org1,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org2')) org2,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org3')) org3,JSON_VALUE(d.PayloadCanonico,'$.norg0') norg0,JSON_VALUE(d.PayloadCanonico,'$.norg1') norg1,JSON_VALUE(d.PayloadCanonico,'$.norg2') norg2,JSON_VALUE(d.PayloadCanonico,'$.norg3') norg3 FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES)
    WHEN 'HIP' THEN (SELECT @O0 clave_organica_0,@O1 clave_organica_1,@Q quincena,@A anio,@Per periodo,@HipComp computadora_antigua,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.interno')) interno,JSON_VALUE(d.PayloadCanonico,'$.nombre') nombre,JSON_VALUE(d.PayloadCanonico,'$.noempleado') noempleado,JSON_VALUE(d.PayloadCanonico,'$.rfc') rfc,CONVERT(DECIMAL(18,2),ROUND(d.ImporteOficialD6,2,1)) cantidad,JSON_VALUE(d.PayloadCanonico,'$.status') status,JSON_VALUE(d.PayloadCanonico,'$.referencia_1') referencia_1,JSON_VALUE(d.PayloadCanonico,'$.referencia_2') referencia_2,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.pno_solicitud')) pno_solicitud,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.pano')) pano,JSON_VALUE(d.PayloadCanonico,'$.pclave_clase_prestamo') pclave_clase_prestamo,JSON_VALUE(d.PayloadCanonico,'$.pdescripcion') pdescripcion,JSON_VALUE(d.PayloadCanonico,'$.pclave_prestamo') pclave_prestamo,JSON_VALUE(d.PayloadCanonico,'$.prestamo_desc') prestamo_desc,JSON_VALUE(d.PayloadCanonico,'$.tipo') tipo,JSON_VALUE(d.PayloadCanonico,'$.periodo_c') periodo_c,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.descto_d6')),2,1)) descto,TRY_CONVERT(DATETIME2,JSON_VALUE(d.PayloadCanonico,'$.fecha_c')) fecha_c,JSON_VALUE(d.PayloadCanonico,'$.resultado') resultado,JSON_VALUE(d.PayloadCanonico,'$.po') po,TRY_CONVERT(DATETIME2,JSON_VALUE(d.PayloadCanonico,'$.fecha_origen')) fecha_origen,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.plazo')) plazo,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.capital_pagar_d6')),2,1)) capital_pagar,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.interes_pagar_d6')),2,1)) interes_pagar,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.interes_diferido_pagar_d6')),2,1)) interes_diferido_pagar,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.seguro_pagar_d6')),2,1)) seguro_pagar,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(d.PayloadCanonico,'$.moratorio_pagar_d6')),2,1)) moratorio_pagar,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org0')) org0,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org1')) org1,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org2')) org2,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org3')) org3,JSON_VALUE(d.PayloadCanonico,'$.norg0') norg0,JSON_VALUE(d.PayloadCanonico,'$.norg1') norg1,JSON_VALUE(d.PayloadCanonico,'$.norg2') norg2,JSON_VALUE(d.PayloadCanonico,'$.norg3') norg3 FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES)
    ELSE (SELECT @O0 clave_organica_0,@O1 clave_organica_1,@Q quincena,@A anio,@Per periodo,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.fpension')) fpension,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.interno')) interno,JSON_VALUE(d.PayloadCanonico,'$.nombres') nombres,JSON_VALUE(d.PayloadCanonico,'$.nonombre') nonombre,JSON_VALUE(d.PayloadCanonico,'$.rfc') rfc,JSON_VALUE(d.PayloadCanonico,'$.norfc') norfc,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org0')) org0,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org1')) org1,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org2')) org2,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.org3')) org3,JSON_VALUE(d.PayloadCanonico,'$.norg0') norg0,JSON_VALUE(d.PayloadCanonico,'$.norg1') norg1,JSON_VALUE(d.PayloadCanonico,'$.norg2') norg2,JSON_VALUE(d.PayloadCanonico,'$.norg3') norg3,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.sueldo')) sueldo,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.oprestaciones')) oprestaciones,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.quinquenios')) quinquenios,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.sdo')) sdo,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.oprest')) oprest,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.quinq')) quinq,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.tpension')) tpension,CONVERT(DECIMAL(18,2),ROUND(d.ImporteOficialD6,2,1)) transitorio,JSON_VALUE(d.PayloadCanonico,'$.cconcepto') cconcepto,JSON_VALUE(d.PayloadCanonico,'$.descripcion') descripcion,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.importe')) importe,TRY_CONVERT(DATETIME2,JSON_VALUE(d.PayloadCanonico,'$.defuncion')) defuncion,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.pcp')) pcp,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.palimenticia')) palimenticia,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.retroactivo')) retroactivo,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.payudaecon')) payudaecon,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.otrosp1')) otrosp1,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.otrosp2')) otrosp2,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.otrosp3')) otrosp3,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.otrosp4')) otrosp4,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.otrosp5')) otrosp5,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.terreno')) terreno,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.hipviv')) hipviv,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.prodental')) prodental,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.otrod1')) otrod1,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.otrod2')) otrod2,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.otrod3')) otrod3,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.otrod4')) otrod4,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.otrod5')) otrod5,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.otrod6')) otrod6,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.tpercep')) tpercep,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.tdeduc')) tdeduc,CONVERT(DECIMAL(18,2),ROUND(d.ImporteOficialD6,2,1)) total,TRY_CONVERT(DATETIME2,JSON_VALUE(d.PayloadCanonico,'$.fin')) fin,TRY_CONVERT(DATETIME2,JSON_VALUE(d.PayloadCanonico,'$.inicio')) inicio,TRY_CONVERT(INT,JSON_VALUE(d.PayloadCanonico,'$.anio')) anio_registro,JSON_VALUE(d.PayloadCanonico,'$.sihay') sihay,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.porcentaje')) porcentaje,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.sdoporc')) sdoporc,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.ayudporc')) ayudporc,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(d.PayloadCanonico,'$.quinqporc')) quinqporc,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.transorg0')) transorg0,CONVERT(CHAR(2),JSON_VALUE(d.PayloadCanonico,'$.transorg1')) transorg1,JSON_VALUE(d.PayloadCanonico,'$.transnorg0') transnorg0,JSON_VALUE(d.PayloadCanonico,'$.transnorg1') transnorg1 FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES)
    END)),2)
  FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=@LiquidacionSnapshotId;

  INSERT @Rows
  SELECT 'RESUMEN',v.SourceOrden,CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),(SELECT v.Endpoint tipo_endpoint,@O0 clave_organica_0,@O1 clave_organica_1,@Q quincena,@A anio,@Per periodo,COALESCE(f.Registros,0) total_empleados,CONVERT(DECIMAL(19,6),CASE v.Dominio WHEN 'AHORRO' THEN t.AhorroA2 WHEN 'VIVIENDA' THEN t.ViviendaA2 WHEN 'PRESTACIONES' THEN t.PrestacionesA2 WHEN 'CAIR' THEN t.CAIRFondoA2 WHEN 'GUARDERIAS' THEN t.GuarderiasA2 WHEN 'TRANSITORIO' THEN t.TransitorioA2 ELSE t.AguinaldoA2 END) total_contribucion,CONVERT(DECIMAL(19,6),IIF(v.Dominio IN('AHORRO','VIVIENDA','PRESTACIONES','CAIR'),@BaseSueldo,0)) total_sueldo_base FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES))),2)
  FROM(VALUES(1,'AHORRO','individuales/ahorro'),(2,'VIVIENDA','individuales/vivienda'),(3,'PRESTACIONES','individuales/prestaciones'),(4,'CAIR','individuales/cair'),(5,'GUARDERIAS','guarderias'),(6,'TRANSITORIO','pension-nomina-transitorio'),(7,'AGUINALDO','aguinaldo'))v(SourceOrden,Dominio,Endpoint)
  JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=@LiquidacionSnapshotId LEFT JOIN liquidacion.QnaSnapshotFuente f ON f.LiquidacionSnapshotId=@LiquidacionSnapshotId AND f.Dominio=v.Dominio;
  INSERT @Rows SELECT 'REVISION',1,CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),(SELECT @O0 Organica0,@O1 Organica1,@O2 Organica2,@O3 Organica3,@Per Periodo,t.CAIRA2 CAIR,t.FRAA2 FRA,t.FREA2 FRE,t.FHA2 FH,t.FVA2 FV,t.FAAA2 FAA,t.FAEA2 FAE,t.FATA2 FAT,t.FAIA2 FAI,t.Registros RegistrosOrigen,@LiquidacionSnapshotId LiquidacionSnapshotId FROM liquidacion.QnaSnapshotTotal t WHERE t.LiquidacionSnapshotId=@LiquidacionSnapshotId FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES))),2);

  INSERT liquidacion.QnaLegacyExpectedRow(QnaLegacyProjectionId,Dominio,SourceOrden,RowHash,NormalizacionVersion)
    SELECT @P,Dominio,SourceOrden,RowHash,'LEGACY-PROJECTION-v1' FROM @Rows;
  DECLARE @Totals TABLE(Dominio VARCHAR(20) PRIMARY KEY,Registros INT,TotalV5 DECIMAL(19,2),TotalNormalizado DECIMAL(19,2));
  INSERT @Totals
  SELECT f.Dominio,f.Registros,CASE f.Dominio WHEN 'AHORRO' THEN t.AhorroA2 WHEN 'VIVIENDA' THEN t.ViviendaA2 WHEN 'PRESTACIONES' THEN t.PrestacionesA2 WHEN 'CAIR' THEN t.CAIRFondoA2 WHEN 'GUARDERIAS' THEN t.GuarderiasA2 WHEN 'TRANSITORIO' THEN t.TransitorioA2 WHEN 'AGUINALDO' THEN t.AguinaldoA2 WHEN 'PCP' THEN t.RetencionPCPA2 WHEN 'PMP' THEN t.RetencionPMPA2 ELSE t.RetencionHIPA2 END,
    CASE WHEN f.Dominio IN('AHORRO','VIVIENDA','PRESTACIONES','CAIR') THEN CASE f.Dominio WHEN 'AHORRO' THEN CONVERT(DECIMAL(19,2),ROUND(COALESCE((SELECT SUM(FATD6) FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId),0),2,1)) WHEN 'VIVIENDA' THEN CONVERT(DECIMAL(19,2),ROUND(COALESCE((SELECT SUM(ViviendaD6) FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId),0),2,1)) WHEN 'PRESTACIONES' THEN CONVERT(DECIMAL(19,2),ROUND(COALESCE((SELECT SUM(PrestacionesD6) FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId),0),2,1)) ELSE CONVERT(DECIMAL(19,2),ROUND(COALESCE((SELECT SUM(CAIRFondoD6) FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId),0),2,1)) END ELSE COALESCE((SELECT SUM(CONVERT(DECIMAL(19,2),ROUND(d.ImporteOficialD6,2,1))) FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=@LiquidacionSnapshotId AND d.Dominio=f.Dominio),0) END
  FROM liquidacion.QnaSnapshotFuente f JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=f.LiquidacionSnapshotId WHERE f.LiquidacionSnapshotId=@LiquidacionSnapshotId;
  INSERT @Totals VALUES('RESUMEN',7,(SELECT TotalAportacionesA2 FROM liquidacion.QnaSnapshotTotal WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId),(SELECT TotalAportacionesA2 FROM liquidacion.QnaSnapshotTotal WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId)),
    ('REVISION',1,(SELECT CAIRA2+FRAA2+FREA2+FHA2+FVA2+FAAA2+FAEA2+FATA2+FAIA2 FROM liquidacion.QnaSnapshotTotal WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId),(SELECT CAIRA2+FRAA2+FREA2+FHA2+FVA2+FAAA2+FAEA2+FATA2+FAIA2 FROM liquidacion.QnaSnapshotTotal WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId));
  INSERT liquidacion.QnaLegacyExpectedDomain(QnaLegacyProjectionId,Dominio,Registros,TotalV5A2,TotalNormalizadoA2,HashEsperado,NormalizacionVersion)
  SELECT @P,t.Dominio,t.Registros,t.TotalV5,t.TotalNormalizado,CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),COALESCE((SELECT STRING_AGG(CONVERT(NVARCHAR(MAX),r.RowHash),N'|') WITHIN GROUP(ORDER BY r.SourceOrden) FROM @Rows r WHERE r.Dominio=t.Dominio),N''))),2),'LEGACY-PROJECTION-v1' FROM @Totals t;
  IF (SELECT COUNT(*) FROM liquidacion.QnaLegacyExpectedDomain WHERE QnaLegacyProjectionId=@P)<>12 OR EXISTS(SELECT 1 FROM liquidacion.QnaLegacyExpectedDomain WHERE QnaLegacyProjectionId=@P AND (HashEsperado IS NULL OR NormalizacionVersion<>'LEGACY-PROJECTION-v1')) THROW 51758,'QNA_LEGACY_ORACLE_INCOMPLETO',1;
END;
GO
CREATE OR ALTER TRIGGER liquidacion.TR_QnaLegacyReconciliacion_Inmutable ON liquidacion.QnaLegacyReconciliacion AFTER INSERT,UPDATE,DELETE AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS(SELECT 1 FROM liquidacion.QnaLegacyCapabilityLease WHERE SessionId=@@SPID) THROW 51743,'QNA_LEGACY_RECONCILIACION_DML_REQUIERE_CAPACIDAD_FIRMADA',1;
  IF EXISTS(SELECT 1 FROM deleted) THROW 51743,'QNA_LEGACY_RECONCILIACION_APPEND_ONLY',1;
END;
GO
CREATE OR ALTER TRIGGER liquidacion.TR_QnaLegacyRepairAudit_Inmutable ON liquidacion.QnaLegacyRepairAudit AFTER INSERT,UPDATE,DELETE AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS(SELECT 1 FROM liquidacion.QnaLegacyCapabilityLease WHERE SessionId=@@SPID) THROW 51744,'QNA_LEGACY_REPAIR_AUDIT_DML_REQUIERE_CAPACIDAD_FIRMADA',1;
  IF EXISTS(SELECT 1 FROM deleted) THROW 51744,'QNA_LEGACY_REPAIR_AUDIT_APPEND_ONLY',1;
END;
GO
CREATE OR ALTER TRIGGER liquidacion.TR_QnaLegacyScopeOwnership_Inmutable ON liquidacion.QnaLegacyScopeOwnership AFTER INSERT,UPDATE,DELETE AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS(SELECT 1 FROM liquidacion.QnaLegacyCapabilityLease WHERE SessionId=@@SPID) THROW 51744,'QNA_LEGACY_SCOPE_OWNERSHIP_DML_REQUIERE_CAPACIDAD_FIRMADA',1;
END;
GO
CREATE OR ALTER TRIGGER liquidacion.TR_QnaLegacyExpectedDomain_Inmutable ON liquidacion.QnaLegacyExpectedDomain AFTER INSERT,UPDATE,DELETE AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS(SELECT 1 FROM liquidacion.QnaLegacyCapabilityLease WHERE SessionId=@@SPID) THROW 51744,'QNA_LEGACY_EXPECTED_DOMAIN_DML_REQUIERE_CAPACIDAD_FIRMADA',1;
END;
GO
CREATE OR ALTER TRIGGER liquidacion.TR_QnaLegacyExpectedRow_Inmutable ON liquidacion.QnaLegacyExpectedRow AFTER INSERT,UPDATE,DELETE AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS(SELECT 1 FROM liquidacion.QnaLegacyCapabilityLease WHERE SessionId=@@SPID) THROW 51744,'QNA_LEGACY_EXPECTED_ROW_DML_REQUIERE_CAPACIDAD_FIRMADA',1;
END;
GO
DENY INSERT,UPDATE,DELETE ON OBJECT::liquidacion.QnaLegacyProjection TO public;
DENY INSERT,UPDATE,DELETE ON OBJECT::liquidacion.QnaLegacyReconciliacion TO public;
DENY INSERT,UPDATE,DELETE ON OBJECT::liquidacion.QnaLegacyRepairAudit TO public;
DENY INSERT,UPDATE,DELETE ON OBJECT::liquidacion.QnaLegacyScopeOwnership TO public;
DENY INSERT,UPDATE,DELETE ON OBJECT::liquidacion.QnaLegacyExpectedDomain TO public;
DENY INSERT,UPDATE,DELETE ON OBJECT::liquidacion.QnaLegacyExpectedRow TO public;
DENY INSERT,UPDATE,DELETE ON OBJECT::liquidacion.QnaLegacyCapabilityLease TO public;
GRANT SELECT ON OBJECT::liquidacion.QnaLegacyCapabilityLease TO public;
GO

/* Los diez writers legacy quedan bloqueados por scope cuando ya existe un V5 oficial. */
DECLARE @Guardas TABLE(Tabla SYSNAME,TriggerName SYSNAME);
INSERT @Guardas VALUES
 (N'aportaciones.IndividualesAhorroHistorico',N'aportaciones.TR_IndividualesAhorroHistorico_V5Guard'),
 (N'aportaciones.IndividualesViviendaHistorico',N'aportaciones.TR_IndividualesViviendaHistorico_V5Guard'),
 (N'aportaciones.IndividualesPrestacionesHistorico',N'aportaciones.TR_IndividualesPrestacionesHistorico_V5Guard'),
 (N'aportaciones.IndividualesCairHistorico',N'aportaciones.TR_IndividualesCairHistorico_V5Guard'),
 (N'aportaciones.PensionNominaTransitorioHistorico',N'aportaciones.TR_PensionNominaTransitorioHistorico_V5Guard'),
 (N'aportaciones.GuarderiasHistorico',N'aportaciones.TR_GuarderiasHistorico_V5Guard'),
 (N'aportaciones.AguinaldoHistorico',N'aportaciones.TR_AguinaldoHistorico_V5Guard'),
 (N'retenciones.PrestamosCortoPlazoHistorico',N'retenciones.TR_PrestamosCortoPlazoHistorico_V5Guard'),
 (N'retenciones.PrestamosMedianoPlazoHistorico',N'retenciones.TR_PrestamosMedianoPlazoHistorico_V5Guard'),
 (N'retenciones.PrestamosHipotecariosHistorico',N'retenciones.TR_PrestamosHipotecariosHistorico_V5Guard'),
 (N'aportaciones.ResumenHistorico',N'aportaciones.TR_ResumenHistorico_V5Guard');
DECLARE @T SYSNAME,@Tr SYSNAME,@Sql NVARCHAR(MAX);
DECLARE guardas CURSOR LOCAL FAST_FORWARD FOR SELECT Tabla,TriggerName FROM @Guardas;
OPEN guardas; FETCH NEXT FROM guardas INTO @T,@Tr;
WHILE @@FETCH_STATUS=0
BEGIN
  SET @Sql=N'CREATE OR ALTER TRIGGER '+@Tr+N' ON '+@T+N' AFTER INSERT,UPDATE,DELETE AS
  BEGIN
    SET NOCOUNT ON;
    IF EXISTS(SELECT 1 FROM liquidacion.QnaLegacyCapabilityLease WHERE SessionId=@@SPID) RETURN;
    IF EXISTS(SELECT 1 FROM (SELECT clave_organica_0,clave_organica_1,anio,quincena FROM inserted UNION SELECT clave_organica_0,clave_organica_1,anio,quincena FROM deleted) x
      JOIN liquidacion.QnaProceso p ON p.Organica0=x.clave_organica_0 AND p.Organica1=x.clave_organica_1 AND p.Anio=x.anio AND p.Quincena=x.quincena
      JOIN liquidacion.QnaSnapshotOficialActual o ON o.QnaProcesoId=p.QnaProcesoId
      JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=o.LiquidacionSnapshotId AND s.VersionEsquema>=5)
      THROW 51745,''QNA_V5_LEGACY_WRITE_REQUIERE_PROYECTOR'',1;
  END;';
  EXEC sys.sp_executesql @Sql;
  FETCH NEXT FROM guardas INTO @T,@Tr;
END;
CLOSE guardas; DEALLOCATE guardas;
GO

CREATE OR ALTER TRIGGER conciliacion.TR_RevisionAplicacionHistorico_V5Guard ON conciliacion.RevisionAplicacionHistorico AFTER INSERT,UPDATE,DELETE AS
BEGIN
  SET NOCOUNT ON;
  IF EXISTS(SELECT 1 FROM liquidacion.QnaLegacyCapabilityLease WHERE SessionId=@@SPID) RETURN;
  IF EXISTS(SELECT 1 FROM (SELECT Organica0,Organica1,Organica2,Organica3,Periodo FROM inserted UNION SELECT Organica0,Organica1,Organica2,Organica3,Periodo FROM deleted) x
    JOIN liquidacion.QnaSnapshot s ON s.Organica0=x.Organica0 AND s.Organica1=x.Organica1 AND s.Organica2=x.Organica2 AND s.Organica3=x.Organica3 AND s.Periodo=x.Periodo AND s.VersionEsquema>=5
    JOIN liquidacion.QnaSnapshotOficialActual o ON o.LiquidacionSnapshotId=s.LiquidacionSnapshotId)
    THROW 51746,'QNA_V5_REVISION_WRITE_REQUIERE_PROYECTOR',1;
END;
GO

CREATE OR ALTER PROCEDURE liquidacion.spConstruirOracleLegacyV5_Deprecated
  @LiquidacionSnapshotId BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @P BIGINT,@HipComp BIT,@BaseSueldo DECIMAL(19,6);
  SELECT @P=QnaLegacyProjectionId FROM liquidacion.QnaLegacyProjection WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId;
  IF @P IS NULL THROW 51758,'QNA_LEGACY_ORACLE_HEADER_REQUERIDO',1;
  IF EXISTS(SELECT 1 FROM liquidacion.QnaLegacyExpectedDomain WHERE QnaLegacyProjectionId=@P) RETURN;
  SELECT @HipComp=CASE WHEN IdentificadorFuente LIKE 'FIREBIRD:AP_S_COMP_QNA:%' THEN 1 ELSE 0 END FROM liquidacion.QnaSnapshotFuente WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId AND Dominio='HIP';
  SELECT @BaseSueldo=COALESCE(SUM(BaseCotizacionSueldoD6),0) FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId;
  DECLARE @E TABLE(Dominio VARCHAR(20) PRIMARY KEY,Registros INT,TotalV5 DECIMAL(19,2),TotalNormalizado DECIMAL(19,2),HashEsperado CHAR(64));
  INSERT @E
  SELECT f.Dominio,f.Registros,
    CASE f.Dominio WHEN 'AHORRO' THEN t.AhorroA2 WHEN 'VIVIENDA' THEN t.ViviendaA2 WHEN 'PRESTACIONES' THEN t.PrestacionesA2 WHEN 'CAIR' THEN t.CAIRFondoA2 WHEN 'GUARDERIAS' THEN t.GuarderiasA2 WHEN 'TRANSITORIO' THEN t.TransitorioA2 WHEN 'AGUINALDO' THEN t.AguinaldoA2 WHEN 'PCP' THEN t.RetencionPCPA2 WHEN 'PMP' THEN t.RetencionPMPA2 ELSE t.RetencionHIPA2 END,
    CASE WHEN f.Dominio IN('AHORRO','VIVIENDA','PRESTACIONES','CAIR') THEN
      CASE f.Dominio WHEN 'AHORRO' THEN CONVERT(DECIMAL(19,2),ROUND(COALESCE((SELECT SUM(FATD6) FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId),0),2,1)) WHEN 'VIVIENDA' THEN CONVERT(DECIMAL(19,2),ROUND(COALESCE((SELECT SUM(ViviendaD6) FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId),0),2,1)) WHEN 'PRESTACIONES' THEN CONVERT(DECIMAL(19,2),ROUND(COALESCE((SELECT SUM(PrestacionesD6) FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId),0),2,1)) ELSE CONVERT(DECIMAL(19,2),ROUND(COALESCE((SELECT SUM(CAIRFondoD6) FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId),0),2,1)) END
      ELSE COALESCE((SELECT SUM(CONVERT(DECIMAL(19,2),ROUND(d.ImporteOficialD6,2,1))) FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=@LiquidacionSnapshotId AND d.Dominio=f.Dominio),0) END,
    CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),COALESCE(CASE f.Dominio
      WHEN 'AHORRO' THEN (SELECT Interno interno,Nombre nombre,SueldoD6 sueldo,QuinqueniosD6 quinquenios,OtrasPrestacionesD6 otras_prestaciones,BaseCotizacionSueldoD6 sueldo_base,FAED6 afae,FAAD6 afaa,FATD6 total FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId ORDER BY Interno FOR JSON PATH,INCLUDE_NULL_VALUES)
      WHEN 'VIVIENDA' THEN (SELECT Interno interno,Nombre nombre,SueldoD6 sueldo,QuinqueniosD6 quinquenios,OtrasPrestacionesD6 otras_prestaciones,BaseCotizacionSueldoD6 sueldo_base,ViviendaD6 afe,ViviendaD6 total FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId ORDER BY Interno FOR JSON PATH,INCLUDE_NULL_VALUES)
      WHEN 'PRESTACIONES' THEN (SELECT Interno interno,Nombre nombre,SueldoD6 sueldo,QuinqueniosD6 quinquenios,OtrasPrestacionesD6 otras_prestaciones,COALESCE(BaseCotizacionSueldoD6,0) sueldo_base,FRED6 afpe,FRAD6 afpa,PrestacionesD6 total FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId ORDER BY Interno FOR JSON PATH,INCLUDE_NULL_VALUES)
      WHEN 'CAIR' THEN (SELECT Interno interno,Nombre nombre,SueldoD6 sueldo,QuinqueniosD6 quinquenios,OtrasPrestacionesD6 otras_prestaciones,BaseCotizacionSueldoD6 sueldo_base,CAIRD6 afe,CAIRFondoD6 total FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId ORDER BY Interno FOR JSON PATH,INCLUDE_NULL_VALUES)
      WHEN 'GUARDERIAS' THEN (SELECT JSON_VALUE(PayloadCanonico,'$.titular_nombre') titular_nombre,JSON_VALUE(PayloadCanonico,'$.titular_no_empleado') titular_no_empleado,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(PayloadCanonico,'$.titular_monto')) titular_monto,JSON_VALUE(PayloadCanonico,'$.titular_rfc') titular_rfc,JSON_VALUE(PayloadCanonico,'$.titular_monto_texto') titular_monto_texto,JSON_VALUE(PayloadCanonico,'$.titular_org0') titular_org0,JSON_VALUE(PayloadCanonico,'$.titular_org1') titular_org1,JSON_VALUE(PayloadCanonico,'$.titular_org2') titular_org2,JSON_VALUE(PayloadCanonico,'$.titular_org3') titular_org3,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(PayloadCanonico,'$.entidad_monto')) entidad_monto,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(PayloadCanonico,'$.recibo_ajuste')) recibo_ajuste,CONVERT(DECIMAL(18,2),ROUND(ImporteOficialD6,2,1)) recibo_total,JSON_VALUE(PayloadCanonico,'$.recibo_mes_ano') recibo_mes_ano,TRY_CONVERT(DATETIME2,JSON_VALUE(PayloadCanonico,'$.recibo_fecha_venc')) recibo_fecha_venc,JSON_VALUE(PayloadCanonico,'$.recibo_folio') recibo_folio,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.menor_id')) menor_id,JSON_VALUE(PayloadCanonico,'$.menor_nombre') menor_nombre,JSON_VALUE(PayloadCanonico,'$.menor_rfc') menor_rfc,JSON_VALUE(PayloadCanonico,'$.menor_nivel') menor_nivel,JSON_VALUE(PayloadCanonico,'$.menor_sala') menor_sala,JSON_VALUE(PayloadCanonico,'$.estatus') estatus FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId AND Dominio='GUARDERIAS' ORDER BY EmpleadoClave,ClaveFilaHash,HashFila,Orden FOR JSON PATH,INCLUDE_NULL_VALUES)
      WHEN 'TRANSITORIO' THEN (SELECT TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.fpension')) fpension,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.interno')) interno,JSON_VALUE(PayloadCanonico,'$.nombres') nombres,JSON_VALUE(PayloadCanonico,'$.nonombre') nonombre,JSON_VALUE(PayloadCanonico,'$.rfc') rfc,JSON_VALUE(PayloadCanonico,'$.norfc') norfc,JSON_VALUE(PayloadCanonico,'$.org0') org0,JSON_VALUE(PayloadCanonico,'$.org1') org1,JSON_VALUE(PayloadCanonico,'$.org2') org2,JSON_VALUE(PayloadCanonico,'$.org3') org3,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(PayloadCanonico,'$.sueldo')) sueldo,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(PayloadCanonico,'$.oprestaciones')) oprestaciones,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(PayloadCanonico,'$.quinquenios')) quinquenios,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(PayloadCanonico,'$.tpension')) tpension,CONVERT(DECIMAL(18,2),ROUND(ImporteOficialD6,2,1)) transitorio,JSON_VALUE(PayloadCanonico,'$.cconcepto') cconcepto,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(PayloadCanonico,'$.importe')) importe,CONVERT(DECIMAL(18,2),ROUND(ImporteOficialD6,2,1)) total,TRY_CONVERT(DATETIME2,JSON_VALUE(PayloadCanonico,'$.fin')) fin,TRY_CONVERT(DATETIME2,JSON_VALUE(PayloadCanonico,'$.inicio')) inicio,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.anio')) anio_registro FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId AND Dominio='TRANSITORIO' ORDER BY EmpleadoClave,ClaveFilaHash,HashFila,Orden FOR JSON PATH,INCLUDE_NULL_VALUES)
      WHEN 'AGUINALDO' THEN (SELECT TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.interno')) interno,JSON_VALUE(PayloadCanonico,'$.noempleado') noempleado,JSON_VALUE(PayloadCanonico,'$.nombres') nombres,JSON_VALUE(PayloadCanonico,'$.rfc') rfc,JSON_VALUE(PayloadCanonico,'$.curp') curp,TRY_CONVERT(DATETIME2,JSON_VALUE(PayloadCanonico,'$.fecha')) fecha,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.dias_aguinaldo')) dias_aguinaldo,CONVERT(DECIMAL(18,2),ROUND(ImporteOficialD6,2,1)) general,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(PayloadCanonico,'$.proporcion')) proporcion,JSON_VALUE(PayloadCanonico,'$.mensaje') mensaje FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId AND Dominio='AGUINALDO' ORDER BY EmpleadoClave,ClaveFilaHash,HashFila,Orden FOR JSON PATH,INCLUDE_NULL_VALUES)
      WHEN 'PCP' THEN (SELECT TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.interno')) interno,JSON_VALUE(PayloadCanonico,'$.rfc') rfc,JSON_VALUE(PayloadCanonico,'$.nombre') nombre,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.prestamo')) prestamo,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.letra')) letra,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.plazo')) plazo,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(PayloadCanonico,'$.capital_d6')),2,1)) capital,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(PayloadCanonico,'$.interes_d6')),2,1)) interes,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(PayloadCanonico,'$.monto_d6')),2,1)) monto,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(PayloadCanonico,'$.moratorios_d6')),2,1)) moratorios,CONVERT(DECIMAL(18,2),ROUND(ImporteOficialD6,2,1)) total,JSON_VALUE(PayloadCanonico,'$.resultado') resultado FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId AND Dominio='PCP' ORDER BY EmpleadoClave,ClaveFilaHash,HashFila,Orden FOR JSON PATH,INCLUDE_NULL_VALUES)
      WHEN 'PMP' THEN (SELECT TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.interno')) interno,JSON_VALUE(PayloadCanonico,'$.rfc') rfc,JSON_VALUE(PayloadCanonico,'$.nombre') nombre,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.prestamo')) prestamo,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.letra')) letra,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.plazo')) plazo,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(PayloadCanonico,'$.capital_d6')),2,1)) capital,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(PayloadCanonico,'$.moratorios_d6')),2,1)) moratorios,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(PayloadCanonico,'$.interes_d6')),2,1)) interes,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(PayloadCanonico,'$.seguro_d6')),2,1)) seguro,CONVERT(DECIMAL(18,2),ROUND(ImporteOficialD6,2,1)) total,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.folio')) folio,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.anio')) anio_prestamo FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId AND Dominio='PMP' ORDER BY EmpleadoClave,ClaveFilaHash,HashFila,Orden FOR JSON PATH,INCLUDE_NULL_VALUES)
      ELSE (SELECT @HipComp computadora_antigua,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.interno')) interno,JSON_VALUE(PayloadCanonico,'$.nombre') nombre,JSON_VALUE(PayloadCanonico,'$.noempleado') noempleado,JSON_VALUE(PayloadCanonico,'$.rfc') rfc,CONVERT(DECIMAL(18,2),ROUND(ImporteOficialD6,2,1)) cantidad,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.pno_solicitud')) pno_solicitud,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.pano')) pano,JSON_VALUE(PayloadCanonico,'$.pclave_prestamo') pclave_prestamo,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(PayloadCanonico,'$.descto_d6')),2,1)) descto,TRY_CONVERT(INT,JSON_VALUE(PayloadCanonico,'$.plazo')) plazo,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(PayloadCanonico,'$.capital_pagar_d6')),2,1)) capital_pagar,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(PayloadCanonico,'$.interes_pagar_d6')),2,1)) interes_pagar,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(PayloadCanonico,'$.interes_diferido_pagar_d6')),2,1)) interes_diferido_pagar,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(PayloadCanonico,'$.seguro_pagar_d6')),2,1)) seguro_pagar,TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(PayloadCanonico,'$.moratorio_pagar_d6')),2,1)) moratorio_pagar FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId AND Dominio='HIP' ORDER BY EmpleadoClave,ClaveFilaHash,HashFila,Orden FOR JSON PATH,INCLUDE_NULL_VALUES)
    END,N'[]'))),2)
  FROM liquidacion.QnaSnapshotFuente f JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=f.LiquidacionSnapshotId WHERE f.LiquidacionSnapshotId=@LiquidacionSnapshotId;
  INSERT @E VALUES
    ('RESUMEN',7,(SELECT TotalAportacionesA2 FROM liquidacion.QnaSnapshotTotal WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId),(SELECT TotalAportacionesA2 FROM liquidacion.QnaSnapshotTotal WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId),
       CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),(SELECT v.Endpoint tipo_endpoint,CONVERT(VARCHAR(20),COALESCE(f.Registros,0)) total_empleados,CONVERT(VARCHAR(50),CONVERT(DECIMAL(19,6),CASE v.Dominio WHEN 'AHORRO' THEN t.AhorroA2 WHEN 'VIVIENDA' THEN t.ViviendaA2 WHEN 'PRESTACIONES' THEN t.PrestacionesA2 WHEN 'CAIR' THEN t.CAIRFondoA2 WHEN 'GUARDERIAS' THEN t.GuarderiasA2 WHEN 'TRANSITORIO' THEN t.TransitorioA2 ELSE t.AguinaldoA2 END)) total_contribucion,CONVERT(VARCHAR(50),CONVERT(DECIMAL(19,6),CASE WHEN v.Dominio IN('AHORRO','VIVIENDA','PRESTACIONES','CAIR') THEN @BaseSueldo ELSE 0 END)) total_sueldo_base FROM(VALUES('AHORRO','individuales/ahorro'),('VIVIENDA','individuales/vivienda'),('PRESTACIONES','individuales/prestaciones'),('CAIR','individuales/cair'),('GUARDERIAS','guarderias'),('TRANSITORIO','pension-nomina-transitorio'),('AGUINALDO','aguinaldo'))v(Dominio,Endpoint) JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=@LiquidacionSnapshotId LEFT JOIN liquidacion.QnaSnapshotFuente f ON f.LiquidacionSnapshotId=@LiquidacionSnapshotId AND f.Dominio=v.Dominio ORDER BY v.Endpoint FOR JSON PATH,INCLUDE_NULL_VALUES))),2)),
    ('REVISION',1,(SELECT CAIRA2+FRAA2+FREA2+FHA2+FVA2+FAAA2+FAEA2+FATA2+FAIA2 FROM liquidacion.QnaSnapshotTotal WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId),(SELECT CAIRA2+FRAA2+FREA2+FHA2+FVA2+FAAA2+FAEA2+FATA2+FAIA2 FROM liquidacion.QnaSnapshotTotal WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId),
      CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),(SELECT CAIRA2 CAIR,FRAA2 FRA,FREA2 FRE,FHA2 FH,FVA2 FV,FAAA2 FAA,FAEA2 FAE,FATA2 FAT,FAIA2 FAI,Registros RegistrosOrigen,@LiquidacionSnapshotId LiquidacionSnapshotId FROM liquidacion.QnaSnapshotTotal WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId FOR JSON PATH,INCLUDE_NULL_VALUES))),2));
  INSERT liquidacion.QnaLegacyExpectedDomain(QnaLegacyProjectionId,Dominio,Registros,TotalV5A2,TotalNormalizadoA2,HashEsperado,NormalizacionVersion)
    SELECT @P,Dominio,Registros,TotalV5,TotalNormalizado,HashEsperado,'LEGACY-PROJECTION-v1' FROM @E;
END;
GO

CREATE OR ALTER PROCEDURE liquidacion.spAsignarProvenanceLegacyV5
  @LiquidacionSnapshotId BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @P BIGINT,@O0 CHAR(2),@O1 CHAR(2),@O2 CHAR(2),@O3 CHAR(2),@A INT,@Q INT,@Per CHAR(4);
  SELECT @P=p.QnaLegacyProjectionId,@O0=s.Organica0,@O1=s.Organica1,@O2=s.Organica2,@O3=s.Organica3,@A=s.Anio,@Q=s.Quincena,@Per=s.Periodo
    FROM liquidacion.QnaLegacyProjection p JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=p.LiquidacionSnapshotId
    WHERE p.LiquidacionSnapshotId=@LiquidacionSnapshotId;
  IF @P IS NULL THROW 51760,'QNA_LEGACY_PROVENANCE_HEADER_REQUERIDO',1;

  UPDATE aportaciones.IndividualesAhorroHistorico SET QnaLiquidacionSnapshotId=@LiquidacionSnapshotId WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q;
  UPDATE aportaciones.IndividualesViviendaHistorico SET QnaLiquidacionSnapshotId=@LiquidacionSnapshotId WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q;
  UPDATE aportaciones.IndividualesPrestacionesHistorico SET QnaLiquidacionSnapshotId=@LiquidacionSnapshotId WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q;
  UPDATE aportaciones.IndividualesCairHistorico SET QnaLiquidacionSnapshotId=@LiquidacionSnapshotId WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q;
  UPDATE aportaciones.GuarderiasHistorico SET QnaLiquidacionSnapshotId=@LiquidacionSnapshotId WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q;
  UPDATE aportaciones.AguinaldoHistorico SET QnaLiquidacionSnapshotId=@LiquidacionSnapshotId WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q;
  UPDATE aportaciones.PensionNominaTransitorioHistorico SET QnaLiquidacionSnapshotId=@LiquidacionSnapshotId WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q;
  UPDATE retenciones.PrestamosCortoPlazoHistorico SET QnaLiquidacionSnapshotId=@LiquidacionSnapshotId WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q;
  UPDATE retenciones.PrestamosMedianoPlazoHistorico SET QnaLiquidacionSnapshotId=@LiquidacionSnapshotId WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q;
  UPDATE retenciones.PrestamosHipotecariosHistorico SET QnaLiquidacionSnapshotId=@LiquidacionSnapshotId WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q;
  UPDATE aportaciones.ResumenHistorico SET QnaLiquidacionSnapshotId=@LiquidacionSnapshotId WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q;
  UPDATE conciliacion.RevisionAplicacionHistorico SET QnaLiquidacionSnapshotId=@LiquidacionSnapshotId WHERE Organica0=@O0 AND Organica1=@O1 AND Organica2=@O2 AND Organica3=@O3 AND Periodo=@Per;

  CREATE TABLE #ActualCanonical(PhysicalId BIGINT NOT NULL,SourceOrden INT NULL,RowHash CHAR(64) NOT NULL);
  CREATE TABLE #Assignments(PhysicalId BIGINT NOT NULL PRIMARY KEY,SourceOrden INT NOT NULL);
  DECLARE @Stores TABLE(Dominio VARCHAR(20),Tabla SYSNAME);
  INSERT @Stores VALUES
    ('AHORRO',N'aportaciones.IndividualesAhorroHistorico'),('VIVIENDA',N'aportaciones.IndividualesViviendaHistorico'),
    ('PRESTACIONES',N'aportaciones.IndividualesPrestacionesHistorico'),('CAIR',N'aportaciones.IndividualesCairHistorico'),
    ('GUARDERIAS',N'aportaciones.GuarderiasHistorico'),('TRANSITORIO',N'aportaciones.PensionNominaTransitorioHistorico'),
    ('AGUINALDO',N'aportaciones.AguinaldoHistorico'),('PCP',N'retenciones.PrestamosCortoPlazoHistorico'),
    ('PMP',N'retenciones.PrestamosMedianoPlazoHistorico'),('HIP',N'retenciones.PrestamosHipotecariosHistorico'),
    ('RESUMEN',N'aportaciones.ResumenHistorico'),('REVISION',N'conciliacion.RevisionAplicacionHistorico');
  DECLARE @D VARCHAR(20),@T SYSNAME,@Identity SYSNAME,@Sql NVARCHAR(MAX);
  DECLARE store_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT Dominio,Tabla FROM @Stores;
  OPEN store_cursor; FETCH NEXT FROM store_cursor INTO @D,@T;
  WHILE @@FETCH_STATUS=0
  BEGIN
    TRUNCATE TABLE #ActualCanonical; TRUNCATE TABLE #Assignments;
    EXEC liquidacion.spCargarFilasLegacyCanonicasActuales @T,@LiquidacionSnapshotId;
    ;WITH expected_rows AS(
      SELECT SourceOrden,RowHash,ROW_NUMBER() OVER(PARTITION BY RowHash ORDER BY SourceOrden) Occurrence
      FROM liquidacion.QnaLegacyExpectedRow WHERE QnaLegacyProjectionId=@P AND Dominio=@D
    ),actual_rows AS(
      SELECT PhysicalId,RowHash,ROW_NUMBER() OVER(PARTITION BY RowHash ORDER BY PhysicalId) Occurrence FROM #ActualCanonical
    )
    INSERT #Assignments(PhysicalId,SourceOrden)
      SELECT a.PhysicalId,e.SourceOrden FROM actual_rows a JOIN expected_rows e ON e.RowHash=a.RowHash AND e.Occurrence=a.Occurrence;
    DECLARE @ActualCount INT=(SELECT COUNT(*) FROM #ActualCanonical),@ExpectedCount INT=(SELECT COUNT(*) FROM liquidacion.QnaLegacyExpectedRow WHERE QnaLegacyProjectionId=@P AND Dominio=@D),@MatchedCount INT=(SELECT COUNT(*) FROM #Assignments);
    IF @ActualCount<>@ExpectedCount OR @MatchedCount<>@ActualCount
    BEGIN
      DECLARE @Mismatch NVARCHAR(2048)=CONCAT('QNA_LEGACY_PROVENANCE_CANONICAL_MISMATCH:',@D,':EXPECTED=',@ExpectedCount,':ACTUAL=',@ActualCount,':MATCHED=',@MatchedCount);
      THROW 51760,@Mismatch,1;
    END;
    SET @Identity=(SELECT name FROM sys.columns WHERE object_id=OBJECT_ID(@T) AND is_identity=1);
    SET @Sql=N'UPDATE target SET QnaSourceOrden=a.SourceOrden FROM '+QUOTENAME(PARSENAME(@T,2))+N'.'+QUOTENAME(PARSENAME(@T,1))+N' target JOIN #Assignments a ON a.PhysicalId=CONVERT(BIGINT,target.'+QUOTENAME(@Identity)+N') WHERE target.QnaLiquidacionSnapshotId=@Id;';
    EXEC sys.sp_executesql @Sql,N'@Id BIGINT',@LiquidacionSnapshotId;
    FETCH NEXT FROM store_cursor INTO @D,@T;
  END;
  CLOSE store_cursor; DEALLOCATE store_cursor;
END;
GO

CREATE OR ALTER PROCEDURE liquidacion.spProyectarLegacyDesdeSnapshotV5Core
  @LiquidacionSnapshotId BIGINT,
  @UsuarioId NVARCHAR(100),
  @ForzarReparacion BIT=0
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Inicio BIT=0,@XactAbort BIT=CASE WHEN (16384 & @@OPTIONS)=16384 THEN 1 ELSE 0 END;
  SET XACT_ABORT OFF;
  IF @@TRANCOUNT=0 BEGIN SET @Inicio=1; BEGIN TRANSACTION; END ELSE SAVE TRANSACTION QnaLegacyP8;
  DECLARE @ProjectionId BIGINT,@EntidadId INT,@Org0 CHAR(2),@Org1 CHAR(2),@Org2 CHAR(2),@Org3 CHAR(2),@Periodo CHAR(4),@Anio INT,@Qna INT,@OriginalActor NVARCHAR(100);
  BEGIN TRY
    IF NULLIF(LTRIM(RTRIM(@UsuarioId)),N'') IS NULL THROW 51747,'QNA_LEGACY_USUARIO_REQUERIDO',1;
    EXEC liquidacion.spQnaLegacyCapabilityMarker 1;
    SELECT @EntidadId=s.EntidadId,@Org0=s.Organica0,@Org1=s.Organica1,@Org2=s.Organica2,@Org3=s.Organica3,@Periodo=s.Periodo,@Anio=s.Anio,@Qna=s.Quincena
      FROM liquidacion.QnaSnapshot s WITH(UPDLOCK,HOLDLOCK) JOIN liquidacion.QnaSnapshotOficialActual o WITH(UPDLOCK,HOLDLOCK) ON o.LiquidacionSnapshotId=s.LiquidacionSnapshotId
      WHERE s.LiquidacionSnapshotId=@LiquidacionSnapshotId AND s.VersionEsquema>=5;
    IF @Org0 IS NULL THROW 51748,'QNA_LEGACY_REQUIERE_SNAPSHOT_V5_OFICIAL',1;
    SELECT @ProjectionId=QnaLegacyProjectionId,@OriginalActor=UsuarioId FROM liquidacion.QnaLegacyProjection WITH(UPDLOCK,HOLDLOCK) WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId;
    IF @ProjectionId IS NULL
    BEGIN
      INSERT liquidacion.QnaLegacyProjection(LiquidacionSnapshotId,PoliticaVersion,NormalizacionVersion,Autoritativo,UsuarioId)
        VALUES(@LiquidacionSnapshotId,'QNA-LEGACY-DUAL-WRITE-V1','LEGACY-PROJECTION-v1','V5',@UsuarioId);
      SET @ProjectionId=SCOPE_IDENTITY(); SET @OriginalActor=@UsuarioId;
    END;

    DECLARE @OwnerProjectionId BIGINT,@OwnerSnapshotId BIGINT,@OwnerEntidadId INT,@OwnerOrg2 CHAR(2),@OwnerOrg3 CHAR(2);
    SELECT @OwnerProjectionId=QnaLegacyProjectionId,@OwnerSnapshotId=LiquidacionSnapshotId,@OwnerEntidadId=EntidadId,@OwnerOrg2=Organica2,@OwnerOrg3=Organica3
      FROM liquidacion.QnaLegacyScopeOwnership WITH(UPDLOCK,HOLDLOCK)
      WHERE Organica0=@Org0 AND Organica1=@Org1 AND Anio=@Anio AND Quincena=@Qna;
    IF @OwnerProjectionId IS NULL
    BEGIN
      INSERT liquidacion.QnaLegacyScopeOwnership(Organica0,Organica1,Anio,Quincena,EntidadId,Organica2,Organica3,QnaLegacyProjectionId,LiquidacionSnapshotId)
        VALUES(@Org0,@Org1,@Anio,@Qna,@EntidadId,@Org2,@Org3,@ProjectionId,@LiquidacionSnapshotId);
      SET @OwnerProjectionId=@ProjectionId; SET @OwnerSnapshotId=@LiquidacionSnapshotId;
    END
    ELSE IF @OwnerSnapshotId<>@LiquidacionSnapshotId AND (@OwnerEntidadId<>@EntidadId OR @OwnerOrg2<>@Org2 OR @OwnerOrg3<>@Org3)
    BEGIN
      DECLARE @Collision NVARCHAR(2000)=CONCAT('LEGACY_SCOPE_COLLISION ownerSnapshot=',@OwnerSnapshotId,' ownerEntidad=',@OwnerEntidadId,
        ' ownerOrg2=',@OwnerOrg2,' ownerOrg3=',@OwnerOrg3,' requestedSnapshot=',@LiquidacionSnapshotId,' requestedEntidad=',@EntidadId,
        ' requestedOrg2=',@Org2,' requestedOrg3=',@Org3);
      DECLARE @CollisionHash CHAR(64)=CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),@Collision)),2);
      IF NOT EXISTS(SELECT 1 FROM liquidacion.QnaLegacyReconciliacion WHERE QnaLegacyProjectionId=@ProjectionId AND Dominio='RESUMEN' AND Huella=@CollisionHash)
        INSERT liquidacion.QnaLegacyReconciliacion(QnaLegacyProjectionId,Dominio,Estado,EstadoDominio,RegistrosEsperados,RegistrosActuales,TotalEsperadoA2,TotalActualA2,HashEsperado,HashActual,Diferencias,ErrorDetalle,Huella,UsuarioId)
          VALUES(@ProjectionId,'RESUMEN','WARNING','EMPTY',0,0,0,0,NULL,NULL,@Collision,NULL,@CollisionHash,@OriginalActor);
      UPDATE liquidacion.QnaLegacyProjection SET Estado='WARNING',Detalle=@Collision,FechaActualizacion=SYSDATETIME() WHERE QnaLegacyProjectionId=@ProjectionId;
      SELECT 'WARNING' Estado,'LEGACY_SCOPE_COLLISION' Codigo,@Collision Detalle;
      EXEC liquidacion.spQnaLegacyCapabilityMarker 0;
      IF @Inicio=1 COMMIT TRANSACTION;
      IF @XactAbort=1 SET XACT_ABORT ON;
      RETURN;
    END
    ELSE IF @OwnerSnapshotId<>@LiquidacionSnapshotId
    BEGIN
      DECLARE @OwnerResult TABLE(Estado VARCHAR(20),Codigo VARCHAR(100),Detalle NVARCHAR(2000));
      INSERT @OwnerResult EXEC liquidacion.spConciliarLegacySnapshotV5 @OwnerSnapshotId,@OriginalActor;
      IF NOT EXISTS(SELECT 1 FROM liquidacion.QnaLegacyProjection WHERE QnaLegacyProjectionId=@OwnerProjectionId AND Estado='COMPLETE')
      BEGIN
        DECLARE @OwnerIncomplete NVARCHAR(2000)=CONCAT('LEGACY_SCOPE_OWNER_NOT_COMPLETE ownerSnapshot=',@OwnerSnapshotId);
        DECLARE @OwnerIncompleteHash CHAR(64)=CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),@OwnerIncomplete)),2);
        INSERT liquidacion.QnaLegacyReconciliacion(QnaLegacyProjectionId,Dominio,Estado,EstadoDominio,RegistrosEsperados,RegistrosActuales,TotalEsperadoA2,TotalActualA2,HashEsperado,HashActual,Diferencias,ErrorDetalle,Huella,UsuarioId)
          VALUES(@ProjectionId,'RESUMEN','WARNING','EMPTY',0,0,0,0,NULL,NULL,@OwnerIncomplete,NULL,@OwnerIncompleteHash,@OriginalActor);
        UPDATE liquidacion.QnaLegacyProjection SET Estado='WARNING',Detalle=@OwnerIncomplete,FechaActualizacion=SYSDATETIME() WHERE QnaLegacyProjectionId=@ProjectionId;
        SELECT 'WARNING' Estado,'LEGACY_SCOPE_OWNER_NOT_COMPLETE' Codigo,@OwnerIncomplete Detalle;
        EXEC liquidacion.spQnaLegacyCapabilityMarker 0;
        IF @Inicio=1 COMMIT TRANSACTION;
        IF @XactAbort=1 SET XACT_ABORT ON;
        RETURN;
      END;
      UPDATE liquidacion.QnaLegacyProjection SET Estado='SUPERSEDED',Detalle=CONCAT('REPLACED_BY:',@LiquidacionSnapshotId),FechaActualizacion=SYSDATETIME() WHERE QnaLegacyProjectionId=@OwnerProjectionId;
      INSERT liquidacion.QnaLegacyReconciliacion(QnaLegacyProjectionId,Dominio,Estado,EstadoDominio,RegistrosEsperados,RegistrosActuales,TotalEsperadoA2,TotalActualA2,HashEsperado,HashActual,Diferencias,ErrorDetalle,Huella,UsuarioId)
        SELECT @OwnerProjectionId,Dominio,'SUPERSEDED',EstadoDominio,RegistrosEsperados,RegistrosActuales,TotalEsperadoA2,TotalActualA2,HashEsperado,HashActual,
          CONCAT('REPLACED_BY:',@LiquidacionSnapshotId),NULL,CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),CONCAT('SUPERSEDED|',Dominio,'|',@LiquidacionSnapshotId))),2),@OriginalActor
        FROM liquidacion.QnaLegacyReconciliacion r WHERE r.QnaLegacyProjectionId=@OwnerProjectionId
          AND r.QnaLegacyReconciliacionId=(SELECT MAX(x.QnaLegacyReconciliacionId) FROM liquidacion.QnaLegacyReconciliacion x WHERE x.QnaLegacyProjectionId=r.QnaLegacyProjectionId AND x.Dominio=r.Dominio);
      UPDATE liquidacion.QnaLegacyScopeOwnership SET QnaLegacyProjectionId=@ProjectionId,LiquidacionSnapshotId=@LiquidacionSnapshotId WHERE QnaLegacyProjectionId=@OwnerProjectionId;
    END;

    EXEC liquidacion.spConstruirOracleLegacyV5 @LiquidacionSnapshotId;

    CREATE TABLE #M(Dominio VARCHAR(20) PRIMARY KEY,EstadoDominio VARCHAR(20),Esperados INT,Actuales INT,EsperadoA2 DECIMAL(19,2),ActualA2 DECIMAL(19,2),HashEsperado CHAR(64),HashActual CHAR(64));
    CREATE TABLE #E(Dominio VARCHAR(20),Orden INT,Payload NVARCHAR(MAX),ImporteD6 DECIMAL(19,6),ImporteA2 DECIMAL(19,2));

    INSERT #E
    SELECT v.Dominio,d.Orden,
      (SELECT d.Interno interno,d.Nombre nombre,d.SueldoD6 sueldo,d.QuinqueniosD6 quinquenios,d.OtrasPrestacionesD6 otras_prestaciones,
        CASE v.Dominio WHEN 'AHORRO' THEN d.BaseCotizacionSueldoD6 WHEN 'VIVIENDA' THEN d.BaseCotizacionSueldoD6 WHEN 'PRESTACIONES' THEN COALESCE(d.BaseCotizacionSueldoD6,0) ELSE d.BaseCotizacionSueldoD6 END sueldo_base,
        CASE v.Dominio WHEN 'AHORRO' THEN d.FAED6 WHEN 'VIVIENDA' THEN d.ViviendaD6 WHEN 'PRESTACIONES' THEN d.FRED6 ELSE d.CAIRD6 END c1,
        CASE v.Dominio WHEN 'AHORRO' THEN d.FAAD6 WHEN 'PRESTACIONES' THEN d.FRAD6 END c2,
        CASE v.Dominio WHEN 'AHORRO' THEN d.FATD6 WHEN 'VIVIENDA' THEN d.ViviendaD6 WHEN 'PRESTACIONES' THEN d.PrestacionesD6 ELSE d.CAIRFondoD6 END total
       FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES),
      CASE v.Dominio WHEN 'AHORRO' THEN d.FATD6 WHEN 'VIVIENDA' THEN d.ViviendaD6 WHEN 'PRESTACIONES' THEN d.PrestacionesD6 ELSE d.CAIRFondoD6 END,
      CONVERT(DECIMAL(19,2),ROUND(CASE v.Dominio WHEN 'AHORRO' THEN d.FATD6 WHEN 'VIVIENDA' THEN d.ViviendaD6 WHEN 'PRESTACIONES' THEN d.PrestacionesD6 ELSE d.CAIRFondoD6 END,2,1))
    FROM liquidacion.QnaSnapshotDetalle d CROSS JOIN(VALUES('AHORRO'),('VIVIENDA'),('PRESTACIONES'),('CAIR'))v(Dominio)
    WHERE d.LiquidacionSnapshotId=@LiquidacionSnapshotId;
    INSERT #E
    SELECT d.Dominio,d.Orden,d.PayloadCanonico,d.ImporteOficialD6,CONVERT(DECIMAL(19,2),ROUND(d.ImporteOficialD6,2,1))
      FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=@LiquidacionSnapshotId AND d.Dominio IN('TRANSITORIO','GUARDERIAS','AGUINALDO','PCP','PMP','HIP');

    IF EXISTS(SELECT 1 FROM #E e CROSS APPLY OPENJSON(e.Payload) j
      WHERE j.[value] IS NOT NULL AND (
        (j.[key] LIKE '%[_]d6' AND TRY_CONVERT(DECIMAL(19,6),j.[value]) IS NULL)
        OR (j.[key] IN('interno','fpension','menor_id','dias_aguinaldo','cuantos','cuantos_ori','qna_a','dias_gral_agui','anio','prestamo','letra','plazo','folio','pno_solicitud','pano') AND TRY_CONVERT(INT,j.[value]) IS NULL)
        OR (j.[key] IN('fecha','fecha_lf','fecha_li','f_inicio','f_fin','defuncion','fin','inicio','fecha_c','fecha_origen','recibo_fecha_venc') AND TRY_CONVERT(DATETIME2,j.[value]) IS NULL)
      )) THROW 51757,'QNA_LEGACY_PAYLOAD_CONVERSION_INVALIDA',1;

    /* Reintento: una proyeccion antes completa nunca se reescribe automaticamente. */
    IF @ForzarReparacion=0 AND EXISTS(SELECT 1 FROM liquidacion.QnaLegacyProjection WHERE QnaLegacyProjectionId=@ProjectionId AND Estado='COMPLETE')
    BEGIN
      EXEC liquidacion.spConciliarLegacySnapshotV5 @LiquidacionSnapshotId,@OriginalActor;
      EXEC liquidacion.spQnaLegacyCapabilityMarker 0;
      IF @Inicio=1 COMMIT TRANSACTION;
      IF @XactAbort=1 SET XACT_ABORT ON;
      RETURN;
    END;

    DELETE aportaciones.IndividualesAhorroHistorico WHERE clave_organica_0=@Org0 AND clave_organica_1=@Org1 AND anio=@Anio AND quincena=@Qna;
    DELETE aportaciones.IndividualesViviendaHistorico WHERE clave_organica_0=@Org0 AND clave_organica_1=@Org1 AND anio=@Anio AND quincena=@Qna;
    DELETE aportaciones.IndividualesPrestacionesHistorico WHERE clave_organica_0=@Org0 AND clave_organica_1=@Org1 AND anio=@Anio AND quincena=@Qna;
    DELETE aportaciones.IndividualesCairHistorico WHERE clave_organica_0=@Org0 AND clave_organica_1=@Org1 AND anio=@Anio AND quincena=@Qna;
    DELETE aportaciones.PensionNominaTransitorioHistorico WHERE clave_organica_0=@Org0 AND clave_organica_1=@Org1 AND anio=@Anio AND quincena=@Qna;
    DELETE aportaciones.GuarderiasHistorico WHERE clave_organica_0=@Org0 AND clave_organica_1=@Org1 AND anio=@Anio AND quincena=@Qna;
    DELETE aportaciones.AguinaldoHistorico WHERE clave_organica_0=@Org0 AND clave_organica_1=@Org1 AND anio=@Anio AND quincena=@Qna;
    DELETE retenciones.PrestamosCortoPlazoHistorico WHERE clave_organica_0=@Org0 AND clave_organica_1=@Org1 AND anio=@Anio AND quincena=@Qna;
    DELETE retenciones.PrestamosMedianoPlazoHistorico WHERE clave_organica_0=@Org0 AND clave_organica_1=@Org1 AND anio=@Anio AND quincena=@Qna;
    DELETE retenciones.PrestamosHipotecariosHistorico WHERE clave_organica_0=@Org0 AND clave_organica_1=@Org1 AND anio=@Anio AND quincena=@Qna;

    INSERT aportaciones.IndividualesAhorroHistorico(clave_organica_0,clave_organica_1,quincena,anio,interno,nombre,sueldo,quinquenios,otras_prestaciones,sueldo_base,afae,afaa,total,usuario_id,QnaLiquidacionSnapshotId,QnaSourceOrden)
      SELECT @Org0,@Org1,@Qna,@Anio,Interno,Nombre,SueldoD6,QuinqueniosD6,OtrasPrestacionesD6,BaseCotizacionSueldoD6,FAED6,FAAD6,FATD6,@OriginalActor,@LiquidacionSnapshotId,Orden FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId;
    INSERT aportaciones.IndividualesViviendaHistorico(clave_organica_0,clave_organica_1,quincena,anio,interno,nombre,sueldo,quinquenios,otras_prestaciones,sueldo_base,afe,total,usuario_id,QnaLiquidacionSnapshotId,QnaSourceOrden)
      SELECT @Org0,@Org1,@Qna,@Anio,Interno,Nombre,SueldoD6,QuinqueniosD6,OtrasPrestacionesD6,BaseCotizacionSueldoD6,ViviendaD6,ViviendaD6,@OriginalActor,@LiquidacionSnapshotId,Orden FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId;
    INSERT aportaciones.IndividualesPrestacionesHistorico(clave_organica_0,clave_organica_1,quincena,anio,periodo,interno,nombre,sueldo,quinquenios,otras_prestaciones,sueldo_base,afpe,afpa,total,usuario_id,QnaLiquidacionSnapshotId,QnaSourceOrden)
      SELECT @Org0,@Org1,@Qna,@Anio,@Periodo,Interno,Nombre,SueldoD6,QuinqueniosD6,OtrasPrestacionesD6,COALESCE(BaseCotizacionSueldoD6,0),FRED6,FRAD6,PrestacionesD6,@OriginalActor,@LiquidacionSnapshotId,Orden FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId;
    INSERT aportaciones.IndividualesCairHistorico(clave_organica_0,clave_organica_1,quincena,anio,periodo,interno,nombre,sueldo,quinquenios,otras_prestaciones,sueldo_base,afe,total,usuario_id,QnaLiquidacionSnapshotId,QnaSourceOrden)
      SELECT @Org0,@Org1,@Qna,@Anio,@Periodo,Interno,Nombre,SueldoD6,QuinqueniosD6,OtrasPrestacionesD6,BaseCotizacionSueldoD6,CAIRD6,CAIRFondoD6,@OriginalActor,@LiquidacionSnapshotId,Orden FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId;

    INSERT aportaciones.GuarderiasHistorico(clave_organica_0,clave_organica_1,quincena,anio,periodo,titular_nombre,titular_no_empleado,titular_monto,titular_rfc,titular_monto_texto,titular_org0,titular_org0_nombre,titular_org1,titular_org1_nombre,titular_org2,titular_org2_nombre,titular_org3,titular_org3_nombre,entidad_monto,recibo_ajuste,recibo_total,recibo_mes_ano,recibo_fecha_venc,recibo_folio,menor_id,menor_nombre,menor_rfc,menor_nivel,menor_sala,estatus,usuario_id,QnaLiquidacionSnapshotId,QnaSourceOrden)
      SELECT @Org0,@Org1,@Qna,@Anio,@Periodo,JSON_VALUE(Payload,'$.titular_nombre'),JSON_VALUE(Payload,'$.titular_no_empleado'),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.titular_monto')),JSON_VALUE(Payload,'$.titular_rfc'),JSON_VALUE(Payload,'$.titular_monto_texto'),JSON_VALUE(Payload,'$.titular_org0'),JSON_VALUE(Payload,'$.titular_org0_nombre'),JSON_VALUE(Payload,'$.titular_org1'),JSON_VALUE(Payload,'$.titular_org1_nombre'),JSON_VALUE(Payload,'$.titular_org2'),JSON_VALUE(Payload,'$.titular_org2_nombre'),JSON_VALUE(Payload,'$.titular_org3'),JSON_VALUE(Payload,'$.titular_org3_nombre'),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.entidad_monto')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.recibo_ajuste')),ImporteA2,JSON_VALUE(Payload,'$.recibo_mes_ano'),TRY_CONVERT(DATETIME2,JSON_VALUE(Payload,'$.recibo_fecha_venc')),JSON_VALUE(Payload,'$.recibo_folio'),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.menor_id')),JSON_VALUE(Payload,'$.menor_nombre'),JSON_VALUE(Payload,'$.menor_rfc'),JSON_VALUE(Payload,'$.menor_nivel'),JSON_VALUE(Payload,'$.menor_sala'),JSON_VALUE(Payload,'$.estatus'),@OriginalActor,@LiquidacionSnapshotId,Orden FROM #E WHERE Dominio='GUARDERIAS';
    INSERT aportaciones.AguinaldoHistorico(clave_organica_0,clave_organica_1,quincena,anio,periodo,interno,org0,org1,org2,org3,movimiento,noempleado,tipomovimiento,nombres,rfc,curp,fecha,dias_aguinaldo,cuantos,cuantos_ori,nocontar,sdo,op,q,activo,nom_activo,qna_a,porcentaje_a,diario,general,porcentaje,proporcion,mensaje,dias_gral_agui,fecha_lf,fecha_li,f_inicio,f_fin,norg0,norg1,norg2,norg3,usuario_id,QnaLiquidacionSnapshotId,QnaSourceOrden)
      SELECT @Org0,@Org1,@Qna,@Anio,@Periodo,TRY_CONVERT(INT,JSON_VALUE(Payload,'$.interno')),JSON_VALUE(Payload,'$.org0'),JSON_VALUE(Payload,'$.org1'),JSON_VALUE(Payload,'$.org2'),JSON_VALUE(Payload,'$.org3'),JSON_VALUE(Payload,'$.movimiento'),JSON_VALUE(Payload,'$.noempleado'),JSON_VALUE(Payload,'$.tipomovimiento'),JSON_VALUE(Payload,'$.nombres'),JSON_VALUE(Payload,'$.rfc'),JSON_VALUE(Payload,'$.curp'),TRY_CONVERT(DATETIME2,JSON_VALUE(Payload,'$.fecha')),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.dias_aguinaldo')),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.cuantos')),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.cuantos_ori')),JSON_VALUE(Payload,'$.nocontar'),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.sdo')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.op')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.q')),JSON_VALUE(Payload,'$.activo'),JSON_VALUE(Payload,'$.nom_activo'),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.qna_a')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.porcentaje_a')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.diario')),ImporteA2,TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.porcentaje')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.proporcion')),JSON_VALUE(Payload,'$.mensaje'),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.dias_gral_agui')),TRY_CONVERT(DATETIME2,JSON_VALUE(Payload,'$.fecha_lf')),TRY_CONVERT(DATETIME2,JSON_VALUE(Payload,'$.fecha_li')),TRY_CONVERT(DATETIME2,JSON_VALUE(Payload,'$.f_inicio')),TRY_CONVERT(DATETIME2,JSON_VALUE(Payload,'$.f_fin')),JSON_VALUE(Payload,'$.norg0'),JSON_VALUE(Payload,'$.norg1'),JSON_VALUE(Payload,'$.norg2'),JSON_VALUE(Payload,'$.norg3'),@OriginalActor,@LiquidacionSnapshotId,Orden FROM #E WHERE Dominio='AGUINALDO';

    INSERT aportaciones.PensionNominaTransitorioHistorico(clave_organica_0,clave_organica_1,quincena,anio,periodo,fpension,interno,nombres,nonombre,rfc,norfc,org0,org1,org2,org3,norg0,norg1,norg2,norg3,sueldo,oprestaciones,quinquenios,sdo,oprest,quinq,tpension,transitorio,cconcepto,descripcion,importe,defuncion,pcp,palimenticia,retroactivo,payudaecon,otrosp1,otrosp2,otrosp3,otrosp4,otrosp5,terreno,hipviv,prodental,otrod1,otrod2,otrod3,otrod4,otrod5,otrod6,tpercep,tdeduc,total,fin,inicio,anio_registro,sihay,porcentaje,sdoporc,ayudporc,quinqporc,transorg0,transorg1,transnorg0,transnorg1,usuario_id)
      SELECT @Org0,@Org1,@Qna,@Anio,@Periodo,TRY_CONVERT(INT,JSON_VALUE(Payload,'$.fpension')),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.interno')),JSON_VALUE(Payload,'$.nombres'),JSON_VALUE(Payload,'$.nonombre'),JSON_VALUE(Payload,'$.rfc'),JSON_VALUE(Payload,'$.norfc'),JSON_VALUE(Payload,'$.org0'),JSON_VALUE(Payload,'$.org1'),JSON_VALUE(Payload,'$.org2'),JSON_VALUE(Payload,'$.org3'),JSON_VALUE(Payload,'$.norg0'),JSON_VALUE(Payload,'$.norg1'),JSON_VALUE(Payload,'$.norg2'),JSON_VALUE(Payload,'$.norg3'),
      TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.sueldo')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.oprestaciones')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.quinquenios')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.sdo')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.oprest')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.quinq')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.tpension')),ImporteA2,JSON_VALUE(Payload,'$.cconcepto'),JSON_VALUE(Payload,'$.descripcion'),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.importe')),TRY_CONVERT(DATETIME2,JSON_VALUE(Payload,'$.defuncion')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.pcp')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.palimenticia')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.retroactivo')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.payudaecon')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.otrosp1')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.otrosp2')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.otrosp3')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.otrosp4')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.otrosp5')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.terreno')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.hipviv')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.prodental')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.otrod1')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.otrod2')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.otrod3')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.otrod4')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.otrod5')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.otrod6')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.tpercep')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.tdeduc')),ImporteA2,TRY_CONVERT(DATETIME2,JSON_VALUE(Payload,'$.fin')),TRY_CONVERT(DATETIME2,JSON_VALUE(Payload,'$.inicio')),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.anio')),JSON_VALUE(Payload,'$.sihay'),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.porcentaje')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.sdoporc')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.ayudporc')),TRY_CONVERT(DECIMAL(18,2),JSON_VALUE(Payload,'$.quinqporc')),JSON_VALUE(Payload,'$.transorg0'),JSON_VALUE(Payload,'$.transorg1'),JSON_VALUE(Payload,'$.transnorg0'),JSON_VALUE(Payload,'$.transnorg1'),@OriginalActor FROM #E WHERE Dominio='TRANSITORIO';

    INSERT retenciones.PrestamosCortoPlazoHistorico(clave_organica_0,clave_organica_1,quincena,anio,periodo,interno,rfc,nombre,prestamo,letra,plazo,periodo_c,fecha_c,capital,interes,monto,moratorios,total,resultado,td,org0,org1,org2,org3,norg0,norg1,norg2,norg3,usuario_id)
      SELECT @Org0,@Org1,@Qna,@Anio,@Periodo,TRY_CONVERT(INT,JSON_VALUE(Payload,'$.interno')),JSON_VALUE(Payload,'$.rfc'),JSON_VALUE(Payload,'$.nombre'),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.prestamo')),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.letra')),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.plazo')),JSON_VALUE(Payload,'$.periodo_c'),TRY_CONVERT(DATETIME2,JSON_VALUE(Payload,'$.fecha_c')),TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(Payload,'$.capital_d6')),2,1)),TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(Payload,'$.interes_d6')),2,1)),TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(Payload,'$.monto_d6')),2,1)),TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(Payload,'$.moratorios_d6')),2,1)),ImporteA2,JSON_VALUE(Payload,'$.resultado'),JSON_VALUE(Payload,'$.td'),JSON_VALUE(Payload,'$.org0'),JSON_VALUE(Payload,'$.org1'),JSON_VALUE(Payload,'$.org2'),JSON_VALUE(Payload,'$.org3'),JSON_VALUE(Payload,'$.norg0'),JSON_VALUE(Payload,'$.norg1'),JSON_VALUE(Payload,'$.norg2'),JSON_VALUE(Payload,'$.norg3'),@OriginalActor FROM #E WHERE Dominio='PCP';
    INSERT retenciones.PrestamosMedianoPlazoHistorico(clave_organica_0,clave_organica_1,quincena,anio,periodo,interno,rfc,nombre,prestamo,letra,plazo,periodo_c,fecha_c,capital,moratorios,interes,seguro,total,resultado,clase,desc_clase,desc_prestamo,clave_p,noemple,folio,anio_prestamo,po,fecha_origen,org0,org1,org2,org3,norg0,norg1,norg2,norg3,usuario_id)
      SELECT @Org0,@Org1,@Qna,@Anio,@Periodo,TRY_CONVERT(INT,JSON_VALUE(Payload,'$.interno')),JSON_VALUE(Payload,'$.rfc'),JSON_VALUE(Payload,'$.nombre'),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.prestamo')),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.letra')),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.plazo')),JSON_VALUE(Payload,'$.periodo_c'),TRY_CONVERT(DATETIME2,JSON_VALUE(Payload,'$.fecha_c')),TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(Payload,'$.capital_d6')),2,1)),TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(Payload,'$.moratorios_d6')),2,1)),TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(Payload,'$.interes_d6')),2,1)),TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(Payload,'$.seguro_d6')),2,1)),ImporteA2,JSON_VALUE(Payload,'$.resultado'),JSON_VALUE(Payload,'$.clase'),JSON_VALUE(Payload,'$.desc_clase'),JSON_VALUE(Payload,'$.desc_prestamo'),JSON_VALUE(Payload,'$.clave_p'),JSON_VALUE(Payload,'$.noemple'),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.folio')),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.anio')),JSON_VALUE(Payload,'$.po'),TRY_CONVERT(DATETIME2,JSON_VALUE(Payload,'$.fecha_origen')),JSON_VALUE(Payload,'$.org0'),JSON_VALUE(Payload,'$.org1'),JSON_VALUE(Payload,'$.org2'),JSON_VALUE(Payload,'$.org3'),JSON_VALUE(Payload,'$.norg0'),JSON_VALUE(Payload,'$.norg1'),JSON_VALUE(Payload,'$.norg2'),JSON_VALUE(Payload,'$.norg3'),@OriginalActor FROM #E WHERE Dominio='PMP';
    INSERT retenciones.PrestamosHipotecariosHistorico(clave_organica_0,clave_organica_1,quincena,anio,periodo,computadora_antigua,interno,nombre,noempleado,rfc,cantidad,status,referencia_1,referencia_2,pno_solicitud,pano,pclave_clase_prestamo,pdescripcion,pclave_prestamo,prestamo_desc,tipo,periodo_c,descto,fecha_c,resultado,po,fecha_origen,plazo,capital_pagar,interes_pagar,interes_diferido_pagar,seguro_pagar,moratorio_pagar,org0,org1,org2,org3,norg0,norg1,norg2,norg3,usuario_id)
      SELECT @Org0,@Org1,@Qna,@Anio,@Periodo,CASE WHEN EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotFuente f WHERE f.LiquidacionSnapshotId=@LiquidacionSnapshotId AND f.Dominio='HIP' AND f.IdentificadorFuente LIKE 'FIREBIRD:AP_S_COMP_QNA:%') THEN 1 ELSE 0 END,TRY_CONVERT(INT,JSON_VALUE(Payload,'$.interno')),JSON_VALUE(Payload,'$.nombre'),JSON_VALUE(Payload,'$.noempleado'),JSON_VALUE(Payload,'$.rfc'),ImporteA2,JSON_VALUE(Payload,'$.status'),JSON_VALUE(Payload,'$.referencia_1'),JSON_VALUE(Payload,'$.referencia_2'),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.pno_solicitud')),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.pano')),JSON_VALUE(Payload,'$.pclave_clase_prestamo'),JSON_VALUE(Payload,'$.pdescripcion'),JSON_VALUE(Payload,'$.pclave_prestamo'),JSON_VALUE(Payload,'$.prestamo_desc'),JSON_VALUE(Payload,'$.tipo'),JSON_VALUE(Payload,'$.periodo_c'),TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(Payload,'$.descto_d6')),2,1)),TRY_CONVERT(DATETIME2,JSON_VALUE(Payload,'$.fecha_c')),JSON_VALUE(Payload,'$.resultado'),JSON_VALUE(Payload,'$.po'),TRY_CONVERT(DATETIME2,JSON_VALUE(Payload,'$.fecha_origen')),TRY_CONVERT(INT,JSON_VALUE(Payload,'$.plazo')),TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(Payload,'$.capital_pagar_d6')),2,1)),TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(Payload,'$.interes_pagar_d6')),2,1)),TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(Payload,'$.interes_diferido_pagar_d6')),2,1)),TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(Payload,'$.seguro_pagar_d6')),2,1)),TRY_CONVERT(DECIMAL(18,2),ROUND(TRY_CONVERT(DECIMAL(19,6),JSON_VALUE(Payload,'$.moratorio_pagar_d6')),2,1)),JSON_VALUE(Payload,'$.org0'),JSON_VALUE(Payload,'$.org1'),JSON_VALUE(Payload,'$.org2'),JSON_VALUE(Payload,'$.org3'),JSON_VALUE(Payload,'$.norg0'),JSON_VALUE(Payload,'$.norg1'),JSON_VALUE(Payload,'$.norg2'),JSON_VALUE(Payload,'$.norg3'),@OriginalActor FROM #E WHERE Dominio='HIP';

    IF TRY_CONVERT(BIT,SESSION_CONTEXT(N'QNA_LEGACY_FAIL_AFTER_DETAILS'))=1 THROW 51749,'QNA_LEGACY_FALLO_INYECTADO',1;

    DELETE aportaciones.ResumenHistorico WHERE clave_organica_0=@Org0 AND clave_organica_1=@Org1 AND anio=@Anio AND quincena=@Qna;
    INSERT aportaciones.ResumenHistorico(tipo_endpoint,clave_organica_0,clave_organica_1,quincena,anio,total_empleados,total_contribucion,total_sueldo_base,usuario_id)
      SELECT v.Endpoint,@Org0,@Org1,@Qna,@Anio,COALESCE(f.Registros,0),
        CASE v.Dominio WHEN 'AHORRO' THEN t.AhorroA2 WHEN 'VIVIENDA' THEN t.ViviendaA2 WHEN 'PRESTACIONES' THEN t.PrestacionesA2 WHEN 'CAIR' THEN t.CAIRFondoA2 WHEN 'GUARDERIAS' THEN t.GuarderiasA2 WHEN 'TRANSITORIO' THEN t.TransitorioA2 WHEN 'AGUINALDO' THEN t.AguinaldoA2 WHEN 'PCP' THEN t.RetencionPCPA2 WHEN 'PMP' THEN t.RetencionPMPA2 ELSE t.RetencionHIPA2 END,
        CASE WHEN v.Dominio IN('AHORRO','VIVIENDA','PRESTACIONES','CAIR') THEN CONVERT(DECIMAL(19,6),(SELECT COALESCE(SUM(BaseCotizacionSueldoD6),0) FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId)) ELSE 0 END,@OriginalActor
      FROM(VALUES('AHORRO','individuales/ahorro'),('VIVIENDA','individuales/vivienda'),('PRESTACIONES','individuales/prestaciones'),('CAIR','individuales/cair'),('GUARDERIAS','guarderias'),('TRANSITORIO','pension-nomina-transitorio'),('AGUINALDO','aguinaldo'))v(Dominio,Endpoint)
      JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=@LiquidacionSnapshotId LEFT JOIN liquidacion.QnaSnapshotFuente f ON f.LiquidacionSnapshotId=@LiquidacionSnapshotId AND f.Dominio=v.Dominio;

    DELETE conciliacion.RevisionAplicacionHistorico WHERE Organica0=@Org0 AND Organica1=@Org1 AND Organica2=@Org2 AND Organica3=@Org3 AND Periodo=@Periodo;
    INSERT conciliacion.RevisionAplicacionHistorico(Organica0,Organica1,Organica2,Organica3,Periodo,CAIR,FRA,FRE,FH,FV,FAA,FAE,FAT,FAI,RegistrosOrigen,UsuarioId,LiquidacionSnapshotId)
      SELECT @Org0,@Org1,@Org2,@Org3,@Periodo,CAIRA2,FRAA2,FREA2,FHA2,FVA2,FAAA2,FAEA2,FATA2,FAIA2,Registros,TRY_CONVERT(UNIQUEIDENTIFIER,@OriginalActor),@LiquidacionSnapshotId FROM liquidacion.QnaSnapshotTotal WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId;
    EXEC liquidacion.spAsignarProvenanceLegacyV5 @LiquidacionSnapshotId;
    EXEC liquidacion.spConciliarLegacySnapshotV5 @LiquidacionSnapshotId,@OriginalActor;
    EXEC liquidacion.spQnaLegacyCapabilityMarker 0;
    IF @Inicio=1 COMMIT TRANSACTION;
    IF @XactAbort=1 SET XACT_ABORT ON;
  END TRY
  BEGIN CATCH
    DECLARE @Error NVARCHAR(2000)=LEFT(ERROR_MESSAGE(),2000);
    IF XACT_STATE()=-1 BEGIN IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; IF @XactAbort=1 SET XACT_ABORT ON; THROW; END;
    IF XACT_STATE()=1 BEGIN IF @Inicio=1 ROLLBACK TRANSACTION; ELSE ROLLBACK TRANSACTION QnaLegacyP8; END;
    IF @Inicio=1 BEGIN TRANSACTION;
    EXEC liquidacion.spQnaLegacyCapabilityMarker 1;
    SET @ProjectionId=NULL; SET @OriginalActor=NULL;
    SELECT @ProjectionId=QnaLegacyProjectionId,@OriginalActor=UsuarioId FROM liquidacion.QnaLegacyProjection WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId;
    IF @ProjectionId IS NULL
    BEGIN INSERT liquidacion.QnaLegacyProjection(LiquidacionSnapshotId,PoliticaVersion,NormalizacionVersion,Autoritativo,UsuarioId) VALUES(@LiquidacionSnapshotId,'QNA-LEGACY-DUAL-WRITE-V1','LEGACY-PROJECTION-v1','V5',@UsuarioId); SET @ProjectionId=SCOPE_IDENTITY(); SET @OriginalActor=@UsuarioId; END;
    DECLARE @Huella CHAR(64)=CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),CONCAT('ERROR|',@Error))),2);
    IF NOT EXISTS(SELECT 1 FROM liquidacion.QnaLegacyReconciliacion WHERE QnaLegacyProjectionId=@ProjectionId AND Dominio='RESUMEN' AND Huella=@Huella)
      INSERT liquidacion.QnaLegacyReconciliacion(QnaLegacyProjectionId,Dominio,Estado,EstadoDominio,RegistrosEsperados,RegistrosActuales,TotalEsperadoA2,TotalActualA2,HashEsperado,HashActual,Diferencias,ErrorDetalle,Huella,UsuarioId)
      VALUES(@ProjectionId,'RESUMEN','ERROR','EMPTY',0,0,0,0,NULL,NULL,'PROYECCION_REVERTIDA_A_SAVEPOINT',@Error,@Huella,@OriginalActor);
    UPDATE liquidacion.QnaLegacyProjection SET Estado='ERROR',Detalle=@Error,FechaActualizacion=SYSDATETIME() WHERE QnaLegacyProjectionId=@ProjectionId;
    EXEC liquidacion.spQnaLegacyCapabilityMarker 0;
    IF @Inicio=1 COMMIT TRANSACTION;
    IF @XactAbort=1 SET XACT_ABORT ON;
    SELECT 'ERROR' Estado,@Error Detalle;
  END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE liquidacion.spProyectarLegacyDesdeSnapshotV5
  @LiquidacionSnapshotId BIGINT,
  @UsuarioId NVARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;
  EXEC liquidacion.spProyectarLegacyDesdeSnapshotV5Core @LiquidacionSnapshotId,@UsuarioId,0;
END;
GO

CREATE OR ALTER PROCEDURE liquidacion.spConciliarLegacySnapshotV5_Deprecated
  @LiquidacionSnapshotId BIGINT,@UsuarioId NVARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @P BIGINT,@O0 CHAR(2),@O1 CHAR(2),@O2 CHAR(2),@O3 CHAR(2),@A INT,@Q INT,@Per CHAR(4);
  SELECT @P=p.QnaLegacyProjectionId,@UsuarioId=p.UsuarioId,@O0=s.Organica0,@O1=s.Organica1,@O2=s.Organica2,@O3=s.Organica3,@A=s.Anio,@Q=s.Quincena,@Per=s.Periodo FROM liquidacion.QnaLegacyProjection p JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=p.LiquidacionSnapshotId WHERE p.LiquidacionSnapshotId=@LiquidacionSnapshotId;
  IF @P IS NULL THROW 51750,'QNA_LEGACY_PROJECTION_HEADER_REQUERIDO',1;
  DECLARE @R TABLE(Dominio VARCHAR(20),EstadoDominio VARCHAR(20),E INT,A INT,TV5 DECIMAL(19,2),TE DECIMAL(19,2),TA DECIMAL(19,2),DN DECIMAL(19,2),HE CHAR(64),HA CHAR(64));
  INSERT @R
  SELECT f.Dominio,f.Estado,o.Registros,x.Registros,o.TotalV5A2,o.TotalNormalizadoA2,x.TotalA2,o.DiferenciaNormalizacionA2,o.HashEsperado,x.HashActual
  FROM liquidacion.QnaSnapshotFuente f JOIN liquidacion.QnaLegacyExpectedDomain o ON o.QnaLegacyProjectionId=@P AND o.Dominio=f.Dominio
  CROSS APPLY(SELECT
    CASE f.Dominio WHEN 'AHORRO' THEN (SELECT COUNT(*) FROM aportaciones.IndividualesAhorroHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'VIVIENDA' THEN (SELECT COUNT(*) FROM aportaciones.IndividualesViviendaHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'PRESTACIONES' THEN (SELECT COUNT(*) FROM aportaciones.IndividualesPrestacionesHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'CAIR' THEN (SELECT COUNT(*) FROM aportaciones.IndividualesCairHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'GUARDERIAS' THEN (SELECT COUNT(*) FROM aportaciones.GuarderiasHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'TRANSITORIO' THEN (SELECT COUNT(*) FROM aportaciones.PensionNominaTransitorioHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'AGUINALDO' THEN (SELECT COUNT(*) FROM aportaciones.AguinaldoHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'PCP' THEN (SELECT COUNT(*) FROM retenciones.PrestamosCortoPlazoHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'PMP' THEN (SELECT COUNT(*) FROM retenciones.PrestamosMedianoPlazoHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) ELSE (SELECT COUNT(*) FROM retenciones.PrestamosHipotecariosHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) END Registros,
    CASE f.Dominio WHEN 'AHORRO' THEN (SELECT CONVERT(DECIMAL(19,2),ROUND(COALESCE(SUM(total),0),2,1)) FROM aportaciones.IndividualesAhorroHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'VIVIENDA' THEN (SELECT CONVERT(DECIMAL(19,2),ROUND(COALESCE(SUM(total),0),2,1)) FROM aportaciones.IndividualesViviendaHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'PRESTACIONES' THEN (SELECT CONVERT(DECIMAL(19,2),ROUND(COALESCE(SUM(total),0),2,1)) FROM aportaciones.IndividualesPrestacionesHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'CAIR' THEN (SELECT CONVERT(DECIMAL(19,2),ROUND(COALESCE(SUM(total),0),2,1)) FROM aportaciones.IndividualesCairHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'GUARDERIAS' THEN (SELECT COALESCE(SUM(recibo_total),0) FROM aportaciones.GuarderiasHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'TRANSITORIO' THEN (SELECT COALESCE(SUM(total),0) FROM aportaciones.PensionNominaTransitorioHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'AGUINALDO' THEN (SELECT COALESCE(SUM(general),0) FROM aportaciones.AguinaldoHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'PCP' THEN (SELECT COALESCE(SUM(total),0) FROM retenciones.PrestamosCortoPlazoHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) WHEN 'PMP' THEN (SELECT COALESCE(SUM(total),0) FROM retenciones.PrestamosMedianoPlazoHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) ELSE (SELECT COALESCE(SUM(cantidad),0) FROM retenciones.PrestamosHipotecariosHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) END TotalA2,
    CAST(NULL AS CHAR(64)) HashActual)x
  WHERE f.LiquidacionSnapshotId=@LiquidacionSnapshotId;
  INSERT @R
    SELECT o.Dominio,'COMPLETE',o.Registros,
      CASE o.Dominio WHEN 'RESUMEN' THEN (SELECT COUNT(*) FROM aportaciones.ResumenHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) ELSE (SELECT COUNT(*) FROM conciliacion.RevisionAplicacionHistorico WHERE Organica0=@O0 AND Organica1=@O1 AND Organica2=@O2 AND Organica3=@O3 AND Periodo=@Per) END,
      o.TotalV5A2,o.TotalNormalizadoA2,
      CASE o.Dominio WHEN 'RESUMEN' THEN (SELECT COALESCE(SUM(total_contribucion),0) FROM aportaciones.ResumenHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q) ELSE (SELECT COALESCE(SUM(CAIR+FRA+FRE+FH+FV+FAA+FAE+FAT+FAI),0) FROM conciliacion.RevisionAplicacionHistorico WHERE Organica0=@O0 AND Organica1=@O1 AND Organica2=@O2 AND Organica3=@O3 AND Periodo=@Per) END,
      o.DiferenciaNormalizacionA2,o.HashEsperado,NULL
    FROM liquidacion.QnaLegacyExpectedDomain o WHERE o.QnaLegacyProjectionId=@P AND o.Dominio IN('RESUMEN','REVISION');

  /* Hash de todos los campos de negocio normalizados; IDs y auditoria fisica se excluyen. */
  UPDATE r SET HA=CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),COALESCE(CASE r.Dominio
    WHEN 'AHORRO' THEN (SELECT interno,nombre,sueldo,quinquenios,otras_prestaciones,sueldo_base,afae,afaa,total FROM aportaciones.IndividualesAhorroHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q ORDER BY interno FOR JSON PATH,INCLUDE_NULL_VALUES)
    WHEN 'VIVIENDA' THEN (SELECT interno,nombre,sueldo,quinquenios,otras_prestaciones,sueldo_base,afe,total FROM aportaciones.IndividualesViviendaHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q ORDER BY interno FOR JSON PATH,INCLUDE_NULL_VALUES)
    WHEN 'PRESTACIONES' THEN (SELECT interno,nombre,sueldo,quinquenios,otras_prestaciones,sueldo_base,afpe,afpa,total FROM aportaciones.IndividualesPrestacionesHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q ORDER BY interno FOR JSON PATH,INCLUDE_NULL_VALUES)
    WHEN 'CAIR' THEN (SELECT interno,nombre,sueldo,quinquenios,otras_prestaciones,sueldo_base,afe,total FROM aportaciones.IndividualesCairHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q ORDER BY interno FOR JSON PATH,INCLUDE_NULL_VALUES)
    WHEN 'GUARDERIAS' THEN (SELECT titular_nombre,titular_no_empleado,titular_monto,titular_rfc,titular_monto_texto,titular_org0,titular_org1,titular_org2,titular_org3,entidad_monto,recibo_ajuste,recibo_total,recibo_mes_ano,recibo_fecha_venc,recibo_folio,menor_id,menor_nombre,menor_rfc,menor_nivel,menor_sala,estatus FROM aportaciones.GuarderiasHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q ORDER BY titular_no_empleado,recibo_folio,menor_id,id FOR JSON PATH,INCLUDE_NULL_VALUES)
    WHEN 'TRANSITORIO' THEN (SELECT fpension,interno,nombres,nonombre,rfc,norfc,org0,org1,org2,org3,sueldo,oprestaciones,quinquenios,tpension,transitorio,cconcepto,importe,total,fin,inicio,anio_registro FROM aportaciones.PensionNominaTransitorioHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q ORDER BY interno,fpension,cconcepto,id FOR JSON PATH,INCLUDE_NULL_VALUES)
    WHEN 'AGUINALDO' THEN (SELECT interno,noempleado,nombres,rfc,curp,fecha,dias_aguinaldo,general,proporcion,mensaje FROM aportaciones.AguinaldoHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q ORDER BY interno,noempleado,id FOR JSON PATH,INCLUDE_NULL_VALUES)
    WHEN 'PCP' THEN (SELECT interno,rfc,nombre,prestamo,letra,plazo,capital,interes,monto,moratorios,total,resultado FROM retenciones.PrestamosCortoPlazoHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q ORDER BY interno,prestamo,letra,id FOR JSON PATH,INCLUDE_NULL_VALUES)
    WHEN 'PMP' THEN (SELECT interno,rfc,nombre,prestamo,letra,plazo,capital,moratorios,interes,seguro,total,folio,anio_prestamo FROM retenciones.PrestamosMedianoPlazoHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q ORDER BY interno,prestamo,letra,folio,id FOR JSON PATH,INCLUDE_NULL_VALUES)
    WHEN 'HIP' THEN (SELECT computadora_antigua,interno,nombre,noempleado,rfc,cantidad,pno_solicitud,pano,pclave_prestamo,descto,plazo,capital_pagar,interes_pagar,interes_diferido_pagar,seguro_pagar,moratorio_pagar FROM retenciones.PrestamosHipotecariosHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q ORDER BY interno,pno_solicitud,pano,id FOR JSON PATH,INCLUDE_NULL_VALUES)
    WHEN 'RESUMEN' THEN (SELECT tipo_endpoint,CONVERT(VARCHAR(20),total_empleados) total_empleados,CONVERT(VARCHAR(50),total_contribucion) total_contribucion,CONVERT(VARCHAR(50),total_sueldo_base) total_sueldo_base FROM aportaciones.ResumenHistorico WHERE clave_organica_0=@O0 AND clave_organica_1=@O1 AND anio=@A AND quincena=@Q ORDER BY tipo_endpoint FOR JSON PATH,INCLUDE_NULL_VALUES)
    ELSE (SELECT CAIR,FRA,FRE,FH,FV,FAA,FAE,FAT,FAI,RegistrosOrigen,LiquidacionSnapshotId FROM conciliacion.RevisionAplicacionHistorico WHERE Organica0=@O0 AND Organica1=@O1 AND Organica2=@O2 AND Organica3=@O3 AND Periodo=@Per FOR JSON PATH,INCLUDE_NULL_VALUES)
  END,N'[]'))),2) FROM @R r;
  INSERT liquidacion.QnaLegacyReconciliacion(QnaLegacyProjectionId,Dominio,Estado,EstadoDominio,RegistrosEsperados,RegistrosActuales,TotalEsperadoA2,TotalActualA2,TotalV5A2,DiferenciaNormalizacionA2,NormalizacionVersion,HashEsperado,HashActual,Diferencias,ErrorDetalle,Huella,UsuarioId)
  SELECT @P,Dominio,IIF(E=A AND TE=TA AND HE=HA,'COMPLETE','WARNING'),EstadoDominio,E,A,TE,TA,TV5,DN,'LEGACY-PROJECTION-v1',HE,HA,
    IIF(E=A AND TE=TA AND HE=HA,NULL,CONCAT('CONTEO:',E,'/',A,';TOTAL_A2:',TE,'/',TA,';HASH:',HE,'/',HA)),NULL,
    CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),CONCAT(Dominio,'|',E,'|',A,'|',TE,'|',TA,'|',HE,'|',HA))),2),@UsuarioId
  FROM @R r;
  DECLARE @EstadoFinal VARCHAR(20)=IIF(EXISTS(SELECT 1 FROM @R WHERE E<>A OR TE<>TA OR HE<>HA),'WARNING','COMPLETE');
  DECLARE @DetalleFinal NVARCHAR(2000)=(SELECT STRING_AGG(CONVERT(NVARCHAR(MAX),CONCAT(Dominio,':',E,'/',A,':',TE,'/',TA)),N';') FROM @R WHERE E<>A OR TE<>TA OR HE<>HA);
  UPDATE liquidacion.QnaLegacyProjection SET Estado=@EstadoFinal,Detalle=@DetalleFinal,FechaActualizacion=SYSDATETIME() WHERE QnaLegacyProjectionId=@P AND Estado<>'SUPERSEDED';
  SELECT @EstadoFinal Estado,CONVERT(VARCHAR(100),CASE WHEN @EstadoFinal='WARNING' THEN 'LEGACY_RECONCILIATION_DIVERGENCE' END) Codigo,@DetalleFinal Detalle;
END;
GO

CREATE OR ALTER PROCEDURE liquidacion.spConciliarLegacySnapshotV5
  @LiquidacionSnapshotId BIGINT,@UsuarioId NVARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @P BIGINT;
  SELECT @P=QnaLegacyProjectionId,@UsuarioId=UsuarioId FROM liquidacion.QnaLegacyProjection WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId;
  IF @P IS NULL THROW 51750,'QNA_LEGACY_PROJECTION_HEADER_REQUERIDO',1;
  IF (SELECT COUNT(*) FROM liquidacion.QnaLegacyExpectedDomain WHERE QnaLegacyProjectionId=@P)<>12 THROW 51758,'QNA_LEGACY_ORACLE_INCOMPLETO',1;
  CREATE TABLE #ActualCanonical(PhysicalId BIGINT NOT NULL,SourceOrden INT NULL,RowHash CHAR(64) NOT NULL);
  CREATE TABLE #R(Dominio VARCHAR(20) PRIMARY KEY,EstadoDominio VARCHAR(20),E INT,A INT,TV5 DECIMAL(19,2),TE DECIMAL(19,2),TA DECIMAL(19,2),DN DECIMAL(19,2),HE CHAR(64),HA CHAR(64));
  DECLARE @Stores TABLE(Dominio VARCHAR(20),Tabla SYSNAME,TotalExpression NVARCHAR(500));
  INSERT @Stores VALUES
    ('AHORRO',N'aportaciones.IndividualesAhorroHistorico',N'total'),('VIVIENDA',N'aportaciones.IndividualesViviendaHistorico',N'total'),
    ('PRESTACIONES',N'aportaciones.IndividualesPrestacionesHistorico',N'total'),('CAIR',N'aportaciones.IndividualesCairHistorico',N'total'),
    ('GUARDERIAS',N'aportaciones.GuarderiasHistorico',N'recibo_total'),('TRANSITORIO',N'aportaciones.PensionNominaTransitorioHistorico',N'total'),
    ('AGUINALDO',N'aportaciones.AguinaldoHistorico',N'general'),('PCP',N'retenciones.PrestamosCortoPlazoHistorico',N'total'),
    ('PMP',N'retenciones.PrestamosMedianoPlazoHistorico',N'total'),('HIP',N'retenciones.PrestamosHipotecariosHistorico',N'cantidad'),
    ('RESUMEN',N'aportaciones.ResumenHistorico',N'total_contribucion'),
    ('REVISION',N'conciliacion.RevisionAplicacionHistorico',N'CAIR+FRA+FRE+FH+FV+FAA+FAE+FAT+FAI');
  DECLARE @D VARCHAR(20),@T SYSNAME,@TotalExpression NVARCHAR(500),@A INT,@TA DECIMAL(19,2),@HA CHAR(64),@Sql NVARCHAR(MAX);
  DECLARE store_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT Dominio,Tabla,TotalExpression FROM @Stores;
  OPEN store_cursor; FETCH NEXT FROM store_cursor INTO @D,@T,@TotalExpression;
  WHILE @@FETCH_STATUS=0
  BEGIN
    TRUNCATE TABLE #ActualCanonical;
    EXEC liquidacion.spCargarFilasLegacyCanonicasActuales @T,@LiquidacionSnapshotId;
    IF EXISTS(SELECT 1 FROM #ActualCanonical WHERE SourceOrden IS NULL)
      OR EXISTS(SELECT SourceOrden FROM #ActualCanonical GROUP BY SourceOrden HAVING COUNT(*)<>1)
      THROW 51761,'QNA_LEGACY_PROVENANCE_INCOMPLETA',1;
    SELECT @A=COUNT(*),@HA=CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),COALESCE(STRING_AGG(CONVERT(NVARCHAR(MAX),RowHash),N'|') WITHIN GROUP(ORDER BY SourceOrden),N''))),2) FROM #ActualCanonical;
    SET @Sql=N'SELECT @Total=COALESCE(SUM(CONVERT(DECIMAL(19,2),'+@TotalExpression+N')),0) FROM '+QUOTENAME(PARSENAME(@T,2))+N'.'+QUOTENAME(PARSENAME(@T,1))+N' WHERE QnaLiquidacionSnapshotId=@Id;';
    EXEC sys.sp_executesql @Sql,N'@Id BIGINT,@Total DECIMAL(19,2) OUTPUT',@LiquidacionSnapshotId,@TA OUTPUT;
    INSERT #R
    SELECT o.Dominio,COALESCE(f.Estado,'COMPLETE'),o.Registros,@A,o.TotalV5A2,o.TotalNormalizadoA2,@TA,o.DiferenciaNormalizacionA2,o.HashEsperado,@HA
    FROM liquidacion.QnaLegacyExpectedDomain o LEFT JOIN liquidacion.QnaSnapshotFuente f ON f.LiquidacionSnapshotId=@LiquidacionSnapshotId AND f.Dominio=o.Dominio
    WHERE o.QnaLegacyProjectionId=@P AND o.Dominio=@D;
    FETCH NEXT FROM store_cursor INTO @D,@T,@TotalExpression;
  END;
  CLOSE store_cursor; DEALLOCATE store_cursor;
  INSERT liquidacion.QnaLegacyReconciliacion(QnaLegacyProjectionId,Dominio,Estado,EstadoDominio,RegistrosEsperados,RegistrosActuales,TotalEsperadoA2,TotalActualA2,TotalV5A2,DiferenciaNormalizacionA2,NormalizacionVersion,HashEsperado,HashActual,Diferencias,ErrorDetalle,Huella,UsuarioId)
  SELECT @P,Dominio,IIF(E=A AND TE=TA AND HE=HA,'COMPLETE','WARNING'),EstadoDominio,E,A,TE,TA,TV5,DN,'LEGACY-PROJECTION-v1',HE,HA,
    IIF(E=A AND TE=TA AND HE=HA,NULL,CONCAT('CONTEO:',E,'/',A,';TOTAL_A2:',TE,'/',TA,';HASH:',HE,'/',HA)),NULL,
    CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),CONCAT(Dominio,'|',E,'|',A,'|',TE,'|',TA,'|',HE,'|',HA))),2),@UsuarioId FROM #R;
  DECLARE @EstadoFinal VARCHAR(20)=IIF(EXISTS(SELECT 1 FROM #R WHERE E<>A OR TE<>TA OR HE<>HA),'WARNING','COMPLETE');
  DECLARE @DetalleFinal NVARCHAR(2000)=(SELECT STRING_AGG(CONVERT(NVARCHAR(MAX),CONCAT(Dominio,':',E,'/',A,':',TE,'/',TA)),N';') FROM #R WHERE E<>A OR TE<>TA OR HE<>HA);
  UPDATE liquidacion.QnaLegacyProjection SET Estado=@EstadoFinal,Detalle=@DetalleFinal,FechaActualizacion=SYSDATETIME() WHERE QnaLegacyProjectionId=@P AND Estado<>'SUPERSEDED';
  SELECT @EstadoFinal Estado,CONVERT(VARCHAR(100),IIF(@EstadoFinal='WARNING','LEGACY_RECONCILIATION_DIVERGENCE',NULL)) Codigo,@DetalleFinal Detalle;
END;
GO

CREATE OR ALTER PROCEDURE liquidacion.spRepararLegacyDesdeSnapshotV5
  @LiquidacionSnapshotId BIGINT,@UsuarioId NVARCHAR(100),@Motivo NVARCHAR(1000)
AS
BEGIN
  SET NOCOUNT ON;
  IF NULLIF(LTRIM(RTRIM(@UsuarioId)),N'') IS NULL OR NULLIF(LTRIM(RTRIM(@Motivo)),N'') IS NULL THROW 51751,'QNA_LEGACY_REPAIR_AUDITORIA_REQUERIDA',1;
  IF IS_ROLEMEMBER(N'qna_legacy_repair_executor')<>1 THROW 51752,'QNA_LEGACY_REPAIR_ROLE_REQUERIDO',1;
  BEGIN TRY
    EXEC liquidacion.spQnaLegacyCapabilityMarker 1;
    EXEC liquidacion.spProyectarLegacyDesdeSnapshotV5Core @LiquidacionSnapshotId,@UsuarioId,1;
    DECLARE @Estado VARCHAR(20),@Detalle NVARCHAR(2000);
    SELECT @Estado=Estado,@Detalle=Detalle FROM liquidacion.QnaLegacyProjection WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId;
    SET @Estado=COALESCE(@Estado,'ERROR');
    IF @Estado='COMPLETE' AND EXISTS(SELECT 1 FROM liquidacion.QnaLegacyProjection p WHERE p.LiquidacionSnapshotId=@LiquidacionSnapshotId AND p.Estado<>'COMPLETE')
      BEGIN SET @Estado='WARNING'; SET @Detalle='POST_REPAIR_NOT_ALL_DOMAINS_COMPLETE'; END;
    INSERT liquidacion.QnaLegacyRepairAudit(LiquidacionSnapshotId,UsuarioId,Motivo,Resultado,Detalle) VALUES(@LiquidacionSnapshotId,@UsuarioId,@Motivo,@Estado,@Detalle);
    EXEC liquidacion.spQnaLegacyCapabilityMarker 0;
    SELECT @Estado Estado,'LEGACY_REPAIR_RESULT' Codigo,@Detalle Detalle;
  END TRY
  BEGIN CATCH
    IF XACT_STATE()=1 INSERT liquidacion.QnaLegacyRepairAudit(LiquidacionSnapshotId,UsuarioId,Motivo,Resultado,Detalle) VALUES(@LiquidacionSnapshotId,@UsuarioId,@Motivo,'ERROR',LEFT(ERROR_MESSAGE(),2000));
    IF XACT_STATE()=1 EXEC liquidacion.spQnaLegacyCapabilityMarker 0;
    THROW;
  END CATCH;
END;
GO
REVOKE EXECUTE ON OBJECT::liquidacion.spRepararLegacyDesdeSnapshotV5 FROM public;
REVOKE EXECUTE ON OBJECT::liquidacion.spQnaLegacyCapabilityProbe FROM public;
DENY EXECUTE ON OBJECT::liquidacion.spProyectarLegacyDesdeSnapshotV5Core TO public;
GRANT EXECUTE ON OBJECT::liquidacion.spRepararLegacyDesdeSnapshotV5 TO qna_legacy_repair_executor;
REVOKE EXECUTE ON OBJECT::liquidacion.spProyectarLegacyDesdeSnapshotV5 FROM public;
GRANT EXECUTE ON OBJECT::liquidacion.spProyectarLegacyDesdeSnapshotV5 TO qna_legacy_projector_executor;
DENY EXECUTE ON OBJECT::aportaciones.spGuardarIndividualesAhorroHistorico_Lote TO qna_legacy_projector_executor,qna_legacy_repair_executor;
DENY EXECUTE ON OBJECT::aportaciones.spGuardarIndividualesViviendaHistorico_Lote TO qna_legacy_projector_executor,qna_legacy_repair_executor;
DENY EXECUTE ON OBJECT::aportaciones.spGuardarIndividualesPrestacionesHistorico_Lote TO qna_legacy_projector_executor,qna_legacy_repair_executor;
DENY EXECUTE ON OBJECT::aportaciones.spGuardarIndividualesCairHistorico_Lote TO qna_legacy_projector_executor,qna_legacy_repair_executor;
DENY EXECUTE ON OBJECT::aportaciones.spGuardarPensionNominaTransitorioHistorico_Lote TO qna_legacy_projector_executor,qna_legacy_repair_executor;
DENY EXECUTE ON OBJECT::aportaciones.spGuardarGuarderiasHistorico_Lote TO qna_legacy_projector_executor,qna_legacy_repair_executor;
DENY EXECUTE ON OBJECT::aportaciones.spGuardarAguinaldoHistorico_Lote TO qna_legacy_projector_executor,qna_legacy_repair_executor;
DENY EXECUTE ON OBJECT::retenciones.spGuardarPrestamosCortoPlazoHistorico_Lote TO qna_legacy_projector_executor,qna_legacy_repair_executor;
DENY EXECUTE ON OBJECT::retenciones.spGuardarPrestamosMedianoPlazoHistorico_Lote TO qna_legacy_projector_executor,qna_legacy_repair_executor;
DENY EXECUTE ON OBJECT::retenciones.spGuardarPrestamosHipotecariosHistorico_Lote TO qna_legacy_projector_executor,qna_legacy_repair_executor;
DECLARE @ModulosFirmados TABLE(Nombre NVARCHAR(300));
INSERT @ModulosFirmados VALUES
 (N'liquidacion.spProyectarLegacyDesdeSnapshotV5'),(N'liquidacion.spProyectarLegacyDesdeSnapshotV5Core'),
 (N'liquidacion.spQnaLegacyCapabilityMarker'),(N'liquidacion.spQnaLegacyCapabilityProbe'),
 (N'liquidacion.spConstruirOracleLegacyV5'),(N'liquidacion.spCargarFilasLegacyCanonicasActuales'),
 (N'liquidacion.spAsignarProvenanceLegacyV5'),(N'liquidacion.spConciliarLegacySnapshotV5'),(N'liquidacion.spRepararLegacyDesdeSnapshotV5');
DECLARE @TriggersFirmados TABLE(Nombre NVARCHAR(300));
INSERT @TriggersFirmados VALUES
 (N'liquidacion.TR_QnaLegacyProjection_Inmutable'),(N'liquidacion.TR_QnaLegacyScopeOwnership_Inmutable'),
 (N'liquidacion.TR_QnaLegacyReconciliacion_Inmutable'),(N'liquidacion.TR_QnaLegacyRepairAudit_Inmutable'),(N'liquidacion.TR_QnaLegacyExpectedDomain_Inmutable'),(N'liquidacion.TR_QnaLegacyExpectedRow_Inmutable'),
 (N'aportaciones.TR_IndividualesAhorroHistorico_V5Guard'),(N'aportaciones.TR_IndividualesViviendaHistorico_V5Guard'),(N'aportaciones.TR_IndividualesPrestacionesHistorico_V5Guard'),(N'aportaciones.TR_IndividualesCairHistorico_V5Guard'),
 (N'aportaciones.TR_PensionNominaTransitorioHistorico_V5Guard'),(N'aportaciones.TR_GuarderiasHistorico_V5Guard'),(N'aportaciones.TR_AguinaldoHistorico_V5Guard'),(N'aportaciones.TR_ResumenHistorico_V5Guard'),
 (N'retenciones.TR_PrestamosCortoPlazoHistorico_V5Guard'),(N'retenciones.TR_PrestamosMedianoPlazoHistorico_V5Guard'),(N'retenciones.TR_PrestamosHipotecariosHistorico_V5Guard'),
 (N'conciliacion.TR_RevisionAplicacionHistorico_V5Guard');
DECLARE @Modulo NVARCHAR(300),@FirmaSql NVARCHAR(MAX);
DECLARE firmas_modulo CURSOR LOCAL FAST_FORWARD FOR SELECT Nombre FROM @ModulosFirmados;
OPEN firmas_modulo; FETCH NEXT FROM firmas_modulo INTO @Modulo;
WHILE @@FETCH_STATUS=0
BEGIN
  IF EXISTS(SELECT 1 FROM sys.crypt_properties WHERE major_id=OBJECT_ID(@Modulo) AND thumbprint=(SELECT thumbprint FROM sys.certificates WHERE name=N'QnaLegacyProjectorCertificate'))
  BEGIN
    SET @FirmaSql=N'DROP SIGNATURE FROM OBJECT::'+QUOTENAME(PARSENAME(@Modulo,2))+N'.'+QUOTENAME(PARSENAME(@Modulo,1))+N' BY CERTIFICATE QnaLegacyProjectorCertificate WITH PASSWORD=''BICSN-QNA-Legacy-Projection-v1-Certificate'';';
    EXEC sys.sp_executesql @FirmaSql;
  END;
  SET @FirmaSql=N'ADD SIGNATURE TO OBJECT::'+QUOTENAME(PARSENAME(@Modulo,2))+N'.'+QUOTENAME(PARSENAME(@Modulo,1))+N' BY CERTIFICATE QnaLegacyProjectorCertificate WITH PASSWORD=''BICSN-QNA-Legacy-Projection-v1-Certificate'';';
  EXEC sys.sp_executesql @FirmaSql;
  FETCH NEXT FROM firmas_modulo INTO @Modulo;
END;
CLOSE firmas_modulo; DEALLOCATE firmas_modulo;
DECLARE @Trigger NVARCHAR(300),@TriggerSql NVARCHAR(MAX);
DECLARE firmas_trigger CURSOR LOCAL FAST_FORWARD FOR SELECT Nombre FROM @TriggersFirmados;
OPEN firmas_trigger; FETCH NEXT FROM firmas_trigger INTO @Trigger;
WHILE @@FETCH_STATUS=0
BEGIN
  IF EXISTS(SELECT 1 FROM sys.crypt_properties WHERE major_id=OBJECT_ID(@Trigger) AND thumbprint=(SELECT thumbprint FROM sys.certificates WHERE name=N'QnaLegacyProjectorCertificate'))
  BEGIN
    SET @TriggerSql=N'DROP SIGNATURE FROM OBJECT::'+QUOTENAME(PARSENAME(@Trigger,2))+N'.'+QUOTENAME(PARSENAME(@Trigger,1))+N' BY CERTIFICATE QnaLegacyProjectorCertificate WITH PASSWORD=''BICSN-QNA-Legacy-Projection-v1-Certificate'';';
    EXEC sys.sp_executesql @TriggerSql;
  END;
  IF EXISTS(SELECT 1 FROM sys.crypt_properties WHERE major_id=OBJECT_ID(@Trigger) AND thumbprint=(SELECT thumbprint FROM sys.certificates WHERE name=N'QnaLegacyGuardCertificate'))
  BEGIN
    SET @TriggerSql=N'DROP SIGNATURE FROM OBJECT::'+QUOTENAME(PARSENAME(@Trigger,2))+N'.'+QUOTENAME(PARSENAME(@Trigger,1))+N' BY CERTIFICATE QnaLegacyGuardCertificate WITH PASSWORD=''BICSN-QNA-Legacy-Guard-v1-Certificate'';';
    EXEC sys.sp_executesql @TriggerSql;
  END;
  FETCH NEXT FROM firmas_trigger INTO @Trigger;
END;
CLOSE firmas_trigger; DEALLOCATE firmas_trigger;
GO
