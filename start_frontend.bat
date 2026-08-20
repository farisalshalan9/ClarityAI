@echo off
title ClarityAI Frontend
cd /d "%~dp0frontend"
echo Starting ClarityAI React Frontend on http://localhost:5173...
set "PATH=C:\Program Files\nodejs;%PATH%"
npm run dev
pause
