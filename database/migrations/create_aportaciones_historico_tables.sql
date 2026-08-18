-- =============================================
-- Script de Migración: Tablas de Histórico para Aportaciones de Fondos
-- Descripción: Crea tablas para almacenar el histórico de consultas a los endpoints
--              de aportaciones de fondos, organizadas por periodo orgánica, quincena y año
--              Cada endpoint tiene su propia tabla independiente
-- Fecha: 2026-01-04
-- NOTA: Se EXCLUYE el endpoint /aportacionesFondos/completas
-- =============================================

USE [BICSN]
GO

-- Crear esquema si no existe
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'aportaciones')
BEGIN
    EXEC('CREATE SCHEMA [aportaciones]')
END
GO

-- =============================================
-- 1. Tabla: aportaciones.IndividualesAhorroHistorico
-- Almacena datos de /aportacionesFondos/individuales/ahorro
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[aportaciones].[IndividualesAhorroHistorico]') AND type in (N'U'))
BEGIN
    CREATE TABLE [aportaciones].[IndividualesAhorroHistorico] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [clave_organica_0] CHAR(2) NOT NULL,
        [clave_organica_1] CHAR(2) NOT NULL,
        [quincena] INT NOT NULL,
        [anio] INT NOT NULL,
        [periodo] CHAR(4) NOT NULL, -- formato: quincena (2 dígitos) + año (2 últimos dígitos)
        
        -- Datos del empleado
        [interno] INT NOT NULL,
        [nombre] NVARCHAR(255) NULL,
        [sueldo] DECIMAL(18,2) NULL,
        [quinquenios] DECIMAL(18,2) NULL,
        [otras_prestaciones] DECIMAL(18,2) NULL,
        [sueldo_base] DECIMAL(18,2) NOT NULL,
        
        -- Aportaciones de ahorro
        [afae] DECIMAL(18,2) NULL, -- Ahorro - patron contribution
        [afaa] DECIMAL(18,2) NULL, -- Ahorro - employee contribution
        [total] DECIMAL(18,2) NOT NULL,
        
        -- Auditoría
        [fecha_consulta] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [usuario_id] NVARCHAR(50) NULL,
        
        -- Constraints
        CONSTRAINT [CK_IndividualesAhorroHistorico_Quincena] CHECK ([quincena] >= 1 AND [quincena] <= 24),
        CONSTRAINT [CK_IndividualesAhorroHistorico_Anio] CHECK ([anio] >= 2000 AND [anio] <= 2100),
        CONSTRAINT [CK_IndividualesAhorroHistorico_Periodo] CHECK (LEN([periodo]) = 4)
    )
END
GO

-- =============================================
-- 2. Tabla: aportaciones.IndividualesViviendaHistorico
-- Almacena datos de /aportacionesFondos/individuales/vivienda
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[aportaciones].[IndividualesViviendaHistorico]') AND type in (N'U'))
BEGIN
    CREATE TABLE [aportaciones].[IndividualesViviendaHistorico] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [clave_organica_0] CHAR(2) NOT NULL,
        [clave_organica_1] CHAR(2) NOT NULL,
        [quincena] INT NOT NULL,
        [anio] INT NOT NULL,
        [periodo] CHAR(4) NOT NULL,
        
        -- Datos del empleado
        [interno] INT NOT NULL,
        [nombre] NVARCHAR(255) NULL,
        [sueldo] DECIMAL(18,2) NULL,
        [quinquenios] DECIMAL(18,2) NULL,
        [otras_prestaciones] DECIMAL(18,2) NULL,
        [sueldo_base] DECIMAL(18,2) NOT NULL,
        
        -- Aportaciones de vivienda
        [afe] DECIMAL(18,2) NULL,  -- Vivienda - patron contribution
        [total] DECIMAL(18,2) NOT NULL,
        
        -- Auditoría
        [fecha_consulta] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [usuario_id] NVARCHAR(50) NULL,
        
        -- Constraints
        CONSTRAINT [CK_IndividualesViviendaHistorico_Quincena] CHECK ([quincena] >= 1 AND [quincena] <= 24),
        CONSTRAINT [CK_IndividualesViviendaHistorico_Anio] CHECK ([anio] >= 2000 AND [anio] <= 2100),
        CONSTRAINT [CK_IndividualesViviendaHistorico_Periodo] CHECK (LEN([periodo]) = 4)
    )
END
GO

-- =============================================
-- 3. Tabla: aportaciones.IndividualesPrestacionesHistorico
-- Almacena datos de /aportacionesFondos/individuales/prestaciones
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[aportaciones].[IndividualesPrestacionesHistorico]') AND type in (N'U'))
BEGIN
    CREATE TABLE [aportaciones].[IndividualesPrestacionesHistorico] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [clave_organica_0] CHAR(2) NOT NULL,
        [clave_organica_1] CHAR(2) NOT NULL,
        [quincena] INT NOT NULL,
        [anio] INT NOT NULL,
        [periodo] CHAR(4) NOT NULL,
        
        -- Datos del empleado
        [interno] INT NOT NULL,
        [nombre] NVARCHAR(255) NULL,
        [sueldo] DECIMAL(18,2) NULL,
        [quinquenios] DECIMAL(18,2) NULL,
        [otras_prestaciones] DECIMAL(18,2) NULL,
        [sueldo_base] DECIMAL(18,2) NOT NULL,
        
        -- Aportaciones de prestaciones
        [afpe] DECIMAL(18,2) NULL, -- Prestaciones - patron contribution
        [afpa] DECIMAL(18,2) NULL, -- Prestaciones - employee contribution
        [total] DECIMAL(18,2) NOT NULL,
        
        -- Auditoría
        [fecha_consulta] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [usuario_id] NVARCHAR(50) NULL,
        
        -- Constraints
        CONSTRAINT [CK_IndividualesPrestacionesHistorico_Quincena] CHECK ([quincena] >= 1 AND [quincena] <= 24),
        CONSTRAINT [CK_IndividualesPrestacionesHistorico_Anio] CHECK ([anio] >= 2000 AND [anio] <= 2100),
        CONSTRAINT [CK_IndividualesPrestacionesHistorico_Periodo] CHECK (LEN([periodo]) = 4)
    )
