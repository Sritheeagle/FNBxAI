# ==========================================
# FNBXAI UNIFIED LAUNCHER SYSTEM 🚀
# ==========================================
# Starts: 
# 1. Python AI Agent (Port 8000)
# 2. Node.js Backend (Port 5000)
# 3. React Frontend (Port 5173)
# ==========================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   STARTING FNBXAI SYSTEM ECOSYSTEM       " -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# 1. CLEANUP PREVIOUS PROCESSES
Write-Host "[*] Cleaning up old processes..." -ForegroundColor Gray
$ports = @(5173, 5000, 8000)
foreach ($port in $ports) {
    try {
        $p = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($p) { 
            Write-Host "    - Killing process on port $port" -ForegroundColor Red
            Stop-Process -Id $p.OwningProcess -Force -ErrorAction SilentlyContinue 
        }
    } catch { }
}

# 2. SEED KNOWLEDGE BASE (PYTHON)
Write-Host "[*] Seeding AI Knowledge Base..." -ForegroundColor Green
try {
    # Check if python is available, else try python3
    if (Get-Command "python" -ErrorAction SilentlyContinue) {
        $pyCmd = "python"
    } else {
        $pyCmd = "python3"
    }
    
    Start-Process -FilePath $pyCmd -ArgumentList "agent_backend/seed_knowledge.py" -Wait -NoNewWindow
} catch {
    Write-Host "[!] Failed to seed knowledge base. Continuing..." -ForegroundColor Red
}

# 3. START AGENT BACKEND (PYTHON - Port 8000)
Write-Host "[*] Starting Python AI Agent (Port 8000)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd agent_backend; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
Start-Sleep -Seconds 3

# 4. START NODE BACKEND (Port 5000)
Write-Host "[*] Starting Node.js Backend (Port 5000)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start"
Start-Sleep -Seconds 5

# 5. START FRONTEND (Port 3000)
Write-Host "[*] Starting React Frontend (Port 3000)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

# 6. OPEN BROWSER
Write-Host "[*] Launching Browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 10
Start-Process "http://localhost:3000"

Write-Host "==========================================" -ForegroundColor Green
Write-Host "   SYSTEM ONLINE & READY! 🚀              " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Press any key to close this launcher (Services will keep running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
