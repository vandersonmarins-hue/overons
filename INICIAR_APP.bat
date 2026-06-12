@echo off
title Overons - Sistema de Rastreamento de Entregadores
color 0B
mode con: cols=90 lines=35

:inicio
cls
echo ============================================================
echo       OVERONS - SISTEMA DE RASTREAMENTO DE ENTREGADORES
echo ============================================================
echo.
echo   [1] INICIAR SERVIDOR + ABRIR PAINEL
echo   [2] APENAS INICIAR SERVIDOR
echo   [3] ABRIR DASHBOARD (precisa do servidor rodando)
echo   [4] ABRIR DRIVER FREELANCER
echo   [5] ABRIR DRIVER CLT
echo   [6] INSTALAR DEPENDENCIAS (npm install)
echo   [7] PARAR SERVIDOR
echo   [0] SAIR
echo.
echo ============================================================
set /p opcao="Escolha uma opcao: "

if "%opcao%"=="1" goto iniciar_tudo
if "%opcao%"=="2" goto iniciar_servidor
if "%opcao%"=="3" goto abrir_dashboard
if "%opcao%"=="4" goto abrir_driver
if "%opcao%"=="5" goto abrir_driver_clt
if "%opcao%"=="6" goto instalar
if "%opcao%"=="7" goto parar_servidor
if "%opcao%"=="0" goto sair
goto inicio

:iniciar_tudo
cls
echo ============================================================
echo          INICIANDO SERVIDOR E ABRINDO DASHBOARD
echo ============================================================
echo.
echo Servidor rodando em: http://localhost:3000
echo Dashboard: http://localhost:3000/dashboard
echo Driver: http://localhost:3000/driver.html
echo Driver CLT: http://localhost:3000/driver-clt.html
echo.
echo Para encerrar: feche esta janela ou volte ao menu e opcao 7
echo ============================================================
echo.

cd /d "%~dp0"

if not exist "node_modules\" (
    echo [AVISO] Dependencias nao instaladas. Execute a opcao 6 primeiro.
    echo.
    pause
    goto inicio
)

if not exist "frontend\dist\" (
    echo [BUILD] Gerando frontend React...
    call npm run build-frontend
    if errorlevel 1 (
        echo [ERRO] Falha ao gerar o frontend React.
        pause
        goto inicio
    )
)

start "" http://localhost:3000/dashboard
start "" http://localhost:3000/driver.html
start "" http://localhost:3000/driver-clt.html

echo [INICIANDO] node backend/server.js
echo [AGUARDE] Pressione CTRL+C para parar o servidor...
echo.
node backend/server.js
pause
goto inicio

:iniciar_servidor
cls
echo ============================================================
echo               INICIANDO APENAS O SERVIDOR
echo ============================================================
echo.
echo Servidor rodando em: http://localhost:3000
echo Acesse os arquivos .html no navegador manualmente.
echo.
echo   Dashboard  : http://localhost:3000/dashboard
echo   Driver     : http://localhost:3000/driver.html
echo   Driver CLT : http://localhost:3000/driver-clt.html
echo.
echo Para encerrar: feche esta janela ou volte ao menu e opcao 7
echo ============================================================
echo.

cd /d "%~dp0"

if not exist "node_modules\" (
    echo [AVISO] Dependencias nao instaladas. Execute a opcao 6 primeiro.
    echo.
    pause
    goto inicio
)

if not exist "frontend\dist\" (
    echo [BUILD] Gerando frontend React...
    call npm run build-frontend
    if errorlevel 1 (
        echo [ERRO] Falha ao gerar o frontend React.
        pause
        goto inicio
    )
)

echo [INICIANDO] node backend/server.js
echo [AGUARDE] Pressione CTRL+C para parar o servidor...
echo.
node backend/server.js
pause
goto inicio

:abrir_dashboard
cls
echo ============================================================
echo            ABRINDO DASHBOARD NO NAVEGADOR
echo ============================================================
start http://localhost:3000/dashboard
echo Dashboard aberto! Certifique-se de que o servidor esta rodando.
echo.
pause
goto inicio

:abrir_driver
cls
echo ============================================================
echo           ABRINDO DRIVER FREELANCER NO NAVEGADOR
echo ============================================================
start http://localhost:3000/driver.html
echo Driver aberto! Certifique-se de que o servidor esta rodando.
echo.
pause
goto inicio

:abrir_driver_clt
cls
echo ============================================================
echo             ABRINDO DRIVER CLT NO NAVEGADOR
echo ============================================================
start http://localhost:3000/driver-clt.html
echo Driver CLT aberto! Certifique-se de que o servidor esta rodando.
echo.
pause
goto inicio

:instalar
cls
echo ============================================================
echo            INSTALANDO DEPENDENCIAS (npm install)
echo ============================================================
echo.
cd /d "%~dp0"
npm install
echo.
echo Instalacao concluida!
echo.
pause
goto inicio

:parar_servidor
cls
echo ============================================================
echo               PARANDO O SERVIDOR
echo ============================================================
echo.
echo Encerrando processos do Node.js na porta 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    if not "%%a"=="" (
        echo Parando processo PID: %%a
        taskkill /F /PID %%a 2>nul
    )
)
echo.
echo Servidor parado (se estava rodando).
echo.
pause
goto inicio

:sair
cls
echo ============================================================
echo              OBRIGADO POR USAR O OVERONS!
echo ============================================================
echo.
timeout /t 2 /nobreak >nul
exit

:erro
cls
echo ============================================================
echo   ERRO: Node.js nao encontrado!
echo   Instale em: https://nodejs.org/
echo ============================================================
echo.
pause
goto inicio