END
GO

-- =============================================
-- 4. Tabla: aportaciones.IndividualesCairHistorico
-- Almacena datos de /aportacionesFondos/individuales/cair
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[aportaciones].[IndividualesCairHistorico]') AND type in (N'U'))
BEGIN
    CREATE TABLE [aportaciones].[IndividualesCairHistorico] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [clave_organica_0] CHAR(2) NOT NULL,
        [clave_organica_1] CHAR(2) NOT NULL,
        [quincena] INT NOT NULL,
        [anio] INT NOT NULL,
        [periodo] CHAR(4) NOT NULL,
        
        -- Datos del empleado
        [interno] INT NOT NULL,
        [nombre] NVARCHAR(255) NULL,
        [sueldo] DECIMAL(18,2) NULL,
        [quinquenios] DECIMAL(18,2) NULL,
        [otras_prestaciones] DECIMAL(18,2) NULL,
        [sueldo_base] DECIMAL(18,2) NOT NULL,
        
        -- Aportaciones de CAIR
        [afe] DECIMAL(18,2) NULL,  -- CAIR - patron contribution
        [total] DECIMAL(18,2) NOT NULL,
        
        -- Auditoría
        [fecha_consulta] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [usuario_id] NVARCHAR(50) NULL,
        
        -- Constraints
        CONSTRAINT [CK_IndividualesCairHistorico_Quincena] CHECK ([quincena] >= 1 AND [quincena] <= 24),
        CONSTRAINT [CK_IndividualesCairHistorico_Anio] CHECK ([anio] >= 2000 AND [anio] <= 2100),
        CONSTRAINT [CK_IndividualesCairHistorico_Periodo] CHECK (LEN([periodo]) = 4)
    )
END
GO

-- =============================================
-- 5. Tabla: aportaciones.PrestamosCortoPlazoHistorico
-- Almacena datos de /aportacionesFondos/individuales/prestamos-corto-plazo
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[aportaciones].[PrestamosCortoPlazoHistorico]') AND type in (N'U'))
BEGIN
    CREATE TABLE [aportaciones].[PrestamosCortoPlazoHistorico] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [clave_organica_0] CHAR(2) NOT NULL,
        [clave_organica_1] CHAR(2) NOT NULL,
        [quincena] INT NOT NULL,
        [anio] INT NOT NULL,
        [periodo] CHAR(4) NOT NULL,
        
        -- Datos del empleado
        [interno] INT NOT NULL,
        [rfc] NVARCHAR(13) NULL,
        [nombre] NVARCHAR(255) NULL,
        
        -- Datos del préstamo
        [prestamo] INT NULL,
        [letra] INT NULL,
        [plazo] INT NULL,
        [periodo_c] NVARCHAR(10) NULL,
        [fecha_c] DATETIME2 NULL,
        
        -- Montos
        [capital] DECIMAL(18,2) NULL,
        [interes] DECIMAL(18,2) NULL,
        [monto] DECIMAL(18,2) NULL,
        [moratorios] DECIMAL(18,2) NULL,
        [total] DECIMAL(18,2) NULL,
        
        -- Información adicional
        [resultado] NVARCHAR(50) NULL,
        [td] NVARCHAR(10) NULL,
        
        -- Organización
        [org0] CHAR(2) NULL,
        [org1] CHAR(2) NULL,
        [org2] CHAR(2) NULL,
        [org3] CHAR(2) NULL,
        [norg0] NVARCHAR(255) NULL,
        [norg1] NVARCHAR(255) NULL,
        [norg2] NVARCHAR(255) NULL,
        [norg3] NVARCHAR(255) NULL,
        
        -- Auditoría
        [fecha_consulta] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [usuario_id] NVARCHAR(50) NULL,
        
        -- Constraints
        CONSTRAINT [CK_PrestamosCortoPlazoHistorico_Quincena] CHECK ([quincena] >= 1 AND [quincena] <= 24),
        CONSTRAINT [CK_PrestamosCortoPlazoHistorico_Anio] CHECK ([anio] >= 2000 AND [anio] <= 2100),
        CONSTRAINT [CK_PrestamosCortoPlazoHistorico_Periodo] CHECK (LEN([periodo]) = 4)
    )
END
GO

