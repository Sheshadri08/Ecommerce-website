$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $workspace

Write-Host "Starting NovaCart backend server..." -ForegroundColor Cyan
Write-Host "Project: $workspace" -ForegroundColor DarkGray
Write-Host "Open http://localhost:5000 after the server is ready." -ForegroundColor Green
Write-Host ""

node backend/server.js
