# Script de prueba para endpoint de préstamos a mediano plazo
# Endpoint: /v1/aportacionesFondos/individuales/prestamos-mediano-plazo

$baseUrl = 'http://localhost:4000'
$username = 'capturistaISSSSPEA'
$password = 'ISSSSPEA@1234a'

Write-Host "`n=== Test: Préstamos a Mediano Plazo ===" -ForegroundColor Cyan
Write-Host "Usuario: $username" -ForegroundColor Yellow
Write-Host "Endpoint: $baseUrl/v1/aportacionesFondos/individuales/prestamos-mediano-plazo`n" -ForegroundColor Yellow

# Paso 1: Login
Write-Host "[1/3] Realizando login..." -ForegroundColor Green
try {
    $loginBody = @{
        usernameOrEmail = $username
        password = $password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/v1/auth/login" -Method Post -Body $loginBody -ContentType 'application/json' -ErrorAction Stop
    
    if ($loginResponse.ok) {
        $token = $loginResponse.data.accessToken
        Write-Host "✓ Login exitoso" -ForegroundColor Green
        Write-Host "  User ID: $($loginResponse.data.userId)" -ForegroundColor Gray
        Write-Host "  Username: $($loginResponse.data.username)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Error en login: $($loginResponse.error.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error al realizar login: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Paso 2: Llamar al endpoint de préstamos
Write-Host "`n[2/3] Consultando préstamos a mediano plazo..." -ForegroundColor Green
try {
    $headers = @{
        Authorization = "Bearer $token"
    }

    # El endpoint puede aceptar query params opcionales: clave_organica_0 y clave_organica_1
    # Si no se proporcionan, usa las del token del usuario
    $endpointUrl = "$baseUrl/v1/aportacionesFondos/individuales/prestamos-mediano-plazo"
    
    $response = Invoke-RestMethod -Uri $endpointUrl -Method Get -Headers $headers -ErrorAction Stop
    
    if ($response.ok) {
        Write-Host "✓ Consulta exitosa" -ForegroundColor Green
        Write-Host "`n=== Resultados ===" -ForegroundColor Cyan
        
        $data = $response.data
        Write-Host "Clave Orgánica 0: $($data.clave_organica_0)" -ForegroundColor Yellow
        Write-Host "Clave Orgánica 1: $($data.clave_organica_1)" -ForegroundColor Yellow
        Write-Host "Período: $($data.periodo)" -ForegroundColor Yellow
        Write-Host "Total de préstamos: $($data.prestamos.Count)" -ForegroundColor Yellow
        
        if ($data.prestamos.Count -gt 0) {
            Write-Host "`n=== Primeros 5 préstamos ===" -ForegroundColor Cyan
            $data.prestamos | Select-Object -First 5 | ForEach-Object {
                Write-Host "`n  Interno: $($_.interno)" -ForegroundColor White
                Write-Host "  RFC: $($_.rfc)" -ForegroundColor Gray
                Write-Host "  Nombre: $($_.nombre)" -ForegroundColor Gray
                Write-Host "  Préstamo: $($_.prestamo)" -ForegroundColor Gray
                Write-Host "  Capital: $($_.capital)" -ForegroundColor Gray
                Write-Host "  Total: $($_.total)" -ForegroundColor Gray
                Write-Host "  Clase: $($_.clase) - $($_.desc_clase)" -ForegroundColor Gray
            }
            
            # Resumen estadístico
            Write-Host "`n=== Resumen Estadístico ===" -ForegroundColor Cyan
            $totalCapital = ($data.prestamos | Where-Object { $_.capital } | Measure-Object -Property capital -Sum).Sum
            $totalInteres = ($data.prestamos | Where-Object { $_.interes } | Measure-Object -Property interes -Sum).Sum
            $totalMoratorios = ($data.prestamos | Where-Object { $_.moratorios } | Measure-Object -Property moratorios -Sum).Sum
            $totalSeguro = ($data.prestamos | Where-Object { $_.seguro } | Measure-Object -Property seguro -Sum).Sum
            $totalGeneral = ($data.prestamos | Where-Object { $_.total } | Measure-Object -Property total -Sum).Sum
            
            Write-Host "Total Capital: $totalCapital" -ForegroundColor Yellow
            Write-Host "Total Interés: $totalInteres" -ForegroundColor Yellow
            Write-Host "Total Moratorios: $totalMoratorios" -ForegroundColor Yellow
            Write-Host "Total Seguro: $totalSeguro" -ForegroundColor Yellow
            Write-Host "Total General: $totalGeneral" -ForegroundColor Yellow
            
            # Agrupar por clase
            Write-Host "`n=== Préstamos por Clase ===" -ForegroundColor Cyan
            $porClase = $data.prestamos | Group-Object -Property clase | Sort-Object Count -Descending
            $porClase | ForEach-Object {
                Write-Host "  $($_.Name): $($_.Count) préstamo(s)" -ForegroundColor White
            }
        } else {
            Write-Host "⚠ No se encontraron préstamos para este usuario/orgánica" -ForegroundColor Yellow
        }
        
        # Mostrar respuesta completa en formato JSON (opcional, comentado para no saturar)
        # Write-Host "`n=== Respuesta Completa (JSON) ===" -ForegroundColor Cyan
        # $response | ConvertTo-Json -Depth 10 | Write-Host
        
    } else {
        Write-Host "✗ Error en la respuesta: $($response.error.message)" -ForegroundColor Red
        Write-Host "  Código: $($response.error.code)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error al consultar préstamos: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
        try {
            $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
            if ($errorJson.error) {
                Write-Host "  Código de error: $($errorJson.error.code)" -ForegroundColor Red
                Write-Host "  Mensaje: $($errorJson.error.message)" -ForegroundColor Red
            }
        } catch {
            # Si no es JSON, mostrar el mensaje tal cual
        }
    }
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  Status Code: $statusCode" -ForegroundColor Red
    }
}

# Paso 3: Resumen final
Write-Host "`n[3/3] Prueba completada" -ForegroundColor Green
Write-Host "`n=== Fin del Test ===" -ForegroundColor Cyan




