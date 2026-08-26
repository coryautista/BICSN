/* Verificacion read-only exhaustiva de la proyeccion V3 desde snapshot V5. */
SET NOCOUNT ON;
DECLARE @F TABLE(Objeto NVARCHAR(500) NOT NULL);

DECLARE @C TABLE(Tabla SYSNAME,Columna SYSNAME,Tipo SYSNAME,Longitud SMALLINT,Precision TINYINT,Escala TINYINT,Nullable BIT);
INSERT @C VALUES
 (N'retenciones.RetencionHistoricoLoteV3',N'RetencionHistoricoLoteV3Id',N'bigint',8,19,0,0),(N'retenciones.RetencionHistoricoLoteV3',N'LiquidacionSnapshotId',N'bigint',8,19,0,0),
 (N'retenciones.RetencionHistoricoLoteV3',N'Dominio',N'varchar',3,0,0,0),(N'retenciones.RetencionHistoricoLoteV3',N'EstadoFuente',N'varchar',20,0,0,0),
 (N'retenciones.RetencionHistoricoLoteV3',N'Registros',N'int',4,10,0,0),(N'retenciones.RetencionHistoricoLoteV3',N'HashFuente',N'char',64,0,0,1),
 (N'retenciones.RetencionHistoricoLoteV3',N'TotalA2',N'decimal',9,19,2,0),(N'retenciones.RetencionHistoricoLoteV3',N'SourceScale',N'tinyint',1,3,0,0),
 (N'retenciones.RetencionHistoricoLoteV3',N'IdentificadorFuente',N'nvarchar',600,0,0,0),(N'retenciones.RetencionHistoricoLoteV3',N'UsuarioId',N'nvarchar',200,0,0,0),
 (N'retenciones.RetencionHistoricoLoteV3',N'FechaCreacion',N'datetime2',7,23,3,0);
DECLARE @T TABLE(Tabla SYSNAME,Prefijo VARCHAR(3));
INSERT @T VALUES(N'retenciones.RetencionPCPHistoricoV3','PCP'),(N'retenciones.RetencionPMPHistoricoV3','PMP'),(N'retenciones.RetencionHIPHistoricoV3','HIP');
INSERT @C SELECT t.Tabla,v.Columna,v.Tipo,v.Longitud,v.Precision,v.Escala,v.Nullable FROM @T t CROSS JOIN(VALUES
 (N'RetencionHistoricoLoteV3Id',N'bigint',CAST(8 AS SMALLINT),CAST(19 AS TINYINT),CAST(0 AS TINYINT),CAST(1 AS BIT)),
 (N'Interno',N'int',4,10,0,1),(N'Nombre',N'nvarchar',510,0,0,1),(N'ClaveFilaHash',N'char',64,0,0,1),(N'HashFila',N'char',64,0,0,1),
 (N'PayloadCanonico',N'nvarchar',-1,0,0,1),(N'PayloadVersion',N'smallint',2,5,0,1),(N'IdentificadorFuente',N'nvarchar',600,0,0,1),
 (N'QnaSnapshotDetalleId',N'bigint',8,19,0,1),(N'EsHuerfano',N'bit',1,1,0,1)
)v(Columna,Tipo,Longitud,Precision,Escala,Nullable);
INSERT @C VALUES
 (N'retenciones.RetencionPCPHistoricoV3',N'Prestamo',N'int',4,10,0,1),(N'retenciones.RetencionPCPHistoricoV3',N'CapitalD6',N'decimal',9,19,6,1),
 (N'retenciones.RetencionPCPHistoricoV3',N'InteresD6',N'decimal',9,19,6,1),(N'retenciones.RetencionPCPHistoricoV3',N'MontoD6',N'decimal',9,19,6,1),
 (N'retenciones.RetencionPCPHistoricoV3',N'MoratoriosD6',N'decimal',9,19,6,1),(N'retenciones.RetencionPCPHistoricoV3',N'TotalD6',N'decimal',9,19,6,0),
 (N'retenciones.RetencionPMPHistoricoV3',N'Prestamo',N'int',4,10,0,1),(N'retenciones.RetencionPMPHistoricoV3',N'CapitalD6',N'decimal',9,19,6,1),
 (N'retenciones.RetencionPMPHistoricoV3',N'InteresD6',N'decimal',9,19,6,1),(N'retenciones.RetencionPMPHistoricoV3',N'MoratoriosD6',N'decimal',9,19,6,1),
 (N'retenciones.RetencionPMPHistoricoV3',N'SeguroD6',N'decimal',9,19,6,1),(N'retenciones.RetencionPMPHistoricoV3',N'TotalD6',N'decimal',9,19,6,0),
 (N'retenciones.RetencionHIPHistoricoV3',N'Solicitud',N'int',4,10,0,1),(N'retenciones.RetencionHIPHistoricoV3',N'DescuentoD6',N'decimal',9,19,6,1),
 (N'retenciones.RetencionHIPHistoricoV3',N'CapitalD6',N'decimal',9,19,6,1),(N'retenciones.RetencionHIPHistoricoV3',N'InteresD6',N'decimal',9,19,6,1),
 (N'retenciones.RetencionHIPHistoricoV3',N'InteresDiferidoD6',N'decimal',9,19,6,1),(N'retenciones.RetencionHIPHistoricoV3',N'SeguroD6',N'decimal',9,19,6,1),
 (N'retenciones.RetencionHIPHistoricoV3',N'MoratorioD6',N'decimal',9,19,6,1),(N'retenciones.RetencionHIPHistoricoV3',N'CantidadD6',N'decimal',9,19,6,0),
 (N'retenciones.RetencionHIPHistoricoV3',N'TotalD6',N'decimal',9,19,6,0);