-- =============================================
-- 6. Tabla: aportaciones.PrestamosMedianoPlazoHistorico
-- Almacena datos de /aportacionesFondos/individuales/prestamos-mediano-plazo
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[aportaciones].[PrestamosMedianoPlazoHistorico]') AND type in (N'U'))
BEGIN
    CREATE TABLE [aportaciones].[PrestamosMedianoPlazoHistorico] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [clave_organica_0] CHAR(2) NOT NULL,
        [clave_organica_1] CHAR(2) NOT NULL,
        [quincena] INT NOT NULL,
        [anio] INT NOT NULL,
        [periodo] CHAR(4) NOT NULL,
        
        -- Datos del empleado
        [interno] INT NOT NULL,
        [rfc] NVARCHAR(13) NULL,
        [nombre] NVARCHAR(255) NULL,
        
        -- Datos del préstamo
        [prestamo] INT NULL,
        [letra] INT NULL,
        [plazo] INT NULL,
        [periodo_c] NVARCHAR(10) NULL,
        [fecha_c] DATETIME2 NULL,
        
        -- Montos
        [capital] DECIMAL(18,2) NULL,
        [moratorios] DECIMAL(18,2) NULL,
        [interes] DECIMAL(18,2) NULL,
        [seguro] DECIMAL(18,2) NULL,
        [total] DECIMAL(18,2) NULL,
        
        -- Información adicional
        [resultado] NVARCHAR(50) NULL,
        [clase] NVARCHAR(10) NULL,
        [desc_clase] NVARCHAR(255) NULL,
        [desc_prestamo] NVARCHAR(255) NULL,
        [clave_p] NVARCHAR(20) NULL,
        [noemple] NVARCHAR(50) NULL,
        [folio] INT NULL,
        [anio_prestamo] INT NULL, -- anio del préstamo (diferente del anio de la consulta)
        [po] NVARCHAR(20) NULL,
        [fecha_origen] DATETIME2 NULL,
        
        -- Organización
        [org0] CHAR(2) NULL,
        [org1] CHAR(2) NULL,
        [org2] CHAR(2) NULL,
        [org3] CHAR(2) NULL,
        [norg0] NVARCHAR(255) NULL,
        [norg1] NVARCHAR(255) NULL,
        [norg2] NVARCHAR(255) NULL,
        [norg3] NVARCHAR(255) NULL,
        
        -- Auditoría
        [fecha_consulta] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [usuario_id] NVARCHAR(50) NULL,
        
        -- Constraints
        CONSTRAINT [CK_PrestamosMedianoPlazoHistorico_Quincena] CHECK ([quincena] >= 1 AND [quincena] <= 24),
        CONSTRAINT [CK_PrestamosMedianoPlazoHistorico_Anio] CHECK ([anio] >= 2000 AND [anio] <= 2100),
        CONSTRAINT [CK_PrestamosMedianoPlazoHistorico_Periodo] CHECK (LEN([periodo]) = 4)
    )
END
GO

-- =============================================
-- 7. Tabla: aportaciones.PrestamosHipotecariosHistorico
-- Almacena datos de /aportacionesFondos/individuales/prestamos-hipotecarios
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[aportaciones].[PrestamosHipotecariosHistorico]') AND type in (N'U'))
BEGIN
    CREATE TABLE [aportaciones].[PrestamosHipotecariosHistorico] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [clave_organica_0] CHAR(2) NOT NULL,
        [clave_organica_1] CHAR(2) NOT NULL,
        [quincena] INT NOT NULL,
        [anio] INT NOT NULL,
        [periodo] CHAR(4) NOT NULL,
        [computadora_antigua] BIT NOT NULL DEFAULT 0,
        
        -- Datos del empleado
        [interno] INT NOT NULL,
        [nombre] NVARCHAR(255) NULL,
        [noempleado] NVARCHAR(50) NULL,
        [rfc] NVARCHAR(13) NULL,
        
        -- Datos del préstamo
        [cantidad] DECIMAL(18,2) NULL,
        [status] NVARCHAR(50) NULL,
        [referencia_1] NVARCHAR(100) NULL,
        [referencia_2] NVARCHAR(100) NULL,
        [pno_solicitud] INT NULL,
        [pano] INT NULL,
        [pclave_clase_prestamo] NVARCHAR(20) NULL,
        [pdescripcion] NVARCHAR(255) NULL,
        [pclave_prestamo] NVARCHAR(20) NULL,
        [prestamo_desc] NVARCHAR(255) NULL,
        [tipo] NVARCHAR(50) NULL,
        [periodo_c] NVARCHAR(10) NULL,
        [descto] DECIMAL(18,2) NULL,
        [fecha_c] DATETIME2 NULL,
        [resultado] NVARCHAR(50) NULL,
        [po] NVARCHAR(20) NULL,
        [fecha_origen] DATETIME2 NULL,
        [plazo] INT NULL,
        
        -- Montos a pagar
        [capital_pagar] DECIMAL(18,2) NULL,
        [interes_pagar] DECIMAL(18,2) NULL,
        [interes_diferido_pagar] DECIMAL(18,2) NULL,
        [seguro_pagar] DECIMAL(18,2) NULL,
        [moratorio_pagar] DECIMAL(18,2) NULL,
        
        -- Organización
        [org0] CHAR(2) NULL,
        [org1] CHAR(2) NULL,
        [org2] CHAR(2) NULL,
        [org3] CHAR(2) NULL,
        [norg0] NVARCHAR(255) NULL,
        [norg1] NVARCHAR(255) NULL,
        [norg2] NVARCHAR(255) NULL,
        [norg3] NVARCHAR(255) NULL,
        
        -- Auditoría
        [fecha_consulta] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [usuario_id] NVARCHAR(50) NULL,
        
        -- Constraints
        CONSTRAINT [CK_PrestamosHipotecariosHistorico_Quincena] CHECK ([quincena] >= 1 AND [quincena] <= 24),
        CONSTRAINT [CK_PrestamosHipotecariosHistorico_Anio] CHECK ([anio] >= 2000 AND [anio] <= 2100),
        CONSTRAINT [CK_PrestamosHipotecariosHistorico_Periodo] CHECK (LEN([periodo]) = 4)
    )
