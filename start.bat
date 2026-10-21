@echo off
echo Starting Intelligent Rural Healthcare System Services...

echo.
echo [1/3] Starting Local MySQL Database...
start "MySQL Database" cmd /k "cd /d %~dp0backend && "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --console --datadir="%~dp0backend\data" --port=3306 --shared-memory"

echo Waiting for database to initialize...
timeout /t 4 /nobreak >nul

echo.
echo [2/3] Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm run dev"

echo Waiting for backend to bind...
timeout /t 2 /nobreak >nul

echo.
echo [3/3] Starting Frontend Server...
start "Frontend Client" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo Services Started:
echo Database Port: 3306 (Data: backend/data)
echo Backend API:    http://localhost:5000
echo Frontend UI:   http://localhost:5173
echo ===================================================

