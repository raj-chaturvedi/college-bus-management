# College Bus Management System with AI Route Recommendation
# PowerShell One-Click Runner

$Host.UI.RawUI.WindowTitle = "College Bus Management System Launcher"
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  College Bus Management System - One-Click Launcher   " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "Starting Backend API Server on http://localhost:5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server'; `$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); node server.js"

Start-Sleep -Seconds 3

Write-Host "Starting Frontend Vite App on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\client'; `$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); npm run dev"

Start-Sleep -Seconds 2

Write-Host "Opening Application in default browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host "`nAll services launched successfully!" -ForegroundColor Green
Write-Host "Backend API:  http://localhost:5000" -ForegroundColor White
Write-Host "Frontend App: http://localhost:5173" -ForegroundColor White
