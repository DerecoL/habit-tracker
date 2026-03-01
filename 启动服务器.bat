@echo off
title Habit Tracker Server
powershell -ExecutionPolicy Bypass -NoExit -File "%~dp0standalone\serve.ps1"
pause
