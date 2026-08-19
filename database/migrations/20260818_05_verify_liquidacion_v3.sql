/* Verificacion de catalogo. No modifica datos ni esquema. */
SET NOCOUNT ON;

DECLARE @Faltantes TABLE (Objeto NVARCHAR(300) NOT NULL);

IF SCHEMA_ID(N'liquidacion') IS NULL INSERT @Faltantes VALUES (N'ESQUEMA liquidacion');

INSERT @Faltantes (Objeto)
SELECT v.Objeto
FROM (VALUES
  (N'liquidacion.QnaSnapshot', N'U'),
  (N'liquidacion.QnaSnapshotFuente', N'U'),
  (N'liquidacion.QnaSnapshotTotal', N'U'),
  (N'liquidacion.QnaSnapshotDetalle', N'U'),
  (N'liquidacion.QnaSnapshotFuenteDetalle', N'U'),
  (N'liquidacion.QnaProceso', N'U'),
  (N'liquidacion.QnaProcesoTransicion', N'U'),
  (N'liquidacion.QnaSnapshotSeleccionEvento', N'U'),
  (N'liquidacion.QnaSnapshotDecision', N'U'),
  (N'liquidacion.QnaSnapshotOficialActual', N'U'),
  (N'retenciones.RetencionPCPHistoricoV3', N'U'),
  (N'retenciones.RetencionPMPHistoricoV3', N'U'),
  (N'retenciones.RetencionHIPHistoricoV3', N'U'),
  (N'retenciones.spGuardarRetencionPCPHistorico_V3', N'P'),
  (N'retenciones.spGuardarRetencionPMPHistorico_V3', N'P'),
  (N'retenciones.spGuardarRetencionHIPHistorico_V3', N'P')
) v(Objeto, Tipo)
WHERE OBJECT_ID(v.Objeto, v.Tipo) IS NULL;

INSERT @Faltantes (Objeto)
SELECT N'TIPO ' + v.Objeto
FROM (VALUES
  (N'retenciones.TVP_RetencionPCPHeader_V3'),
  (N'retenciones.TVP_RetencionPCPDetalle_V3'),
  (N'retenciones.TVP_RetencionPMPHeader_V3'),
  (N'retenciones.TVP_RetencionPMPDetalle_V3'),
  (N'retenciones.TVP_RetencionHIPHeader_V3'),
  (N'retenciones.TVP_RetencionHIPDetalle_V3')
) v(Objeto)
WHERE TYPE_ID(v.Objeto) IS NULL;

INSERT @Faltantes (Objeto)
SELECT N'TIPO INEXACTO ' + v.Tipo
FROM (VALUES
  (N'retenciones.TVP_RetencionPCPHeader_V3', 5),
  (N'retenciones.TVP_RetencionPCPDetalle_V3', 11),
  (N'retenciones.TVP_RetencionPMPHeader_V3', 5),
  (N'retenciones.TVP_RetencionPMPDetalle_V3', 11),
  (N'retenciones.TVP_RetencionHIPHeader_V3', 5),
  (N'retenciones.TVP_RetencionHIPDetalle_V3', 14)
) v(Tipo, Columnas)
JOIN sys.table_types tt ON tt.user_type_id=TYPE_ID(v.Tipo)
WHERE (SELECT COUNT(*) FROM sys.columns c WHERE c.object_id=tt.type_table_object_id) <> v.Columnas;

