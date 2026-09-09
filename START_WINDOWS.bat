@echo off
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 scripts\serve.py
  goto finished
)
where python >nul 2>nul
if not errorlevel 1 (
  python scripts\serve.py
  goto finished
)
echo Python was not found. Install Python 3 or open the hosted game link.
pause
exit /b 1
:finished
if errorlevel 1 (
  echo.
  echo The local server could not start. See the error above.
  echo You can also use the HTTPS game link in your browser.
  pause
)
