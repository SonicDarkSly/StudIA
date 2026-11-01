@echo off
rem Lanceur Windows. Fermer la fenetre arrete l'application.
chcp 65001 >nul
cd /d "%~dp0"

set NODE_VERSION=24.18.0
if exist "%CD%\.node\node.exe" set "PATH=%CD%\.node;%PATH%"

where npm >nul 2>nul
if not errorlevel 1 goto nodeok
echo [..] Node.js est introuvable - installation portable dans le dossier de l'app...
curl -fL -o node-portable.zip https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-win-x64.zip
if errorlevel 1 (
  echo [X] Telechargement de Node.js impossible - connexion internet ?
  echo     Alternative : installer Node.js depuis https://nodejs.org puis relancer.
  pause
  exit /b 1
)
tar -xf node-portable.zip
ren node-v%NODE_VERSION%-win-x64 .node
del node-portable.zip
set "PATH=%CD%\.node;%PATH%"
echo [OK] Node.js installe localement dans .node\ - supprimer ce dossier pour desinstaller.

where npm >nul 2>nul
if errorlevel 1 (
  echo [X] Node.js reste introuvable apres l'installation portable.
  pause
  exit /b 1
)
:nodeok

curl -s --max-time 2 http://localhost:3003/api/health 2>nul | findstr ok >nul
if not errorlevel 1 (
  echo [OK] StudIA tourne deja - ouverture de la page.
  start "" http://localhost:5175
  exit /b 0
)

echo [1/3] Verification des dependances...
if not exist node_modules\.bin\vite.cmd if not exist client\node_modules\.bin\vite.cmd goto installdeps
if not exist node_modules\.bin\tsc.cmd if not exist client\node_modules\.bin\tsc.cmd if not exist server\node_modules\.bin\tsc.cmd goto installdeps
if not exist node_modules\node-llama-cpp if not exist server\node_modules\node-llama-cpp goto installdeps
if not exist node_modules\@nestjs\cqrs if not exist server\node_modules\@nestjs\cqrs goto installdeps
if not exist node_modules\react-markdown if not exist client\node_modules\react-markdown goto installdeps
if not exist node_modules\jszip if not exist client\node_modules\jszip goto installdeps
if not exist node_modules\antd if not exist client\node_modules\antd goto installdeps
echo [OK] Dependances deja installees - node_modules complet.
goto depsok
:installdeps
echo [..] Dependances manquantes ou incompletes - installation, quelques minutes...
call npm install
echo [OK] Dependances installees.
:depsok

echo [2/3] Demarrage de StudIA...
start /b cmd /c "npm run dev"

echo [3/3] Preparation en cours - compilation du serveur...
set /a tries=0
:wait
set /a tries+=1
curl -s --max-time 2 http://localhost:3003/api/health 2>nul | findstr ok >nul && goto ready
if %tries% geq 90 goto ready
timeout /t 1 /nobreak >nul
goto wait

:ready
start "" http://localhost:5175
echo.
echo [OK] StudIA est ouvert : http://localhost:5175
echo      Laissez cette fenetre ouverte pendant l'utilisation.
echo      Pour arreter : fermez cette fenetre.
pause >nul
