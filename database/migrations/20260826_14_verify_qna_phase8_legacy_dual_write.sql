SET NOCOUNT ON;

DECLARE @F TABLE(Falla NVARCHAR(500) NOT NULL);
IF DB_NAME()<>N'SII-ISSSSPEA-DES' INSERT @F VALUES(N'BASE_NO_DESARROLLO');
IF NULLIF(@ApplicationPrincipal,N'') IS NULL OR DATABASE_PRINCIPAL_ID(@ApplicationPrincipal) IS NULL INSERT @F VALUES(N'APP_PRINCIPAL_INVALIDO');

DECLARE @Objects TABLE(Nombre SYSNAME,Tipo CHAR(2));
INSERT @Objects VALUES
 (N'liquidacion.QnaLegacyProjection',N'U'),(N'liquidacion.QnaLegacyReconciliacion',N'U'),(N'liquidacion.QnaLegacyRepairAudit',N'U'),
 (N'liquidacion.QnaLegacyScopeOwnership',N'U'),(N'liquidacion.QnaLegacyExpectedDomain',N'U'),(N'liquidacion.QnaLegacyExpectedRow',N'U'),
 (N'liquidacion.QnaLegacyCapabilityLease',N'U'),(N'liquidacion.spQnaLegacyCapabilityMarker',N'P'),(N'liquidacion.spQnaLegacyCapabilityProbe',N'P'),
 (N'liquidacion.spConstruirOracleLegacyV5',N'P'),
 (N'liquidacion.spCargarFilasLegacyCanonicasActuales',N'P'),(N'liquidacion.spAsignarProvenanceLegacyV5',N'P'),
 (N'liquidacion.spProyectarLegacyDesdeSnapshotV5Core',N'P'),(N'liquidacion.spProyectarLegacyDesdeSnapshotV5',N'P'),
 (N'liquidacion.spConciliarLegacySnapshotV5',N'P'),(N'liquidacion.spRepararLegacyDesdeSnapshotV5',N'P');
INSERT @F SELECT CONCAT(N'OBJETO_FALTANTE:',Nombre) FROM @Objects WHERE OBJECT_ID(Nombre,Tipo) IS NULL;
IF OBJECT_ID(N'liquidacion.QnaLegacyModuleGate',N'U') IS NOT NULL INSERT @F VALUES(N'GATE_TOKEN_AUN_EXISTE');
IF EXISTS(SELECT 1 FROM sys.sql_modules WHERE definition LIKE N'%CONTEXT_INFO%' AND object_id IN(
 OBJECT_ID(N'liquidacion.spProyectarLegacyDesdeSnapshotV5'),OBJECT_ID(N'liquidacion.spProyectarLegacyDesdeSnapshotV5Core'),OBJECT_ID(N'liquidacion.spRepararLegacyDesdeSnapshotV5'))) INSERT @F VALUES(N'CAPACIDAD_USA_CONTEXT_INFO');

DECLARE @Stores TABLE(Nombre SYSNAME PRIMARY KEY);
INSERT @Stores VALUES
 (N'aportaciones.IndividualesAhorroHistorico'),(N'aportaciones.IndividualesViviendaHistorico'),(N'aportaciones.IndividualesPrestacionesHistorico'),(N'aportaciones.IndividualesCairHistorico'),
 (N'aportaciones.PensionNominaTransitorioHistorico'),(N'aportaciones.GuarderiasHistorico'),(N'aportaciones.AguinaldoHistorico'),
 (N'retenciones.PrestamosCortoPlazoHistorico'),(N'retenciones.PrestamosMedianoPlazoHistorico'),(N'retenciones.PrestamosHipotecariosHistorico'),
 (N'aportaciones.ResumenHistorico'),(N'conciliacion.RevisionAplicacionHistorico');
INSERT @F SELECT CONCAT(N'PROVENANCE_SNAPSHOT_INVALIDA:',Nombre) FROM @Stores
 WHERE NOT EXISTS(SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(Nombre) AND name=N'QnaLiquidacionSnapshotId' AND TYPE_NAME(user_type_id)=N'bigint' AND is_nullable=1);