END
GO

-- =============================================
-- 8. Tabla: aportaciones.GuarderiasHistorico
-- Almacena datos de /aportacionesFondos/aportacion-guarderias
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[aportaciones].[GuarderiasHistorico]') AND type in (N'U'))
BEGIN
    CREATE TABLE [aportaciones].[GuarderiasHistorico] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [clave_organica_0] CHAR(2) NOT NULL,
        [clave_organica_1] CHAR(2) NOT NULL,
        [quincena] INT NOT NULL,
        [anio] INT NOT NULL,
        [periodo] CHAR(4) NOT NULL,
        
        -- Datos del titular
        [titular_nombre] NVARCHAR(255) NULL,
        [titular_no_empleado] NVARCHAR(50) NULL,
        [titular_monto] DECIMAL(18,2) NULL,
        [titular_rfc] NVARCHAR(13) NULL,
        [titular_monto_texto] NVARCHAR(100) NULL,
        [titular_org0] CHAR(2) NULL,
        [titular_org0_nombre] NVARCHAR(255) NULL,
        [titular_org1] CHAR(2) NULL,
        [titular_org1_nombre] NVARCHAR(255) NULL,
        [titular_org2] CHAR(2) NULL,
        [titular_org2_nombre] NVARCHAR(255) NULL,
        [titular_org3] CHAR(2) NULL,
        [titular_org3_nombre] NVARCHAR(255) NULL,
        
        -- Datos del recibo
        [entidad_monto] DECIMAL(18,2) NULL,
        [recibo_ajuste] DECIMAL(18,2) NULL,
        [recibo_total] DECIMAL(18,2) NULL,
        [recibo_mes_ano] NVARCHAR(20) NULL,
        [recibo_fecha_venc] DATETIME2 NULL,
        [recibo_folio] NVARCHAR(50) NULL,
        
        -- Datos del menor
        [menor_id] INT NULL,
        [menor_nombre] NVARCHAR(255) NULL,
        [menor_rfc] NVARCHAR(13) NULL,
        [menor_nivel] NVARCHAR(50) NULL,
        [menor_sala] NVARCHAR(50) NULL,
        [estatus] NVARCHAR(50) NULL,
        
        -- Auditoría
        [fecha_consulta] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [usuario_id] NVARCHAR(50) NULL,
        
        -- Constraints
        CONSTRAINT [CK_GuarderiasHistorico_Quincena] CHECK ([quincena] >= 1 AND [quincena] <= 24),
        CONSTRAINT [CK_GuarderiasHistorico_Anio] CHECK ([anio] >= 2000 AND [anio] <= 2100),
        CONSTRAINT [CK_GuarderiasHistorico_Periodo] CHECK (LEN([periodo]) = 4)
    )
END
GO

-- =============================================
-- 9. Tabla: aportaciones.PensionNominaTransitorioHistorico
-- Almacena datos de /aportacionesFondos/pension-nomina-transitorio
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[aportaciones].[PensionNominaTransitorioHistorico]') AND type in (N'U'))
BEGIN
    CREATE TABLE [aportaciones].[PensionNominaTransitorioHistorico] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [clave_organica_0] CHAR(2) NOT NULL,
        [clave_organica_1] CHAR(2) NOT NULL,
        [quincena] INT NOT NULL,
        [anio] INT NOT NULL,
        [periodo] CHAR(4) NOT NULL,
        
        -- Datos del pensionado
        [fpension] INT NULL,
        [interno] INT NULL,
        [nombres] NVARCHAR(255) NULL,
        [nonombre] NVARCHAR(50) NULL,
        [rfc] NVARCHAR(13) NULL,
        [norfc] NVARCHAR(13) NULL,
        
        -- Organización
        [org0] CHAR(2) NULL,
        [org1] CHAR(2) NULL,
        [org2] CHAR(2) NULL,
        [org3] CHAR(2) NULL,
        [norg0] NVARCHAR(255) NULL,
        [norg1] NVARCHAR(255) NULL,
        [norg2] NVARCHAR(255) NULL,
        [norg3] NVARCHAR(255) NULL,
        
        -- Sueldos y prestaciones
        [sueldo] DECIMAL(18,2) NULL,
        [oprestaciones] DECIMAL(18,2) NULL,
        [quinquenios] DECIMAL(18,2) NULL,
        [sdo] DECIMAL(18,2) NULL,
        [oprest] DECIMAL(18,2) NULL,
        [quinq] DECIMAL(18,2) NULL,
        
        -- Pensiones
        [tpension] DECIMAL(18,2) NULL,
        [transitorio] DECIMAL(18,2) NULL,
        
        -- Conceptos
        [cconcepto] NVARCHAR(20) NULL,
        [descripcion] NVARCHAR(255) NULL,
        [importe] DECIMAL(18,2) NULL,
        [defuncion] DATETIME2 NULL,
        
        -- Deducciones varias
        [pcp] DECIMAL(18,2) NULL,
        [palimenticia] DECIMAL(18,2) NULL,
        [retroactivo] DECIMAL(18,2) NULL,
        [payudaecon] DECIMAL(18,2) NULL,
        [otrosp1] DECIMAL(18,2) NULL,
        [otrosp2] DECIMAL(18,2) NULL,
        [otrosp3] DECIMAL(18,2) NULL,
        [otrosp4] DECIMAL(18,2) NULL,
        [otrosp5] DECIMAL(18,2) NULL,
        [terreno] DECIMAL(18,2) NULL,
        [hipviv] DECIMAL(18,2) NULL,
        [prodental] DECIMAL(18,2) NULL,
        [otrod1] DECIMAL(18,2) NULL,
        [otrod2] DECIMAL(18,2) NULL,
        [otrod3] DECIMAL(18,2) NULL,
        [otrod4] DECIMAL(18,2) NULL,
        [otrod5] DECIMAL(18,2) NULL,
        [otrod6] DECIMAL(18,2) NULL,
        
        -- Totales
        [tpercep] DECIMAL(18,2) NULL,
        [tdeduc] DECIMAL(18,2) NULL,
        [total] DECIMAL(18,2) NULL,
        
        -- Información adicional
        [fin] DATETIME2 NULL,
        [inicio] DATETIME2 NULL,
        [anio_registro] INT NULL,
        [sihay] NVARCHAR(10) NULL,
        [porcentaje] DECIMAL(18,2) NULL,
        [sdoporc] DECIMAL(18,2) NULL,
        [ayudporc] DECIMAL(18,2) NULL,
        [quinqporc] DECIMAL(18,2) NULL,
        
        -- Organización transitoria
        [transorg0] CHAR(2) NULL,
        [transorg1] CHAR(2) NULL,
        [transnorg0] NVARCHAR(255) NULL,
        [transnorg1] NVARCHAR(255) NULL,
        
        -- Auditoría
        [fecha_consulta] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [usuario_id] NVARCHAR(50) NULL,
        
        -- Constraints
        CONSTRAINT [CK_PensionNominaTransitorioHistorico_Quincena] CHECK ([quincena] >= 1 AND [quincena] <= 24),
        CONSTRAINT [CK_PensionNominaTransitorioHistorico_Anio] CHECK ([anio] >= 2000 AND [anio] <= 2100),
        CONSTRAINT [CK_PensionNominaTransitorioHistorico_Periodo] CHECK (LEN([periodo]) = 4)
    )
