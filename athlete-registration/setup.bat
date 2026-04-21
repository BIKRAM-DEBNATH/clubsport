@echo off
echo 🏟️ Athlete Registration System - Setup
echo.

echo 📦 Installing backend dependencies...
cd backend
call npm install
cd ..

echo 📦 Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo ✅ Setup complete!
echo.
echo Run these in TWO separate Command Prompt windows:
echo.
echo   Window 1 (Backend):
echo     cd backend
echo     npm run dev
echo.
echo   Window 2 (Frontend):
echo     cd frontend
echo     npm run dev
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔌 Backend:  http://localhost:5000
echo 🔐 Admin:    admin@sports.com / Admin@123
pause