INSERT @F SELECT CONCAT(N'PROVENANCE_ORDEN_INVALIDA:',Nombre) FROM @Stores
 WHERE NOT EXISTS(SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(Nombre) AND name=N'QnaSourceOrden' AND TYPE_NAME(user_type_id)=N'int' AND is_nullable=1);
INSERT @F SELECT CONCAT(N'PROVENANCE_FK_INVALIDA:',s.Nombre) FROM @Stores s WHERE NOT EXISTS(
 SELECT 1 FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id
 JOIN sys.columns pc ON pc.object_id=fkc.parent_object_id AND pc.column_id=fkc.parent_column_id
 JOIN sys.columns rc ON rc.object_id=fkc.referenced_object_id AND rc.column_id=fkc.referenced_column_id
 WHERE fk.parent_object_id=OBJECT_ID(s.Nombre) AND fk.referenced_object_id=OBJECT_ID(N'liquidacion.QnaSnapshot')
   AND pc.name=N'QnaLiquidacionSnapshotId' AND rc.name=N'LiquidacionSnapshotId' AND fk.is_disabled=0 AND fk.is_not_trusted=0);
INSERT @F SELECT CONCAT(N'PROVENANCE_INDEX_INVALIDO:',s.Nombre) FROM @Stores s WHERE NOT EXISTS(
 SELECT 1 FROM sys.indexes i WHERE i.object_id=OBJECT_ID(s.Nombre) AND i.name=N'IX_'+PARSENAME(s.Nombre,1)+N'_QnaProvenance' AND i.is_disabled=0
   AND (SELECT STRING_AGG(c.name,N'|') WITHIN GROUP(ORDER BY ic.key_ordinal) FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0)=N'QnaLiquidacionSnapshotId|QnaSourceOrden');
INSERT @F SELECT CONCAT(N'CERTIFICADO_SIN_DML_LEGACY:',s.Nombre) FROM @Stores s WHERE EXISTS(
 SELECT permission_name FROM(VALUES(N'SELECT'),(N'INSERT'),(N'UPDATE'),(N'DELETE')) p(permission_name)
 EXCEPT SELECT permission_name FROM sys.database_permissions d WHERE d.major_id=OBJECT_ID(s.Nombre)
   AND d.grantee_principal_id=DATABASE_PRINCIPAL_ID(N'QnaLegacyProjectorCertificateUser') AND d.state=N'G');

DECLARE @ControlPk TABLE(Tabla SYSNAME,Columna SYSNAME);
INSERT @ControlPk VALUES
 (N'liquidacion.QnaLegacyProjection',N'QnaLegacyProjectionId'),(N'liquidacion.QnaLegacyReconciliacion',N'QnaLegacyReconciliacionId'),
 (N'liquidacion.QnaLegacyRepairAudit',N'QnaLegacyRepairAuditId'),(N'liquidacion.QnaLegacyScopeOwnership',N'QnaLegacyScopeOwnershipId'),
 (N'liquidacion.QnaLegacyExpectedDomain',N'QnaLegacyExpectedDomainId'),(N'liquidacion.QnaLegacyExpectedRow',N'QnaLegacyExpectedRowId'),
 (N'liquidacion.QnaLegacyCapabilityLease',N'SessionId');
INSERT @F SELECT CONCAT(N'PK_INVALIDA:',p.Tabla) FROM @ControlPk p WHERE NOT EXISTS(
 SELECT 1 FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
 WHERE i.object_id=OBJECT_ID(p.Tabla) AND i.is_primary_key=1 AND ic.key_ordinal=1 AND c.name=p.Columna
   AND 1=(SELECT COUNT(*) FROM sys.index_columns x WHERE x.object_id=i.object_id AND x.index_id=i.index_id AND x.key_ordinal>0));