INSERT @F SELECT CONCAT(N'COLUMNA ',e.Tabla,N'.',e.Columna,N' firma incompatible') FROM @C e
LEFT JOIN sys.columns c ON c.object_id=OBJECT_ID(e.Tabla) AND c.name=e.Columna LEFT JOIN sys.types ty ON ty.user_type_id=c.user_type_id
WHERE c.column_id IS NULL OR ty.name<>e.Tipo OR c.max_length<>e.Longitud OR c.precision<>e.Precision OR c.scale<>e.Escala OR c.is_nullable<>e.Nullable;

IF COLUMNPROPERTY(OBJECT_ID(N'retenciones.RetencionHistoricoLoteV3'),N'RetencionHistoricoLoteV3Id','IsIdentity')<>1 INSERT @F VALUES(N'IDENTITY lote');
DECLARE @PK TABLE(Tabla SYSNAME,Nombre SYSNAME,Claves NVARCHAR(200));
INSERT @PK VALUES
 (N'retenciones.RetencionHistoricoLoteV3',N'PK_RetencionHistoricoLoteV3',N'RetencionHistoricoLoteV3Id'),
 (N'retenciones.RetencionPCPHistoricoV3',N'PK_RetencionPCPHistoricoV3',N'RetencionPCPHistoricoV3Id'),
 (N'retenciones.RetencionPMPHistoricoV3',N'PK_RetencionPMPHistoricoV3',N'RetencionPMPHistoricoV3Id'),
 (N'retenciones.RetencionHIPHistoricoV3',N'PK_RetencionHIPHistoricoV3',N'RetencionHIPHistoricoV3Id');
INSERT @F SELECT N'PK '+e.Nombre FROM @PK e WHERE NOT EXISTS(SELECT 1 FROM sys.key_constraints k JOIN sys.indexes i ON i.object_id=k.parent_object_id AND i.index_id=k.unique_index_id
 WHERE k.parent_object_id=OBJECT_ID(e.Tabla) AND k.name=e.Nombre AND k.type='PK' AND
 (SELECT STRING_AGG(CONVERT(NVARCHAR(MAX),c.name),N'|') WITHIN GROUP(ORDER BY ic.key_ordinal) FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0)=e.Claves);
