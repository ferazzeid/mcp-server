/**
 * Comprehensive MCP Server for FastNow - All 108 Endpoints
 * Proxies tool calls to Supabase Edge Functions
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { validateTokenAndGetUserId } from "./config/supabase.js";
import * as FastNowResources from "./resources/fastnow.js";
import { FASTNOW_TOOLS, OAUTH_SCOPES, SUPABASE_FUNCTIONS_BASE_URL } from "./tools/comprehensive-tools.js";
import { FASTNOW_COMPONENTS, getComponentByUri } from "./components-config.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Enable CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// OAuth Authorization Server Metadata (RFC 8414)
app.get('/.well-known/oauth-authorization-server', (req, res) => {
  res.json({
    issuer: "https://go.fastnow.app",
    authorization_endpoint: "https://go.fastnow.app/oauth/authorize",
    token_endpoint: `${SUPABASE_FUNCTIONS_BASE_URL}/oauth-token`,
    registration_endpoint: `${SUPABASE_FUNCTIONS_BASE_URL}/oauth-register`,
    scopes_supported: OAUTH_SCOPES,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "none"]
  });
});

// MCP Discovery endpoint
app.get('/.well-known/mcp.json', (req, res) => {
  res.json({
    "$schema": "https://modelcontextprotocol.io/schemas/mcp.json",
    "name": "FastNow MCP Server",
    "description": "Complete voice control for your fasting, nutrition, weight, and wellness journey with FastNow - 108 tools available",
    "version": "2.0.0",
    "author": {
      "name": "FastNow",
      "url": "https://fastnow.app"
    },
    "capabilities": {
      "resources": true,
      "tools": true,
      "prompts": false
    },
    "transports": {
      "http": {
        "url": "https://mcp.fastnow.app/mcp",
        "method": "POST"
      }
    },
    "authentication": {
      "type": "oauth2",
      "authorization_url": "https://go.fastnow.app/oauth/authorize",
      "token_url": `${SUPABASE_FUNCTIONS_BASE_URL}/oauth-token`,
      "registration_url": `${SUPABASE_FUNCTIONS_BASE_URL}/oauth-register`,
      "client_id": "chatgpt-fastnow",
      "scopes": OAUTH_SCOPES.join(' ')
    },
    "protectedResourceMetadata": {
      "issuer": "https://go.fastnow.app",
      "authorization_endpoint": "https://go.fastnow.app/oauth/authorize",
      "token_endpoint": `${SUPABASE_FUNCTIONS_BASE_URL}/oauth-token`,
      "registration_endpoint": `${SUPABASE_FUNCTIONS_BASE_URL}/oauth-register`,
      "scopes_supported": OAUTH_SCOPES,
      "response_types_supported": ["code"],
      "grant_types_supported": ["authorization_code", "refresh_token"],
      "code_challenge_methods_supported": ["S256"],
      "token_endpoint_auth_methods_supported": ["client_secret_post", "none"]
    },
    "homepage": "https://fastnow.app",
    "documentation": "https://mcp.fastnow.app",
    "privacy_policy": "https://fastnow.app/privacy",
    "terms_of_service": "https://fastnow.app/terms"
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "FastNow MCP Server - Comprehensive Edition",
    status: "running",
    version: "2.0.0",
    tools_count: FASTNOW_TOOLS.length,
    transport: "HTTP POST (request/response)",
    endpoints: {
      health: "/health",
      mcp: "/mcp",
      manifest: "/.well-known/mcp.json"
    },
    protectedResourceMetadata: {
      issuer: "https://go.fastnow.app",
      authorization_endpoint: "https://go.fastnow.app/oauth/authorize",
      token_endpoint: `${SUPABASE_FUNCTIONS_BASE_URL}/oauth-token`,
      registration_endpoint: `${SUPABASE_FUNCTIONS_BASE_URL}/oauth-register`,
      scopes_supported: OAUTH_SCOPES
    }
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "mcp-server-comprehensive",
    tools: FASTNOW_TOOLS.length,
    scopes: OAUTH_SCOPES.length
  });
});

// GET /mcp (for OAuth discovery)
app.get("/mcp", (req, res) => {
  res.json({
    "$schema": "https://modelcontextprotocol.io/schemas/mcp.json",
    "name": "FastNow MCP Server",
    "description": "Complete voice control for fasting, nutrition, and wellness - 108 tools",
    "version": "2.0.0",
    "capabilities": {
      "resources": true,
      "tools": true
    },
    "transports": {
      "http": {
        "url": "https://mcp.fastnow.app/mcp",
        "method": "POST"
      }
    },
    "authentication": {
      "type": "oauth2",
      "authorization_url": "https://go.fastnow.app/oauth/authorize",
      "token_url": `${SUPABASE_FUNCTIONS_BASE_URL}/oauth-token`,
      "registration_url": `${SUPABASE_FUNCTIONS_BASE_URL}/oauth-register`,
      "client_id": "chatgpt-fastnow",
      "scopes": OAUTH_SCOPES.join(' ')
    },
    "protectedResourceMetadata": {
      "issuer": "https://go.fastnow.app",
      "authorization_endpoint": "https://go.fastnow.app/oauth/authorize",
      "token_endpoint": `${SUPABASE_FUNCTIONS_BASE_URL}/oauth-token`,
      "registration_endpoint": `${SUPABASE_FUNCTIONS_BASE_URL}/oauth-register`,
      "scopes_supported": OAUTH_SCOPES,
      "response_types_supported": ["code"],
      "grant_types_supported": ["authorization_code", "refresh_token"],
      "code_challenge_methods_supported": ["S256"],
      "token_endpoint_auth_methods_supported": ["client_secret_post", "none"]
    }
  });
});

/**
 * Proxy tool call to Supabase Edge Function
 */
