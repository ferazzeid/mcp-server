#!/bin/bash

# MCP Server Deployment Script
# Usage: ./deploy.sh [user@host]

set -e

if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh user@your-vps-ip"
  exit 1
fi

SERVER=$1
REMOTE_DIR="/var/www/mcp-server"

echo "🔨 Building locally..."
npm run build

echo "📦 Creating deployment package..."
tar -czf deploy.tar.gz \
  dist/ \
  node_modules/ \
  package.json \
  package-lock.json \
  ecosystem.config.js \
  .env

echo "📤 Uploading to VPS..."
scp deploy.tar.gz $SERVER:/tmp/

echo "🚀 Deploying on VPS..."
ssh $SERVER << 'EOF'
  # Create directory if doesn't exist
  sudo mkdir -p /var/www/mcp-server
  sudo chown -R $USER:$USER /var/www/mcp-server
  
  # Extract files
  cd /var/www/mcp-server
  tar -xzf /tmp/deploy.tar.gz
  rm /tmp/deploy.tar.gz
  
  # Create logs directory
  mkdir -p logs
  
  # Install PM2 if not present
  if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
  fi
  
  # Restart with PM2
  pm2 stop mcp-server 2>/dev/null || true
  pm2 start ecosystem.config.js
  pm2 save
  
  echo "✅ Deployment complete!"
  pm2 status
EOF

echo "🧹 Cleaning up..."
rm deploy.tar.gz

echo ""
echo "✅ Deployment successful!"
echo "📍 Server running at: http://your-vps-ip:3000"
echo ""
echo "Next steps:"
echo "1. Set up Nginx reverse proxy"
echo "2. Configure SSL with Let's Encrypt"
echo "3. Update firewall rules"