END
GO

-- =============================================
-- 10. Tabla: aportaciones.AguinaldoHistorico
-- Almacena datos de /aportacionesFondos/individuales/aguinaldo
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[aportaciones].[AguinaldoHistorico]') AND type in (N'U'))
BEGIN
    CREATE TABLE [aportaciones].[AguinaldoHistorico] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [clave_organica_0] CHAR(2) NOT NULL,
        [clave_organica_1] CHAR(2) NOT NULL,
        [quincena] INT NOT NULL,
        [anio] INT NOT NULL,
        [periodo] CHAR(4) NOT NULL,
        
        -- Datos del empleado
        [interno] INT NULL,
        [org0] CHAR(2) NULL,
        [org1] CHAR(2) NULL,
        [org2] CHAR(2) NULL,
        [org3] CHAR(2) NULL,
        [movimiento] NVARCHAR(10) NULL,
        [noempleado] NVARCHAR(50) NULL,
        [tipomovimiento] NVARCHAR(10) NULL,
        [nombres] NVARCHAR(255) NULL,
        [rfc] NVARCHAR(13) NULL,
        [curp] NVARCHAR(18) NULL,
        [fecha] DATETIME2 NULL,
        
        -- Datos de aguinaldo
        [dias_aguinaldo] INT NULL,
        [cuantos] INT NULL,
        [cuantos_ori] INT NULL,
        [nocontar] NVARCHAR(10) NULL,
        [sdo] DECIMAL(18,2) NULL,
        [op] DECIMAL(18,2) NULL,
        [q] DECIMAL(18,2) NULL,
        [activo] NVARCHAR(10) NULL,
        [nom_activo] NVARCHAR(255) NULL,
        [qna_a] INT NULL,
        [porcentaje_a] DECIMAL(18,2) NULL,
        [diario] DECIMAL(18,2) NULL,
        [general] DECIMAL(18,2) NULL,
        [porcentaje] DECIMAL(18,2) NULL,
        [proporcion] DECIMAL(18,2) NULL,
        [mensaje] NVARCHAR(255) NULL,
        [dias_gral_agui] INT NULL,
        
        -- Fechas
        [fecha_lf] DATETIME2 NULL,
        [fecha_li] DATETIME2 NULL,
        [f_inicio] DATETIME2 NULL,
        [f_fin] DATETIME2 NULL,
        
        -- Organización nombres
        [norg0] NVARCHAR(255) NULL,
        [norg1] NVARCHAR(255) NULL,
        [norg2] NVARCHAR(255) NULL,
        [norg3] NVARCHAR(255) NULL,
        
        -- Auditoría
        [fecha_consulta] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [usuario_id] NVARCHAR(50) NULL,
        
        -- Constraints
        CONSTRAINT [CK_AguinaldoHistorico_Quincena] CHECK ([quincena] >= 1 AND [quincena] <= 24),
        CONSTRAINT [CK_AguinaldoHistorico_Anio] CHECK ([anio] >= 2000 AND [anio] <= 2100),
        CONSTRAINT [CK_AguinaldoHistorico_Periodo] CHECK (LEN([periodo]) = 4)
    )
END
GO