DECLARE @ControlFk TABLE(Tabla SYSNAME,Columna SYSNAME,Referencia SYSNAME,ColumnaReferencia SYSNAME);
INSERT @ControlFk VALUES
 (N'liquidacion.QnaLegacyProjection',N'LiquidacionSnapshotId',N'liquidacion.QnaSnapshot',N'LiquidacionSnapshotId'),
 (N'liquidacion.QnaLegacyReconciliacion',N'QnaLegacyProjectionId',N'liquidacion.QnaLegacyProjection',N'QnaLegacyProjectionId'),
 (N'liquidacion.QnaLegacyRepairAudit',N'LiquidacionSnapshotId',N'liquidacion.QnaSnapshot',N'LiquidacionSnapshotId'),
 (N'liquidacion.QnaLegacyScopeOwnership',N'QnaLegacyProjectionId',N'liquidacion.QnaLegacyProjection',N'QnaLegacyProjectionId'),
 (N'liquidacion.QnaLegacyScopeOwnership',N'LiquidacionSnapshotId',N'liquidacion.QnaSnapshot',N'LiquidacionSnapshotId'),
 (N'liquidacion.QnaLegacyExpectedDomain',N'QnaLegacyProjectionId',N'liquidacion.QnaLegacyProjection',N'QnaLegacyProjectionId'),
 (N'liquidacion.QnaLegacyExpectedRow',N'QnaLegacyProjectionId',N'liquidacion.QnaLegacyProjection',N'QnaLegacyProjectionId');
INSERT @F SELECT CONCAT(N'FK_INVALIDA:',f.Tabla,N'.',f.Columna) FROM @ControlFk f WHERE NOT EXISTS(
 SELECT 1 FROM sys.foreign_keys fk JOIN sys.foreign_key_columns x ON x.constraint_object_id=fk.object_id
 JOIN sys.columns pc ON pc.object_id=x.parent_object_id AND pc.column_id=x.parent_column_id
 JOIN sys.columns rc ON rc.object_id=x.referenced_object_id AND rc.column_id=x.referenced_column_id
 WHERE fk.parent_object_id=OBJECT_ID(f.Tabla) AND fk.referenced_object_id=OBJECT_ID(f.Referencia) AND pc.name=f.Columna AND rc.name=f.ColumnaReferencia AND fk.is_disabled=0 AND fk.is_not_trusted=0);

DECLARE @Defaults TABLE(Tabla SYSNAME,Columna SYSNAME,Marcador NVARCHAR(100));
INSERT @Defaults VALUES
 (N'liquidacion.QnaLegacyProjection',N'Estado',N'PENDING'),(N'liquidacion.QnaLegacyProjection',N'FechaCreacion',N'SYSDATETIME'),
 (N'liquidacion.QnaLegacyProjection',N'FechaActualizacion',N'SYSDATETIME'),(N'liquidacion.QnaLegacyReconciliacion',N'NormalizacionVersion',N'LEGACY-PROJECTION-v1'),
 (N'liquidacion.QnaLegacyReconciliacion',N'FechaCreacion',N'SYSDATETIME'),(N'liquidacion.QnaLegacyRepairAudit',N'FechaCreacion',N'SYSDATETIME'),
 (N'liquidacion.QnaLegacyScopeOwnership',N'FechaCreacion',N'SYSDATETIME'),(N'liquidacion.QnaLegacyExpectedDomain',N'FechaCreacion',N'SYSDATETIME'),
 (N'liquidacion.QnaLegacyExpectedRow',N'FechaCreacion',N'SYSDATETIME'),(N'liquidacion.QnaLegacyCapabilityLease',N'FechaCreacion',N'SYSDATETIME');
INSERT @F SELECT CONCAT(N'DEFAULT_INVALIDO:',d.Tabla,N'.',d.Columna) FROM @Defaults d WHERE NOT EXISTS(
 SELECT 1 FROM sys.columns c JOIN sys.default_constraints dc ON dc.parent_object_id=c.object_id AND dc.parent_column_id=c.column_id
 WHERE c.object_id=OBJECT_ID(d.Tabla) AND c.name=d.Columna AND dc.definition LIKE N'%'+d.Marcador+N'%');

