@echo off
title College Bus Management System with AI Route Recommendation
echo ========================================================
echo   College Bus Management System - One-Click Launcher
echo ========================================================
echo Starting Backend Server on http://localhost:5000 ...
start "College Bus AI - Backend Server" cmd /k "cd /d %~dp0server && node server.js"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting Frontend Vite App on http://localhost:5173 ...
start "College Bus AI - Frontend Client" cmd /k "cd /d %~dp0client && npm run dev"

echo Opening browser at http://localhost:5173 ...
timeout /t 2 /nobreak > nul
start http://localhost:5173

echo ========================================================
echo  System is running live!
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:5173
echo ========================================================
