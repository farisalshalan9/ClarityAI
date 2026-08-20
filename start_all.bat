@echo off
title ClarityAI Launcher
echo =======================================================
echo          Starting ClarityAI Application Suite
echo =======================================================
start "ClarityAI Backend" cmd /c "%~dp0start_backend.bat"
timeout /t 2 >nul
start "ClarityAI Frontend" cmd /c "%~dp0start_frontend.bat"
echo.
echo ClarityAI is launching!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
pause
