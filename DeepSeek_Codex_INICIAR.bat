@echo off
title Overons + Marins ERP - INICIAR
color 0B
mode con: cols=90 lines=40

:inicio
cls
echo ================================================================
echo       OVERONS + MARINS ERP - SISTEMA DE LOGISTICA INTEGRADO
echo ================================================================
echo.
echo   [1] INICIAR TUDO (Overons + Marins + WebSocket)
echo   [2] INICIAR APENAS OVERONS (porta 3000)
echo   [3] INICIAR APENAS MARINS ERP (porta 3001)
echo   [4] INICIAR WEBSOCKET (porta 3004)
echo   [5] ABRIR OVERONS DASHBOARD
echo   [6] ABRIR MARINS ERP
echo   [7] ABRIR RASTREAMENTO
echo   [8] ABRIR CENTRAL DE MONITORAMENTO
echo   [9] PARAR TUDO
echo   [0] SAIR
echo.
echo ================================================================
echo.

set /p opcao="Escolha uma opcao: "

if "%opcao%"=="1" goto iniciar_tudo
if "%opcao%"=="2" goto iniciar_overons
if "%opcao%"=="3" goto iniciar_marins
if "%opcao%"=="4" goto iniciar_websocket
if "%opcao%"=="5" goto abrir_overons
if "%opcao%"=="6" goto abrir_marins
if "%opcao%"=="7" goto abrir_rastreamento
if "%opcao%"=="8" goto abrir_central
if "%opcao%"=="9" goto parar_tudo
if "%opcao%"=="0" goto sair
goto inicio

:iniciar_tudo
cls
echo ================================================================
echo               INICIANDO TODOS OS SERVICOS
echo ================================================================
echo.
echo  [1/3] Iniciando Overons API (porta 3000)...
cd /d "%~dp0"
start "Overons API" cmd /c "node backend/server.js"
timeout /t 3 /nobreak >nul

echo  [2/3] Iniciando WebSocket (porta 3004)...
start "Marins WebSocket" cmd /c "node marins-erp/server/websocket.js"
timeout /t 2 /nobreak >nul

echo  [3/3] Iniciando Marins ERP (porta 3001)...
start "Marins ERP" cmd /c "node marins-erp/node_modules/next/dist/bin/next dev marins-erp -p 3001"
timeout /t 5 /nobreak >nul

echo.
echo ================================================================
echo          TODOS OS SERVICOS INICIADOS!
echo ================================================================
echo.
echo   🚚 Overons:      http://localhost:3000
echo   📱 Marins ERP:   http://localhost:3001
echo   🔌 WebSocket:    ws://localhost:3004
echo.
echo   📋 URLs Uteis:
echo   ├─ Dashboard Overons:    http://localhost:3000/dashboard
echo   ├─ Marins Motorista:    http://localhost:3001/dashboard/motorista
echo   ├─ Central:             http://localhost:3001/central
echo   ├─ Rastreamento:        http://localhost:3001/rastreamento/PED-2024-001
echo   └─ Relatorios:          http://localhost:3001/dashboard/empresa/relatorios
echo.
echo   Pressione qualquer tecla para voltar ao menu...
pause >nul
goto inicio

:iniciar_overons
cls
echo ================================================================
echo              INICIANDO OVERONS API (porta 3000)
echo ================================================================
echo.
cd /d "%~dp0"
start "Overons API" cmd /c "node backend/server.js"
echo.
echo  Aguarde alguns segundos e acesse:
echo   http://localhost:3000
echo   http://localhost:3000/dashboard
echo.
pause
goto inicio

:iniciar_marins
cls
echo ================================================================
echo              INICIANDO MARINS ERP (porta 3001)
echo ================================================================
echo.
cd /d "%~dp0"
start "Marins ERP" cmd /c "node marins-erp/node_modules/next/dist/bin/next dev marins-erp -p 3001"
echo.
echo  Aguarde alguns segundos e acesse:
echo   http://localhost:3001
echo.
pause
goto inicio

:iniciar_websocket
cls
echo ================================================================
echo              INICIANDO WEBSOCKET (porta 3004)
echo ================================================================
echo.
cd /d "%~dp0"
start "Marins WebSocket" cmd /c "node marins-erp/server/websocket.js"
echo.
echo  WebSocket rodando em: ws://localhost:3004
echo.
pause
goto inicio

:abrir_overons
cls
echo ================================================================
echo              ABRINDO OVERONS NO NAVEGADOR
echo ================================================================
start http://localhost:3000/dashboard
echo  Dashboard Overons aberto!
echo.
pause
goto inicio

:abrir_marins
cls
echo ================================================================
echo              ABRINDO MARINS ERP NO NAVEGADOR
echo ================================================================
start http://localhost:3001
echo  Marins ERP aberto!
echo.
pause
goto inicio

:abrir_rastreamento
cls
echo ================================================================
echo           ABRINDO RASTREAMENTO NO NAVEGADOR
echo ================================================================
start http://localhost:3001/rastreamento/PED-2024-001
echo  Rastreamento aberto!
echo.
pause
goto inicio

:abrir_central
cls
echo ================================================================
echo          ABRINDO CENTRAL DE MONITORAMENTO
echo ================================================================
start http://localhost:3001/central
echo  Central de Monitoramento aberta!
echo.
pause
goto inicio

:parar_tudo
cls
echo ================================================================
echo              PARANDO TODOS OS SERVICOS
echo ================================================================
echo.
echo  Encerrando processos nas portas 3000, 3001 e 3004...
echo.
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    if not "%%a"=="" taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    if not "%%a"=="" taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3004') do (
    if not "%%a"=="" taskkill /F /PID %%a 2>nul
)
echo.
echo  Todos os servicos foram parados!
echo.
pause
goto inicio

:sair
cls
echo ================================================================
echo             OBRIGADO POR USAR OVERONS + MARINS!
echo ================================================================
echo.
timeout /t 2 /nobreak >nul
exit
