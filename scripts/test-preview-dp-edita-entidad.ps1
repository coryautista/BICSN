# Script de prueba para endpoint de preview DP_EDITA_ENTIDAD
# Endpoint: /v1/afiliado/preview-dp-edita-entidad/:movimientoId

$baseUrl = 'http://localhost:4000'
$username = 'capturistaISSSSPEA'
$password = 'ISSSSPEA@1234a'
$movimientoId = 1  # Cambiar por el ID del movimiento a probar

Write-Host "`n=== Test: Preview DP_EDITA_ENTIDAD ===" -ForegroundColor Cyan
Write-Host "Usuario: $username" -ForegroundColor Yellow
Write-Host "Movimiento ID: $movimientoId" -ForegroundColor Yellow
Write-Host "Endpoint: $baseUrl/v1/afiliado/preview-dp-edita-entidad/$movimientoId`n" -ForegroundColor Yellow

# Paso 1: Login
Write-Host "[1/2] Realizando login..." -ForegroundColor Green
try {
    $loginBody = @{
        usernameOrEmail = $username
        password = $password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/v1/auth/login" -Method Post -Body $loginBody -ContentType 'application/json' -ErrorAction Stop
    
    if ($loginResponse.ok) {
        $token = $loginResponse.data.accessToken
        Write-Host "✓ Login exitoso" -ForegroundColor Green
    } else {
        Write-Host "✗ Error en login: $($loginResponse.error.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error al realizar login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Paso 2: Obtener preview
Write-Host "`n[2/2] Obteniendo preview de ejecución..." -ForegroundColor Green
try {
    $headers = @{
        Authorization = "Bearer $token"
    }

    $endpointUrl = "$baseUrl/v1/afiliado/preview-dp-edita-entidad/$movimientoId"
    
    $response = Invoke-RestMethod -Uri $endpointUrl -Method Get -Headers $headers -ErrorAction Stop
    
    if ($response.ok) {
        Write-Host "✓ Preview obtenido exitosamente" -ForegroundColor Green
        Write-Host "`n=== INFORMACIÓN DEL MOVIMIENTO ===" -ForegroundColor Cyan
        Write-Host "Movimiento ID: $($response.data.movimientoId)" -ForegroundColor Yellow
        Write-Host "Afiliado ID: $($response.data.afiliadoId)" -ForegroundColor Yellow
        Write-Host "Tipo Movimiento ID: $($response.data.tipoMovimientoId)" -ForegroundColor Yellow
        Write-Host "Código Movimiento: $($response.data.codigoMovimiento)" -ForegroundColor Yellow
        Write-Host "Listo para ejecutar: $($response.data.listoParaEjecutar)" -ForegroundColor $(if ($response.data.listoParaEjecutar) { "Green" } else { "Red" })
        
        Write-Host "`n=== VALIDACIONES ===" -ForegroundColor Cyan
        $validaciones = $response.data.validaciones
        Write-Host "Código Movimiento: $(if ($validaciones.codigoMovimiento.valido) { '✓ Válido' } else { '✗ Inválido: ' + $validaciones.codigoMovimiento.mensaje })" -ForegroundColor $(if ($validaciones.codigoMovimiento.valido) { "Green" } else { "Red" })
        Write-Host "Datos Movimiento: $(if ($validaciones.datosMovimiento.valido) { '✓ Válido' } else { '✗ Inválido: ' + $validaciones.datosMovimiento.mensaje })" -ForegroundColor $(if ($validaciones.datosMovimiento.valido) { "Green" } else { "Red" })
        Write-Host "Período: $(if ($validaciones.periodo.valido) { '✓ Válido (' + $validaciones.periodo.periodo + ')' } else { '✗ Inválido: ' + $validaciones.periodo.mensaje })" -ForegroundColor $(if ($validaciones.periodo.valido) { "Green" } else { "Red" })
        Write-Host "Fecha: $(if ($validaciones.fecha.valido) { '✓ Válida (' + $validaciones.fecha.fechaFormateada + ')' } else { '✗ Inválida: ' + $validaciones.fecha.mensaje })" -ForegroundColor $(if ($validaciones.fecha.valido) { "Green" } else { "Red" })
        Write-Host "Porcentaje: $(if ($validaciones.porcentaje.valido) { '✓ Válido (' + $validaciones.porcentaje.valor + ')' } else { '✗ Inválido: ' + $validaciones.porcentaje.mensaje })" -ForegroundColor $(if ($validaciones.porcentaje.valido) { "Green" } else { "Red" })
        Write-Host "Base/Confianza: $(if ($validaciones.baseConfianza.valido) { '✓ Válido (' + $validaciones.baseConfianza.valor + ')' } else { '✗ Inválido: ' + $validaciones.baseConfianza.mensaje })" -ForegroundColor $(if ($validaciones.baseConfianza.valido) { "Green" } else { "Red" })
        
        if ($response.data.errores.Count -gt 0) {
            Write-Host "`n=== ERRORES ===" -ForegroundColor Red
            foreach ($error in $response.data.errores) {
                Write-Host "  ✗ $error" -ForegroundColor Red
            }
        }
        
        if ($response.data.datosPreparados) {
            Write-Host "`n=== DATOS PREPARADOS ===" -ForegroundColor Cyan
            $datos = $response.data.datosPreparados
            Write-Host "Movimiento: $($datos.movimiento)" -ForegroundColor Yellow
            Write-Host "Período: $($datos.periodo)" -ForegroundColor Yellow
            Write-Host "Sueldo: $($datos.sueldo)" -ForegroundColor Yellow
            Write-Host "Otras Prestaciones: $($datos.otrasPrestaciones)" -ForegroundColor Yellow
            Write-Host "Quinquenio: $($datos.quinquenio)" -ForegroundColor Yellow
            Write-Host "Quincenas: $($datos.quincenas)" -ForegroundColor Yellow
            Write-Host "Org0: $($datos.org0)" -ForegroundColor Yellow
            Write-Host "Org1: $($datos.org1)" -ForegroundColor Yellow
            Write-Host "Org2: $($datos.org2)" -ForegroundColor Yellow
            Write-Host "Org3: $($datos.org3)" -ForegroundColor Yellow
            Write-Host "Base/Confianza: $($datos.baseConfianza)" -ForegroundColor Yellow
            Write-Host "Porcentaje: $($datos.porcentaje)" -ForegroundColor Yellow
            Write-Host "Fecha Real Movimiento: $($datos.fechaRealMovimiento)" -ForegroundColor Yellow
        }
        
        Write-Host "`n=== PARÁMETROS ===" -ForegroundColor Cyan
        if ($response.data.parametros) {
            foreach ($param in $response.data.parametros) {
                Write-Host "  $($param.nombre) ($($param.tipo)): $($param.valor)" -ForegroundColor White
            }
        }
        
        Write-Host "`n=== SQL QUERY ===" -ForegroundColor Cyan
        Write-Host $response.data.sqlQuery -ForegroundColor Gray
        
        if ($response.data.sqlParaEjecutar) {
            Write-Host "`n=== SQL LISTO PARA EJECUTAR EN FIREBIRD ===" -ForegroundColor Green
            Write-Host $response.data.sqlParaEjecutar -ForegroundColor White
            Write-Host "`n(Copia y pega este SQL directamente en tu cliente de Firebird)" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "✗ Error en la respuesta: $($response.error.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error al obtener preview: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
        try {
            $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
            if ($errorJson.error) {
                Write-Host "  Código: $($errorJson.error.code)" -ForegroundColor Red
                Write-Host "  Mensaje: $($errorJson.error.message)" -ForegroundColor Red
            }
        } catch {
            # Si no es JSON, mostrar el mensaje tal cual
        }
    }
}

Write-Host "`n=== Fin del Test ===" -ForegroundColor Cyan