IF NOT EXISTS(SELECT 1 FROM sys.default_constraints d JOIN sys.columns c ON c.object_id=d.parent_object_id AND c.column_id=d.parent_column_id WHERE d.parent_object_id=OBJECT_ID(N'retenciones.RetencionHistoricoLoteV3') AND c.name=N'FechaCreacion' AND OBJECT_DEFINITION(d.object_id) LIKE N'%sysdatetime%') INSERT @F VALUES(N'DEFAULT FechaCreacion');

DECLARE @Checks TABLE(Tabla SYSNAME,Nombre SYSNAME,Marcador NVARCHAR(100));
INSERT @Checks VALUES
 (N'retenciones.RetencionHistoricoLoteV3',N'CK_RetencionHistoricoLoteV3_Contrato',N'NOT_APPLICABLE'),
 (N'retenciones.RetencionPCPHistoricoV3',N'CK_RetencionPCPHistoricoV3_LegacyNoNulo',N'Prestamo'),
 (N'retenciones.RetencionPMPHistoricoV3',N'CK_RetencionPMPHistoricoV3_LegacyNoNulo',N'SeguroD6'),
 (N'retenciones.RetencionHIPHistoricoV3',N'CK_RetencionHIPHistoricoV3_LegacyNoNulo',N'InteresDiferidoD6'),
 (N'retenciones.RetencionPCPHistoricoV3',N'CK_RetencionPCPHistoricoV3_CompletoV5',N'EsHuerfano'),
 (N'retenciones.RetencionPMPHistoricoV3',N'CK_RetencionPMPHistoricoV3_CompletoV5',N'EsHuerfano'),
 (N'retenciones.RetencionHIPHistoricoV3',N'CK_RetencionHIPHistoricoV3_CompletoV5',N'EsHuerfano');
INSERT @F SELECT N'CHECK '+x.Nombre FROM @Checks x LEFT JOIN sys.check_constraints c ON c.parent_object_id=OBJECT_ID(x.Tabla) AND c.name=x.Nombre
WHERE c.object_id IS NULL OR c.is_disabled=1 OR c.is_not_trusted=1 OR OBJECT_DEFINITION(c.object_id) NOT LIKE N'%'+x.Marcador+N'%';

DECLARE @FK TABLE(Tabla SYSNAME,Nombre SYSNAME,Columna SYSNAME,Referida SYSNAME,ColumnaReferida SYSNAME);
INSERT @FK VALUES
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
INSERT @F SELECT N'FK '+x.Nombre FROM @FK x WHERE NOT EXISTS(SELECT 1 FROM sys.foreign_keys f JOIN sys.foreign_key_columns fc ON fc.constraint_object_id=f.object_id
 WHERE f.parent_object_id=OBJECT_ID(x.Tabla) AND f.name=x.Nombre AND f.referenced_object_id=OBJECT_ID(x.Referida) AND f.is_disabled=0 AND f.is_not_trusted=0
 AND COL_NAME(fc.parent_object_id,fc.parent_column_id)=x.Columna AND COL_NAME(fc.referenced_object_id,fc.referenced_column_id)=x.ColumnaReferida
 AND (SELECT COUNT(*) FROM sys.foreign_key_columns z WHERE z.constraint_object_id=f.object_id)=1);

DECLARE @UI TABLE(Tabla SYSNAME,Nombre SYSNAME,Claves NVARCHAR(200));
INSERT @UI VALUES
 (N'retenciones.RetencionHistoricoLoteV3',N'UQ_RetencionHistoricoLoteV3_SnapshotDominio',N'LiquidacionSnapshotId|Dominio'),
 (N'retenciones.RetencionPCPHistoricoV3',N'UQ_RetencionPCPHistoricoV3_Orden',N'LiquidacionSnapshotId|Orden'),
 (N'retenciones.RetencionPMPHistoricoV3',N'UQ_RetencionPMPHistoricoV3_Orden',N'LiquidacionSnapshotId|Orden'),
 (N'retenciones.RetencionHIPHistoricoV3',N'UQ_RetencionHIPHistoricoV3_Orden',N'LiquidacionSnapshotId|Orden');
