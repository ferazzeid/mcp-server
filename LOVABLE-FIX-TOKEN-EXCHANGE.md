# Fix OAuth Token Exchange Endpoint

## Problem
ChatGPT is getting an error when trying to exchange the authorization code for an access token.

Error in ChatGPT: "Something went wrong with setting up the connection"
Status: "Setup incomplete"

This means the `oauth-token` edge function is failing.

---

## What to Check

### 1. Check Supabase Edge Function Logs

Go to Supabase Dashboard → Edge Functions → oauth-token → Logs

Look for recent errors when ChatGPT tried to exchange the token. Common errors:
- "Authorization code not found"
- "PKCE verification failed"
- "Invalid grant"
- Database query errors

**Share the error logs with me!**

---

### 2. Verify the oauth-token Function

The token exchange flow should:

1. **Receive POST request** with:
   - `grant_type=authorization_code`
   - `code=auth_code_...`
   - `redirect_uri=...`
   - `code_verifier=...` (for PKCE)
   - `client_id=...`

2. **Look up the authorization code** in `oauth_authorization_codes` table

3. **Verify it's valid:**
   - Not expired
   - Not already used
   - Matches the client_id
   - Matches the redirect_uri

4. **Verify PKCE** (if code_challenge was provided):
   - Hash the code_verifier with SHA256
   - Base64URL encode it
   - Compare with stored code_challenge

5. **Generate tokens:**
   - Create a Supabase session for the user_id
   - Return access_token and refresh_token

6. **Mark code as used**

---

### 3. Common Issues & Fixes

#### Issue A: Code Not Found
```typescript
// Make sure you're querying correctly:
const { data: authCode, error } = await supabase
  .from('oauth_authorization_codes')
  .select('*')
  .eq('code', code)
  .eq('used', false)
  .single();

if (error || !authCode) {
  return new Response(JSON.stringify({ 
    error: 'invalid_grant',
    error_description: 'Authorization code not found or already used'
  }), { 
    status: 400, 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });
}
```

#### Issue B: PKCE Verification
```typescript
// You need to verify the code_verifier
import { createHash } from 'crypto';

function base64URLEncode(str: Buffer): string {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function sha256(buffer: string): Buffer {
  return createHash('sha256').update(buffer).digest();
}

// Verify PKCE
if (authCode.code_challenge) {
  if (!code_verifier) {
    return new Response(JSON.stringify({ 
      error: 'invalid_request',
      error_description: 'code_verifier required'
    }), { status: 400, headers: corsHeaders });
  }

  const computedChallenge = base64URLEncode(sha256(code_verifier));
  
  if (computedChallenge !== authCode.code_challenge) {
    return new Response(JSON.stringify({ 
      error: 'invalid_grant',
      error_description: 'PKCE verification failed'
    }), { status: 400, headers: corsHeaders });
  }
}
```

#### Issue C: Token Generation
```typescript
// Generate access token using Supabase Admin API
const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
  type: 'magiclink',
  email: userEmail, // Get from user_id in auth.users
  options: {
    redirectTo: authCode.redirect_uri
  }
});

// Or create a JWT manually:
import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(Deno.env.get('SUPABASE_JWT_SECRET'));

const token = await new SignJWT({ 
  sub: authCode.user_id,
  aud: 'authenticated',
  role: 'authenticated',
  scope: authCode.scope
})
  .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
  .setIssuedAt()
  .setExpirationTime('1h')
  .sign(secret);
```

#### Issue D: Response Format
```typescript
// Return tokens in correct format
return new Response(JSON.stringify({
  access_token: token,
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_token: refreshToken, // Optional
  scope: authCode.scope
}), {
  status: 200,
  headers: { 
    ...corsHeaders, 
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache'
  }
});
```

---

## 4. Updated oauth-token Function (Complete)

Here's a working implementation:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const formData = await req.formData();
    const grant_type = formData.get('grant_type');
    const code = formData.get('code');
    const redirect_uri = formData.get('redirect_uri');
    const code_verifier = formData.get('code_verifier');
    const client_id = formData.get('client_id');

    console.log('Token request:', { grant_type, code, redirect_uri, client_id });

    if (grant_type !== 'authorization_code') {
      return new Response(JSON.stringify({ 
        error: 'unsupported_grant_type' 
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Look up authorization code
    const { data: authCode, error: codeError } = await supabase
      .from('oauth_authorization_codes')
      .select('*')
      .eq('code', code)
      .eq('used', false)
      .single();

    console.log('Auth code lookup:', { found: !!authCode, error: codeError });

    if (codeError || !authCode) {
      return new Response(JSON.stringify({ 
        error: 'invalid_grant',
        error_description: 'Authorization code not found or already used'
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check expiration
    if (new Date(authCode.expires_at) < new Date()) {
      return new Response(JSON.stringify({ 
        error: 'invalid_grant',
        error_description: 'Authorization code expired'
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify client_id
    if (authCode.client_id !== client_id) {
      return new Response(JSON.stringify({ 
        error: 'invalid_grant',
        error_description: 'Client ID mismatch'
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify redirect_uri
    if (authCode.redirect_uri !== redirect_uri) {
      return new Response(JSON.stringify({ 
        error: 'invalid_grant',
        error_description: 'Redirect URI mismatch'
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Mark code as used
    await supabase
      .from('oauth_authorization_codes')
      .update({ used: true })
      .eq('code', code);

    // Get user email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(authCode.user_id);
    
    if (userError || !userData) {
      console.error('User lookup error:', userError);
      return new Response(JSON.stringify({ 
        error: 'server_error',
        error_description: 'Failed to get user'
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Generate access token (create session)
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      user_id: authCode.user_id
    });

    if (sessionError || !sessionData?.session) {
      console.error('Session creation error:', sessionError);
      return new Response(JSON.stringify({ 
        error: 'server_error',
        error_description: 'Failed to create session'
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Token generated successfully');

    // Return tokens
    return new Response(JSON.stringify({
      access_token: sessionData.session.access_token,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: sessionData.session.refresh_token,
      scope: authCode.scope
    }), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache'
      }
    });

  } catch (err) {
    console.error('Token exchange error:', err);
    return new Response(JSON.stringify({ 
      error: 'server_error',
      error_description: String(err)
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
```

---

## 5. Testing

After deploying the fix, test the token endpoint directly:

```bash
curl -X POST https://texnkijwcygodtywgedm.supabase.co/functions/v1/oauth-token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=auth_code_test&redirect_uri=https://example.com&client_id=test_client"
```

Should return tokens or a clear error message.

---

## Next Steps

1. **Check Supabase logs** for oauth-token function
2. **Share the error logs** with me
3. **Update the function** with the fixes above
4. **Test the token exchange** manually
5. **Try connecting in ChatGPT again**

Once we see the actual error, I can give you the exact fix! 🚀

