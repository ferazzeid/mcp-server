# 🔐 Implement OAuth 2.0 Dynamic Client Registration Endpoint

## Context
ChatGPT needs to **dynamically register itself** as an OAuth client before users can authenticate. This is a **required** part of the OAuth 2.0 flow for ChatGPT connectors.

## What You Need to Build

### **1. Supabase Edge Function: `oauth-register`**

**Endpoint:** `https://texnkijwcygodtywgedm.supabase.co/functions/v1/oauth-register`

**Method:** `POST`

**Purpose:** Allow ChatGPT (or any OAuth client) to register itself and receive a `client_id` (and optionally `client_secret`).

---

## ✅ Technical Specification

### **Request Body (from ChatGPT):**
```json
{
  "client_name": "ChatGPT",
  "redirect_uris": ["https://chatgpt.com/oauth/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none",  // PKCE, no client_secret needed
  "application_type": "web"
}
```

### **Response Body (you return):**
```json
{
  "client_id": "generated-unique-client-id",
  "client_id_issued_at": 1234567890,
  "client_name": "ChatGPT",
  "redirect_uris": ["https://chatgpt.com/oauth/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

**Note:** Since we're using PKCE (code_challenge_method: S256), we do NOT need to return a `client_secret`. ChatGPT will use PKCE for security.

---

## 🗄️ Database Table: `oauth_clients`

Create a new table to store registered OAuth clients:

```sql
CREATE TABLE oauth_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  redirect_uris TEXT[] NOT NULL,
  grant_types TEXT[] DEFAULT ARRAY['authorization_code', 'refresh_token'],
  response_types TEXT[] DEFAULT ARRAY['code'],
  token_endpoint_auth_method TEXT DEFAULT 'none',
  application_type TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast client_id lookups
CREATE INDEX idx_oauth_clients_client_id ON oauth_clients(client_id);
```

---

## 📝 Implementation Steps

### **Step 1: Create the Supabase Edge Function**

File: `supabase/functions/oauth-register/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    
    // Validate required fields
    if (!body.client_name || !body.redirect_uris) {
      return new Response(
        JSON.stringify({ error: 'invalid_client_metadata', error_description: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique client_id
    const client_id = `oauth_client_${crypto.randomUUID()}`;

    // Store in database
    const { data, error } = await supabase
      .from('oauth_clients')
      .insert({
        client_id,
        client_name: body.client_name,
        redirect_uris: body.redirect_uris,
        grant_types: body.grant_types || ['authorization_code', 'refresh_token'],
        response_types: body.response_types || ['code'],
        token_endpoint_auth_method: body.token_endpoint_auth_method || 'none',
        application_type: body.application_type || 'web'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'server_error', error_description: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return registration response
    return new Response(
      JSON.stringify({
        client_id: data.client_id,
        client_id_issued_at: Math.floor(new Date(data.created_at).getTime() / 1000),
        client_name: data.client_name,
        redirect_uris: data.redirect_uris,
        grant_types: data.grant_types,
        response_types: data.response_types,
        token_endpoint_auth_method: data.token_endpoint_auth_method
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: 'server_error', error_description: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 🔄 Update Existing OAuth Functions

### **`oauth-authorize` needs to verify client_id**

Before showing the login/consent screen, check that the `client_id` exists in `oauth_clients`:

```typescript
// In oauth-authorize/index.ts
const { data: client } = await supabase
  .from('oauth_clients')
  .select('*')
  .eq('client_id', params.get('client_id'))
  .single();

if (!client) {
  return new Response('Invalid client_id', { status: 400 });
}

// Also verify redirect_uri matches one in client.redirect_uris
if (!client.redirect_uris.includes(params.get('redirect_uri'))) {
  return new Response('Invalid redirect_uri', { status: 400 });
}
```

---

## ✅ Testing

After deployment, test the registration endpoint:

```bash
curl -X POST https://texnkijwcygodtywgedm.supabase.co/functions/v1/oauth-register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "ChatGPT",
    "redirect_uris": ["https://chatgpt.com/oauth/callback"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none"
  }'
```

**Expected Response:**
```json
{
  "client_id": "oauth_client_abc123...",
  "client_id_issued_at": 1234567890,
  "client_name": "ChatGPT",
  ...
}
```

---

## 🚨 Important Notes

1. **PKCE Support:** ChatGPT uses PKCE (Proof Key for Code Exchange), so `client_secret` is NOT required.
2. **Verify redirect_uri:** Always validate that the redirect_uri in authorization requests matches the registered ones.
3. **One-time registration:** ChatGPT should only register once. Store its `client_id` and reuse it.

---

## 📋 Summary

- ✅ Create `oauth_clients` table in Supabase
- ✅ Create `oauth-register` edge function
- ✅ Update `oauth-authorize` to validate `client_id` and `redirect_uri`
- ✅ Deploy and test

Once this is complete, ChatGPT will be able to:
1. **Register itself** (get a `client_id`)
2. **Authorize users** (existing flow)
3. **Exchange tokens** (existing flow)

Let me know when this is deployed! 🚀

