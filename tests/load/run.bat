@echo off
REM tests\load\run.bat — Windows wrapper for k6.
REM Usage:
REM   tests\load\run.bat              -- baseline against localhost
REM   tests\load\run.bat burst        -- burst against localhost
REM   set BASE_URL=http://... ^&^& tests\load\run.bat baseline

setlocal
set "SCENARIO=%~1"
if "%SCENARIO%"=="" set "SCENARIO=baseline"
if "%BASE_URL%"=="" set "BASE_URL=http://localhost:8080"

if /I "%SCENARIO%"=="baseline" (
  set "SCRIPT=k6-baseline.js"
) else if /I "%SCENARIO%"=="burst" (
  set "SCRIPT=k6-burst.js"
) else (
  echo unknown scenario: %SCENARIO% ^(use baseline or burst^)
  exit /b 2
)

echo k6 %SCRIPT%  --^>  %BASE_URL%
k6 run "%~dp0%SCRIPT%"
endlocal
