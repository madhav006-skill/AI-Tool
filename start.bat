@echo off
echo ========================================
echo    JARVIS Voice Assistant
echo    Starting Backend + Frontend...
echo ========================================
echo.

cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

:: Start both servers
npm run dev

pause
