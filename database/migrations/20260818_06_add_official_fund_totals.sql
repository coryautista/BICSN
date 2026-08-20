SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID(N'aportaciones.SnapshotCalculoV2', N'U') IS NOT NULL
  BEGIN
    IF COL_LENGTH(N'aportaciones.SnapshotCalculoV2', N'CAIR_FONDO') IS NULL
      ALTER TABLE aportaciones.SnapshotCalculoV2 ADD CAIR_FONDO DECIMAL(19,2) NULL;
    IF COL_LENGTH(N'aportaciones.SnapshotCalculoV2', N'PRESTACIONES') IS NULL
      ALTER TABLE aportaciones.SnapshotCalculoV2 ADD PRESTACIONES DECIMAL(19,2) NULL;
    IF COL_LENGTH(N'aportaciones.SnapshotCalculoV2', N'VIVIENDA') IS NULL
      ALTER TABLE aportaciones.SnapshotCalculoV2 ADD VIVIENDA DECIMAL(19,2) NULL;
  END;

  IF OBJECT_ID(N'aportaciones.SnapshotCalculoV2Detalle', N'U') IS NOT NULL
  BEGIN
    IF COL_LENGTH(N'aportaciones.SnapshotCalculoV2Detalle', N'CAIRFONDOD6') IS NULL
      ALTER TABLE aportaciones.SnapshotCalculoV2Detalle ADD CAIRFONDOD6 DECIMAL(19,6) NULL;
    IF COL_LENGTH(N'aportaciones.SnapshotCalculoV2Detalle', N'PRESTACIONESD6') IS NULL
      ALTER TABLE aportaciones.SnapshotCalculoV2Detalle ADD PRESTACIONESD6 DECIMAL(19,6) NULL;
    IF COL_LENGTH(N'aportaciones.SnapshotCalculoV2Detalle', N'VIVIENDAD6') IS NULL
      ALTER TABLE aportaciones.SnapshotCalculoV2Detalle ADD VIVIENDAD6 DECIMAL(19,6) NULL;
  END;

  IF OBJECT_ID(N'liquidacion.CK_QnaSnapshotTotal_FAT', N'C') IS NOT NULL
    ALTER TABLE liquidacion.QnaSnapshotTotal DROP CONSTRAINT CK_QnaSnapshotTotal_FAT;
  ALTER TABLE liquidacion.QnaSnapshotTotal WITH CHECK ADD CONSTRAINT CK_QnaSnapshotTotal_FAT
    CHECK (FATA2 = FAAA2 + FAEA2);

  IF COL_LENGTH(N'liquidacion.QnaSnapshotTotal', N'CAIRFondoA2') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotTotal ADD CAIRFondoA2 DECIMAL(19,2) NULL;

  IF OBJECT_ID(N'liquidacion.CK_QnaSnapshotTotal_Aportaciones', N'C') IS NOT NULL
    ALTER TABLE liquidacion.QnaSnapshotTotal DROP CONSTRAINT CK_QnaSnapshotTotal_Aportaciones;
  EXEC(N'ALTER TABLE liquidacion.QnaSnapshotTotal WITH CHECK ADD CONSTRAINT CK_QnaSnapshotTotal_Aportaciones
    CHECK (TotalAportacionesA2 = AhorroA2 + ViviendaA2 + PrestacionesA2
      + COALESCE(CAIRFondoA2, CAIRA2) + GuarderiasA2 + TransitorioA2 + AguinaldoA2)');

  IF OBJECT_ID(N'liquidacion.CK_QnaSnapshot_Policy', N'C') IS NOT NULL
    ALTER TABLE liquidacion.QnaSnapshot DROP CONSTRAINT CK_QnaSnapshot_Policy;
  ALTER TABLE liquidacion.QnaSnapshot WITH CHECK ADD CONSTRAINT CK_QnaSnapshot_Policy
    CHECK (PrecisionPolicy IN ('MXN-DETAIL6-AGG2-TRUNC-v1', 'MXN-DETAIL6-LEAF2-FUND2-ROUND-v2', 'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3'));

  IF COL_LENGTH(N'conciliacion.Revision', N'PRESTACIONES') IS NULL
    ALTER TABLE conciliacion.Revision ADD PRESTACIONES DECIMAL(19,2) NOT NULL
      CONSTRAINT DF_Revision_PRESTACIONES DEFAULT (0);
  IF COL_LENGTH(N'conciliacion.Revision', N'VIVIENDA') IS NULL
    ALTER TABLE conciliacion.Revision ADD VIVIENDA DECIMAL(19,2) NOT NULL
      CONSTRAINT DF_Revision_VIVIENDA DEFAULT (0);
  IF COL_LENGTH(N'conciliacion.RevisionHistorico', N'PRESTACIONES') IS NULL
    ALTER TABLE conciliacion.RevisionHistorico ADD PRESTACIONES DECIMAL(19,2) NOT NULL
      CONSTRAINT DF_RevisionHistorico_PRESTACIONES DEFAULT (0);
  IF COL_LENGTH(N'conciliacion.RevisionHistorico', N'VIVIENDA') IS NULL
    ALTER TABLE conciliacion.RevisionHistorico ADD VIVIENDA DECIMAL(19,2) NOT NULL
      CONSTRAINT DF_RevisionHistorico_VIVIENDA DEFAULT (0);

  IF OBJECT_ID(N'aportaciones.FormulaCalculoVersion', N'U') IS NOT NULL
     AND OBJECT_ID(N'aportaciones.FormulaCalculoParametro', N'U') IS NOT NULL
  BEGIN
    IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'UQ_FormulaCalculoVersion_AnioInicio')
      ALTER TABLE aportaciones.FormulaCalculoVersion DROP CONSTRAINT UQ_FormulaCalculoVersion_AnioInicio;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_FormulaCalculoVersion_InicioActivo'
      AND object_id = OBJECT_ID(N'aportaciones.FormulaCalculoVersion'))
      CREATE UNIQUE INDEX UX_FormulaCalculoVersion_InicioActivo
        ON aportaciones.FormulaCalculoVersion (ClaveFormula, AnioVigencia, QuincenaDesde)
        WHERE Estado = 'ACTIVA';

    DECLARE @AhorroId BIGINT, @ViviendaId BIGINT, @PrestacionesId BIGINT, @CairId BIGINT;
    DECLARE @AhorroP DECIMAL(19,9), @AhorroA DECIMAL(19,9), @ViviendaP DECIMAL(19,9);
    DECLARE @PrestacionesP DECIMAL(19,9), @PrestacionesA DECIMAL(19,9), @CairP DECIMAL(19,9);
    SELECT @AhorroId=CatalogoPorcentajeFondoId,@AhorroP=PorcentajePatron,@AhorroA=PorcentajeAfiliado
      FROM aportaciones.CatalogoPorcentajeFondo WHERE TipoFondo='ahorro' AND AnioVigencia=2026 AND Vigente=1;
    SELECT @ViviendaId=CatalogoPorcentajeFondoId,@ViviendaP=PorcentajePatron
      FROM aportaciones.CatalogoPorcentajeFondo WHERE TipoFondo='vivienda' AND AnioVigencia=2026 AND Vigente=1;
    SELECT @PrestacionesId=CatalogoPorcentajeFondoId,@PrestacionesP=PorcentajePatron,@PrestacionesA=PorcentajeAfiliado
      FROM aportaciones.CatalogoPorcentajeFondo WHERE TipoFondo='prestaciones' AND AnioVigencia=2026 AND Vigente=1;
    SELECT @CairId=CatalogoPorcentajeFondoId,@CairP=PorcentajePatron
      FROM aportaciones.CatalogoPorcentajeFondo WHERE TipoFondo='cair' AND AnioVigencia=2026 AND Vigente=1;
    IF @AhorroId IS NULL OR @ViviendaId IS NULL OR @PrestacionesId IS NULL OR @CairId IS NULL
      THROW 51060, 'CatalogoPorcentajeFondo 2026 incompleto para crear la formula SQL oficial.', 1;

    DECLARE @FormulaSqlId BIGINT;
    SELECT @FormulaSqlId=FormulaCalculoVersionId FROM aportaciones.FormulaCalculoVersion
      WHERE ClaveFormula='APORTACIONES-NOMINA' AND AnioVigencia=2026
        AND PrecisionPolicy='MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3';
    IF @FormulaSqlId IS NULL
    BEGIN
      DECLARE @FormulaOrigenId BIGINT;
      SELECT TOP (1) @FormulaOrigenId=FormulaCalculoVersionId
        FROM aportaciones.FormulaCalculoVersion
        WHERE ClaveFormula='APORTACIONES-NOMINA' AND AnioVigencia=2026
        ORDER BY NumeroVersion DESC;
      IF @FormulaOrigenId IS NULL THROW 51061, 'No existe formula origen 2026.', 1;

      UPDATE aportaciones.FormulaCalculoVersion SET Estado='INACTIVA'
        WHERE ClaveFormula='APORTACIONES-NOMINA' AND AnioVigencia=2026 AND Estado='ACTIVA';
      INSERT INTO aportaciones.FormulaCalculoVersion (
        ClaveFormula,AnioVigencia,NumeroVersion,QuincenaDesde,QuincenaHasta,Descripcion,
        PrecisionPolicy,Estado,FormulaOrigenId,UsuarioAlta
      ) VALUES (
        'APORTACIONES-NOMINA',2026,
        (SELECT ISNULL(MAX(NumeroVersion),0)+1 FROM aportaciones.FormulaCalculoVersion
          WHERE ClaveFormula='APORTACIONES-NOMINA' AND AnioVigencia=2026),
        1,24,N'Formula oficial derivada de CatalogoPorcentajeFondo',
        'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3','ACTIVA',@FormulaOrigenId,SUSER_SNAME()
      );
      SET @FormulaSqlId=SCOPE_IDENTITY();

      INSERT INTO aportaciones.FormulaCalculoParametro (
        FormulaCalculoVersionId,ClaveParametro,Valor,Unidad,Fuente,Observaciones,UsuarioAlta
      )
      SELECT @FormulaSqlId,ClaveParametro,Valor,Unidad,Fuente,Observaciones,SUSER_SNAME()
        FROM aportaciones.FormulaCalculoParametro
        WHERE FormulaCalculoVersionId=@FormulaOrigenId
          AND ClaveParametro IN ('DIAS_MES','DIAS_DEFAULT_SIN_TXT','DIAS_MIN','DIAS_MAX');
      INSERT INTO aportaciones.FormulaCalculoParametro (
        FormulaCalculoVersionId,ClaveParametro,Valor,Unidad,Fuente,Observaciones,UsuarioAlta
      ) VALUES
        (@FormulaSqlId,'CAIR_SUELDO',@CairP,'TASA',CONCAT('CatalogoPorcentajeFondo:',@CairId,':cair'),NULL,SUSER_SNAME()),
        (@FormulaSqlId,'FRA_SUELDO',@PrestacionesA,'TASA',CONCAT('CatalogoPorcentajeFondo:',@PrestacionesId,':prestaciones'),NULL,SUSER_SNAME()),
        (@FormulaSqlId,'FRA_OTRAS',0,'TASA',CONCAT('CatalogoPorcentajeFondo:',@PrestacionesId,':prestaciones'),NULL,SUSER_SNAME()),
        (@FormulaSqlId,'FRA_QUINQUENIOS',0,'TASA',CONCAT('CatalogoPorcentajeFondo:',@PrestacionesId,':prestaciones'),NULL,SUSER_SNAME()),
        (@FormulaSqlId,'FRE_SUELDO',@PrestacionesP,'TASA',CONCAT('CatalogoPorcentajeFondo:',@PrestacionesId,':prestaciones'),NULL,SUSER_SNAME()),
        (@FormulaSqlId,'FRE_OTRAS',@PrestacionesP+@PrestacionesA,'TASA',CONCAT('CatalogoPorcentajeFondo:',@PrestacionesId,':prestaciones'),N'Suma patronal y afiliado',SUSER_SNAME()),
        (@FormulaSqlId,'FRE_QUINQUENIOS',@PrestacionesP+@PrestacionesA,'TASA',CONCAT('CatalogoPorcentajeFondo:',@PrestacionesId,':prestaciones'),N'Patron mas afiliado',SUSER_SNAME()),
        (@FormulaSqlId,'FH_SUELDO',@ViviendaP/5,'TASA',CONCAT('CatalogoPorcentajeFondo:',@ViviendaId,':vivienda'),N'20% de Vivienda',SUSER_SNAME()),
        (@FormulaSqlId,'FV_SUELDO',(@ViviendaP*4)/5,'TASA',CONCAT('CatalogoPorcentajeFondo:',@ViviendaId,':vivienda'),N'80% de Vivienda',SUSER_SNAME()),
        (@FormulaSqlId,'FAA_SUELDO',@AhorroA,'TASA',CONCAT('CatalogoPorcentajeFondo:',@AhorroId,':ahorro'),NULL,SUSER_SNAME()),
        (@FormulaSqlId,'FAE_SUELDO',@AhorroP,'TASA',CONCAT('CatalogoPorcentajeFondo:',@AhorroId,':ahorro'),NULL,SUSER_SNAME());
    END;
  END;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO
