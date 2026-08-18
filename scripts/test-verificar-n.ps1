$body = @{usernameOrEmail='capturistaISSSSPEA';password='ISSSSPEA@1234a'} | ConvertTo-Json
$response = Invoke-RestMethod -Uri 'http://localhost:4000/v1/auth/login' -Method Post -Body $body -ContentType 'application/json'
$token = $response.data.accessToken
$headers = @{Authorization="Bearer $token"}
$plantilla = Invoke-RestMethod -Uri 'http://localhost:4000/v1/obtenerPlantilla' -Method Get -Headers $headers

Write-Host "`n=== Verificacion de registros con Ñ ===" -ForegroundColor Green
Write-Host "Total de registros: $($plantilla.data.Count)" -ForegroundColor Cyan

# Buscar registros que contienen Ñ (usando código Unicode)
$nChar = [char]0x00D1  # Ñ mayúscula
$nCharLower = [char]0x00F1  # ñ minúscula
$registrosConN = $plantilla.data | Where-Object { 
    ($_.APELLIDO_PATERNO -and $_.APELLIDO_PATERNO.Contains($nChar)) -or 
    ($_.APELLIDO_PATERNO -and $_.APELLIDO_PATERNO.Contains($nCharLower)) -or
    ($_.APELLIDO_MATERNO -and $_.APELLIDO_MATERNO.Contains($nChar)) -or 
    ($_.APELLIDO_MATERNO -and $_.APELLIDO_MATERNO.Contains($nCharLower)) -or
    ($_.NOMBRE -and $_.NOMBRE.Contains($nChar)) -or 
    ($_.NOMBRE -and $_.NOMBRE.Contains($nCharLower))
}

Write-Host "Registros que contienen N con tilde: $($registrosConN.Count)" -ForegroundColor $(if ($registrosConN.Count -gt 0) { 'Green' } else { 'Red' })

if ($registrosConN.Count -gt 0) {
    Write-Host "`n=== Primeros 10 registros con N con tilde ===" -ForegroundColor Yellow
    $registrosConN | Select-Object -First 10 | ForEach-Object {
        $paterno = $_.APELLIDO_PATERNO
        $materno = $_.APELLIDO_MATERNO
        $nombre = $_.NOMBRE
        Write-Host "INTERNO: $($_.INTERNO) | PATERNO: $paterno | MATERNO: $materno | NOMBRE: $nombre" -ForegroundColor Cyan
    }
} else {
    Write-Host "`n=== PROBLEMA: No se encontraron registros con N con tilde ===" -ForegroundColor Red
    Write-Host "Buscando registros que deberian tener N con tilde pero no la tienen..." -ForegroundColor Yellow
    
    $registrosEspeciales = $plantilla.data | Where-Object { 
        $_.APELLIDO_PATERNO -like '*NU*' -or 
        $_.APELLIDO_PATERNO -like '*MU*' 
    } | Select-Object -First 5
    
    $registrosEspeciales | ForEach-Object {
        $paterno = $_.APELLIDO_PATERNO
        $materno = $_.APELLIDO_MATERNO
        Write-Host "INTERNO: $($_.INTERNO) | PATERNO: $paterno | MATERNO: $materno" -ForegroundColor Magenta
    }
}

