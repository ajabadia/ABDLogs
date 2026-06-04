# run-e2e.ps1 — Run E2E tests for ABDLogs on Windows
#
# Cleans up the port, launches the dev server, waits for it to respond,
# runs the Playwright tests, and cleans up the server on exit.

$ErrorActionPreference = "Stop"

$Port = 3600
$ProjectRoot = (Resolve-Path "$PSScriptRoot/..").Path
$ParentDir = (Resolve-Path "$ProjectRoot/..").Path

Write-Host "=== Step 1: Cleanup port $Port ==="
node "$ParentDir/ABDLogs/scripts/cleanup-port.mjs" $Port

Write-Host "=== Step 2: Start ABDLogs dev server on port $Port ==="
$LogDir = "$ProjectRoot/test-results"
if (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
$LogFile = "$LogDir/dev-server.log"
$ErrLogFile = "$LogDir/dev-server-err.log"
if (Test-Path $LogFile) { Remove-Item $LogFile -Force -ErrorAction SilentlyContinue }
if (Test-Path $ErrLogFile) { Remove-Item $ErrLogFile -Force -ErrorAction SilentlyContinue }

$Process = Start-Process node -ArgumentList "node_modules/next/dist/bin/next dev -p $Port --webpack" -WorkingDirectory $ProjectRoot -NoNewWindow -PassThru -RedirectStandardOutput $LogFile -RedirectStandardError $ErrLogFile

$TestExitCode = 1
try {
    Write-Host "Server started with PID: $($Process.Id)"

    Write-Host "=== Step 3: Wait for server to be ready ==="
    $Ready = $false
    for ($i = 1; $i -le 30; $i++) {
        try {
            $Response = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($Response -and $Response.StatusCode -ge 200 -and $Response.StatusCode -lt 500) {
                Write-Host "Server is ready after $($i * 2) seconds (HTTP $($Response.StatusCode))."
                $Ready = $true
                break
            }
        } catch {
            if ($_.Exception -and $_.Exception.Response) {
                $status = [int]$_.Exception.Response.StatusCode
                if ($status -ge 200 -and $status -lt 500) {
                    Write-Host "Server is ready after $($i * 2) seconds (HTTP $status)."
                    $Ready = $true
                    break
                }
            }
        }
        Start-Sleep -Seconds 2
    }

    if (-not $Ready) {
        Write-Host "Timeout waiting for server to respond on port $Port" -ForegroundColor Red
        if (Test-Path $LogFile) { Get-Content $LogFile -Tail 20 }
        throw "Server startup timed out."
    }

    Write-Host "=== Step 4: Run Playwright E2E tests ==="
    $env:ABDLOGS_SKIP_PORT_CLEANUP = "true"
    pnpm exec playwright test --reporter=list --retries 0 --workers 1
    $TestExitCode = $LASTEXITCODE

} finally {
    Write-Host "=== Step 5: Cleanup server ==="
    if ($Process -and -not $Process.HasExited) {
        Write-Host "Stopping dev server process PID $($Process.Id)..."
        Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
    }
}

if ($TestExitCode -eq 0) {
    Write-Host "=== ALL TESTS PASSED ===" -ForegroundColor Green
    exit 0
} else {
    Write-Host "=== TESTS FAILED (Exit Code: $TestExitCode) ===" -ForegroundColor Red
    exit $TestExitCode
}
