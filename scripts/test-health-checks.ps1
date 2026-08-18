# Test Health Check Endpoints
# Este script prueba todos los endpoints de health check

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTING HEALTH CHECK ENDPOINTS" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:4000"

# 1. Basic Health Check
Write-Host "1. Testing /health (basic)..." -ForegroundColor Yellow
try {
    $basic = Invoke-WebRequest -Uri "$baseUrl/health" | 
             Select-Object -ExpandProperty Content | ConvertFrom-Json
    Write-Host "   ✓ OK" -ForegroundColor Green
    Write-Host "   - Timestamp: $($basic.timestamp)" -ForegroundColor White
    Write-Host "   - Uptime: $([math]::Round($basic.uptime, 2))s" -ForegroundColor White
} catch {
    Write-Host "   ✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Detailed Health Check
Write-Host "`n2. Testing /health/detailed..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health/detailed"
    $detailed = $response.Content | ConvertFrom-Json
    
    $statusColor = switch ($detailed.status) {
        "healthy" { "Green" }
        "degraded" { "Yellow" }
        "unhealthy" { "Red" }
        default { "White" }
    }
    
    Write-Host "   Overall Status: $($detailed.status.ToUpper())" -ForegroundColor $statusColor
    Write-Host "   HTTP Status: $($response.StatusCode)" -ForegroundColor $(if ($response.StatusCode -eq 200) { "Green" } else { "Red" })
    Write-Host "   Timestamp: $($detailed.timestamp)" -ForegroundColor White
    Write-Host "   Uptime: $([math]::Round($detailed.uptime, 2))s" -ForegroundColor White
    
    Write-Host "`n   Component Checks:" -ForegroundColor White
    foreach ($check in $detailed.checks) {
        $checkColor = switch ($check.status) {
            "healthy" { "Green" }
            "degraded" { "Yellow" }
            "unhealthy" { "Red" }
            default { "White" }
        }
        Write-Host "     [$($check.status.ToUpper())]" -ForegroundColor $checkColor -NoNewline
        Write-Host " $($check.name)" -ForegroundColor White
        Write-Host "       Response Time: $($check.responseTime)ms" -ForegroundColor Gray
        Write-Host "       Message: $($check.message)" -ForegroundColor Gray
        
        if ($check.details) {
            Write-Host "       Details:" -ForegroundColor Gray
            $check.details.PSObject.Properties | ForEach-Object {
                Write-Host "         - $($_.Name): $($_.Value)" -ForegroundColor DarkGray
            }
        }
    }
    
    if ($detailed.system) {
        Write-Host "`n   System Metrics:" -ForegroundColor White
        
        # Memory
        $memPercent = [math]::Round($detailed.system.memory.usagePercent, 2)
        $memColor = if ($memPercent -gt 90) { "Red" } elseif ($memPercent -gt 70) { "Yellow" } else { "Green" }
        Write-Host "     Memory Usage: $memPercent%" -ForegroundColor $memColor
        Write-Host "       Total: $([math]::Round($detailed.system.memory.total / 1MB, 2)) MB" -ForegroundColor Gray
        Write-Host "       Used: $([math]::Round($detailed.system.memory.used / 1MB, 2)) MB" -ForegroundColor Gray
        Write-Host "       Free: $([math]::Round($detailed.system.memory.free / 1MB, 2)) MB" -ForegroundColor Gray
        
        # Process
        Write-Host "     Process:" -ForegroundColor White
        Write-Host "       PID: $($detailed.system.process.pid)" -ForegroundColor Gray
        Write-Host "       Uptime: $([math]::Round($detailed.system.process.uptime, 2))s" -ForegroundColor Gray
        
        if ($detailed.system.process.memoryUsage) {
            Write-Host "       RSS: $([math]::Round($detailed.system.process.memoryUsage.rss / 1MB, 2)) MB" -ForegroundColor Gray
            Write-Host "       Heap Used: $([math]::Round($detailed.system.process.memoryUsage.heapUsed / 1MB, 2)) MB" -ForegroundColor Gray
        }
    }
    
    Write-Host "`n   ✓ Detailed health check completed" -ForegroundColor Green
    
} catch {
    Write-Host "   ✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   HTTP Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# 3. Database Health Check
Write-Host "`n3. Testing /health/db..." -ForegroundColor Yellow
try {
    $db = Invoke-WebRequest -Uri "$baseUrl/health/db" | 
          Select-Object -ExpandProperty Content | ConvertFrom-Json
    
    if ($db.ok) {
        Write-Host "   ✓ Database connection OK" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Database connection FAILED" -ForegroundColor Red
        if ($db.error) {
            Write-Host "   Error: $($db.error)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "   ✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "HEALTH CHECK TESTING COMPLETED" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Opcional: Guardar resultado detallado en JSON
$saveResults = Read-Host "¿Guardar resultados en JSON? (s/n)"
if ($saveResults -eq 's') {
    try {
        $detailed = Invoke-WebRequest -Uri "$baseUrl/health/detailed" | 
                    Select-Object -ExpandProperty Content | ConvertFrom-Json
        
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $filename = "health-check-$timestamp.json"
        
        $detailed | ConvertTo-Json -Depth 10 | Out-File $filename
        Write-Host "`nResultados guardados en: $filename" -ForegroundColor Green
    } catch {
        Write-Host "`nError guardando resultados: $($_.Exception.Message)" -ForegroundColor Red
    }
}
