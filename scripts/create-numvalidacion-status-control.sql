-- =============================================
-- TABLA DE CONTROL PARA ESTADOS DE VALIDACIÓN DE AFILIADOS
-- Fecha: 2025-11-12
-- Descripción: Tabla para controlar los estatus de numValidacion y movimientos del afiliado
-- =============================================

USE [TuBaseDatos] -- Cambiar por el nombre de tu base de datos
GO

-- Crear tabla de control de estados
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[afi.AfiliadoStatusControl]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[afi.AfiliadoStatusControl] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [numValidacion] INT NOT NULL UNIQUE,
        [nombreStatus] NVARCHAR(100) NOT NULL,
        [descripcion] NVARCHAR(500) NULL,
        [color] NVARCHAR(7) NULL, -- Color hexadecimal para UI
        [activo] BIT DEFAULT 1,
        [orden] INT DEFAULT 0,
        [fechaCreacion] DATETIME2 DEFAULT GETDATE(),
        [fechaModificacion] DATETIME2 DEFAULT GETDATE(),
        [usuarioCreacion] NVARCHAR(50) DEFAULT 'SYSTEM',
        [usuarioModificacion] NVARCHAR(50) DEFAULT 'SYSTEM'
    )
END
GO

-- Crear índices para mejor rendimiento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AfiStatusControl_NumValidacion')
    CREATE UNIQUE INDEX IX_AfiStatusControl_NumValidacion 
    ON [dbo].[afi.AfiliadoStatusControl] (numValidacion)
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AfiStatusControl_Activo_Orden')
    CREATE INDEX IX_AfiStatusControl_Activo_Orden 
    ON [dbo].[afi.AfiliadoStatusControl] (activo, orden)
GO

-- Insertar estados iniciales
IF NOT EXISTS (SELECT * FROM [dbo].[afi.AfiliadoStatusControl] WHERE numValidacion = 1)
BEGIN
    INSERT INTO [dbo].[afi.AfiliadoStatusControl] 
    ([numValidacion], [nombreStatus], [descripcion], [color], [orden])
    VALUES 
    (1, 'Registrado', 'Afiliado recién registrado, pendiente de validación inicial', '#6B7280', 1),
    (2, 'Aprobado', 'Afiliado aprobado y validado', '#10B981', 2),
    (3, 'En Revisión', 'Afiliado en proceso de revisión', '#F59E0B', 3),
    (4, 'Rechazado', 'Afiliado rechazado', '#EF4444', 4),
    (5, 'Suspendido', 'Afiliado temporalmente suspendido', '#F97316', 5),
    (6, 'Cancelado', 'Afiliado cancelado por solicitud', '#6B7280', 6)
END
GO

-- Crear tabla de historial de movimientos (opcional, para auditoría)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[afi.AfiliadoStatusHistory]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[afi.AfiliadoStatusHistory] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [afiliadoId] INT NOT NULL, -- ID del afiliado
        [numValidacionAnterior] INT NULL,
        [numValidacionNuevo] INT NOT NULL,
        [statusAnterior] NVARCHAR(100) NULL,
        [statusNuevo] NVARCHAR(100) NOT NULL,
        [motivo] NVARCHAR(500) NULL, -- Razón del cambio
        [observaciones] NVARCHAR(1000) NULL,
        [usuarioId] NVARCHAR(50) NOT NULL, -- Usuario que realizó el cambio
        [fechaCambio] DATETIME2 DEFAULT GETDATE(),
        [ipAddress] NVARCHAR(45) NULL, -- Dirección IP del usuario
        [userAgent] NVARCHAR(500) NULL -- Navegador/dispositivo utilizado
    )
END
GO

-- Índices para la tabla de historial
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AfiStatusHistory_AfiliadoId')
    CREATE INDEX IX_AfiStatusHistory_AfiliadoId 
    ON [dbo].[afi.AfiliadoStatusHistory] (afiliadoId)
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AfiStatusHistory_FechaCambio')
    CREATE INDEX IX_AfiStatusHistory_FechaCambio 
    ON [dbo].[afi.AfiliadoStatusHistory] (fechaCambio)
GO

