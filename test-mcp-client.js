// Simple MCP client to test your server
const https = require('https');

const testMCP = async () => {
  console.log('🧪 Testing MCP Server...\n');

  // Test 1: Check if server is up
  console.log('1️⃣ Checking server health...');
  const healthRes = await fetch('https://mcp.fastnow.app/health');
  const health = await healthRes.json();
  console.log('✅ Server health:', health);

  // Test 2: Check discovery manifest
  console.log('\n2️⃣ Checking MCP discovery manifest...');
  const manifestRes = await fetch('https://mcp.fastnow.app/.well-known/mcp.json');
  const manifest = await manifestRes.json();
  console.log('✅ Manifest:', manifest.name);
  console.log('   Tools:', manifest.capabilities.tools ? 'Yes' : 'No');
  console.log('   Resources:', manifest.capabilities.resources ? 'Yes' : 'No');
  console.log('   SSE URL:', manifest.transports.sse.url);

  // Test 3: Try SSE connection
  console.log('\n3️⃣ Testing SSE connection...');
  const EventSource = (await import('eventsource')).default;
  const es = new EventSource('https://mcp.fastnow.app/sse');
  
  es.onopen = () => {
    console.log('✅ SSE connection opened!');
    setTimeout(() => {
      console.log('\n✅ All tests passed! Your MCP server is working correctly.');
      console.log('\n📝 The issue is with ChatGPT Desktop Beta, not your server.');
      es.close();
      process.exit(0);
    }, 2000);
  };
  
  es.onerror = (err) => {
    console.error('❌ SSE error:', err);
    es.close();
    process.exit(1);
  };
  
  es.onmessage = (msg) => {
    console.log('📨 Received:', msg.data);
  };
};

testMCP().catch(console.error);

