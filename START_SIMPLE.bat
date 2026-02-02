@echo off
title FNBXAI Simple Launcher
color 0A

echo.
echo =================================================
echo    FNBXAI - Simple System Launcher
echo =================================================
echo.

echo [1/3] Starting Backend Server...
cd /d "%~dp0backend"
echo Starting Backend Server on port 5000...
start "FNBXAI Backend" cmd /k "echo Backend Server Starting... && npm start"

echo.
echo [2/3] Waiting for Backend to initialize...
timeout /t 10 /nobreak >NUL

echo.
echo [3/3] Starting Frontend Application...
cd /d "%~dp0"
echo Starting Frontend on port 3000...
start "FNBXAI Frontend" cmd /k "echo Frontend Starting... && npm start"

echo.
echo =================================================
echo    FNBXAI System Starting...
echo =================================================
echo.
echo ACCESS POINTS:
echo   Frontend: http://localhost:3000
echo   Backend: http://localhost:5000
echo.
echo The system will be ready in about 30 seconds.
echo.

echo Opening browser in 15 seconds...
timeout /t 15 /nobreak >NUL
start http://localhost:3000

echo.
echo Press any key to exit this launcher...
pause >NUL