-- =============================================
-- 11. Tabla: aportaciones.ResumenHistorico
-- Almacena los resúmenes/totales de cada consulta
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[aportaciones].[ResumenHistorico]') AND type in (N'U'))
BEGIN
    CREATE TABLE [aportaciones].[ResumenHistorico] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [tipo_endpoint] NVARCHAR(50) NOT NULL, -- individuales/ahorro, individuales/vivienda, individuales/prestaciones, individuales/cair, guarderias, prestamos-corto-plazo, prestamos-mediano-plazo, prestamos-hipotecarios, pension-nomina-transitorio, individuales/aguinaldo
        [clave_organica_0] CHAR(2) NOT NULL,
        [clave_organica_1] CHAR(2) NOT NULL,
        [quincena] INT NOT NULL,
        [anio] INT NOT NULL,
        [periodo] CHAR(4) NOT NULL,
        
        -- Resúmenes para aportaciones individuales
        [total_empleados] INT NULL,
        [total_contribucion] DECIMAL(18,2) NULL,
        [total_sueldo_base] DECIMAL(18,2) NULL,
        
        -- Resúmenes para préstamos
        [total_prestamos] INT NULL,
        [total_capital] DECIMAL(18,2) NULL,
        [total_interes] DECIMAL(18,2) NULL,
        [total_moratorios] DECIMAL(18,2) NULL,
        [total_seguro] DECIMAL(18,2) NULL, -- para préstamos mediano plazo e hipotecarios
        [total_general] DECIMAL(18,2) NULL,
        
        -- Resúmenes para guarderías
        [total_aportaciones] INT NULL,
        [total_titular_monto] DECIMAL(18,2) NULL,
        [total_entidad_monto] DECIMAL(18,2) NULL,
        [total_recibo] DECIMAL(18,2) NULL,
        
        -- Resúmenes para pension-nomina-transitorio
        [total_registros] INT NULL,
        [total_percepciones] DECIMAL(18,2) NULL,
        [total_deducciones] DECIMAL(18,2) NULL,
        [total_pension] DECIMAL(18,2) NULL,
        
        -- Información adicional
        [accion] NVARCHAR(20) NULL, -- APLICAR, TERMINADO, etc.
        [computadora_antigua] BIT NULL, -- solo para préstamos hipotecarios
        
        -- Auditoría
        [fecha_consulta] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [usuario_id] NVARCHAR(50) NULL,
        
        -- Constraints
        CONSTRAINT [CK_ResumenHistorico_TipoEndpoint] CHECK ([tipo_endpoint] IN (
            'individuales/ahorro', 
            'individuales/vivienda',
            'individuales/prestaciones', 
            'individuales/cair', 
            'guarderias', 
            'prestamos-corto-plazo', 
            'prestamos-mediano-plazo', 
            'prestamos-hipotecarios',
            'pension-nomina-transitorio',
            'individuales/aguinaldo'
        )),
        CONSTRAINT [CK_ResumenHistorico_Quincena] CHECK ([quincena] >= 1 AND [quincena] <= 24),
        CONSTRAINT [CK_ResumenHistorico_Anio] CHECK ([anio] >= 2000 AND [anio] <= 2100),
        CONSTRAINT [CK_ResumenHistorico_Periodo] CHECK (LEN([periodo]) = 4)
    )
END
GO

-- =============================================
-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
-- =============================================

-- Índices para aportaciones.IndividualesAhorroHistorico
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesAhorroHistorico_OrganicaPeriodo' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesAhorroHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesAhorroHistorico_OrganicaPeriodo]
    ON [aportaciones].[IndividualesAhorroHistorico] ([clave_organica_0], [clave_organica_1], [anio], [quincena])
    INCLUDE ([interno], [total])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesAhorroHistorico_Periodo' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesAhorroHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesAhorroHistorico_Periodo]
    ON [aportaciones].[IndividualesAhorroHistorico] ([periodo])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesAhorroHistorico_Interno' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesAhorroHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesAhorroHistorico_Interno]
    ON [aportaciones].[IndividualesAhorroHistorico] ([interno])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesAhorroHistorico_FechaConsulta' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesAhorroHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesAhorroHistorico_FechaConsulta]
    ON [aportaciones].[IndividualesAhorroHistorico] ([fecha_consulta])
GO

-- Índices para aportaciones.IndividualesViviendaHistorico
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesViviendaHistorico_OrganicaPeriodo' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesViviendaHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesViviendaHistorico_OrganicaPeriodo]
    ON [aportaciones].[IndividualesViviendaHistorico] ([clave_organica_0], [clave_organica_1], [anio], [quincena])
    INCLUDE ([interno], [total])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesViviendaHistorico_Periodo' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesViviendaHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesViviendaHistorico_Periodo]
    ON [aportaciones].[IndividualesViviendaHistorico] ([periodo])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesViviendaHistorico_Interno' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesViviendaHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesViviendaHistorico_Interno]
    ON [aportaciones].[IndividualesViviendaHistorico] ([interno])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesViviendaHistorico_FechaConsulta' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesViviendaHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesViviendaHistorico_FechaConsulta]
    ON [aportaciones].[IndividualesViviendaHistorico] ([fecha_consulta])
GO

-- Índices para aportaciones.IndividualesPrestacionesHistorico
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesPrestacionesHistorico_OrganicaPeriodo' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesPrestacionesHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesPrestacionesHistorico_OrganicaPeriodo]
    ON [aportaciones].[IndividualesPrestacionesHistorico] ([clave_organica_0], [clave_organica_1], [anio], [quincena])
    INCLUDE ([interno], [total])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesPrestacionesHistorico_Periodo' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesPrestacionesHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesPrestacionesHistorico_Periodo]
    ON [aportaciones].[IndividualesPrestacionesHistorico] ([periodo])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesPrestacionesHistorico_Interno' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesPrestacionesHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesPrestacionesHistorico_Interno]
    ON [aportaciones].[IndividualesPrestacionesHistorico] ([interno])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesPrestacionesHistorico_FechaConsulta' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesPrestacionesHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesPrestacionesHistorico_FechaConsulta]
    ON [aportaciones].[IndividualesPrestacionesHistorico] ([fecha_consulta])
