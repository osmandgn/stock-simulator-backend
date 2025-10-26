#!/bin/bash

# Stock Simulator Backend API Test Script
# Run this after starting the server: npm start

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Stock Simulator Backend API"
echo "========================================"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ $response -eq 200 ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    curl -s "$BASE_URL/health" | jq '.'
else
    echo -e "${RED}❌ Health check failed (HTTP $response)${NC}"
fi
echo ""

# Test 2: Root endpoint
echo -e "${YELLOW}2. Testing Root Endpoint (/)...${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ $response -eq 200 ]; then
    echo -e "${GREEN}✅ Root endpoint passed${NC}"
else
    echo -e "${RED}❌ Root endpoint failed (HTTP $response)${NC}"
fi
echo ""

# Test 3: Get popular stocks
echo -e "${YELLOW}3. Testing Popular Stocks (GET /api/stocks/popular)...${NC}"
response=$(curl -s "$BASE_URL/api/stocks/popular?limit=5")
count=$(echo $response | jq -r '.count')
cached=$(echo $response | jq -r '.cached')
if [ "$count" -gt 0 ]; then
    echo -e "${GREEN}✅ Popular stocks passed (${count} stocks, cached: ${cached})${NC}"
    echo $response | jq '.stocks[0]'
else
    echo -e "${RED}❌ Popular stocks failed${NC}"
    echo $response | jq '.'
fi
echo ""

# Test 4: Get trending stocks
echo -e "${YELLOW}4. Testing Trending Stocks (GET /api/stocks/trending)...${NC}"
response=$(curl -s "$BASE_URL/api/stocks/trending")
count=$(echo $response | jq -r '.count')
if [ "$count" -gt 0 ]; then
    echo -e "${GREEN}✅ Trending stocks passed (${count} stocks)${NC}"
    echo $response | jq '.stocks[0]'
else
    echo -e "${RED}❌ Trending stocks failed${NC}"
    echo $response | jq '.'
fi
echo ""

# Test 5: Get stock quote
echo -e "${YELLOW}5. Testing Stock Quote (GET /api/stocks/quote/AAPL)...${NC}"
response=$(curl -s "$BASE_URL/api/stocks/quote/AAPL")
symbol=$(echo $response | jq -r '.symbol')
price=$(echo $response | jq -r '.currentPrice')
if [ "$symbol" = "AAPL" ] && [ "$price" != "null" ]; then
    echo -e "${GREEN}✅ Stock quote passed (AAPL: \$$price)${NC}"
    echo $response | jq '.'
else
    echo -e "${RED}❌ Stock quote failed${NC}"
    echo $response | jq '.'
fi
echo ""

# Test 6: Search stocks
echo -e "${YELLOW}6. Testing Stock Search (GET /api/stocks/search?q=tesla)...${NC}"
response=$(curl -s "$BASE_URL/api/stocks/search?q=tesla")
count=$(echo $response | jq -r '.count')
if [ "$count" -gt 0 ]; then
    echo -e "${GREEN}✅ Stock search passed (${count} results)${NC}"
    echo $response | jq '.results[0]'
else
    echo -e "${RED}❌ Stock search failed${NC}"
    echo $response | jq '.'
fi
echo ""

# Test 7: Batch quotes
echo -e "${YELLOW}7. Testing Batch Quotes (POST /api/stocks/batch-quotes)...${NC}"
response=$(curl -s -X POST "$BASE_URL/api/stocks/batch-quotes" \
  -H "Content-Type: application/json" \
  -d '{"symbols":["AAPL","GOOGL","TSLA"]}')
count=$(echo $response | jq -r '.count')
if [ "$count" -gt 0 ]; then
    echo -e "${GREEN}✅ Batch quotes passed (${count} quotes)${NC}"
    echo $response | jq '.quotes[0]'
else
    echo -e "${RED}❌ Batch quotes failed${NC}"
    echo $response | jq '.'
fi
echo ""

# Test 8: Get leaderboard
echo -e "${YELLOW}8. Testing Leaderboard (GET /api/leaderboard)...${NC}"
response=$(curl -s "$BASE_URL/api/leaderboard")
count=$(echo $response | jq -r '.count')
if [ "$count" -gt 0 ]; then
    echo -e "${GREEN}✅ Leaderboard passed (${count} users)${NC}"
    echo $response | jq '.leaderboard[0]'
else
    echo -e "${RED}❌ Leaderboard failed${NC}"
    echo $response | jq '.'
fi
echo ""

# Test 9: Update leaderboard
echo -e "${YELLOW}9. Testing Update Leaderboard (POST /api/leaderboard/update)...${NC}"
response=$(curl -s -X POST "$BASE_URL/api/leaderboard/update" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123","username":"TestUser","totalReturn":5000.50}')
success=$(echo $response | jq -r '.success')
if [ "$success" = "true" ]; then
    echo -e "${GREEN}✅ Update leaderboard passed${NC}"
    echo $response | jq '.user'
else
    echo -e "${RED}❌ Update leaderboard failed${NC}"
    echo $response | jq '.'
fi
echo ""

# Test 10: Cache stats
echo -e "${YELLOW}10. Testing Cache Stats (GET /api/admin/cache/stats)...${NC}"
response=$(curl -s "$BASE_URL/api/admin/cache/stats")
success=$(echo $response | jq -r '.success')
if [ "$success" = "true" ]; then
    echo -e "${GREEN}✅ Cache stats passed${NC}"
    echo $response | jq '.cache'
else
    echo -e "${RED}❌ Cache stats failed${NC}"
    echo $response | jq '.'
fi
echo ""

echo "========================================"
echo -e "${GREEN}✨ All tests completed!${NC}"
echo ""