async function proxyToolCallToSupabase(
  toolConfig: any,
  args: any,
  authToken: string
): Promise<any> {
  try {
    // Build the endpoint URL, replacing placeholders like {food_id}
    let endpoint = toolConfig.endpoint;
    Object.keys(args).forEach(key => {
      endpoint = endpoint.replace(`{${key}}`, args[key]);
    });

    let url = `${SUPABASE_FUNCTIONS_BASE_URL}${endpoint}`;
    
    // Build request options
    // Use X-OAuth-Token header to bypass Supabase's platform-level JWT validation
    const options: RequestInit = {
      method: toolConfig.method,
      headers: {
        'Content-Type': 'application/json',
        'X-OAuth-Token': authToken  // Custom header for OAuth tokens (not JWTs)
      }
    };

    // Add body for POST/PUT requests
    if (['POST', 'PUT'].includes(toolConfig.method) && Object.keys(args).length > 0) {
      options.body = JSON.stringify(args);
    }

    // Add query params for GET/DELETE requests
    if (['GET', 'DELETE'].includes(toolConfig.method)) {
      const params = new URLSearchParams();
      Object.keys(args).forEach(key => {
        if (!endpoint.includes(`{${key}}`)) {
          params.append(key, String(args[key]));
        }
      });
      const queryString = params.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    console.log(`📡 Proxying to: ${toolConfig.method} ${url}`);
    
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Supabase function error: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    console.error(`❌ Proxy error for ${toolConfig.name}:`, error);
    throw error;
  }
}

// MCP HTTP endpoint
app.post("/mcp", express.json(), async (req, res) => {
  console.log("=== MCP REQUEST ===");
  console.log("Method:", req.body.method);
  
  try {
    const request = req.body;
    let response;
    
    switch (request.method) {
      case "initialize":
        console.log("✅ Initialize request");
        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
              resources: {}
            },
            serverInfo: {
              name: "FastNow MCP Server - Comprehensive",
              version: "2.0.0"
            },
            protectedResourceMetadata: {
              issuer: "https://go.fastnow.app",
              authorization_endpoint: "https://go.fastnow.app/oauth/authorize",
              token_endpoint: `${SUPABASE_FUNCTIONS_BASE_URL}/oauth-token`,
              registration_endpoint: `${SUPABASE_FUNCTIONS_BASE_URL}/oauth-register`,
              scopes_supported: OAUTH_SCOPES,
              response_types_supported: ["code"],
              grant_types_supported: ["authorization_code", "refresh_token"],
              code_challenge_methods_supported: ["S256"],
              token_endpoint_auth_methods_supported: ["client_secret_post", "none"]
            }
          }
        };
        break;
        
      case "tools/list":
        console.log(`📋 Listing ${FASTNOW_TOOLS.length} tools`);
        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            tools: FASTNOW_TOOLS.map(tool => {
              const toolDef: any = {
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
              };
              
              // Add readOnlyHint for GET tools
              if (tool.readOnlyHint) {
                toolDef.readOnlyHint = true;
              }
              
              // Add component metadata if tool has a linked component
              if (tool.component) {
                toolDef._meta = {
                  "openai/scopes": tool.scopes,
                  "openai/outputTemplate": tool.component,
                  "openai/widgetCSP": {
                    connect_domains: ["https://2533d87e.fastnow-components.pages.dev"],
                    resource_domains: ["https://2533d87e.fastnow-components.pages.dev"]
                  }
                };
              }
              
              return toolDef;
            })
          }
        };
        break;
        
      case "resources/list":
        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            resources: [
              // Data resources
              { uri: "fastnow://user/current-fast", name: "Current Fasting Session", mimeType: "application/json" },
              { uri: "fastnow://user/todays-food", name: "Today's Food Log", mimeType: "application/json" },
              { uri: "fastnow://user/weight-history", name: "Weight History", mimeType: "application/json" },
              { uri: "fastnow://user/profile", name: "User Profile", mimeType: "application/json" },
              { uri: "fastnow://user/daily-summary", name: "Daily Summary", mimeType: "application/json" },
              
              // UI Component resources
              ...FASTNOW_COMPONENTS.map(comp => ({
                uri: comp.uri,
                name: comp.name,
                description: comp.description,
                mimeType: "text/html+skybridge"
              }))
            ]
          }
        };
        break;
        
      case "resources/read":
        const uri = request.params?.uri;
        if (!uri) throw new Error("Missing uri parameter");
        
        // Check if this is a UI component resource
        if (uri.startsWith("ui://widget/")) {
          const component = getComponentByUri(uri);
          if (!component) {
            throw new Error(`Unknown component: ${uri}`);
          }
          
          response = {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              contents: [{
                uri,
                mimeType: "text/html+skybridge",
                text: component.htmlContent
              }]
            }
          };
          break;
        }
        
        // For data resources, require authentication
        const authHeader = req.headers.authorization;
        const userToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        if (!userToken) throw new Error("Authentication required");
        const userId = await validateTokenAndGetUserId(userToken);
        
        let resourceData;
        switch (uri) {
          case "fastnow://user/current-fast":
            resourceData = await FastNowResources.getCurrentFast(userId, userToken);
            break;
          case "fastnow://user/todays-food":
            resourceData = await FastNowResources.getTodaysFood(userId, userToken);
            break;
          case "fastnow://user/weight-history":
            resourceData = await FastNowResources.getWeightHistory(userId, userToken);
            break;
          case "fastnow://user/profile":
            resourceData = await FastNowResources.getUserProfile(userId, userToken);
            break;
          case "fastnow://user/daily-summary":
            resourceData = await FastNowResources.getDailySummary(userId, userToken);
            break;
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
        
        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            contents: [{ uri, mimeType: "application/json", text: JSON.stringify(resourceData) }]
          }
        };
        break;
        
      case "tools/call":
        const toolName = request.params?.name;
        const toolArgs = request.params?.arguments || {};
        
        console.log(`🔧 Tool call: ${toolName}`);
        console.log(`📦 Arguments:`, JSON.stringify(toolArgs, null, 2));
        
        // Find tool configuration
        const toolConfig = FASTNOW_TOOLS.find(t => t.name === toolName);
        if (!toolConfig) {
          throw new Error(`Tool not found: ${toolName}`);
        }
        
        // Extract auth token
        const toolAuthHeader = req.headers.authorization;
        const toolUserToken = toolAuthHeader?.startsWith('Bearer ') ? toolAuthHeader.substring(7) : null;
        
        if (!toolUserToken) {
          throw new Error("Authentication required - no Bearer token in Authorization header");
        }
        
        // Validate token (also validates scopes are present)
        await validateTokenAndGetUserId(toolUserToken);
        
        // Proxy the call to Supabase edge function
        const toolResult = await proxyToolCallToSupabase(toolConfig, toolArgs, toolUserToken);
        
        console.log(`✅ Tool result:`, JSON.stringify(toolResult, null, 2));
        
        // Build response content
        const responseContent: any[] = [{ 
          type: "text", 
          text: JSON.stringify(toolResult, null, 2) 
        }];

        // If tool has a linked component, include it in the response
        if (toolConfig.component) {
          const component = getComponentByUri(toolConfig.component);
          if (component) {
            console.log(`🎨 Including component: ${component.name}`);
            responseContent.push({
              type: "resource",
              resource: {
                uri: toolConfig.component,
                mimeType: "text/html+skybridge",
                text: component.htmlContent,
                structuredContent: toolResult.data || toolResult  // Pass data to component
              }
            });
          }
        }
        
        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            content: responseContent
          }
        };
        break;
        
      default:
        response = {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`
          }
        };
    }
    
    res.json(response);
    
  } catch (error) {
    console.error("❌ MCP error:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isAuthError = errorMessage.toLowerCase().includes("authentication required") || 
                        errorMessage.toLowerCase().includes("unauthorized") ||
                        errorMessage.toLowerCase().includes("invalid token");
    
    if (isAuthError) {
      res.setHeader('WWW-Authenticate', 'Bearer realm="https://mcp.fastnow.app"');
      res.setHeader('Link', '<https://mcp.fastnow.app/.well-known/mcp.json>; rel="oauth-authorization-server"');
      res.status(401).json({
        jsonrpc: "2.0",
        id: req.body.id || null,
        error: {
          code: -32001,
          message: errorMessage
        }
      });
    } else {
      res.status(500).json({
        jsonrpc: "2.0",
        id: req.body.id || null,
        error: {
          code: -32603,
          message: errorMessage
        }
      });
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FastNow MCP Server - Comprehensive Edition`);
  console.log(`📡 Running on: http://localhost:${PORT}`);
  console.log(`🔧 Tools available: ${FASTNOW_TOOLS.length}`);
  console.log(`🔐 OAuth scopes: ${OAUTH_SCOPES.length}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

