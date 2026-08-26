/* Verificacion read-only de proyecciones V5 del Snapshot QNA oficial. */
SET NOCOUNT ON;

DECLARE @Faltantes TABLE (Objeto NVARCHAR(400) NOT NULL);
DECLARE @ColumnasEsperadas TABLE (
  Tabla SYSNAME NOT NULL,
  Columna SYSNAME NOT NULL,
  Tipo SYSNAME NOT NULL,
  Longitud SMALLINT NOT NULL,
  Precision TINYINT NOT NULL,
  Escala TINYINT NOT NULL,
  Nullable BIT NOT NULL
);

INSERT @ColumnasEsperadas VALUES
  (N'liquidacion.QnaSnapshotDetalle',N'SnapshotCalculoV2DetalleId',N'bigint',8,19,0,1),
  (N'liquidacion.QnaSnapshotDetalle',N'EmpleadoClaveHash',N'char',64,0,0,1),
  (N'liquidacion.QnaSnapshotDetalle',N'Interno',N'int',4,10,0,1),
  (N'liquidacion.QnaSnapshotDetalle',N'Nombre',N'nvarchar',510,0,0,1),
  (N'liquidacion.QnaSnapshotDetalle',N'DiasLaborados',N'decimal',5,5,2,1),
  (N'liquidacion.QnaSnapshotDetalle',N'DiasOrigen',N'varchar',40,0,0,1),
  (N'liquidacion.QnaSnapshotDetalle',N'SueldoMensualD6',N'decimal',9,19,6,1),
  (N'liquidacion.QnaSnapshotDetalle',N'BaseCotizacionSueldoD6',N'decimal',9,19,6,1),
  (N'liquidacion.QnaSnapshotDetalle',N'QuinqueniosMensualD6',N'decimal',9,19,6,1),
  (N'liquidacion.QnaSnapshotDetalle',N'BaseCotizacionQuinqueniosD6',N'decimal',9,19,6,1),
  (N'liquidacion.QnaSnapshotDetalle',N'CAIRFondoD6',N'decimal',9,19,6,1),
  (N'liquidacion.QnaSnapshotDetalle',N'PrestacionesD6',N'decimal',9,19,6,1),
  (N'liquidacion.QnaSnapshotDetalle',N'ViviendaD6',N'decimal',9,19,6,1),
  (N'liquidacion.QnaSnapshotDetalle',N'GuarderiasD6',N'decimal',9,19,6,1),
  (N'liquidacion.QnaSnapshotDetalle',N'TransitorioD6',N'decimal',9,19,6,1),
  (N'liquidacion.QnaSnapshotDetalle',N'AguinaldoD6',N'decimal',9,19,6,1),
  (N'liquidacion.QnaSnapshotDetalle',N'HashFila',N'char',64,0,0,1),
  (N'liquidacion.QnaSnapshotFuenteDetalle',N'EmpleadoClave',N'nvarchar',100,0,0,1),
  (N'liquidacion.QnaSnapshotFuenteDetalle',N'Rfc',N'nvarchar',40,0,0,1),
  (N'liquidacion.QnaSnapshotFuenteDetalle',N'Nombre',N'nvarchar',510,0,0,1),
  (N'liquidacion.QnaSnapshotFuenteDetalle',N'PayloadVersion',N'smallint',2,5,0,1);

INSERT @Faltantes
SELECT CONCAT(N'COLUMNA ',e.Tabla,N'.',e.Columna,N' firma esperada ',e.Tipo,N'(',e.Precision,N',',e.Escala,N')')
FROM @ColumnasEsperadas e
LEFT JOIN sys.columns c ON c.object_id=OBJECT_ID(e.Tabla) AND c.name=e.Columna
LEFT JOIN sys.types t ON t.user_type_id=c.user_type_id
WHERE c.column_id IS NULL OR t.name<>e.Tipo OR c.max_length<>e.Longitud
  OR c.precision<>e.Precision OR c.scale<>e.Escala OR c.is_nullable<>e.Nullable;

IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys fk
  JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id
  WHERE fk.parent_object_id=OBJECT_ID(N'liquidacion.QnaSnapshotDetalle')
    AND fk.name=N'FK_QnaSnapshotDetalle_SnapshotCalculoV2Detalle'
    AND fk.referenced_object_id=OBJECT_ID(N'aportaciones.SnapshotCalculoV2Detalle')
    AND COL_NAME(fkc.parent_object_id,fkc.parent_column_id)=N'SnapshotCalculoV2DetalleId'
    AND COL_NAME(fkc.referenced_object_id,fkc.referenced_column_id)=N'SnapshotDetalleId'
    AND fk.is_disabled=0 AND fk.is_not_trusted=0
) INSERT @Faltantes VALUES (N'FK confiable FK_QnaSnapshotDetalle_SnapshotCalculoV2Detalle');