DECLARE @Indexes TABLE(Tabla SYSNAME,Nombre SYSNAME,Columnas NVARCHAR(300),Unico BIT);
INSERT @Indexes VALUES
 (N'liquidacion.QnaLegacyProjection',N'UQ_QnaLegacyProjection_Snapshot',N'LiquidacionSnapshotId',1),
 (N'liquidacion.QnaLegacyScopeOwnership',N'UQ_QnaLegacyScopeOwnership_Reduced',N'Organica0|Organica1|Anio|Quincena',1),
 (N'liquidacion.QnaLegacyScopeOwnership',N'UQ_QnaLegacyScopeOwnership_Projection',N'QnaLegacyProjectionId',1),
 (N'liquidacion.QnaLegacyExpectedDomain',N'UQ_QnaLegacyExpectedDomain_ProjectionDominio',N'QnaLegacyProjectionId|Dominio',1),
 (N'liquidacion.QnaLegacyExpectedRow',N'UQ_QnaLegacyExpectedRow_ProjectionDomainOrder',N'QnaLegacyProjectionId|Dominio|SourceOrden',1),
 (N'liquidacion.QnaLegacyReconciliacion',N'IX_QnaLegacyReconciliacion_ProjectionDominio',N'QnaLegacyProjectionId|Dominio|QnaLegacyReconciliacionId',0);
INSERT @F SELECT CONCAT(N'INDEX_INVALIDO:',e.Nombre) FROM @Indexes e WHERE NOT EXISTS(
 SELECT 1 FROM sys.indexes i WHERE i.object_id=OBJECT_ID(e.Tabla) AND i.name=e.Nombre AND i.is_unique=e.Unico AND i.is_disabled=0
  AND (SELECT STRING_AGG(c.name,N'|') WITHIN GROUP(ORDER BY ic.key_ordinal) FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0)=e.Columnas);

DECLARE @ProjectorModules TABLE(Nombre SYSNAME PRIMARY KEY);
INSERT @ProjectorModules VALUES
 (N'liquidacion.spProyectarLegacyDesdeSnapshotV5'),(N'liquidacion.spProyectarLegacyDesdeSnapshotV5Core'),
 (N'liquidacion.spQnaLegacyCapabilityMarker'),(N'liquidacion.spQnaLegacyCapabilityProbe'),
 (N'liquidacion.spConstruirOracleLegacyV5'),(N'liquidacion.spCargarFilasLegacyCanonicasActuales'),
 (N'liquidacion.spAsignarProvenanceLegacyV5'),(N'liquidacion.spConciliarLegacySnapshotV5'),(N'liquidacion.spRepararLegacyDesdeSnapshotV5');
INSERT @F SELECT CONCAT(N'FIRMA_PROJECTOR_FALTANTE:',m.Nombre) FROM @ProjectorModules m WHERE NOT EXISTS(
 SELECT 1 FROM sys.crypt_properties cp JOIN sys.certificates c ON c.thumbprint=cp.thumbprint WHERE cp.major_id=OBJECT_ID(m.Nombre) AND c.name=N'QnaLegacyProjectorCertificate');

DECLARE @GuardTriggers TABLE(Nombre SYSNAME PRIMARY KEY);
INSERT @GuardTriggers VALUES
 (N'liquidacion.TR_QnaLegacyProjection_Inmutable'),(N'liquidacion.TR_QnaLegacyReconciliacion_Inmutable'),(N'liquidacion.TR_QnaLegacyRepairAudit_Inmutable'),
 (N'liquidacion.TR_QnaLegacyScopeOwnership_Inmutable'),(N'liquidacion.TR_QnaLegacyExpectedDomain_Inmutable'),(N'liquidacion.TR_QnaLegacyExpectedRow_Inmutable'),
 (N'aportaciones.TR_IndividualesAhorroHistorico_V5Guard'),(N'aportaciones.TR_IndividualesViviendaHistorico_V5Guard'),
 (N'aportaciones.TR_IndividualesPrestacionesHistorico_V5Guard'),(N'aportaciones.TR_IndividualesCairHistorico_V5Guard'),
 (N'aportaciones.TR_PensionNominaTransitorioHistorico_V5Guard'),(N'aportaciones.TR_GuarderiasHistorico_V5Guard'),
 (N'aportaciones.TR_AguinaldoHistorico_V5Guard'),(N'aportaciones.TR_ResumenHistorico_V5Guard'),
 (N'retenciones.TR_PrestamosCortoPlazoHistorico_V5Guard'),(N'retenciones.TR_PrestamosMedianoPlazoHistorico_V5Guard'),
 (N'retenciones.TR_PrestamosHipotecariosHistorico_V5Guard'),(N'conciliacion.TR_RevisionAplicacionHistorico_V5Guard');
