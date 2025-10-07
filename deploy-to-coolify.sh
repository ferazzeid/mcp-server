#!/bin/bash

# Auto-deploy script for Coolify integration
# Usage: npm run deploy

echo "🚀 Starting deployment to Coolify..."

# Add all changes
git add .

# Commit with timestamp
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"

# Push to GitHub (triggers Coolify webhook)
git push origin main

echo "✅ Code pushed to GitHub"
echo "🔄 Coolify should auto-deploy in ~30 seconds"
echo "🌐 Check your app URL for updates"

# Optional: Check deployment status
echo "📊 Deployment status:"
echo "   GitHub: https://github.com/ferazzeid/mcp-server"
echo "   Coolify: http://217.21.78.212:8000"
