#!/bin/bash

echo "🚀 Starting PersonalFlow Task Tracker..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Desktop first."
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Build and start containers
echo "📦 Building and starting containers..."
docker compose up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PersonalFlow is running!"
    echo ""
    echo "🌐 Access the application:"
    echo "   Frontend:     http://localhost:3000"
    echo "   API:          http://localhost:3124"
    echo "   API Docs:     http://localhost:3124/swagger"
    echo ""
    echo "💡 To stop the application, run: docker-compose down"
    echo "📝 Check logs with: docker-compose logs -f"
else
    echo ""
    echo "❌ Failed to start containers. Please check the error messages above."
    exit 1
fi
