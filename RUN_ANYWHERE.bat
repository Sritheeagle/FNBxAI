@echo off
title FNBXAI Universal Launcher
color 0A

echo.
echo =================================================
echo    FNBXAI Universal Launcher - Run from Any Directory
echo =================================================
echo.

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0
echo 📁 Script Directory: %SCRIPT_DIR%

REM Navigate to project root
cd /d "%SCRIPT_DIR%"

REM Check if FNBXAI.ps1 exists
if exist "FNBXAI.ps1" (
    echo ✅ Found FNBXAI.ps1
    echo 🚀 Starting complete system...
    echo.
    
    REM Run the PowerShell script
    powershell -ExecutionPolicy Bypass -File FNBXAI.ps1
) else (
    echo ❌ FNBXAI.ps1 not found
    echo Please ensure you're in the correct project directory.
    echo.
    echo Current directory: %CD%
    echo Expected script location: %SCRIPT_DIR%FNBXAI.ps1
    echo.
    pause
)
