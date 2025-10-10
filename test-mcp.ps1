# Test MCP Server

# Test 1: Health check
Write-Host "Testing health endpoint..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "https://mcp.fastnow.app/health"

# Test 2: SSE connection (this will hang as expected)
Write-Host "`nTesting SSE endpoint (press Ctrl+C to stop)..." -ForegroundColor Cyan
Write-Host "If you see this hanging, the SSE endpoint is working!" -ForegroundColor Green
# curl https://mcp.fastnow.app/sse




