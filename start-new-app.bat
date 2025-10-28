@echo off
echo 🚀 Starting Stotra Elections Platform (React + Vite)
echo.

REM Check if we're in the right directory
if not exist "frontend" (
    echo ❌ frontend/ directory not found. Make sure you're in the project root.
    pause
    exit /b 1
)

REM Navigate to frontend
cd frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

echo 🎯 Starting development server...
echo 🌐 App will be available at: http://localhost:3000
echo.

REM Start the dev server
npm run dev