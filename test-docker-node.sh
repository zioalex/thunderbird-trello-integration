#!/bin/bash

# Test with specific Node versions using Docker (matches CI environment exactly)

echo "🐳 Testing with Node.js versions using Docker..."

# Test with Node 18
echo "📦 Testing with Node 18..."
docker run --rm -v "$(pwd):/app" -w /app node:18-alpine sh -c "
    npm ci --silent && 
    npm run lint && 
    npm test
"

# Test with Node 20
echo "📦 Testing with Node 20..."
docker run --rm -v "$(pwd):/app" -w /app node:20-alpine sh -c "
    npm ci --silent && 
    npm run lint && 
    npm test
"

echo "✅ Docker tests completed!"