INSERT @Faltantes (Objeto)
SELECT N'FIRMA TVP INEXACTA ' + v.Tipo
FROM (VALUES
  (N'retenciones.TVP_RetencionPCPHeader_V3', N'LiquidacionSnapshotId:bigint:0|SourceScale:tinyint:0|Registros:int:0|TotalA2:decimal:0|UsuarioId:nvarchar:0'),
  (N'retenciones.TVP_RetencionPCPDetalle_V3', N'Orden:int:0|EmpleadoClave:nvarchar:0|Rfc:nvarchar:1|Prestamo:int:0|Letra:int:1|Plazo:int:1|CapitalD6:decimal:0|InteresD6:decimal:0|MontoD6:decimal:0|MoratoriosD6:decimal:0|TotalD6:decimal:0'),
  (N'retenciones.TVP_RetencionPMPHeader_V3', N'LiquidacionSnapshotId:bigint:0|SourceScale:tinyint:0|Registros:int:0|TotalA2:decimal:0|UsuarioId:nvarchar:0'),
  (N'retenciones.TVP_RetencionPMPDetalle_V3', N'Orden:int:0|EmpleadoClave:nvarchar:0|Rfc:nvarchar:1|Prestamo:int:0|Letra:int:1|Plazo:int:1|CapitalD6:decimal:0|InteresD6:decimal:0|MoratoriosD6:decimal:0|SeguroD6:decimal:0|TotalD6:decimal:0'),
  (N'retenciones.TVP_RetencionHIPHeader_V3', N'LiquidacionSnapshotId:bigint:0|SourceScale:tinyint:0|Registros:int:0|TotalA2:decimal:0|UsuarioId:nvarchar:0'),
  (N'retenciones.TVP_RetencionHIPDetalle_V3', N'Orden:int:0|EmpleadoClave:nvarchar:0|Rfc:nvarchar:1|Solicitud:int:0|AnioPrestamo:smallint:1|Plazo:int:1|CantidadD6:decimal:0|DescuentoD6:decimal:0|CapitalD6:decimal:0|InteresD6:decimal:0|InteresDiferidoD6:decimal:0|SeguroD6:decimal:0|MoratorioD6:decimal:0|TotalD6:decimal:0')
) v(Tipo, FirmaEsperada)
JOIN sys.table_types tt ON tt.user_type_id=TYPE_ID(v.Tipo)
CROSS APPLY (
  SELECT STRING_AGG(CONVERT(NVARCHAR(MAX), CONCAT(c.name, N':', t.name, N':', c.is_nullable)), N'|')
    WITHIN GROUP (ORDER BY c.column_id) AS FirmaActual
  FROM sys.columns c
  JOIN sys.types t ON t.user_type_id=c.user_type_id
  WHERE c.object_id=tt.type_table_object_id
) a
WHERE a.FirmaActual <> v.FirmaEsperada;

IF EXISTS (
  SELECT 1 FROM sys.table_types tt
  JOIN sys.columns c ON c.object_id=tt.type_table_object_id
  WHERE tt.user_type_id IN (
    TYPE_ID(N'retenciones.TVP_RetencionPCPHeader_V3'), TYPE_ID(N'retenciones.TVP_RetencionPMPHeader_V3'), TYPE_ID(N'retenciones.TVP_RetencionHIPHeader_V3')
  ) AND c.name=N'UsuarioId' AND c.max_length<>200
) OR EXISTS (
  SELECT 1 FROM sys.table_types tt
  JOIN sys.columns c ON c.object_id=tt.type_table_object_id
  WHERE tt.user_type_id IN (
    TYPE_ID(N'retenciones.TVP_RetencionPCPDetalle_V3'), TYPE_ID(N'retenciones.TVP_RetencionPMPDetalle_V3'), TYPE_ID(N'retenciones.TVP_RetencionHIPDetalle_V3')
  ) AND ((c.name=N'EmpleadoClave' AND c.max_length<>100) OR (c.name=N'Rfc' AND c.max_length<>40))
) INSERT @Faltantes VALUES (N'TIPOS V3 con longitud NVARCHAR incorrecta');