-- Crear función para obtener el nombre del status
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[fnGetAfiliadoStatusName]') AND type in (N'FN', N'IF', N'TF', N'FS', N'FT'))
BEGIN
    EXEC('
    CREATE FUNCTION [dbo].[fnGetAfiliadoStatusName](@numValidacion INT)
    RETURNS NVARCHAR(100)
    AS
    BEGIN
        DECLARE @statusName NVARCHAR(100)
        SELECT @statusName = nombreStatus 
        FROM [dbo].[afi.AfiliadoStatusControl]
        WHERE numValidacion = @numValidacion AND activo = 1
        RETURN ISNULL(@statusName, ''Desconocido'')
    END')
END
GO

-- Crear procedimiento para cambiar status de afiliado
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[spCambiarStatusAfiliado]') AND type in (N'P', N'PC'))
BEGIN
    EXEC('
    CREATE PROCEDURE [dbo].[spCambiarStatusAfiliado]
        @afiliadoId INT,
        @numValidacionNuevo INT,
        @usuarioId NVARCHAR(50),
        @motivo NVARCHAR(500) = NULL,
        @observaciones NVARCHAR(1000) = NULL,
        @ipAddress NVARCHAR(45) = NULL,
        @userAgent NVARCHAR(500) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        
        DECLARE @numValidacionAnterior INT
        DECLARE @statusAnterior NVARCHAR(100)
        DECLARE @statusNuevo NVARCHAR(100)
        DECLARE @errorMessage NVARCHAR(500)
        
        -- Obtener status actual
        SELECT @numValidacionAnterior = numValidacion, @statusAnterior = nombreStatus
        FROM [dbo].[afi.Afiliado]
        INNER JOIN [dbo].[afi.AfiliadoStatusControl] ON numValidacion = numValidacion
        WHERE id = @afiliadoId
        
        -- Verificar que el afiliado existe
        IF @numValidacionAnterior IS NULL
        BEGIN
            RAISERROR(''Afiliado no encontrado'', 16, 1)
            RETURN
        END
        
        -- Verificar que el nuevo status existe y está activo
        IF NOT EXISTS (SELECT 1 FROM [dbo].[afi.AfiliadoStatusControl] WHERE numValidacion = @numValidacionNuevo AND activo = 1)
        BEGIN
            RAISERROR(''Status de validación no válido'', 16, 1)
            RETURN
        END
        
        -- Obtener nombre del nuevo status
        SELECT @statusNuevo = nombreStatus FROM [dbo].[afi.AfiliadoStatusControl] WHERE numValidacion = @numValidacionNuevo
        
        -- Iniciar transacción
        BEGIN TRANSACTION
        
        BEGIN TRY
            -- Actualizar el afiliado
            UPDATE [dbo].[afi.Afiliado]
            SET numValidacion = @numValidacionNuevo,
                fechaModificacion = GETDATE(),
                usuarioModificacion = @usuarioId
            WHERE id = @afiliadoId
            
            -- Insertar en historial
            INSERT INTO [dbo].[afi.AfiliadoStatusHistory]
            (afiliadoId, numValidacionAnterior, numValidacionNuevo, statusAnterior, statusNuevo, 
             motivo, observaciones, usuarioId, ipAddress, userAgent)
            VALUES
            (@afiliadoId, @numValidacionAnterior, @numValidacionNuevo, @statusAnterior, @statusNuevo,
             @motivo, @observaciones, @usuarioId, @ipAddress, @userAgent)
             
            COMMIT TRANSACTION
            
            SELECT 
                @afiliadoId as afiliadoId,
                @numValidacionAnterior as numValidacionAnterior,
                @numValidacionNuevo as numValidacionNuevo,
                @statusAnterior as statusAnterior,
                @statusNuevo as statusNuevo,
                ''Status actualizado exitosamente'' as mensaje
                
        END TRY
        BEGIN CATCH
            ROLLBACK TRANSACTION
            
            SELECT 
                @afiliadoId as afiliadoId,
                @numValidacionAnterior as numValidacionAnterior,
                @numValidacionNuevo as numValidacionNuevo,
                @statusAnterior as statusAnterior,
                @statusNuevo as statusNuevo,
                ERROR_MESSAGE() as mensaje
        END CATCH
    END')
END
GO

-- Crear vista para obtener afiliados con sus status
IF NOT EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[vAfiliadosConStatus]'))
BEGIN
    EXEC('
    CREATE VIEW [dbo].[vAfiliadosConStatus] AS
    SELECT 
        a.id,
        a.curp,
        a.rfc,
        a.nombre,
        a.apellidoPaterno,
        a.apellidoMaterno,
        a.email,
        a.telefono,
        a.afiliadosComplete,
        a.numValidacion,
        s.nombreStatus,
        s.descripcion as statusDescripcion,
        s.color as statusColor,
        a.fechaCreacion,
        a.fechaModificacion,
        a.usuarioCreacion,
        a.usuarioModificacion
    FROM [dbo].[afi.Afiliado] a
    INNER JOIN [dbo].[afi.AfiliadoStatusControl] s ON a.numValidacion = s.numValidacion
    WHERE s.activo = 1')
END
GO

PRINT 'Tablas de control de status de afiliados creadas exitosamente'
PRINT 'Estados disponibles:'
SELECT numValidacion, nombreStatus, descripcion, color 
FROM [dbo].[afi.AfiliadoStatusControl] 
WHERE activo = 1 
ORDER BY orden