INSERT @F SELECT N'INDICE UNICO '+e.Nombre FROM @UI e WHERE NOT EXISTS(SELECT 1 FROM sys.indexes i WHERE i.object_id=OBJECT_ID(e.Tabla) AND i.name=e.Nombre AND i.is_unique=1 AND i.is_disabled=0 AND
 (SELECT STRING_AGG(CONVERT(NVARCHAR(MAX),c.name),N'|') WITHIN GROUP(ORDER BY ic.key_ordinal) FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0)=e.Claves);
INSERT @F SELECT N'INDICE no unico ClaveFilaHash '+t.Prefijo FROM @T t LEFT JOIN sys.indexes i ON i.object_id=OBJECT_ID(t.Tabla) AND i.name=N'IX_Retencion'+t.Prefijo+N'HistoricoV3_ClaveFilaHash'
WHERE i.index_id IS NULL OR i.is_unique=1 OR i.is_disabled=1 OR i.has_filter<>1 OR i.filter_definition NOT LIKE N'%ClaveFilaHash%IS NOT NULL%';
INSERT @F SELECT N'CLAVES indice ClaveFilaHash '+t.Prefijo FROM @T t WHERE
 (SELECT STRING_AGG(CONVERT(NVARCHAR(MAX),c.name),N'|') WITHIN GROUP(ORDER BY ic.key_ordinal) FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0 JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE i.object_id=OBJECT_ID(t.Tabla) AND i.name=N'IX_Retencion'+t.Prefijo+N'HistoricoV3_ClaveFilaHash')<>N'LiquidacionSnapshotId|ClaveFilaHash';

DECLARE @Triggers TABLE(Tabla SYSNAME,Nombre SYSNAME,Marcador NVARCHAR(100));
INSERT @Triggers VALUES
 (N'retenciones.RetencionHistoricoLoteV3',N'TR_RetencionHistoricoLoteV3_Inmutable',N'UPDATE,DELETE'),
 (N'retenciones.RetencionPCPHistoricoV3',N'TR_RetencionPCPHistoricoV3_Inmutable',N'APPEND_ONLY'),(N'retenciones.RetencionPMPHistoricoV3',N'TR_RetencionPMPHistoricoV3_Inmutable',N'APPEND_ONLY'),(N'retenciones.RetencionHIPHistoricoV3',N'TR_RetencionHIPHistoricoV3_Inmutable',N'APPEND_ONLY'),
 (N'retenciones.RetencionPCPHistoricoV3',N'TR_RetencionPCPHistoricoV3_GuardarV5',N'REQUIERE_PROYECTOR'),(N'retenciones.RetencionPMPHistoricoV3',N'TR_RetencionPMPHistoricoV3_GuardarV5',N'REQUIERE_PROYECTOR'),(N'retenciones.RetencionHIPHistoricoV3',N'TR_RetencionHIPHistoricoV3_GuardarV5',N'REQUIERE_PROYECTOR');
INSERT @F SELECT N'TRIGGER '+x.Nombre FROM @Triggers x LEFT JOIN sys.triggers t ON t.parent_id=OBJECT_ID(x.Tabla) AND t.name=x.Nombre
WHERE t.object_id IS NULL OR t.is_disabled=1 OR OBJECT_DEFINITION(t.object_id) NOT LIKE N'%'+x.Marcador+N'%';

