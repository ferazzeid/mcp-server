# MCP Server for ChatGPT Apps

Your first MCP (Model Context Protocol) server for building ChatGPT apps.

## What's Installed

- **@modelcontextprotocol/sdk** - Official MCP TypeScript SDK
- **TypeScript** - For type-safe development
- **Express** - Web framework (ready for HTTP endpoints)
- **Zod** - Schema validation

## Project Structure

```
src/
  server.ts      - Main MCP server with example tool & widget
dist/            - Compiled JavaScript (after build)
tsconfig.json    - TypeScript configuration
```

## Quick Start

### 1. Build the server
```bash
npm run build
```

### 2. Test locally (development mode)
```bash
npm run dev
```

### 3. Run compiled version
```bash
npm start
```

## Example Tool

The server includes a `show_greeting` tool that:
- Takes a name as input
- Returns a custom HTML widget with a greeting
- Demonstrates structured data passing to components

## Next Steps

1. **Test with MCP Inspector**: Install the MCP Inspector to test your server locally
2. **Add more tools**: Extend `src/server.ts` with your own tools
3. **Create custom widgets**: Build React/Vue components and bundle them
4. **Deploy**: Host on your VPS or a cloud platform
5. **Connect to ChatGPT**: Add your server URL in ChatGPT settings

## Documentation

- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk/build/mcp-server)
- [MCP Protocol Docs](https://modelcontextprotocol.io)

## Development Tips

- Use `npm run dev` for live development with ts-node
- Test tools with MCP Inspector before deploying
- Keep widget HTML inline or bundle with webpack/vite
- Structure data in `structuredContent` for your widgets

