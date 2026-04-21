#!/bin/bash

# Athlete Registration System - Production Setup Script
# This script helps set up the system for production deployment

set -e

echo "================================"
echo "Production Setup Script"
echo "================================"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js v18+ required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v) OK"

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found"
    echo "   Copy backend/.env.example to backend/.env and update values"
    cp backend/.env.example backend/.env 2>/dev/null || echo "   Use: cp backend/.env.example backend/.env"
fi

if [ ! -f "frontend/.env.production" ]; then
    echo "⚠️  frontend/.env.production not found"
    echo "   Copy frontend/.env to frontend/.env.production"
    cp frontend/.env frontend/.env.production 2>/dev/null || echo "   Create frontend/.env.production manually"
fi

echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install --production
cd ..

echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --production
cd ..

echo ""
echo "🔨 Building frontend..."
cd frontend
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
    du -sh dist/
else
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

echo ""
echo "✅ Production setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify backend/.env has production values"
echo "2. Update frontend/.env.production with correct API URL"
echo "3. Deploy backend to your hosting (Vercel/Heroku/etc)"
echo "4. Deploy frontend dist/ to your CDN/hosting"
echo "5. Run database backups and monitoring"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