INSERT @F SELECT CONCAT(N'TRIGGER_FALTANTE_O_DESHABILITADO:',g.Nombre) FROM @GuardTriggers g
 WHERE OBJECT_ID(g.Nombre,N'TR') IS NULL OR EXISTS(SELECT 1 FROM sys.triggers WHERE object_id=OBJECT_ID(g.Nombre) AND is_disabled=1);
INSERT @F SELECT CONCAT(N'TRIGGER_CAPACIDAD_INVALIDA:',g.Nombre) FROM @GuardTriggers g
 WHERE OBJECT_DEFINITION(OBJECT_ID(g.Nombre)) NOT LIKE N'%QnaLegacyCapabilityLease%SessionId%@@SPID%';
INSERT @F SELECT CONCAT(N'TRIGGER_BYPASS_POR_ROL:',g.Nombre) FROM @GuardTriggers g
 WHERE OBJECT_DEFINITION(OBJECT_ID(g.Nombre)) LIKE N'%IS_ROLEMEMBER%';
INSERT @F SELECT CONCAT(N'FIRMA_PROJECTOR_EN_TRIGGER:',g.Nombre) FROM @GuardTriggers g WHERE EXISTS(
 SELECT 1 FROM sys.crypt_properties cp JOIN sys.certificates c ON c.thumbprint=cp.thumbprint WHERE cp.major_id=OBJECT_ID(g.Nombre) AND c.name=N'QnaLegacyProjectorCertificate');

DECLARE @ProtectedControls TABLE(Nombre SYSNAME PRIMARY KEY);
INSERT @ProtectedControls VALUES
 (N'liquidacion.QnaLegacyProjection'),(N'liquidacion.QnaLegacyReconciliacion'),(N'liquidacion.QnaLegacyRepairAudit'),
 (N'liquidacion.QnaLegacyScopeOwnership'),(N'liquidacion.QnaLegacyExpectedDomain'),(N'liquidacion.QnaLegacyExpectedRow'),
 (N'liquidacion.QnaLegacyCapabilityLease');
INSERT @F SELECT CONCAT(N'CONTROL_SIN_DENY_PUBLIC:',Nombre) FROM @ProtectedControls c WHERE EXISTS(
 SELECT permission_name FROM(VALUES(N'INSERT'),(N'UPDATE'),(N'DELETE')) p(permission_name)
 EXCEPT SELECT permission_name FROM sys.database_permissions d WHERE d.major_id=OBJECT_ID(c.Nombre)
   AND d.grantee_principal_id=DATABASE_PRINCIPAL_ID(N'public') AND d.state=N'D');
IF NOT EXISTS(SELECT 1 FROM sys.database_permissions WHERE major_id=OBJECT_ID(N'liquidacion.QnaLegacyCapabilityLease')
  AND grantee_principal_id=DATABASE_PRINCIPAL_ID(N'public') AND permission_name=N'SELECT' AND state=N'G') INSERT @F VALUES(N'CAPABILITY_LEASE_SIN_LECTURA_GUARD');

