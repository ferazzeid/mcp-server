# Add OAuth Authorization Server Metadata Endpoint

## Problem
ChatGPT is looking for OAuth server metadata at `https://go.fastnow.app/.well-known/oauth-authorization-server` but this endpoint doesn't exist yet.

This is a standard OAuth 2.0 discovery endpoint (RFC 8414) that allows OAuth clients to automatically discover your authorization server's configuration.

---

## What to Implement

### Create a new API route: `/.well-known/oauth-authorization-server`

**File:** `src/pages/api/.well-known/oauth-authorization-server.ts` (or equivalent route in your framework)

**Response:** Return JSON with OAuth server configuration

---

## Implementation

### For React Router / Express Backend:

```typescript
// src/pages/api/.well-known/oauth-authorization-server.ts

export default function handler(req, res) {
  res.status(200).json({
    issuer: "https://go.fastnow.app",
    authorization_endpoint: "https://go.fastnow.app/oauth/authorize",
    token_endpoint: "https://texnkijwcygodtywgedm.supabase.co/functions/v1/oauth-token",
    registration_endpoint: "https://texnkijwcygodtywgedm.supabase.co/functions/v1/oauth-register",
    scopes_supported: [
      "read:fasting",
      "write:fasting",
      "read:food",
      "write:food",
      "read:goals",
      "write:goals",
      "read:stats"
    ],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "none"],
    revocation_endpoint_auth_methods_supported: ["none"]
  });
}
```

### For Vite/React (Static Site):

If your app is a static site, you need to create a static JSON file:

**File:** `public/.well-known/oauth-authorization-server.json`

```json
{
  "issuer": "https://go.fastnow.app",
  "authorization_endpoint": "https://go.fastnow.app/oauth/authorize",
  "token_endpoint": "https://texnkijwcygodtywgedm.supabase.co/functions/v1/oauth-token",
  "registration_endpoint": "https://texnkijwcygodtywgedm.supabase.co/functions/v1/oauth-register",
  "scopes_supported": [
    "read:fasting",
    "write:fasting",
    "read:food",
    "write:food",
    "read:goals",
    "write:goals",
    "read:stats"
  ],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "none"]
}
```

**IMPORTANT:** You'll also need to configure your hosting (Netlify/Vercel/etc) to serve this at `/.well-known/oauth-authorization-server` (without the .json extension).

---

## Netlify Configuration (if using Netlify)

Add to `netlify.toml`:

```toml
[[redirects]]
  from = "/.well-known/oauth-authorization-server"
  to = "/.well-known/oauth-authorization-server.json"
  status = 200
  force = true

[[headers]]
  for = "/.well-known/*"
  [headers.values]
    Content-Type = "application/json"
    Access-Control-Allow-Origin = "*"
```

---

## Vercel Configuration (if using Vercel)

Add to `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/.well-known/oauth-authorization-server",
      "destination": "/.well-known/oauth-authorization-server.json"
    }
  ],
  "headers": [
    {
      "source": "/.well-known/(.*)",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/json"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

---

## Testing

After deployment, test that the endpoint works:

```bash
curl https://go.fastnow.app/.well-known/oauth-authorization-server
```

**Expected Response:**
```json
{
  "issuer": "https://go.fastnow.app",
  "authorization_endpoint": "https://go.fastnow.app/oauth/authorize",
  "token_endpoint": "https://texnkijwcygodtywgedm.supabase.co/functions/v1/oauth-token",
  "registration_endpoint": "https://texnkijwcygodtywgedm.supabase.co/functions/v1/oauth-register",
  ...
}
```

---

## Why This is Required

Per RFC 8414 (OAuth 2.0 Authorization Server Metadata), OAuth clients like ChatGPT look for server configuration at:

```
{issuer}/.well-known/oauth-authorization-server
```

Since our `issuer` is `https://go.fastnow.app`, ChatGPT is trying to fetch:

```
https://go.fastnow.app/.well-known/oauth-authorization-server
```

This endpoint tells ChatGPT:
- Where to send users for authorization
- Where to exchange tokens
- Where to register as a client
- What scopes are supported
- What authentication methods are supported

---

## Summary

✅ Add `/.well-known/oauth-authorization-server` endpoint to FastNow app
✅ Return OAuth server configuration as JSON
✅ Ensure CORS headers allow ChatGPT to access it
✅ Test the endpoint after deployment

Once this is deployed, ChatGPT will be able to discover your OAuth configuration and complete the connection!

