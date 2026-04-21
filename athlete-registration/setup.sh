#!/bin/bash
# Start script for Athlete Registration System

echo "🏟️ Athlete Registration System - Starting..."
echo ""

# Check MongoDB
if ! command -v mongod &> /dev/null; then
  echo "⚠️  MongoDB not found. Please install MongoDB first."
  echo "   https://www.mongodb.com/try/download/community"
  exit 1
fi

# Install backend deps
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

# Install frontend deps
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "Now run in TWO terminals:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend && npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd frontend && npm run dev"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔌 Backend:  http://localhost:5000"
echo "🔐 Admin:    admin@sports.com / Admin@123"
