@echo off
echo ============================================
echo  Starting Make My Office Applications
echo ============================================
echo.

:: Start Internal App (MMO-Team)
echo [1/2] Starting MMO-Team (Internal Management)...
start "MMO-Team Internal" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 2 /nobreak >nul

:: Start Client App (Office Dream Builder)
echo [2/2] Starting Office Dream Builder (Client-Facing)...
start "Office Dream Builder" cmd /k "cd /d %~dp0office-dream-builder && npm run dev"

echo.
echo ============================================
echo  Both Applications Started!
echo ============================================
echo.
echo  MMO-Team (Internal):     http://localhost:5173
echo  Office Dream Builder:    http://localhost:5174
echo.
echo  Close the terminal windows to stop the apps
echo ============================================
echo.

pause