IF OBJECT_ID(N'retenciones.spProyectarRetencionesV3DesdeSnapshotV5',N'P') IS NULL INSERT @F VALUES(N'PROCEDURE proyector');
IF (SELECT COUNT(*) FROM sys.parameters WHERE object_id=OBJECT_ID(N'retenciones.spProyectarRetencionesV3DesdeSnapshotV5') AND parameter_id>0)<>2 INSERT @F VALUES(N'PARAMETROS proyector conteo');
IF NOT EXISTS(SELECT 1 FROM sys.parameters p JOIN sys.types t ON t.user_type_id=p.user_type_id WHERE p.object_id=OBJECT_ID(N'retenciones.spProyectarRetencionesV3DesdeSnapshotV5') AND p.name=N'@LiquidacionSnapshotId' AND t.name=N'bigint' AND p.max_length=8) INSERT @F VALUES(N'PARAMETRO LiquidacionSnapshotId');
IF NOT EXISTS(SELECT 1 FROM sys.parameters p JOIN sys.types t ON t.user_type_id=p.user_type_id WHERE p.object_id=OBJECT_ID(N'retenciones.spProyectarRetencionesV3DesdeSnapshotV5') AND p.name=N'@UsuarioId' AND t.name=N'nvarchar' AND p.max_length=200) INSERT @F VALUES(N'PARAMETRO UsuarioId');
DECLARE @Def NVARCHAR(MAX)=OBJECT_DEFINITION(OBJECT_ID(N'retenciones.spProyectarRetencionesV3DesdeSnapshotV5',N'P'));
IF @Def NOT LIKE N'%SAVE TRANSACTION RetencionV3Proyector%' OR @Def NOT LIKE N'%BEGIN CATCH%' OR @Def NOT LIKE N'%ROLLBACK TRANSACTION RetencionV3Proyector%'
 OR @Def NOT LIKE N'%OPENJSON%' OR @Def NOT LIKE N'%TRY_CONVERT(DECIMAL(19,6)%' OR @Def NOT LIKE N'%EXCEPT%' OR @Def NOT LIKE N'%AP_S_PCP%' OR @Def NOT LIKE N'%AP_S_VIV%'
 OR @Def NOT LIKE N'%TRY_CONVERT(INT,j.value)%' OR @Def NOT LIKE N'%TRY_CONVERT(SMALLINT,j.value)%' OR @Def NOT LIKE N'%RETENCION_V3_ENTERO_INT_DESTINO_INVALIDO%'
 OR @Def NOT LIKE N'%RETENCION_V3_ENTERO_SMALLINT_DESTINO_INVALIDO%' OR @Def NOT LIKE N'%''PCP'',''plazo''%' OR @Def NOT LIKE N'%''PMP'',''folio''%' OR CHARINDEX(N'j.[key]=''pano''',@Def)=0
 OR @Def NOT LIKE N'%PayloadVersion%' OR @Def NOT LIKE N'%QnaSnapshotDetalleId%' OR @Def NOT LIKE N'%EsHuerfano%' OR @Def NOT LIKE N'%RETENCION_V3_FAIL_AFTER_LOTES%' INSERT @F VALUES(N'DEFINICION sustantiva proyector');

DECLARE @LegacyProcedures TABLE(Nombre SYSNAME,Marcador NVARCHAR(100));
INSERT @LegacyProcedures VALUES(N'spGuardarRetencionPCPHistorico_V3',N'RETENCION_PCP_V5_REQUIERE_PROYECTOR'),(N'spGuardarRetencionPMPHistorico_V3',N'RETENCION_PMP_V5_REQUIERE_PROYECTOR'),(N'spGuardarRetencionHIPHistorico_V3',N'RETENCION_HIP_V5_REQUIERE_PROYECTOR');
INSERT @F SELECT N'GUARD LEGACY '+p.Nombre FROM @LegacyProcedures p CROSS APPLY(SELECT OBJECT_DEFINITION(OBJECT_ID(N'retenciones.'+p.Nombre,N'P')) Def)v
WHERE v.Def IS NULL OR v.Def NOT LIKE N'%VersionEsquema%>=%5%' OR v.Def NOT LIKE N'%'+p.Marcador+N'%'
 OR CHARINDEX(N'VersionEsquema',v.Def)=0 OR CHARINDEX(N'RETURN',v.Def)=0 OR CHARINDEX(N'VersionEsquema',v.Def)>CHARINDEX(N'RETURN',v.Def);

IF EXISTS(SELECT 1 FROM retenciones.RetencionHistoricoLoteV3 l JOIN liquidacion.QnaSnapshotFuente f ON f.LiquidacionSnapshotId=l.LiquidacionSnapshotId AND f.Dominio=l.Dominio JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=l.LiquidacionSnapshotId
 WHERE l.EstadoFuente<>f.Estado OR l.Registros<>f.Registros OR ISNULL(l.HashFuente,'')<>ISNULL(f.HashFuente,'') OR l.SourceScale<>f.SourceScale OR l.IdentificadorFuente<>f.IdentificadorFuente
 OR l.TotalA2<>CASE l.Dominio WHEN 'PCP' THEN t.RetencionPCPA2 WHEN 'PMP' THEN t.RetencionPMPA2 ELSE t.RetencionHIPA2 END) INSERT @F VALUES(N'LOTES V5 inconsistentes');