IF EXISTS (
  SELECT 1 FROM liquidacion.QnaSnapshotDetalle d
  LEFT JOIN aportaciones.SnapshotCalculoV2Detalle v ON v.SnapshotDetalleId=d.SnapshotCalculoV2DetalleId
  WHERE d.SnapshotCalculoV2DetalleId IS NOT NULL AND v.SnapshotDetalleId IS NULL
) INSERT @Faltantes VALUES (N'REFERENCIAS HUERFANAS SnapshotCalculoV2DetalleId');

DECLARE @Indices TABLE (Nombre SYSNAME, Claves NVARCHAR(300), Unico BIT, Filtrado BIT, ColumnaFiltro SYSNAME NULL);
INSERT @Indices VALUES
  (N'UX_QnaSnapshotDetalle_EmpleadoHash',N'LiquidacionSnapshotId|EmpleadoClaveHash',1,1,N'EmpleadoClaveHash'),
  (N'UX_QnaSnapshotDetalle_CalculoDetalle',N'LiquidacionSnapshotId|SnapshotCalculoV2DetalleId',1,1,N'SnapshotCalculoV2DetalleId'),
  (N'IX_QnaSnapshotFuenteDetalle_Clave',N'LiquidacionSnapshotId|Dominio|ClaveFilaHash',0,0,NULL);

INSERT @Faltantes
SELECT N'INDICE ' + e.Nombre
FROM @Indices e
LEFT JOIN (
  SELECT i.name,i.is_unique,i.has_filter,i.is_disabled,i.filter_definition,
    STRING_AGG(CONVERT(NVARCHAR(MAX),c.name),N'|') WITHIN GROUP (ORDER BY ic.key_ordinal) AS Claves
  FROM sys.indexes i
  JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0
  JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
  WHERE i.object_id IN (OBJECT_ID(N'liquidacion.QnaSnapshotDetalle'),OBJECT_ID(N'liquidacion.QnaSnapshotFuenteDetalle'))
  GROUP BY i.name,i.is_unique,i.has_filter,i.is_disabled,i.filter_definition
) a ON a.name=e.Nombre
WHERE a.name IS NULL OR a.Claves<>e.Claves OR a.is_unique<>e.Unico OR a.has_filter<>e.Filtrado
  OR a.is_disabled<>0
  OR (e.ColumnaFiltro IS NOT NULL AND (a.filter_definition NOT LIKE N'%' + e.ColumnaFiltro + N'%'
    OR a.filter_definition NOT LIKE N'%IS NOT NULL%'));

IF EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id=OBJECT_ID(N'liquidacion.QnaSnapshotFuenteDetalle')
    AND name=N'UQ_QnaSnapshotFuenteDetalle_Clave' AND is_unique=1
) INSERT @Faltantes VALUES (N'UNICIDAD LEGACY UQ_QnaSnapshotFuenteDetalle_Clave DEBE ESTAR RETIRADA');

INSERT @Faltantes
SELECT N'CHECK confiable ' + v.Nombre
FROM (VALUES
  (N'liquidacion.QnaSnapshotDetalle',N'CK_QnaSnapshotDetalle_FAT'),
  (N'liquidacion.QnaSnapshotDetalle',N'CK_QnaSnapshotDetalle_DiasV5'),
  (N'liquidacion.QnaSnapshotDetalle',N'CK_QnaSnapshotDetalle_HashesV5'),
  (N'liquidacion.QnaSnapshotDetalle',N'CK_QnaSnapshotDetalle_ProyeccionV5'),
  (N'liquidacion.QnaSnapshotFuenteDetalle',N'CK_QnaSnapshotFuenteDetalle_Payload'),
  (N'liquidacion.QnaSnapshotFuenteDetalle',N'CK_QnaSnapshotFuenteDetalle_Hashes'),
  (N'liquidacion.QnaSnapshotFuenteDetalle',N'CK_QnaSnapshotFuenteDetalle_PayloadVersionV5'),
  (N'liquidacion.QnaSnapshotFuenteDetalle',N'CK_QnaSnapshotFuenteDetalle_IdentidadV5')
) v(Tabla,Nombre)
LEFT JOIN sys.check_constraints c ON c.parent_object_id=OBJECT_ID(v.Tabla) AND c.name=v.Nombre
WHERE c.object_id IS NULL OR c.is_disabled=1 OR c.is_not_trusted=1;

IF OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.CK_QnaSnapshotDetalle_DiasV5',N'C')) NOT LIKE N'%DiasLaborados%0%15%'
  INSERT @Faltantes VALUES (N'DEFINICION CK_QnaSnapshotDetalle_DiasV5');
IF OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.CK_QnaSnapshotDetalle_HashesV5',N'C')) NOT LIKE N'%Latin1_General_100_BIN2%'
  INSERT @Faltantes VALUES (N'DEFINICION CK_QnaSnapshotDetalle_HashesV5');