IF DATABASE_PRINCIPAL_ID(N'qna_legacy_projector_executor') IS NULL INSERT @F VALUES(N'ROL_PROJECTOR_FALTANTE');
IF DATABASE_PRINCIPAL_ID(N'qna_legacy_repair_executor') IS NULL INSERT @F VALUES(N'ROL_REPAIR_FALTANTE');
IF NOT EXISTS(SELECT 1 FROM sys.database_permissions WHERE major_id=OBJECT_ID(N'liquidacion.spProyectarLegacyDesdeSnapshotV5') AND grantee_principal_id=DATABASE_PRINCIPAL_ID(N'qna_legacy_projector_executor') AND permission_name=N'EXECUTE' AND state=N'G') INSERT @F VALUES(N'ROL_PROJECTOR_SIN_GRANT');
IF NOT EXISTS(SELECT 1 FROM sys.database_permissions WHERE major_id=OBJECT_ID(N'liquidacion.spRepararLegacyDesdeSnapshotV5') AND grantee_principal_id=DATABASE_PRINCIPAL_ID(N'qna_legacy_repair_executor') AND permission_name=N'EXECUTE' AND state=N'G') INSERT @F VALUES(N'ROL_REPAIR_SIN_GRANT');
IF EXISTS(SELECT 1 FROM sys.database_permissions d WHERE d.grantee_principal_id=DATABASE_PRINCIPAL_ID(N'qna_legacy_projector_executor') AND d.state IN(N'G',N'W')
  AND NOT(d.major_id=OBJECT_ID(N'liquidacion.spProyectarLegacyDesdeSnapshotV5') AND d.permission_name=N'EXECUTE')) INSERT @F VALUES(N'ROL_PROJECTOR_GRANT_FUERA_WRAPPER');
IF EXISTS(SELECT 1 FROM sys.database_permissions d WHERE d.grantee_principal_id=DATABASE_PRINCIPAL_ID(N'qna_legacy_repair_executor') AND d.state IN(N'G',N'W')
  AND NOT(d.major_id=OBJECT_ID(N'liquidacion.spRepararLegacyDesdeSnapshotV5') AND d.permission_name=N'EXECUTE')) INSERT @F VALUES(N'ROL_REPAIR_GRANT_FUERA_WRAPPER');
IF EXISTS(SELECT 1 FROM sys.database_permissions WHERE major_id IN(OBJECT_ID(N'liquidacion.spProyectarLegacyDesdeSnapshotV5'),OBJECT_ID(N'liquidacion.spRepararLegacyDesdeSnapshotV5')) AND grantee_principal_id=DATABASE_PRINCIPAL_ID(N'public') AND permission_name=N'EXECUTE' AND state IN(N'G',N'W')) INSERT @F VALUES(N'PUBLIC_CON_EXECUTE');
IF NOT EXISTS(SELECT 1 FROM sys.database_permissions WHERE major_id=OBJECT_ID(N'liquidacion.spQnaLegacyCapabilityMarker') AND grantee_principal_id=DATABASE_PRINCIPAL_ID(N'QnaLegacyProjectorCertificateUser') AND permission_name=N'CONTROL' AND state=N'G') INSERT @F VALUES(N'CERTIFICADO_SIN_CONTROL_MARKER');

IF IS_ROLEMEMBER(N'db_datawriter',N'QnaPhase8VerifierLeastPrivilege')=1 ALTER ROLE db_datawriter DROP MEMBER QnaPhase8VerifierLeastPrivilege;
IF IS_ROLEMEMBER(N'qna_legacy_projector_executor',N'QnaPhase8VerifierLeastPrivilege')=1 ALTER ROLE qna_legacy_projector_executor DROP MEMBER QnaPhase8VerifierLeastPrivilege;
IF DATABASE_PRINCIPAL_ID(N'QnaPhase8VerifierLeastPrivilege') IS NOT NULL DROP USER QnaPhase8VerifierLeastPrivilege;
CREATE USER QnaPhase8VerifierLeastPrivilege WITHOUT LOGIN;
ALTER ROLE qna_legacy_projector_executor ADD MEMBER QnaPhase8VerifierLeastPrivilege;
ALTER ROLE db_datawriter ADD MEMBER QnaPhase8VerifierLeastPrivilege;
GRANT EXECUTE ON OBJECT::liquidacion.spQnaLegacyCapabilityProbe TO QnaPhase8VerifierLeastPrivilege;
CREATE TABLE #CapabilityProbe(CapabilityGranted BIT);
CREATE TABLE #DirectCapabilityProbe(Denied BIT);
BEGIN TRY
  EXECUTE AS USER=N'QnaPhase8VerifierLeastPrivilege';
  INSERT #CapabilityProbe EXEC liquidacion.spQnaLegacyCapabilityProbe;
  BEGIN TRY
    INSERT liquidacion.QnaLegacyCapabilityLease(SessionId) VALUES(32767);
    INSERT #DirectCapabilityProbe VALUES(0);
  END TRY BEGIN CATCH
    INSERT #DirectCapabilityProbe VALUES(IIF(ERROR_NUMBER()=229,1,0));
  END CATCH;
  REVERT;