IF EXISTS(SELECT 1 FROM retenciones.RetencionHistoricoLoteV3 l WHERE l.Registros<>CASE l.Dominio WHEN 'PCP' THEN(SELECT COUNT(*) FROM retenciones.RetencionPCPHistoricoV3 r WHERE r.RetencionHistoricoLoteV3Id=l.RetencionHistoricoLoteV3Id) WHEN 'PMP' THEN(SELECT COUNT(*) FROM retenciones.RetencionPMPHistoricoV3 r WHERE r.RetencionHistoricoLoteV3Id=l.RetencionHistoricoLoteV3Id) ELSE(SELECT COUNT(*) FROM retenciones.RetencionHIPHistoricoV3 r WHERE r.RetencionHistoricoLoteV3Id=l.RetencionHistoricoLoteV3Id) END) INSERT @F VALUES(N'CONTEOS lotes V5 inconsistentes');
IF EXISTS(SELECT 1 FROM retenciones.RetencionPCPHistoricoV3 WHERE RetencionHistoricoLoteV3Id IS NOT NULL AND (PayloadVersion<>1 OR SourceScale<>2 OR (EsHuerfano=1 AND QnaSnapshotDetalleId IS NOT NULL) OR (EsHuerfano=0 AND QnaSnapshotDetalleId IS NULL))) INSERT @F VALUES(N'FILAS PCP V5 inconsistentes');
IF EXISTS(SELECT 1 FROM retenciones.RetencionPMPHistoricoV3 WHERE RetencionHistoricoLoteV3Id IS NOT NULL AND (PayloadVersion<>1 OR SourceScale<>2 OR (EsHuerfano=1 AND QnaSnapshotDetalleId IS NOT NULL) OR (EsHuerfano=0 AND QnaSnapshotDetalleId IS NULL))) INSERT @F VALUES(N'FILAS PMP V5 inconsistentes');
IF EXISTS(SELECT 1 FROM retenciones.RetencionHIPHistoricoV3 WHERE RetencionHistoricoLoteV3Id IS NOT NULL AND (PayloadVersion<>1 OR SourceScale<>2 OR CantidadD6<>TotalD6 OR (EsHuerfano=1 AND QnaSnapshotDetalleId IS NOT NULL) OR (EsHuerfano=0 AND QnaSnapshotDetalleId IS NULL))) INSERT @F VALUES(N'FILAS HIP V5 inconsistentes');

IF EXISTS(SELECT 1 FROM @F)
BEGIN
 SELECT Objeto AS Faltante FROM @F ORDER BY Objeto;
 DECLARE @M NVARCHAR(2048); SELECT @M=LEFT(STRING_AGG(CONVERT(NVARCHAR(MAX),Objeto),N' | '),2048) FROM @F; THROW 51720,@M,1;
END;
SELECT DB_NAME() BaseDatos,(SELECT COUNT_BIG(*) FROM retenciones.RetencionHistoricoLoteV3)Lotes,
 (SELECT COUNT_BIG(*) FROM retenciones.RetencionPCPHistoricoV3 WHERE RetencionHistoricoLoteV3Id IS NOT NULL)PCPV5,
 (SELECT COUNT_BIG(*) FROM retenciones.RetencionPMPHistoricoV3 WHERE RetencionHistoricoLoteV3Id IS NOT NULL)PMPV5,
 (SELECT COUNT_BIG(*) FROM retenciones.RetencionHIPHistoricoV3 WHERE RetencionHistoricoLoteV3Id IS NOT NULL)HIPV5,
 'RETENCIONES_V3_PROJECTION_SCHEMA_OK' Resultado;
GO
