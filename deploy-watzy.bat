@echo off
title Watzy Deployment to Vercel
color 0A

echo.
echo ==========================================
echo        Watzy Vercel Deployment Script
echo ==========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if pnpm is installed
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] pnpm is not installed. Installing...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install pnpm
        pause
        exit /b 1
    )
    echo [SUCCESS] pnpm installed successfully
)

:: Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Vercel CLI not found. Installing...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Vercel CLI
        pause
        exit /b 1
    )
    echo [SUCCESS] Vercel CLI installed successfully
)

echo [INFO] Checking Vercel authentication...
vercel whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Not logged in to Vercel. Please login...
    vercel login
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to login to Vercel
        pause
        exit /b 1
    )
)

echo [SUCCESS] Authenticated with Vercel

echo.
echo [INFO] Building and deploying watzy to Vercel...
echo.

:: Deploy to Vercel
vercel --prod --yes
if %errorlevel% neq 0 (
    echo [ERROR] Deployment failed
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Deployment completed!
echo.

echo [INFO] Configuring custom domain watzy.app...
vercel domains add watzy.app 2>nul
vercel domains add www.watzy.app 2>nul

echo.
echo [SUCCESS] Domain configuration completed!
echo.

echo ==========================================
echo        Deployment Summary
echo ==========================================
echo.
echo [SUCCESS] watzy has been deployed to Vercel!
echo.
echo IMPORTANT NEXT STEPS:
echo.
echo 1. ADD ENVIRONMENT VARIABLES:
echo    Visit: https://vercel.com/dashboard
echo    Go to: Your Project ^> Settings ^> Environment Variables
echo    Add all variables from your .env.local file
echo.
echo 2. UPDATE DNS SETTINGS for watzy.app:
echo    A Record:     @ ^-^> 76.76.19.19
echo    CNAME Record: www ^-^> cname.vercel-dns.com
echo.
echo 3. UPDATE EXTERNAL SERVICES:
echo    - Supabase: Update Site URL to https://watzy.app
echo    - Razorpay: Update Website URL to https://watzy.app
echo.
echo 4. VERIFY DEPLOYMENT:
echo    Your site will be live at https://watzy.app
echo    DNS propagation may take 24-48 hours
echo.
echo ==========================================

echo.
echo Press any key to open Vercel dashboard...
pause >nul
start https://vercel.com/dashboard

echo.
echo Press any key to exit...
pause >nul