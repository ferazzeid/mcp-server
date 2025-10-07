# VPS Deployment Guide

## Quick Deploy

**Option 1: Automated Script (Recommended)**
```bash
chmod +x deploy.sh
./deploy.sh user@your-vps-ip
```

**Option 2: Manual Steps**

### On Local Machine
```bash
npm run build
```

### On VPS
```bash
# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Create project directory
sudo mkdir -p /var/www/mcp-server
sudo chown -R $USER:$USER /var/www/mcp-server
cd /var/www/mcp-server

# Upload files (from local machine)
# scp -r dist package.json ecosystem.config.js user@vps:/var/www/mcp-server/

# Install dependencies
npm install --production

# Create .env file
echo "PORT=3000" > .env
echo "NODE_ENV=production" >> .env

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the command it outputs
```

## Setup HTTPS (Required for ChatGPT)

### 1. Install Nginx
```bash
sudo apt update
sudo apt install -y nginx
```

### 2. Configure Nginx
```bash
sudo cp nginx-config.conf /etc/nginx/sites-available/mcp-server
# Edit the file and replace 'your-domain.com' with your actual domain
sudo nano /etc/nginx/sites-available/mcp-server

# Enable site
sudo ln -s /etc/nginx/sites-available/mcp-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Setup SSL with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 4. Update Firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

## Verify Deployment

### Check Server Status
```bash
pm2 status
pm2 logs mcp-server
```

### Test Endpoints
```bash
# Health check
curl https://your-domain.com/health

# Should return: {"status":"ok","service":"mcp-server"}
```

## Connect to ChatGPT

1. Open ChatGPT Settings
2. Go to Integrations → MCP Servers
3. Add new server:
   - **Name**: Your MCP Server
   - **URL**: `https://your-domain.com/sse`
4. Test connection

## Troubleshooting

### Check Logs
```bash
pm2 logs mcp-server --lines 100
```

### Restart Server
```bash
pm2 restart mcp-server
```

### Check Nginx
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Check SSL Certificate
```bash
sudo certbot certificates
```

## Update Deployment

```bash
# From local machine
./deploy.sh user@your-vps-ip
```

Or manually:
```bash
cd /var/www/mcp-server
git pull  # if using git
npm install
npm run build
pm2 restart mcp-server
```