IF OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.CK_QnaSnapshotDetalle_ProyeccionV5',N'C')) NOT LIKE N'%SnapshotCalculoV2DetalleId%EmpleadoClaveHash%Interno%Nombre%DiasLaborados%HashFila%'
  INSERT @Faltantes VALUES (N'DEFINICION CK_QnaSnapshotDetalle_ProyeccionV5');
IF OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.CK_QnaSnapshotFuenteDetalle_IdentidadV5',N'C')) NOT LIKE N'%EmpleadoClave%Nombre%PayloadVersion%'
  INSERT @Faltantes VALUES (N'DEFINICION CK_QnaSnapshotFuenteDetalle_IdentidadV5');
IF OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.CK_QnaSnapshotFuenteDetalle_Hashes',N'C')) NOT LIKE N'%Latin1_General_100_BIN2%'
  INSERT @Faltantes VALUES (N'DEFINICION CK_QnaSnapshotFuenteDetalle_Hashes');

INSERT @Faltantes
SELECT N'TRIGGER ' + v.Nombre
FROM (VALUES
  (N'liquidacion.QnaSnapshotDetalle',N'TR_QnaSnapshotDetalle_Inmutable'),
  (N'liquidacion.QnaSnapshotFuenteDetalle',N'TR_QnaSnapshotFuenteDetalle_Inmutable'),
  (N'liquidacion.QnaSnapshotDetalle',N'TR_QnaSnapshotDetalle_V5_Completitud'),
  (N'liquidacion.QnaSnapshotFuenteDetalle',N'TR_QnaSnapshotFuenteDetalle_V5_Completitud')
) v(Tabla,Nombre)
LEFT JOIN sys.triggers t ON t.parent_id=OBJECT_ID(v.Tabla) AND t.name=v.Nombre
WHERE t.object_id IS NULL OR t.is_disabled=1;

IF OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.TR_QnaSnapshotDetalle_Inmutable',N'TR')) NOT LIKE N'%THROW 51603%'
  INSERT @Faltantes VALUES (N'DEFINICION TR_QnaSnapshotDetalle_Inmutable');
IF OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.TR_QnaSnapshotFuenteDetalle_Inmutable',N'TR')) NOT LIKE N'%THROW 51604%'
  INSERT @Faltantes VALUES (N'DEFINICION TR_QnaSnapshotFuenteDetalle_Inmutable');
IF OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.TR_QnaSnapshotDetalle_V5_Completitud',N'TR')) NOT LIKE N'%VersionEsquema%THROW 51665%'
  INSERT @Faltantes VALUES (N'DEFINICION TR_QnaSnapshotDetalle_V5_Completitud');
IF OBJECT_DEFINITION(OBJECT_ID(N'liquidacion.TR_QnaSnapshotFuenteDetalle_V5_Completitud',N'TR')) NOT LIKE N'%VersionEsquema%PayloadVersion%THROW 51666%'
  INSERT @Faltantes VALUES (N'DEFINICION TR_QnaSnapshotFuenteDetalle_V5_Completitud');

IF EXISTS (
  SELECT 1 FROM liquidacion.QnaSnapshotDetalle d
  JOIN liquidacion.QnaSnapshot q ON q.LiquidacionSnapshotId=d.LiquidacionSnapshotId
  WHERE q.VersionEsquema>=5 AND d.SnapshotCalculoV2DetalleId IS NULL
) INSERT @Faltantes VALUES (N'FILAS V5 SIN PROYECCION COMPLETA');

IF EXISTS (
  SELECT 1 FROM liquidacion.QnaSnapshotFuenteDetalle d
  JOIN liquidacion.QnaSnapshot q ON q.LiquidacionSnapshotId=d.LiquidacionSnapshotId
  WHERE q.VersionEsquema>=5 AND (d.EmpleadoClave IS NULL OR d.Nombre IS NULL OR d.PayloadVersion<>1)
) INSERT @Faltantes VALUES (N'FILAS AUXILIARES V5 SIN IDENTIDAD O PAYLOAD VERSION 1');

IF EXISTS (SELECT 1 FROM @Faltantes)
BEGIN
  SELECT Objeto AS Faltante FROM @Faltantes ORDER BY Objeto;
  DECLARE @Mensaje NVARCHAR(2048);
  SELECT @Mensaje=LEFT(STRING_AGG(CONVERT(NVARCHAR(MAX),Objeto),N' | ') WITHIN GROUP (ORDER BY Objeto),2048)
  FROM @Faltantes;
  THROW 51670, @Mensaje, 1;
END;

SELECT DB_NAME() AS BaseDatos,
  (SELECT COUNT_BIG(1) FROM liquidacion.QnaSnapshotDetalle) AS Detalles,
  (SELECT COUNT_BIG(1) FROM liquidacion.QnaSnapshotFuenteDetalle) AS FuentesDetalle,
  5 AS VersionEsquemaNueva,
  'QNA_OFFICIAL_PROJECTIONS_SCHEMA_OK' AS Resultado;
GO
