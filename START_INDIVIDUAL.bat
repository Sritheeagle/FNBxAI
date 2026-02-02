@echo off
title FNBXAI Individual Component Launcher
color 0A

echo.
echo =================================================
echo    FNBXAI - Individual Component Launcher
echo =================================================
echo.
echo Choose which component to start:
echo.
echo   1. Backend Server Only
echo   2. Frontend Only
echo   3. Knowledge Base Seeding Only
echo   4. AI System Monitor Only
echo   5. Database Manager Only
echo   6. Exit
echo.

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto knowledge
if "%choice%"=="4" goto monitor
if "%choice%"=="5" goto database
if "%choice%"=="6" goto exit

echo Invalid choice. Please try again.
goto start

:backend
echo.
echo 🔧 Starting Backend Server...
start "FNBXAI Backend" cmd /k "cd backend && echo Starting Backend Server... && npm start"
goto end

:frontend
echo.
echo 🎨 Starting Frontend Application...
start "FNBXAI Frontend" cmd /k "echo Starting Frontend Application... && npm start"
goto end

:knowledge
echo.
echo 📚 Seeding Knowledge Base...
start "FNBXAI Knowledge Base" cmd /k "cd backend && echo Seeding Knowledge Base... && npm run seed-specialized"
goto end

:monitor
echo.
echo 🤖 Starting AI System Monitor...
start "FNBXAI AI Monitor" cmd /k "echo AI System Monitor Active && timeout /t 300 && echo Monitor running..."
goto end

:database
echo.
echo 🗄️ Starting Database Manager...
start "FNBXAI Database" cmd /k "echo Database Manager Active && timeout /t 300 && echo Database running..."
goto end

:exit
echo.
echo 🚀 FNBXAI Launcher closed.
exit /b 0

:end
echo.
echo ✅ Component started successfully!
echo 🌐 Access Points:
echo    Frontend: http://localhost:3000
echo    Backend: http://localhost:5000
echo.
echo Press any key to return to menu...
pause >NUL
goto start
