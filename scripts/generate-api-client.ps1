# Chạy từ thư mục ZenvoyceFE. Cần: .NET SDK, dotnet tool restore.
$ErrorActionPreference = "Stop"
$feRoot = Split-Path $PSScriptRoot -Parent
$beProj = Join-Path $feRoot "..\ZenvoyceBE\ZenvoyceBE\Zenvoyce.API.csproj"
$outDir = Join-Path $feRoot "..\ZenvoyceBE\ZenvoyceBE\artifacts"
$dll = Join-Path $outDir "Zenvoyce.API.dll"
$openapi = Join-Path $feRoot "openapi.json"

Write-Host "Building API -> $outDir"
dotnet build $beProj -c Release -o $outDir
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Set-Location $feRoot
Write-Host "swagger tofile -> openapi.json"
dotnet swagger tofile --output $openapi $dll v1
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "nswag run"
dotnet nswag run nswag.json
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Done."
