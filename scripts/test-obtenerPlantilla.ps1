$body = @{usernameOrEmail='capturistaISSSSPEA';password='ISSSSPEA@1234a'} | ConvertTo-Json
$response = Invoke-RestMethod -Uri 'http://localhost:4000/v1/auth/login' -Method Post -Body $body -ContentType 'application/json'
$token = $response.data.accessToken
$headers = @{Authorization="Bearer $token"}
$plantilla = Invoke-RestMethod -Uri 'http://localhost:4000/v1/obtenerPlantilla' -Method Get -Headers $headers

Write-Host "`n=== Verificacion obtenerPlantilla ===" -ForegroundColor Green

$registrosEspeciales = $plantilla.data | Where-Object { 
    $_.APELLIDO_PATERNO -like '*NU*' -or 
    $_.APELLIDO_PATERNO -like '*MU*' -or 
    $_.APELLIDO_PATERNO -like '*TISCARE*' -or 
    $_.APELLIDO_PATERNO -like '*PI*' -or 
    $_.APELLIDO_MATERNO -like '*CASTA*' 
} | Select-Object -First 10

Write-Host "`n=== Registros con apellidos que deberian tener N ===" -ForegroundColor Cyan

$correctos = 0
$incorrectos = 0

foreach ($r in $registrosEspeciales) {
    $paterno = $r.APELLIDO_PATERNO
    $materno = $r.APELLIDO_MATERNO
    $tieneError = $paterno -match '[?\uFFFD]' -or $materno -match '[?\uFFFD]'
    
    if ($tieneError) {
        $incorrectos++
        $color = "Red"
        $icono = "X"
    } else {
        $correctos++
        $color = "Green"
        $icono = "OK"
    }
    
    Write-Host "$icono INTERNO: $($r.INTERNO) | PATERNO: $paterno | MATERNO: $materno" -ForegroundColor $color
}

$totalConErrores = ($plantilla.data | Where-Object { 
    $_.APELLIDO_PATERNO -match '[?\uFFFD]' -or 
    $_.APELLIDO_MATERNO -match '[?\uFFFD]' -or 
    $_.NOMBRE -match '[?\uFFFD]' 
}).Count

$totalRegistros = $plantilla.data.Count

Write-Host "`n=== Resumen ===" -ForegroundColor Yellow
Write-Host "Total de registros: $totalRegistros" -ForegroundColor Cyan
Write-Host "Registros correctos en muestra: $correctos" -ForegroundColor Green
Write-Host "Registros con error en muestra: $incorrectos" -ForegroundColor Red

if ($totalConErrores -gt 0) {
    $porcentaje = if ($totalRegistros -gt 0) { [math]::Round(($totalConErrores/$totalRegistros)*100, 2) } else { 0 }
    Write-Host "Total con '?' o U+FFFD: $totalConErrores" -ForegroundColor Red
    Write-Host "Porcentaje con error: $porcentaje%" -ForegroundColor Red
} else {
    Write-Host "OK - No se encontraron caracteres problematicos - Conversion exitosa!" -ForegroundColor Green
}

$ejemplo = $plantilla.data | Where-Object { $_.APELLIDO_PATERNO -like '*NU*' } | Select-Object -First 1
if ($ejemplo) {
    $paterno = $ejemplo.APELLIDO_PATERNO
    Write-Host "`nEjemplo: APELLIDO_PATERNO = '$paterno'" -ForegroundColor Cyan
    $tieneFFFD = $paterno.Contains([char]65533)
    $tieneQuestion = $paterno.Contains('?')
    
    $colorFFFD = if ($tieneFFFD) { "Red" } else { "Green" }
    $colorQuestion = if ($tieneQuestion) { "Red" } else { "Green" }
    
    Write-Host "Contiene U+FFFD: $tieneFFFD" -ForegroundColor $colorFFFD
    Write-Host "Contiene '?': $tieneQuestion" -ForegroundColor $colorQuestion
}


