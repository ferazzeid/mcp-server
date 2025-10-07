# Coolify + Cursor Integration Guide

## Option 1: GitHub Webhooks (Automatic Deployments)

### Setup in Coolify:
1. Go to your application settings
2. Enable "Auto Deploy" 
3. Set webhook URL: `https://your-coolify-domain.com/webhooks/github`
4. Copy the webhook secret

### Setup in GitHub:
1. Go to: https://github.com/ferazzeid/mcp-server/settings/hooks
2. Add webhook:
   - **Payload URL:** `https://your-coolify-domain.com/webhooks/github`
   - **Content type:** `application/json`
   - **Secret:** (paste from Coolify)
   - **Events:** Push events
   - **Active:** ✅

### Result:
- Push to GitHub → Coolify auto-deploys
- No manual intervention needed

## Option 2: Coolify CLI Integration

### Install Coolify CLI:
```bash
npm install -g @coolify/cli
```

### Configure in Cursor:
```bash
coolify login https://217.21.78.212:8000
coolify link your-app-name
```

### Deploy from Cursor:
```bash
coolify deploy
```

## Option 3: Custom Deployment Script

### Create deploy script:
```bash
#!/bin/bash
git add .
git commit -m "Deploy: $(date)"
git push origin main
echo "🚀 Deployed to Coolify!"
```

### Add to package.json:
```json
{
  "scripts": {
    "deploy": "./deploy.sh"
  }
}
```

### Deploy with:
```bash
npm run deploy
```

## Option 4: VS Code Extension (if available)

Some Coolify extensions exist for VS Code that might work with Cursor.

## Recommended Workflow:

1. **Code in Cursor**
2. **Commit & Push to GitHub**
3. **Coolify auto-deploys**
4. **Test on live URL**

This eliminates manual deployment steps!