GO

-- Índices para aportaciones.IndividualesCairHistorico
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesCairHistorico_OrganicaPeriodo' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesCairHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesCairHistorico_OrganicaPeriodo]
    ON [aportaciones].[IndividualesCairHistorico] ([clave_organica_0], [clave_organica_1], [anio], [quincena])
    INCLUDE ([interno], [total])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesCairHistorico_Periodo' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesCairHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesCairHistorico_Periodo]
    ON [aportaciones].[IndividualesCairHistorico] ([periodo])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesCairHistorico_Interno' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesCairHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesCairHistorico_Interno]
    ON [aportaciones].[IndividualesCairHistorico] ([interno])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_IndividualesCairHistorico_FechaConsulta' AND object_id = OBJECT_ID(N'[aportaciones].[IndividualesCairHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_IndividualesCairHistorico_FechaConsulta]
    ON [aportaciones].[IndividualesCairHistorico] ([fecha_consulta])
GO

-- Índices para aportaciones.PrestamosCortoPlazoHistorico
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PrestamosCortoPlazoHistorico_OrganicaPeriodo' AND object_id = OBJECT_ID(N'[aportaciones].[PrestamosCortoPlazoHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PrestamosCortoPlazoHistorico_OrganicaPeriodo]
    ON [aportaciones].[PrestamosCortoPlazoHistorico] ([clave_organica_0], [clave_organica_1], [anio], [quincena])
    INCLUDE ([interno], [total])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PrestamosCortoPlazoHistorico_Periodo' AND object_id = OBJECT_ID(N'[aportaciones].[PrestamosCortoPlazoHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PrestamosCortoPlazoHistorico_Periodo]
    ON [aportaciones].[PrestamosCortoPlazoHistorico] ([periodo])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PrestamosCortoPlazoHistorico_Interno' AND object_id = OBJECT_ID(N'[aportaciones].[PrestamosCortoPlazoHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PrestamosCortoPlazoHistorico_Interno]
    ON [aportaciones].[PrestamosCortoPlazoHistorico] ([interno])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PrestamosCortoPlazoHistorico_FechaConsulta' AND object_id = OBJECT_ID(N'[aportaciones].[PrestamosCortoPlazoHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PrestamosCortoPlazoHistorico_FechaConsulta]
    ON [aportaciones].[PrestamosCortoPlazoHistorico] ([fecha_consulta])
GO

-- Índices para aportaciones.PrestamosMedianoPlazoHistorico
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PrestamosMedianoPlazoHistorico_OrganicaPeriodo' AND object_id = OBJECT_ID(N'[aportaciones].[PrestamosMedianoPlazoHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PrestamosMedianoPlazoHistorico_OrganicaPeriodo]
    ON [aportaciones].[PrestamosMedianoPlazoHistorico] ([clave_organica_0], [clave_organica_1], [anio], [quincena])
    INCLUDE ([interno], [total])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PrestamosMedianoPlazoHistorico_Periodo' AND object_id = OBJECT_ID(N'[aportaciones].[PrestamosMedianoPlazoHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PrestamosMedianoPlazoHistorico_Periodo]
    ON [aportaciones].[PrestamosMedianoPlazoHistorico] ([periodo])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PrestamosMedianoPlazoHistorico_Interno' AND object_id = OBJECT_ID(N'[aportaciones].[PrestamosMedianoPlazoHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PrestamosMedianoPlazoHistorico_Interno]
    ON [aportaciones].[PrestamosMedianoPlazoHistorico] ([interno])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PrestamosMedianoPlazoHistorico_FechaConsulta' AND object_id = OBJECT_ID(N'[aportaciones].[PrestamosMedianoPlazoHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PrestamosMedianoPlazoHistorico_FechaConsulta]
    ON [aportaciones].[PrestamosMedianoPlazoHistorico] ([fecha_consulta])
GO

-- Índices para aportaciones.PrestamosHipotecariosHistorico
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PrestamosHipotecariosHistorico_OrganicaPeriodo' AND object_id = OBJECT_ID(N'[aportaciones].[PrestamosHipotecariosHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PrestamosHipotecariosHistorico_OrganicaPeriodo]
    ON [aportaciones].[PrestamosHipotecariosHistorico] ([clave_organica_0], [clave_organica_1], [anio], [quincena])
    INCLUDE ([interno], [capital_pagar], [interes_pagar], [seguro_pagar], [moratorio_pagar])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PrestamosHipotecariosHistorico_Periodo' AND object_id = OBJECT_ID(N'[aportaciones].[PrestamosHipotecariosHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PrestamosHipotecariosHistorico_Periodo]
    ON [aportaciones].[PrestamosHipotecariosHistorico] ([periodo])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PrestamosHipotecariosHistorico_Interno' AND object_id = OBJECT_ID(N'[aportaciones].[PrestamosHipotecariosHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PrestamosHipotecariosHistorico_Interno]
    ON [aportaciones].[PrestamosHipotecariosHistorico] ([interno])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PrestamosHipotecariosHistorico_FechaConsulta' AND object_id = OBJECT_ID(N'[aportaciones].[PrestamosHipotecariosHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PrestamosHipotecariosHistorico_FechaConsulta]
    ON [aportaciones].[PrestamosHipotecariosHistorico] ([fecha_consulta])
