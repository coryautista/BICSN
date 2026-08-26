/* Proyecciones legibles V5 para el Snapshot QNA oficial. No reconstruye datos historicos. */
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
SET QUOTED_IDENTIFIER ON;

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID(N'liquidacion.QnaSnapshot', N'U') IS NULL
    THROW 51660, 'Falta liquidacion.QnaSnapshot.', 1;
  IF OBJECT_ID(N'liquidacion.QnaSnapshotDetalle', N'U') IS NULL
    THROW 51661, 'Falta liquidacion.QnaSnapshotDetalle.', 1;
  IF OBJECT_ID(N'liquidacion.QnaSnapshotFuenteDetalle', N'U') IS NULL
    THROW 51662, 'Falta liquidacion.QnaSnapshotFuenteDetalle.', 1;
  IF OBJECT_ID(N'aportaciones.SnapshotCalculoV2Detalle', N'U') IS NULL
    THROW 51663, 'Falta aportaciones.SnapshotCalculoV2Detalle.', 1;

  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'SnapshotCalculoV2DetalleId') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD SnapshotCalculoV2DetalleId BIGINT NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'EmpleadoClaveHash') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD EmpleadoClaveHash CHAR(64) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'Interno') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD Interno INT NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'Nombre') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD Nombre NVARCHAR(255) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'DiasLaborados') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD DiasLaborados DECIMAL(5,2) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'DiasOrigen') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD DiasOrigen VARCHAR(40) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'SueldoMensualD6') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD SueldoMensualD6 DECIMAL(19,6) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'BaseCotizacionSueldoD6') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD BaseCotizacionSueldoD6 DECIMAL(19,6) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'QuinqueniosMensualD6') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD QuinqueniosMensualD6 DECIMAL(19,6) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'BaseCotizacionQuinqueniosD6') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD BaseCotizacionQuinqueniosD6 DECIMAL(19,6) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'CAIRFondoD6') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD CAIRFondoD6 DECIMAL(19,6) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'PrestacionesD6') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD PrestacionesD6 DECIMAL(19,6) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'ViviendaD6') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD ViviendaD6 DECIMAL(19,6) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'GuarderiasD6') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD GuarderiasD6 DECIMAL(19,6) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'TransitorioD6') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD TransitorioD6 DECIMAL(19,6) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'AguinaldoD6') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD AguinaldoD6 DECIMAL(19,6) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotDetalle', N'HashFila') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle ADD HashFila CHAR(64) NULL;

  IF COL_LENGTH(N'liquidacion.QnaSnapshotFuenteDetalle', N'EmpleadoClave') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotFuenteDetalle ADD EmpleadoClave NVARCHAR(50) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotFuenteDetalle', N'Rfc') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotFuenteDetalle ADD Rfc NVARCHAR(20) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotFuenteDetalle', N'Nombre') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotFuenteDetalle ADD Nombre NVARCHAR(255) NULL;
  IF COL_LENGTH(N'liquidacion.QnaSnapshotFuenteDetalle', N'PayloadVersion') IS NULL
    ALTER TABLE liquidacion.QnaSnapshotFuenteDetalle ADD PayloadVersion SMALLINT NULL;

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

  IF EXISTS (
    SELECT 1
    FROM @ColumnasEsperadas e
    LEFT JOIN sys.columns c ON c.object_id=OBJECT_ID(e.Tabla) AND c.name=e.Columna
    LEFT JOIN sys.types t ON t.user_type_id=c.user_type_id
    WHERE c.column_id IS NULL OR t.name<>e.Tipo OR c.max_length<>e.Longitud
      OR c.precision<>e.Precision OR c.scale<>e.Escala OR c.is_nullable<>e.Nullable
  ) THROW 51664, 'Firma incompatible en columnas de proyeccion V5.', 1;

  IF EXISTS (
    SELECT 1 FROM sys.key_constraints
    WHERE parent_object_id=OBJECT_ID(N'liquidacion.QnaSnapshotFuenteDetalle')
      AND name=N'UQ_QnaSnapshotFuenteDetalle_Clave'
  ) EXEC(N'ALTER TABLE liquidacion.QnaSnapshotFuenteDetalle DROP CONSTRAINT UQ_QnaSnapshotFuenteDetalle_Clave;');

  IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id=OBJECT_ID(N'liquidacion.QnaSnapshotFuenteDetalle')
      AND name=N'UQ_QnaSnapshotFuenteDetalle_Clave'
  ) EXEC(N'DROP INDEX UQ_QnaSnapshotFuenteDetalle_Clave ON liquidacion.QnaSnapshotFuenteDetalle;');

  IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id=OBJECT_ID(N'liquidacion.QnaSnapshotFuenteDetalle')
      AND name=N'IX_QnaSnapshotFuenteDetalle_Clave'
  ) EXEC(N'DROP INDEX IX_QnaSnapshotFuenteDetalle_Clave ON liquidacion.QnaSnapshotFuenteDetalle;');
  EXEC(N'CREATE INDEX IX_QnaSnapshotFuenteDetalle_Clave
    ON liquidacion.QnaSnapshotFuenteDetalle (LiquidacionSnapshotId,Dominio,ClaveFilaHash);');

  IF OBJECT_ID(N'liquidacion.FK_QnaSnapshotDetalle_SnapshotCalculoV2Detalle', N'F') IS NULL
    EXEC(N'ALTER TABLE liquidacion.QnaSnapshotDetalle WITH CHECK
      ADD CONSTRAINT FK_QnaSnapshotDetalle_SnapshotCalculoV2Detalle
      FOREIGN KEY (SnapshotCalculoV2DetalleId)
      REFERENCES aportaciones.SnapshotCalculoV2Detalle (SnapshotDetalleId);');
  EXEC(N'ALTER TABLE liquidacion.QnaSnapshotDetalle WITH CHECK
    CHECK CONSTRAINT FK_QnaSnapshotDetalle_SnapshotCalculoV2Detalle;');

  IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id=OBJECT_ID(N'liquidacion.QnaSnapshotDetalle')
      AND name=N'UX_QnaSnapshotDetalle_EmpleadoHash'
  ) EXEC(N'DROP INDEX UX_QnaSnapshotDetalle_EmpleadoHash ON liquidacion.QnaSnapshotDetalle;');
  EXEC(N'CREATE UNIQUE INDEX UX_QnaSnapshotDetalle_EmpleadoHash
    ON liquidacion.QnaSnapshotDetalle (LiquidacionSnapshotId,EmpleadoClaveHash)
    WHERE EmpleadoClaveHash IS NOT NULL;');

  IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id=OBJECT_ID(N'liquidacion.QnaSnapshotDetalle')
      AND name=N'UX_QnaSnapshotDetalle_CalculoDetalle'
  ) EXEC(N'DROP INDEX UX_QnaSnapshotDetalle_CalculoDetalle ON liquidacion.QnaSnapshotDetalle;');
  EXEC(N'CREATE UNIQUE INDEX UX_QnaSnapshotDetalle_CalculoDetalle
    ON liquidacion.QnaSnapshotDetalle (LiquidacionSnapshotId,SnapshotCalculoV2DetalleId)
    WHERE SnapshotCalculoV2DetalleId IS NOT NULL;');

  IF OBJECT_ID(N'liquidacion.CK_QnaSnapshotDetalle_DiasV5', N'C') IS NOT NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle DROP CONSTRAINT CK_QnaSnapshotDetalle_DiasV5;
  EXEC(N'ALTER TABLE liquidacion.QnaSnapshotDetalle WITH CHECK
    ADD CONSTRAINT CK_QnaSnapshotDetalle_DiasV5
    CHECK (DiasLaborados IS NULL OR DiasLaborados BETWEEN 0 AND 15);');

  IF OBJECT_ID(N'liquidacion.CK_QnaSnapshotDetalle_HashesV5', N'C') IS NOT NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle DROP CONSTRAINT CK_QnaSnapshotDetalle_HashesV5;
  EXEC(N'ALTER TABLE liquidacion.QnaSnapshotDetalle WITH CHECK
    ADD CONSTRAINT CK_QnaSnapshotDetalle_HashesV5 CHECK (
      (EmpleadoClaveHash IS NULL OR (LEN(EmpleadoClaveHash)=64
        AND EmpleadoClaveHash COLLATE Latin1_General_100_BIN2 NOT LIKE ''%[^0-9A-F]%''))
      AND (HashFila IS NULL OR (LEN(HashFila)=64
        AND HashFila COLLATE Latin1_General_100_BIN2 NOT LIKE ''%[^0-9A-F]%''))
    );');

  IF OBJECT_ID(N'liquidacion.CK_QnaSnapshotDetalle_ProyeccionV5', N'C') IS NOT NULL
    ALTER TABLE liquidacion.QnaSnapshotDetalle DROP CONSTRAINT CK_QnaSnapshotDetalle_ProyeccionV5;
  EXEC(N'ALTER TABLE liquidacion.QnaSnapshotDetalle WITH CHECK
    ADD CONSTRAINT CK_QnaSnapshotDetalle_ProyeccionV5 CHECK (
        (SnapshotCalculoV2DetalleId IS NULL AND EmpleadoClaveHash IS NULL AND Interno IS NULL
          AND Nombre IS NULL AND DiasLaborados IS NULL AND DiasOrigen IS NULL
          AND SueldoMensualD6 IS NULL AND BaseCotizacionSueldoD6 IS NULL
          AND QuinqueniosMensualD6 IS NULL AND BaseCotizacionQuinqueniosD6 IS NULL
          AND CAIRFondoD6 IS NULL AND PrestacionesD6 IS NULL AND ViviendaD6 IS NULL
          AND GuarderiasD6 IS NULL AND TransitorioD6 IS NULL AND AguinaldoD6 IS NULL AND HashFila IS NULL)
        OR
        (SnapshotCalculoV2DetalleId IS NOT NULL AND EmpleadoClaveHash IS NOT NULL AND Interno IS NOT NULL
          AND Nombre IS NOT NULL AND DiasLaborados IS NOT NULL AND DiasOrigen IS NOT NULL
          AND SueldoMensualD6 IS NOT NULL AND QuinqueniosMensualD6 IS NOT NULL
          AND CAIRFondoD6 IS NOT NULL AND PrestacionesD6 IS NOT NULL AND ViviendaD6 IS NOT NULL
          AND GuarderiasD6 IS NOT NULL AND TransitorioD6 IS NOT NULL AND AguinaldoD6 IS NOT NULL
          AND HashFila IS NOT NULL)
    );');

  IF OBJECT_ID(N'liquidacion.CK_QnaSnapshotFuenteDetalle_PayloadVersionV5', N'C') IS NOT NULL
    ALTER TABLE liquidacion.QnaSnapshotFuenteDetalle DROP CONSTRAINT CK_QnaSnapshotFuenteDetalle_PayloadVersionV5;
  EXEC(N'ALTER TABLE liquidacion.QnaSnapshotFuenteDetalle WITH CHECK
    ADD CONSTRAINT CK_QnaSnapshotFuenteDetalle_PayloadVersionV5
    CHECK (PayloadVersion IS NULL OR PayloadVersion > 0);');

  IF OBJECT_ID(N'liquidacion.CK_QnaSnapshotFuenteDetalle_IdentidadV5', N'C') IS NOT NULL
    ALTER TABLE liquidacion.QnaSnapshotFuenteDetalle DROP CONSTRAINT CK_QnaSnapshotFuenteDetalle_IdentidadV5;
  EXEC(N'ALTER TABLE liquidacion.QnaSnapshotFuenteDetalle WITH CHECK
    ADD CONSTRAINT CK_QnaSnapshotFuenteDetalle_IdentidadV5 CHECK (
      (EmpleadoClave IS NULL AND Rfc IS NULL AND Nombre IS NULL AND PayloadVersion IS NULL)
      OR (EmpleadoClave IS NOT NULL AND Nombre IS NOT NULL AND PayloadVersion IS NOT NULL)
    );');

  IF OBJECT_ID(N'liquidacion.CK_QnaSnapshotFuenteDetalle_Hashes', N'C') IS NOT NULL
    ALTER TABLE liquidacion.QnaSnapshotFuenteDetalle DROP CONSTRAINT CK_QnaSnapshotFuenteDetalle_Hashes;
  EXEC(N'ALTER TABLE liquidacion.QnaSnapshotFuenteDetalle WITH CHECK
    ADD CONSTRAINT CK_QnaSnapshotFuenteDetalle_Hashes CHECK (
      LEN(ClaveFilaHash)=64 AND ClaveFilaHash COLLATE Latin1_General_100_BIN2 NOT LIKE ''%[^0-9A-F]%''
      AND LEN(HashFila)=64 AND HashFila COLLATE Latin1_General_100_BIN2 NOT LIKE ''%[^0-9A-F]%''
    );');

  EXEC(N'CREATE OR ALTER TRIGGER liquidacion.TR_QnaSnapshotDetalle_V5_Completitud
    ON liquidacion.QnaSnapshotDetalle AFTER INSERT AS
    BEGIN
      SET NOCOUNT ON;
      IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN liquidacion.QnaSnapshot q ON q.LiquidacionSnapshotId=i.LiquidacionSnapshotId
        WHERE q.VersionEsquema>=5 AND i.SnapshotCalculoV2DetalleId IS NULL
      ) THROW 51665, ''QNA_SNAPSHOT_DETALLE_V5_INCOMPLETO'', 1;
    END;');

  EXEC(N'CREATE OR ALTER TRIGGER liquidacion.TR_QnaSnapshotFuenteDetalle_V5_Completitud
    ON liquidacion.QnaSnapshotFuenteDetalle AFTER INSERT AS
    BEGIN
      SET NOCOUNT ON;
      IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN liquidacion.QnaSnapshot q ON q.LiquidacionSnapshotId=i.LiquidacionSnapshotId
        WHERE q.VersionEsquema>=5
          AND (i.EmpleadoClave IS NULL OR i.Nombre IS NULL OR i.PayloadVersion<>1)
      ) THROW 51666, ''QNA_SNAPSHOT_FUENTE_DETALLE_V5_INCOMPLETO'', 1;
    END;');

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO
