#!/bin/bash
set -e

echo "🧹 Cleaning up old containers and images..."
docker-compose down -v 2>/dev/null || true
docker rm -f $(docker ps -aq -f name=browser-worker) 2>/dev/null || true
docker rm -f $(docker ps -aq -f name=remote-browser) 2>/dev/null || true

echo ""
echo "🗑️  Removing old images to force rebuild..."
docker rmi remote-browser-orchestrator:latest 2>/dev/null || true
docker rmi remote-browser-orchestrator 2>/dev/null || true
docker rmi remote-browser-worker:latest 2>/dev/null || true
docker rmi remote-browser-worker 2>/dev/null || true

echo ""
echo "🔧 Building worker image (this may take a few minutes)..."
docker build -t remote-browser-worker:latest ./src/worker

echo ""
echo "🔧 Building orchestrator image..."
docker-compose build --no-cache orchestrator

echo ""
echo "🚀 Starting orchestrator..."
docker-compose up -d orchestrator

echo ""
echo "⏳ Waiting for orchestrator to be ready..."
sleep 8

echo ""
echo "📊 Checking status..."
docker ps | grep remote-browser || echo "⚠️  No containers running!"

echo ""
echo "🌐 Testing network..."
docker network inspect remote-browser-net >/dev/null 2>&1 && echo "✓ Network exists" || echo "✗ Network missing"

echo ""
echo "📋 Recent logs..."
docker logs remote-browser-orchestrator --tail 30

echo ""
echo "✅ Rebuild complete!"
echo ""
echo "🧪 To test the health endpoint:"
echo "  curl http://localhost:3000/health"
echo ""
echo "🧪 To test creating a session (set PASSWORD if auth is enabled):"
echo '  curl -X POST http://localhost:3000/sessions \'
echo '    -H "Content-Type: application/json" \'
echo '    -H "Authorization: Basic $(echo -n admin:PASSWORD | base64)" \'
echo '    -d '"'"'{"launchOptions":{"headless":true}}'"'"
echo ""
echo "📋 To view live logs:"
echo "  docker logs -f remote-browser-orchestrator"
echo ""
echo "🐛 To debug worker container (after creating a session):"
echo "  docker ps | grep browser-worker"
echo '  docker logs $(docker ps -q -f name=browser-worker | head -1)'
echo ""

