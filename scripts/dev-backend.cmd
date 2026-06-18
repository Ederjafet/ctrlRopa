@echo off
setlocal EnableExtensions DisableDelayedExpansion

set "PROJECT_ROOT=%~dp0.."

pushd "%PROJECT_ROOT%" >nul
if errorlevel 1 (
  echo No se pudo entrar a la raiz del proyecto.
  exit /b 1
)

if not exist ".env" (
  echo No existe .env. Copia .env.example a .env y configura CONTROL_ROPA_DB_PASSWORD.
  popd >nul
  exit /b 1
)

for /f "usebackq eol=# tokens=1* delims==" %%A in (".env") do (
  call :set_env_var "%%A" "%%B"
)

if not defined CONTROL_ROPA_DB_PASSWORD (
  echo CONTROL_ROPA_DB_PASSWORD esta vacia. Configurala en .env antes de arrancar backend DEV.
  popd >nul
  exit /b 1
)

if "%CONTROL_ROPA_DB_PASSWORD%"=="CAMBIA_ESTE_VALOR" (
  echo CONTROL_ROPA_DB_PASSWORD sigue usando el valor de ejemplo. Configura el password local real en .env.
  popd >nul
  exit /b 1
)

if "%CONTROL_ROPA_DB_PASSWORD%"=="change-me" (
  echo CONTROL_ROPA_DB_PASSWORD sigue usando el valor de ejemplo. Configura el password local real en .env.
  popd >nul
  exit /b 1
)

pushd "backend\control-ropa" >nul
if errorlevel 1 (
  echo No se pudo entrar a backend\control-ropa.
  popd >nul
  exit /b 1
)

call mvnw.cmd spring-boot:run
set "EXIT_CODE=%ERRORLEVEL%"

popd >nul
popd >nul
exit /b %EXIT_CODE%

:set_env_var
setlocal EnableExtensions DisableDelayedExpansion
set "KEY=%~1"
set "VALUE=%~2"

if "%KEY%"=="" exit /b 0
if "%KEY:~0,1%"=="#" exit /b 0

if "%VALUE:~0,1%"=="'" if "%VALUE:~-1%"=="'" set "VALUE=%VALUE:~1,-1%"
if "%VALUE:~0,1%"=="""" if "%VALUE:~-1%"=="""" set "VALUE=%VALUE:~1,-1%"

endlocal & set "%KEY%=%VALUE%"
exit /b 0
