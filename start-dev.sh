#!/bin/bash

# Start development environment script

echo "🚀 Starting Certificate Verification System Development Environment..."

# Kill any existing processes
echo "🔄 Stopping existing processes..."
pkill -f "node server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Wait for processes to stop
sleep 2

# Start backend server
echo "🔧 Starting backend server on port 5000..."
cd backend
PORT=5000 nohup node server.js > server.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
sleep 5

# Test backend
curl -s http://localhost:5000/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend is running on http://localhost:5000"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend..."
cd ../frontend

# Kill any existing frontend processes
pkill -f "vite" 2>/dev/null
sleep 2

# Start frontend
echo "Starting frontend instance..."
npm run dev &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 3

echo ""
echo "🎉 Development environment ready!"
echo "📍 Frontend: http://localhost:3001 (or check npm output above)"
echo "📍 Backend:  http://localhost:5000"
echo "📍 API Health: http://localhost:5000/health"
echo ""
echo "👤 Admin Login:"
echo "   Email: admin@example.com"
echo "   Password: Admin123@"
echo ""
echo "🛑 To stop: pkill -f 'node server.js' && pkill -f vite"