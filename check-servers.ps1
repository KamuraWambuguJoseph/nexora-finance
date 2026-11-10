Write-Output "--- Frontend (Vite :5173) ---"
try {
  $r = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5
  Write-Output "OK $($r.StatusCode)"
} catch {
  Write-Output "FAILED: $($_.Exception.Message)"
}

Write-Output "--- API (:4000 /api/health) ---"
try {
  $r2 = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -UseBasicParsing -TimeoutSec 5
  Write-Output "OK $($r2.StatusCode) $($r2.Content)"
} catch {
  Write-Output "FAILED: $($_.Exception.Message)"
}

Write-Output "--- Listening ports ---"
netstat -ano | Select-String -Pattern 'LISTENING' | Select-String -Pattern ':4000|:5173|:5432|:3000' | ForEach-Object { $_.Line }