IF EXISTS (
  SELECT 1
  FROM sys.table_types tt
  JOIN sys.columns c ON c.object_id=tt.type_table_object_id
  JOIN sys.types t ON t.user_type_id=c.user_type_id
  WHERE tt.user_type_id IN (
    TYPE_ID(N'retenciones.TVP_RetencionPCPHeader_V3'), TYPE_ID(N'retenciones.TVP_RetencionPCPDetalle_V3'),
    TYPE_ID(N'retenciones.TVP_RetencionPMPHeader_V3'), TYPE_ID(N'retenciones.TVP_RetencionPMPDetalle_V3'),
    TYPE_ID(N'retenciones.TVP_RetencionHIPHeader_V3'), TYPE_ID(N'retenciones.TVP_RetencionHIPDetalle_V3')
  ) AND ((c.name LIKE N'%D6' AND (t.name<>N'decimal' OR c.precision<>19 OR c.scale<>6))
    OR (c.name LIKE N'%A2' AND (t.name<>N'decimal' OR c.precision<>19 OR c.scale<>2)))
) INSERT @Faltantes VALUES (N'TIPOS V3 con escala monetaria incorrecta');

INSERT @Faltantes (Objeto)
SELECT N'TRIGGER ' + v.Objeto
FROM (VALUES
  (N'liquidacion.TR_QnaSnapshot_Inmutable'),
  (N'liquidacion.TR_QnaSnapshotFuente_Inmutable'),
  (N'liquidacion.TR_QnaSnapshotTotal_Inmutable'),
  (N'liquidacion.TR_QnaSnapshotDetalle_Inmutable'),
  (N'liquidacion.TR_QnaSnapshotFuenteDetalle_Inmutable'),
  (N'liquidacion.TR_QnaProceso_Inmutable'),
  (N'liquidacion.TR_QnaProcesoTransicion_Inmutable'),
  (N'liquidacion.TR_QnaSnapshotSeleccionEvento_Inmutable'),
  (N'liquidacion.TR_QnaSnapshotDecision_Inmutable'),
  (N'retenciones.TR_RetencionPCPHistoricoV3_Inmutable'),
  (N'retenciones.TR_RetencionPMPHistoricoV3_Inmutable'),
  (N'retenciones.TR_RetencionHIPHistoricoV3_Inmutable')
) v(Objeto)
WHERE OBJECT_ID(v.Objeto, N'TR') IS NULL;

IF OBJECT_ID(N'liquidacion.QnaSnapshotTotal', N'U') IS NOT NULL
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'liquidacion.QnaSnapshotTotal') AND name=N'CK_QnaSnapshotTotal_General')
    INSERT @Faltantes VALUES (N'CHECK CK_QnaSnapshotTotal_General');
  IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'liquidacion.QnaSnapshotTotal') AND name=N'CK_QnaSnapshotTotal_FAT')
    INSERT @Faltantes VALUES (N'CHECK CK_QnaSnapshotTotal_FAT');
  IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'liquidacion.QnaSnapshotTotal') AND name=N'CK_QnaSnapshotTotal_Aportaciones')
    INSERT @Faltantes VALUES (N'CHECK CK_QnaSnapshotTotal_Aportaciones');
END;

IF OBJECT_ID(N'liquidacion.QnaSnapshotOficialActual', N'U') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'liquidacion.QnaSnapshotOficialActual') AND is_unique=1 AND name=N'UQ_QnaSnapshotOficialActual_Snapshot')
  INSERT @Faltantes VALUES (N'UNIQUE UQ_QnaSnapshotOficialActual_Snapshot');

IF EXISTS (
  SELECT 1 FROM sys.columns c
  JOIN sys.types t ON t.user_type_id=c.user_type_id
  WHERE c.object_id IN (
    OBJECT_ID(N'liquidacion.QnaSnapshotDetalle'), OBJECT_ID(N'liquidacion.QnaSnapshotFuenteDetalle'), OBJECT_ID(N'retenciones.RetencionPCPHistoricoV3'),
    OBJECT_ID(N'retenciones.RetencionPMPHistoricoV3'), OBJECT_ID(N'retenciones.RetencionHIPHistoricoV3')
  ) AND c.name LIKE N'%D6' AND (t.name<>N'decimal' OR c.precision<>19 OR c.scale<>6)
) INSERT @Faltantes VALUES (N'COLUMNAS D6 deben ser DECIMAL(19,6)');

