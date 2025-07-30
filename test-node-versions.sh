#!/bin/bash

# Test script for different Node.js versions
set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Thunderbird Trello Extension with different Node.js versions${NC}"
echo "=================================================="

# Function to test with a specific Node version
test_node_version() {
    local version=$1
    echo -e "\n${YELLOW}📦 Testing with Node.js ${version}${NC}"
    echo "----------------------------------------"
    
    # Switch to the specified Node version
    nvm use $version
    
    # Show current Node and npm versions
    echo -e "Node version: $(node --version)"
    echo -e "NPM version: $(npm --version)"
    echo ""
    
    # Clean install dependencies
    echo -e "${BLUE}🔧 Installing dependencies...${NC}"
    npm ci --silent
    
    # Run linting
    echo -e "${BLUE}🔍 Running ESLint...${NC}"
    npm run lint
    
    # Run tests
    echo -e "${BLUE}🧪 Running tests...${NC}"
    npm test
    
    # Run tests in Docker (optional - uncomment if needed)
    # echo -e "${BLUE}🐳 Running tests in Docker...${NC}"
    # npm run test:docker
    
    echo -e "${GREEN}✅ Node.js ${version} tests completed successfully!${NC}"
}

# Test with Node 18
if nvm list | grep -q "v18"; then
    test_node_version 18
else
    echo -e "${YELLOW}⚠️  Node.js 18 not installed, skipping...${NC}"
fi

# Test with Node 20
if nvm list | grep -q "v20"; then
    test_node_version 20
else
    echo -e "${YELLOW}⚠️  Node.js 20 not installed, skipping...${NC}"
fi

echo -e "\n${GREEN}🎉 All Node.js version tests completed!${NC}"
echo "=================================================="

# Return to your preferred Node version (18 in your case)
nvm use 18
echo -e "Switched back to Node.js $(node --version)"