END TRY
BEGIN CATCH
  IF USER_NAME()=N'QnaPhase8VerifierLeastPrivilege' REVERT;
  INSERT @F VALUES(CONCAT(N'CAPABILITY_SYNTHETIC_PROBE_ERROR:',ERROR_MESSAGE()));
END CATCH;
REVOKE EXECUTE ON OBJECT::liquidacion.spQnaLegacyCapabilityProbe FROM QnaPhase8VerifierLeastPrivilege;
ALTER ROLE db_datawriter DROP MEMBER QnaPhase8VerifierLeastPrivilege;
ALTER ROLE qna_legacy_projector_executor DROP MEMBER QnaPhase8VerifierLeastPrivilege;
DROP USER QnaPhase8VerifierLeastPrivilege;
IF NOT EXISTS(SELECT 1 FROM #CapabilityProbe WHERE CapabilityGranted=1) INSERT @F VALUES(N'CAPABILITY_FIRMADA_NO_FUNCIONA');
IF NOT EXISTS(SELECT 1 FROM #DirectCapabilityProbe WHERE Denied=1) INSERT @F VALUES(N'ROL_DB_DATAWRITER_PUEDE_CREAR_CAPACIDAD');
IF EXISTS(SELECT 1 FROM liquidacion.QnaLegacyCapabilityLease) INSERT @F VALUES(N'CAPABILITY_LEASE_RESIDUAL');

DECLARE @OwnerException BIT=IIF(@ApplicationPrincipal=N'dbo' OR IS_ROLEMEMBER(N'db_owner',@ApplicationPrincipal)=1,1,0);
IF @OwnerException=0 AND IS_ROLEMEMBER(N'qna_legacy_projector_executor',@ApplicationPrincipal)<>1 INSERT @F VALUES(N'APP_SIN_ROL_PROJECTOR');
IF @OwnerException=0
BEGIN
  CREATE TABLE #AppPermissions(ControlMarker INT,ExecuteProjector INT,ExecuteRepair INT);
  DECLARE @PermissionSql NVARCHAR(MAX)=N'EXECUTE AS USER='+QUOTENAME(@ApplicationPrincipal,N'''')+N'; INSERT #AppPermissions SELECT HAS_PERMS_BY_NAME(N''liquidacion.spQnaLegacyCapabilityMarker'',N''OBJECT'',N''CONTROL''),HAS_PERMS_BY_NAME(N''liquidacion.spProyectarLegacyDesdeSnapshotV5'',N''OBJECT'',N''EXECUTE''),HAS_PERMS_BY_NAME(N''liquidacion.spRepararLegacyDesdeSnapshotV5'',N''OBJECT'',N''EXECUTE''); REVERT;';
  BEGIN TRY EXEC sys.sp_executesql @PermissionSql; END TRY BEGIN CATCH INSERT @F VALUES(CONCAT(N'APP_PERMISSION_PROBE_ERROR:',ERROR_MESSAGE())); END CATCH;
  IF EXISTS(SELECT 1 FROM #AppPermissions WHERE ControlMarker<>0 OR ExecuteProjector<>1 OR ExecuteRepair<>0) INSERT @F VALUES(N'APP_PERMISOS_EFECTIVOS_INVALIDOS');
END;

IF OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.spConstruirOracleLegacyV5')) LIKE N'%IF EXISTS%QnaLegacyExpectedDomain%RETURN%' INSERT @F VALUES(N'ORACLE_RETORNO_PARCIAL_INSEGURO');
IF OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.spConstruirOracleLegacyV5')) NOT LIKE N'%LEGACY-PROJECTION-v1%' INSERT @F VALUES(N'ORACLE_SIN_POLITICA_NOMBRADA');
IF OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.spConciliarLegacySnapshotV5')) LIKE N'%ORDER BY id%'
 OR OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.spConciliarLegacySnapshotV5')) LIKE N'%ORDER BY [id]%'
 OR OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.spConciliarLegacySnapshotV5')) LIKE N'%ORDER BY PhysicalId%'
 INSERT @F VALUES(N'CONCILIACION_USA_ORDEN_FISICO');
IF OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.spConciliarLegacySnapshotV5')) NOT LIKE N'%spCargarFilasLegacyCanonicasActuales%' INSERT @F VALUES(N'CONCILIACION_SIN_ORDEN_CANONICO');
IF OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.spProyectarLegacyDesdeSnapshotV5Core')) NOT LIKE N'%QNA_LEGACY_PAYLOAD_CONVERSION_INVALIDA%' INSERT @F VALUES(N'PROYECTOR_SIN_VALIDACION_CONVERSION');

INSERT @F SELECT CONCAT(N'ORACLE_INCOMPLETO:',p.QnaLegacyProjectionId) FROM liquidacion.QnaLegacyProjection p
 WHERE p.Estado IN('COMPLETE','WARNING') AND 12<>(SELECT COUNT(*) FROM liquidacion.QnaLegacyExpectedDomain e WHERE e.QnaLegacyProjectionId=p.QnaLegacyProjectionId);
INSERT @F SELECT CONCAT(N'ORACLE_HASH_NULO:',e.QnaLegacyExpectedDomainId) FROM liquidacion.QnaLegacyExpectedDomain e WHERE e.HashEsperado IS NULL OR LEN(e.HashEsperado)<>64;
INSERT @F SELECT CONCAT(N'ORACLE_FILAS_INCOMPLETAS:',p.QnaLegacyProjectionId) FROM liquidacion.QnaLegacyProjection p
 WHERE p.Estado IN('COMPLETE','WARNING')
   AND (SELECT COALESCE(SUM(e.Registros),0) FROM liquidacion.QnaLegacyExpectedDomain e WHERE e.QnaLegacyProjectionId=p.QnaLegacyProjectionId)
     <>(SELECT COUNT(*) FROM liquidacion.QnaLegacyExpectedRow r WHERE r.QnaLegacyProjectionId=p.QnaLegacyProjectionId);
INSERT @F SELECT CONCAT(N'OWNERSHIP_INCONSISTENTE:',o.QnaLegacyScopeOwnershipId) FROM liquidacion.QnaLegacyScopeOwnership o
 JOIN liquidacion.QnaLegacyProjection p ON p.QnaLegacyProjectionId=o.QnaLegacyProjectionId
 WHERE p.LiquidacionSnapshotId<>o.LiquidacionSnapshotId;

IF EXISTS(SELECT 1 FROM @F)
BEGIN
  SELECT Falla FROM @F ORDER BY Falla;
  DECLARE @FailureMessage NVARCHAR(2048)=(SELECT STRING_AGG(CONVERT(NVARCHAR(MAX),Falla),N' | ') FROM @F);
  THROW 51753,@FailureMessage,1;
END;

SELECT 'QNA_PHASE8_LEGACY_DUAL_WRITE_SCHEMA_OK' Resultado,DB_NAME() BaseDatos,12 Dominios,
 'QNA-LEGACY-DUAL-WRITE-V1' Politica,'LEGACY-PROJECTION-v1' Normalizacion,
 @ApplicationPrincipal ApplicationPrincipal,IIF(@OwnerException=1,'DB_OWNER_EXCEPTION','ROLE_MEMBER') ApplicationEnrollment,
 CONVERT(BIT,IIF(@OwnerException=1,0,1)) SqlIsolationEnforceable,
 IIF(@OwnerException=1,'DB_OWNER_EXCEPTION_SQL_ISOLATION_NOT_ENFORCEABLE','NONE') DeploymentRisk;
GO
