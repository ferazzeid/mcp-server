import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
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
import * as FastNowTools from "./tools/fastnow.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Enable CORS for ChatGPT
app.use(cors({
  origin: "*", // In production, restrict to ChatGPT domains
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// Serve static files for .well-known manifest
app.use(express.static('public'));

// MCP Discovery endpoint
app.get('/.well-known/mcp.json', (req, res) => {
  res.json({
    "$schema": "https://modelcontextprotocol.io/schemas/mcp.json",
    "name": "FastNow MCP Server",
    "description": "Track your fasting, nutrition, and weight with AI assistance through FastNow",
    "version": "1.0.0",
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
      "sse": {
        "url": "https://mcp.fastnow.app/sse"
      }
    },
    "authentication": {
      "type": "bearer",
      "description": "Requires user's Supabase JWT token for accessing FastNow data"
    },
    "homepage": "https://fastnow.app",
    "documentation": "https://mcp.fastnow.app",
    "privacy_policy": "https://fastnow.app/privacy",
    "terms_of_service": "https://fastnow.app/terms"
  });
});

// Create MCP server
const server = new Server(
  {
    name: "example-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Example widget HTML (simple component)
const EXAMPLE_WIDGET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
      margin: 0;
    }
    .card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 { margin: 0 0 10px 0; }
    p { margin: 0; opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello from MCP!</h1>
    <p id="message">Your first ChatGPT app component</p>
  </div>
  <script>
    // Access data passed from tool
    const data = window.openai?.toolOutput;
    if (data?.message) {
      document.getElementById('message').textContent = data.message;
    }
  </script>
</body>
</html>
`.trim();

// Register resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "ui://widget/example.html",
        name: "Example Widget",
        mimeType: "text/html+skybridge",
      },
      {
        uri: "fastnow://user/current-fast",
        name: "Current Fasting Session",
        description: "User's active fasting session with progress",
        mimeType: "application/json",
      },
      {
        uri: "fastnow://user/todays-food",
        name: "Today's Food Log",
        description: "All food entries for today with nutrition totals",
        mimeType: "application/json",
      },
      {
        uri: "fastnow://user/weight-history",
        name: "Weight History",
        description: "Recent weight measurements and trends",
        mimeType: "application/json",
      },
      {
        uri: "fastnow://user/profile",
        name: "User Profile",
        description: "User profile with goals and settings",
        mimeType: "application/json",
      },
      {
        uri: "fastnow://user/daily-summary",
        name: "Daily Summary",
        description: "Complete overview of today's activity",
        mimeType: "application/json",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  
  // Widget resource (no auth needed)
  if (uri === "ui://widget/example.html") {
    return {
      contents: [
        {
          uri: "ui://widget/example.html",
          mimeType: "text/html+skybridge",
          text: EXAMPLE_WIDGET_HTML,
        },
      ],
    };
  }
  
  // FastNow resources (require authentication)
  if (uri.startsWith("fastnow://")) {
    // Get auth token from request metadata
    const userToken = (request.params as any)._meta?.userToken;
    
    if (!userToken) {
      throw new Error("Authentication required. Please provide a user token.");
    }
    
    // Validate token and get user ID
    const userId = await validateTokenAndGetUserId(userToken);
    
    let data;
    
    switch (uri) {
      case "fastnow://user/current-fast":
        data = await FastNowResources.getCurrentFast(userId, userToken);
        break;
      
      case "fastnow://user/todays-food":
        data = await FastNowResources.getTodaysFood(userId, userToken);
        break;
      
      case "fastnow://user/weight-history":
        data = await FastNowResources.getWeightHistory(userId, userToken);
        break;
      
      case "fastnow://user/profile":
        data = await FastNowResources.getUserProfile(userId, userToken);
        break;
      
      case "fastnow://user/daily-summary":
        data = await FastNowResources.getDailySummary(userId, userToken);
        break;
      
      default:
        throw new Error(`Unknown FastNow resource: ${uri}`);
    }
    
    return {
      contents: [
        {
          uri: uri,
          mimeType: "application/json",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
  
  throw new Error(`Resource not found: ${uri}`);
});

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Example tools
      {
        name: "search",
        description: "Search for greeting messages and content",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for greeting content",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "fetch",
        description: "Fetch a specific greeting message by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique identifier for the greeting message",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "show_greeting",
        description: "Display a greeting message in a custom widget",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name to greet",
            },
          },
          required: ["name"],
        },
        _meta: {
          "openai/outputTemplate": "ui://widget/example.html",
          "openai/toolInvocation/invoking": "Creating greeting...",
          "openai/toolInvocation/invoked": "Greeting displayed!",
        },
      },
      // FastNow tools
      {
        name: "start_fast",
        description: "Start a new fasting session with a specified goal duration",
        inputSchema: {
          type: "object",
          properties: {
            goal_hours: {
              type: "number",
              description: "Fasting goal duration in hours (e.g., 16 for 16:8 fasting)",
              minimum: 1,
              maximum: 72,
            },
          },
          required: ["goal_hours"],
        },
      },
      {
        name: "end_fast",
        description: "End the current active fasting session",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "log_food",
        description: "Log a food entry with nutritional information",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the food item",
            },
            calories: {
              type: "number",
              description: "Calories in the food",
              minimum: 0,
            },
            carbs: {
              type: "number",
              description: "Carbohydrates in grams",
              minimum: 0,
            },
            protein: {
              type: "number",
              description: "Protein in grams (optional)",
              minimum: 0,
            },
            fat: {
              type: "number",
              description: "Fat in grams (optional)",
              minimum: 0,
            },
            serving_size: {
              type: "number",
              description: "Serving size in grams (default: 100)",
              minimum: 0,
            },
          },
          required: ["name", "calories", "carbs"],
        },
      },
      {
        name: "log_weight",
        description: "Log a weight measurement",
        inputSchema: {
          type: "object",
          properties: {
            weight_kg: {
              type: "number",
              description: "Weight in kilograms",
              minimum: 20,
              maximum: 300,
            },
          },
          required: ["weight_kg"],
        },
      },
      {
        name: "start_walk",
        description: "Start a new walking/exercise session",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "end_walk",
        description: "End the current walking session and log results",
        inputSchema: {
          type: "object",
          properties: {
            distance_meters: {
              type: "number",
              description: "Distance walked in meters (optional)",
              minimum: 0,
            },
            calories_burned: {
              type: "number",
              description: "Estimated calories burned (optional)",
              minimum: 0,
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = request.params.arguments as any;
  
  // Get auth token for FastNow tools
  const userToken = (request.params as any)._meta?.userToken;
  
  // Example tools (no auth needed)
  if (toolName === "search") {
    const query = args?.query || "";
    
    const results = [
      {
        id: "greeting-1",
        title: `Greeting for ${query}`,
        url: "https://mcp.fastnow.app/greeting/1"
      },
      {
        id: "greeting-2", 
        title: `Welcome message for ${query}`,
        url: "https://mcp.fastnow.app/greeting/2"
      }
    ];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ results }),
        },
      ],
    };
  }

  if (toolName === "fetch") {
    const id = args?.id || "";
    
    const document = {
      id: id,
      title: `Greeting Message ${id}`,
      text: `Hello! This is a greeting message with ID: ${id}. Welcome to our MCP server!`,
      url: `https://mcp.fastnow.app/greeting/${id}`,
      metadata: {
        source: "mcp_server",
        created_at: new Date().toISOString()
      }
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(document),
        },
      ],
    };
  }

  if (toolName === "show_greeting") {
    const name = args?.name || "World";
    return {
      content: [
        {
          type: "text",
          text: `Displayed greeting for ${name}`,
        },
      ],
      structuredContent: {
        message: `Hello, ${name}! Welcome to MCP app development.`,
      },
    };
  }
  
  // FastNow tools (require authentication)
  if (!userToken) {
    throw new Error("Authentication required. Please provide a user token.");
  }
  
  const userId = await validateTokenAndGetUserId(userToken);
  
  let result;
  
  switch (toolName) {
    case "start_fast":
      result = await FastNowTools.startFast(userId, userToken, args.goal_hours);
      break;
    
    case "end_fast":
      result = await FastNowTools.endFast(userId, userToken);
      break;
    
    case "log_food":
      result = await FastNowTools.logFood(userId, userToken, args);
      break;
    
    case "log_weight":
      result = await FastNowTools.logWeight(userId, userToken, args.weight_kg);
      break;
    
    case "start_walk":
      result = await FastNowTools.startWalk(userId, userToken);
      break;
    
    case "end_walk":
      result = await FastNowTools.endWalk(userId, userToken, args);
      break;
    
    default:
      throw new Error(`Tool not found: ${toolName}`);
  }
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "MCP Server for ChatGPT Apps",
    status: "running",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      sse: "/sse",
      messages: "/messages"
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "mcp-server" });
});

// SSE endpoint for MCP
app.get("/sse", async (req, res) => {
  console.log("=== NEW SSE CONNECTION ===");
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  
  try {
    // Add X-Accel-Buffering before transport takes over
    res.setHeader('X-Accel-Buffering', 'no');
    
    // Hook into res.write to log what SSE events are being sent
    const originalWrite = res.write.bind(res);
    res.write = function(chunk, ...args) {
      console.log("📤 SSE WRITE:", chunk.toString());
      return originalWrite(chunk, ...args);
    };
    
    console.log("Creating SSE transport with endpoint: /messages");
    const transport = new SSEServerTransport("/messages", res);
    console.log("Transport created, connecting server...");
    
    await server.connect(transport);
    console.log("✅ Server connected! Waiting for client to POST to /messages...");
    
    // Keep connection alive
    req.on("close", () => {
      console.log("=== SSE CONNECTION CLOSED ===");
    });
    
  } catch (error) {
    console.error("❌ SSE error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: String(error) });
    }
  }
});

// POST endpoint for MCP messages - transport will handle this
app.post("/messages", express.json(), async (req, res) => {
  console.log("=== RECEIVED POST TO /messages ===");
  console.log("Body:", JSON.stringify(req.body, null, 2));
  // Transport handles the response via SSE
  res.status(202).end();
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`🚀 MCP Server running on http://localhost:${PORT}`);
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

