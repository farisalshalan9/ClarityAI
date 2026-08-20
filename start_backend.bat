@echo off
title ClarityAI Backend Server
cd /d "%~dp0backend"
echo Starting ClarityAI FastAPI Backend on http://127.0.0.1:8000...
.\venv\Scripts\python.exe main.py
pause
