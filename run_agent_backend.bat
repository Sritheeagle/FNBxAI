@echo off
echo ===================================================
echo      Vignan University AI Agent - Backend Starter
echo ===================================================

cd agent_backend

echo.
echo [1/2] Installing/Verifying Dependencies...
pip install -r requirements.txt

echo.
echo [2/2] Starting Backend Server...
echo --------------------------------
echo Server will run on http://localhost:8000
echo Documentation available at http://localhost:8000/docs
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause
