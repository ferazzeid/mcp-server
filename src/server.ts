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

// Register widget resource
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "ui://widget/example.html",
        name: "Example Widget",
        mimeType: "text/html+skybridge",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "ui://widget/example.html") {
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
  throw new Error("Resource not found");
});

// Register MCP standard tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
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
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "search") {
    const query = (request.params.arguments as any)?.query || "";
    
    // Mock search results - in a real app, this would search your data source
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

  if (request.params.name === "fetch") {
    const id = (request.params.arguments as any)?.id || "";
    
    // Mock fetch result - in a real app, this would fetch from your data source
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

  if (request.params.name === "show_greeting") {
    const name = (request.params.arguments as any)?.name || "World";
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
  
  throw new Error("Tool not found");
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
    },
    documentation: "https://github.com/ferazzeid/mcp-server"
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "mcp-server" });
});

// SSE endpoint for MCP
app.get("/sse", async (req, res) => {
  console.log("New SSE connection established");
  
  const transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
  
  // Keep connection alive
  req.on("close", () => {
    console.log("SSE connection closed");
  });
});

// Message endpoint for client requests
app.post("/messages", async (req, res) => {
  // SSE transport handles this automatically
  res.status(200).send();
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`🚀 MCP Server running on http://localhost:${PORT}`);
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