GO

-- Índices para aportaciones.GuarderiasHistorico
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GuarderiasHistorico_OrganicaPeriodo' AND object_id = OBJECT_ID(N'[aportaciones].[GuarderiasHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_GuarderiasHistorico_OrganicaPeriodo]
    ON [aportaciones].[GuarderiasHistorico] ([clave_organica_0], [clave_organica_1], [anio], [quincena])
    INCLUDE ([titular_no_empleado], [recibo_total])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GuarderiasHistorico_Periodo' AND object_id = OBJECT_ID(N'[aportaciones].[GuarderiasHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_GuarderiasHistorico_Periodo]
    ON [aportaciones].[GuarderiasHistorico] ([periodo])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GuarderiasHistorico_TitularNoEmpleado' AND object_id = OBJECT_ID(N'[aportaciones].[GuarderiasHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_GuarderiasHistorico_TitularNoEmpleado]
    ON [aportaciones].[GuarderiasHistorico] ([titular_no_empleado])
    WHERE [titular_no_empleado] IS NOT NULL
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GuarderiasHistorico_FechaConsulta' AND object_id = OBJECT_ID(N'[aportaciones].[GuarderiasHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_GuarderiasHistorico_FechaConsulta]
    ON [aportaciones].[GuarderiasHistorico] ([fecha_consulta])
GO

-- Índices para aportaciones.PensionNominaTransitorioHistorico
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PensionNominaTransitorioHistorico_OrganicaPeriodo' AND object_id = OBJECT_ID(N'[aportaciones].[PensionNominaTransitorioHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PensionNominaTransitorioHistorico_OrganicaPeriodo]
    ON [aportaciones].[PensionNominaTransitorioHistorico] ([clave_organica_0], [clave_organica_1], [anio], [quincena])
    INCLUDE ([interno], [total])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PensionNominaTransitorioHistorico_Periodo' AND object_id = OBJECT_ID(N'[aportaciones].[PensionNominaTransitorioHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PensionNominaTransitorioHistorico_Periodo]
    ON [aportaciones].[PensionNominaTransitorioHistorico] ([periodo])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PensionNominaTransitorioHistorico_Interno' AND object_id = OBJECT_ID(N'[aportaciones].[PensionNominaTransitorioHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PensionNominaTransitorioHistorico_Interno]
    ON [aportaciones].[PensionNominaTransitorioHistorico] ([interno])
    WHERE [interno] IS NOT NULL
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PensionNominaTransitorioHistorico_FechaConsulta' AND object_id = OBJECT_ID(N'[aportaciones].[PensionNominaTransitorioHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_PensionNominaTransitorioHistorico_FechaConsulta]
    ON [aportaciones].[PensionNominaTransitorioHistorico] ([fecha_consulta])
GO

-- Índices para aportaciones.AguinaldoHistorico
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AguinaldoHistorico_OrganicaPeriodo' AND object_id = OBJECT_ID(N'[aportaciones].[AguinaldoHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_AguinaldoHistorico_OrganicaPeriodo]
    ON [aportaciones].[AguinaldoHistorico] ([clave_organica_0], [clave_organica_1], [anio], [quincena])
    INCLUDE ([interno], [general])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AguinaldoHistorico_Periodo' AND object_id = OBJECT_ID(N'[aportaciones].[AguinaldoHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_AguinaldoHistorico_Periodo]
    ON [aportaciones].[AguinaldoHistorico] ([periodo])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AguinaldoHistorico_Interno' AND object_id = OBJECT_ID(N'[aportaciones].[AguinaldoHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_AguinaldoHistorico_Interno]
    ON [aportaciones].[AguinaldoHistorico] ([interno])
    WHERE [interno] IS NOT NULL
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AguinaldoHistorico_FechaConsulta' AND object_id = OBJECT_ID(N'[aportaciones].[AguinaldoHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_AguinaldoHistorico_FechaConsulta]
    ON [aportaciones].[AguinaldoHistorico] ([fecha_consulta])
GO

-- Índices para aportaciones.ResumenHistorico
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ResumenHistorico_OrganicaPeriodo' AND object_id = OBJECT_ID(N'[aportaciones].[ResumenHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_ResumenHistorico_OrganicaPeriodo]
    ON [aportaciones].[ResumenHistorico] ([clave_organica_0], [clave_organica_1], [anio], [quincena], [tipo_endpoint])
    INCLUDE ([total_empleados], [total_contribucion], [total_general])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ResumenHistorico_Periodo' AND object_id = OBJECT_ID(N'[aportaciones].[ResumenHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_ResumenHistorico_Periodo]
    ON [aportaciones].[ResumenHistorico] ([periodo], [tipo_endpoint])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ResumenHistorico_TipoEndpoint' AND object_id = OBJECT_ID(N'[aportaciones].[ResumenHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_ResumenHistorico_TipoEndpoint]
    ON [aportaciones].[ResumenHistorico] ([tipo_endpoint], [anio], [quincena])
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ResumenHistorico_FechaConsulta' AND object_id = OBJECT_ID(N'[aportaciones].[ResumenHistorico]'))
    CREATE NONCLUSTERED INDEX [IX_ResumenHistorico_FechaConsulta]
    ON [aportaciones].[ResumenHistorico] ([fecha_consulta])
GO

-- =============================================
-- FIN DEL SCRIPT
-- =============================================
PRINT 'Migración completada: Tablas de histórico para aportaciones de fondos creadas exitosamente'
GO