IF EXISTS (
  SELECT 1 FROM sys.columns c
  JOIN sys.types t ON t.user_type_id=c.user_type_id
  WHERE c.object_id IN (OBJECT_ID(N'liquidacion.QnaSnapshotTotal'), OBJECT_ID(N'retenciones.RetencionPCPHistoricoV3'), OBJECT_ID(N'retenciones.RetencionPMPHistoricoV3'), OBJECT_ID(N'retenciones.RetencionHIPHistoricoV3'))
    AND c.name LIKE N'%A2' AND (t.name<>N'decimal' OR c.precision<>19 OR c.scale<>2)
) INSERT @Faltantes VALUES (N'COLUMNAS A2 deben ser DECIMAL(19,2)');

DECLARE @TablaEnlace SYSNAME;
DECLARE @FkEnlace SYSNAME;
DECLARE @IndiceEnlace SYSNAME;
DECLARE enlaces CURSOR LOCAL FAST_FORWARD FOR
  SELECT Nombre, Fk, Indice FROM (VALUES
    (N'pagos.LineaCapturaPeriodo', N'FK_LineaCapturaPeriodo_LiquidacionSnapshot', N'UX_LineaCapturaPeriodo_LiquidacionSnapshotId'),
    (N'conciliacion.RevisionTarea', N'FK_RevisionTarea_LiquidacionSnapshot', N'UX_RevisionTarea_LiquidacionSnapshotId'),
    (N'conciliacion.Revision', N'FK_Revision_LiquidacionSnapshot', N'IX_Revision_LiquidacionSnapshotId'),
    (N'conciliacion.RevisionHistorico', N'FK_RevisionHistorico_LiquidacionSnapshot', N'IX_RevisionHistorico_LiquidacionSnapshotId'),
    (N'conciliacion.RevisionAplicacionHistorico', N'FK_RevisionAplicacionHistorico_LiquidacionSnapshot', N'IX_RevisionAplicacionHistorico_LiquidacionSnapshotId')
  ) e(Nombre, Fk, Indice);
OPEN enlaces;
FETCH NEXT FROM enlaces INTO @TablaEnlace, @FkEnlace, @IndiceEnlace;
WHILE @@FETCH_STATUS = 0
BEGIN
  IF OBJECT_ID(@TablaEnlace, N'U') IS NOT NULL
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM sys.columns c
      WHERE c.object_id=OBJECT_ID(@TablaEnlace) AND c.name=N'LiquidacionSnapshotId'
        AND TYPE_NAME(c.user_type_id)=N'bigint' AND c.is_nullable=1
    ) INSERT @Faltantes VALUES (N'COLUMNA BIGINT NULL ' + @TablaEnlace + N'.LiquidacionSnapshotId');
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID(@TablaEnlace) AND name=@FkEnlace)
      INSERT @Faltantes VALUES (N'FK ' + @TablaEnlace + N'.' + @FkEnlace);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(@TablaEnlace) AND name=@IndiceEnlace AND has_filter=1)
      INSERT @Faltantes VALUES (N'INDICE ' + @TablaEnlace + N'.' + @IndiceEnlace);
  END;
  FETCH NEXT FROM enlaces INTO @TablaEnlace, @FkEnlace, @IndiceEnlace;
END;
CLOSE enlaces;
DEALLOCATE enlaces;

IF EXISTS (SELECT 1 FROM @Faltantes)
BEGIN
  SELECT Objeto AS Faltante FROM @Faltantes ORDER BY Objeto;
  THROW 51650, 'LIQUIDACION_V3_VERIFICACION_FALLIDA', 1;
END;

SELECT DB_NAME() AS BaseDatos,
  'MXN-DETAIL6-AGG2-TRUNC-v1' AS PrecisionPolicy,
  'LIQUIDACION_V3_SCHEMA_OK' AS Resultado;
GO
