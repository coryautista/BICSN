# Script de prueba para endpoint de preview DP_EDITA_ENTIDAD en lote
# Endpoint: /v1/afiliado/preview-dp-edita-entidad-lote

$baseUrl = 'http://localhost:4000'
$username = 'capturistaISSSSPEA'
$password = 'ISSSSPEA@1234a'

Write-Host "`n=== Test: Preview DP_EDITA_ENTIDAD en Lote ===" -ForegroundColor Cyan
Write-Host "Usuario: $username" -ForegroundColor Yellow
Write-Host "Endpoint: $baseUrl/v1/afiliado/preview-dp-edita-entidad-lote`n" -ForegroundColor Yellow

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

# Paso 2: Obtener preview en lote
Write-Host "`n[2/2] Obteniendo preview en lote..." -ForegroundColor Green
try {
    $headers = @{
        Authorization = "Bearer $token"
    }

    $endpointUrl = "$baseUrl/v1/afiliado/preview-dp-edita-entidad-lote"
    
    $response = Invoke-RestMethod -Uri $endpointUrl -Method Get -Headers $headers -ErrorAction Stop
    
    if ($response.ok) {
        Write-Host "✓ Preview en lote obtenido exitosamente" -ForegroundColor Green
        Write-Host "`n=== RESUMEN GENERAL ===" -ForegroundColor Cyan
        Write-Host "Orgánica: $($response.data.organica)" -ForegroundColor Yellow
        Write-Host "Total Afiliados: $($response.data.totalAfiliados)" -ForegroundColor Yellow
        Write-Host "Total Movimientos: $($response.data.totalMovimientos)" -ForegroundColor Yellow
        Write-Host "Afiliados Listos: $($response.data.afiliadosListos)" -ForegroundColor Green
        Write-Host "Afiliados con Errores: $($response.data.afiliadosConErrores)" -ForegroundColor $(if ($response.data.afiliadosConErrores -gt 0) { "Red" } else { "Green" })
        
        Write-Host "`n=== RESUMEN DETALLADO ===" -ForegroundColor Cyan
        Write-Host "Movimientos Listos: $($response.data.resumen.movimientosListos)" -ForegroundColor Green
        Write-Host "Movimientos con Errores: $($response.data.resumen.movimientosConErrores)" -ForegroundColor $(if ($response.data.resumen.movimientosConErrores -gt 0) { "Red" } else { "Green" })
        
        Write-Host "`n=== AFILIADOS PROCESADOS ===" -ForegroundColor Cyan
        $contador = 0
        foreach ($afiliado in $response.data.afiliados) {
            $contador++
            $colorEstado = if ($afiliado.movimientosListos -gt 0) { "Green" } elseif ($afiliado.movimientosConErrores -gt 0) { "Red" } else { "Yellow" }
            
            Write-Host "`n[$contador] Afiliado ID: $($afiliado.afiliadoId)" -ForegroundColor $colorEstado
            Write-Host "  Nombre: $($afiliado.nombreCompleto)" -ForegroundColor White
            Write-Host "  Folio: $($afiliado.folio)" -ForegroundColor Gray
            Write-Host "  Estado: $($afiliado.estado) (numValidacion: $($afiliado.numValidacion))" -ForegroundColor Gray
            Write-Host "  Total Movimientos: $($afiliado.totalMovimientos)" -ForegroundColor Gray
            Write-Host "  Movimientos Listos: $($afiliado.movimientosListos)" -ForegroundColor Green
            Write-Host "  Movimientos con Errores: $($afiliado.movimientosConErrores)" -ForegroundColor $(if ($afiliado.movimientosConErrores -gt 0) { "Red" } else { "Green" })
            
            if ($afiliado.error) {
                Write-Host "  ✗ Error: $($afiliado.error)" -ForegroundColor Red
            }
            
            # Mostrar primeros 3 movimientos como ejemplo
            if ($afiliado.movimientos.Count -gt 0) {
                Write-Host "  Movimientos:" -ForegroundColor Cyan
                $movimientosMostrar = $afiliado.movimientos | Select-Object -First 3
                foreach ($mov in $movimientosMostrar) {
                    $movColor = if ($mov.listoParaEjecutar) { "Green" } else { "Red" }
                    Write-Host "    - Movimiento ID: $($mov.movimientoId) | Tipo: $($mov.tipoMovimientoId) | Código: $($mov.codigoMovimiento) | Listo: $($mov.listoParaEjecutar)" -ForegroundColor $movColor
                    if ($mov.errores.Count -gt 0) {
                        foreach ($error in $mov.errores) {
                            Write-Host "      ✗ $error" -ForegroundColor Red
                        }
                    }
                }
                if ($afiliado.movimientos.Count -gt 3) {
                    Write-Host "    ... y $($afiliado.movimientos.Count - 3) movimientos más" -ForegroundColor Gray
                }
            }
        }
        
        # Mostrar SQLs listos para ejecutar (primeros 5)
        Write-Host "`n=== SQLs LISTOS PARA EJECUTAR (Primeros 5) ===" -ForegroundColor Green
        $sqlsListos = @()
        foreach ($afiliado in $response.data.afiliados) {
            foreach ($mov in $afiliado.movimientos) {
                if ($mov.listoParaEjecutar -and $mov.sqlParaEjecutar) {
                    $sqlsListos += @{
                        afiliadoId = $afiliado.afiliadoId
                        movimientoId = $mov.movimientoId
                        codigoMovimiento = $mov.codigoMovimiento
                        sql = $mov.sqlParaEjecutar
                    }
                }
            }
        }
        
        if ($sqlsListos.Count -gt 0) {
            $sqlsMostrar = $sqlsListos | Select-Object -First 5
            foreach ($sqlInfo in $sqlsMostrar) {
                Write-Host "`n--- Afiliado $($sqlInfo.afiliadoId) | Movimiento $($sqlInfo.movimientoId) ($($sqlInfo.codigoMovimiento)) ---" -ForegroundColor Yellow
                Write-Host $sqlInfo.sql -ForegroundColor White
            }
            if ($sqlsListos.Count -gt 5) {
                Write-Host "`n... y $($sqlsListos.Count - 5) SQLs más listos para ejecutar" -ForegroundColor Gray
            }
        } else {
            Write-Host "No hay SQLs listos para ejecutar (todos tienen errores)" -ForegroundColor Red
        }
        
        # Guardar resultado completo en archivo JSON
        $outputFile = "preview-dp-edita-entidad-lote-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        $response | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile -Encoding UTF8
        Write-Host "`n✓ Resultado completo guardado en: $outputFile" -ForegroundColor Green
        
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




