# ABD Suite - CENTRAL AUDIT DELEGATOR
# Invokes the unified pipeline from @abd/styles node_modules.

$CentralScript = "$PSScriptRoot/../node_modules/@abd/styles/scripts/abd-audit.ps1"

if (Test-Path $CentralScript) {
    & powershell -File $CentralScript
    exit $LASTEXITCODE
} else {
    Write-Host "`nError: Central @abd/styles audit script not found." -ForegroundColor Red
    Write-Host "Please run 'pnpm install' or 'npm install' to restore dependencies.`n" -ForegroundColor Yellow
    exit 1
}
