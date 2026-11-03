@echo off
title ElePay Backend Server
color 0b
echo ===================================================
echo        ⚡ Starting ElePay Backend Server...
echo ===================================================
echo.
echo  Website Portal: http://localhost:3000
echo  Admin Panel:    http://localhost:3000/admin
echo.
echo Server start ho raha hai, is window ko band mat karein...
echo.
node server.js
if %errorlevel% neq 0 (
  echo.
  echo Server start hone me koi dikkat aayi. Check karein ki Node.js installed hai.
  pause
)

