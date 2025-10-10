#!/bin/bash
# Test if read tools work via MCP server

# Get your OAuth token from Supabase
echo "=== Step 1: Get OAuth Token from Database ==="
echo "Run this in Supabase SQL Editor:"
echo "SELECT access_token FROM oauth_apps WHERE app_name = 'chatgpt-fastnow' ORDER BY created_at DESC LIMIT 1;"
echo ""
read -p "Paste the token here: " TOKEN

echo ""
echo "=== Step 2: Test get_current_fast ==="
curl -X POST https://mcp.fastnow.app/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_current_fast",
      "arguments": {}
    }
  }' | jq '.'

echo ""
echo "=== Step 3: Test get_weight_progress ==="
curl -X POST https://mcp.fastnow.app/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_weight_progress",
      "arguments": {}
    }
  }' | jq '.'

