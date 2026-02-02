@echo off
TITLE FNBXAI SYSTEM LAUNCHER
COLOR 0A
CLS

ECHO ==================================================
ECHO    STARTING FNBXAI ECOSYSTEM
ECHO    (Frontend + Backend + Database + AI Agent)
ECHO ==================================================
ECHO.

:: Admin Check Removed for User Convenience

CD /D "%~dp0"

ECHO [1/4] Cleaning up old processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq FNBXAI*" >nul 2>&1

ECHO [2/4] Initializing PowerShell Launcher...
PowerShell -NoProfile -ExecutionPolicy Bypass -File "fnbXai.ps1"

PAUSE
