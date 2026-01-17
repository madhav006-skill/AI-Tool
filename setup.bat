@echo off
REM JARVIS Full Setup Script for Windows
REM Installs all dependencies for React + Node.js migration

echo.
echo ============================================================
echo  🤖 JARVIS - React + Node.js Setup Script
echo ============================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js is not installed!
    echo    Please install from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version
npm --version
echo.

REM Navigate to backend
echo Installing Backend Dependencies...
echo ============================================================
cd /d "%~dp0backend"
if exist package.json (
    call npm install
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Backend dependencies installed
    ) else (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo ❌ package.json not found in backend
    pause
    exit /b 1
)
echo.

REM Navigate to frontend
echo Installing Frontend Dependencies...
echo ============================================================
cd /d "%~dp0frontend"
if exist package.json (
    call npm install
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Frontend dependencies installed
    ) else (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo ❌ package.json not found in frontend
    pause
    exit /b 1
)
echo.

echo ============================================================
echo ✅ Setup Complete!
echo ============================================================
echo.
echo 📋 Next Steps:
echo.
echo 1. Start Backend (Terminal 1):
echo    cd backend
echo    npm start
echo    Server will run on: http://localhost:5000
echo.
echo 2. Start Frontend (Terminal 2):
echo    cd frontend
echo    npm start
echo    App will run on: http://localhost:3000
echo.
echo 3. Open browser and navigate to:
echo    http://localhost:3000
echo.
echo 📚 Documentation:
echo    - README.md - Full documentation
echo    - QUICKSTART.md - Quick start guide
echo    - MIGRATION_COMPARISON.md - Python vs React comparison
echo.
echo ============================================================
pause
