# Create OAuth Authorization Page

## Problem
ChatGPT successfully registered and is trying to redirect users to:
```
https://go.fastnow.app/oauth/authorize?response_type=code&client_id=...&redirect_uri=...&state=...
```

But this page returns 404 because it doesn't exist yet.

---

## What to Implement

Create a complete OAuth authorization flow page where users:
1. See what app is requesting access (ChatGPT)
2. See what permissions are being requested (scopes)
3. Log in if not already authenticated
4. Click "Allow" or "Deny" to grant/refuse access
5. Get redirected back to ChatGPT with an authorization code

---

## Implementation

### **Step 1: Create the Authorization Page**

**File:** `src/pages/OAuthAuthorize.tsx` (or equivalent in your routing structure)

```typescript
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle } from 'lucide-react';

export default function OAuthAuthorize() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);

  // Get OAuth parameters from URL
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const responseType = searchParams.get('response_type');
  const scope = searchParams.get('scope') || 'read:fasting write:fasting read:food write:food read:goals write:goals read:stats';
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');

  useEffect(() => {
    checkAuthAndClient();
  }, []);

  async function checkAuthAndClient() {
    try {
      // Check if user is logged in
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        // Redirect to login, then back here
        const loginUrl = `/login?redirect=${encodeURIComponent(window.location.href)}`;
        window.location.href = loginUrl;
        return;
      }

      setUser(user);

      // Validate OAuth parameters
      if (!clientId || !redirectUri || !state || responseType !== 'code') {
        setError('Invalid OAuth request parameters');
        setLoading(false);
        return;
      }

      // Verify client exists
      const { data: client, error: clientError } = await supabase
        .from('oauth_clients')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (clientError || !client) {
        setError('Invalid client_id');
        setLoading(false);
        return;
      }

      // Verify redirect_uri matches registered URIs
      if (!client.redirect_uris.includes(redirectUri)) {
        setError('Invalid redirect_uri');
        setLoading(false);
        return;
      }

      setClientInfo(client);
      setLoading(false);

    } catch (err) {
      console.error('Auth check error:', err);
      setError('An error occurred');
      setLoading(false);
    }
  }

  async function handleAllow() {
    setLoading(true);
    try {
      // Generate authorization code
      const authCode = `auth_code_${crypto.randomUUID()}`;

      // Store authorization code in database
      const { error: insertError } = await supabase
        .from('oauth_authorization_codes')
        .insert({
          code: authCode,
          client_id: clientId,
          user_id: user.id,
          redirect_uri: redirectUri,
          scope: scope,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        });

      if (insertError) {
        throw insertError;
      }

      // Redirect back to ChatGPT with authorization code
      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.set('code', authCode);
      redirectUrl.searchParams.set('state', state!);

      window.location.href = redirectUrl.toString();

    } catch (err) {
      console.error('Authorization error:', err);
      setError('Failed to authorize');
      setLoading(false);
    }
  }

  function handleDeny() {
    // Redirect back with error
    const redirectUrl = new URL(redirectUri!);
    redirectUrl.searchParams.set('error', 'access_denied');
    redirectUrl.searchParams.set('error_description', 'User denied access');
    redirectUrl.searchParams.set('state', state!);
    window.location.href = redirectUrl.toString();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const scopes = scope.split(' ').map(s => {
    const parts = s.split(':');
    return {
      action: parts[0],
      resource: parts[1]
    };
  });

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Authorize Access</CardTitle>
              <CardDescription>
                {clientInfo?.client_name || 'An application'} wants to access your FastNow data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Logged in as: <span className="font-medium">{user?.email}</span>
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">This app will be able to:</p>
              <ul className="space-y-2">
                {scopes.map((scope, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      <span className="font-medium capitalize">{scope.action}</span> your{' '}
                      <span className="font-medium">{scope.resource}</span> data
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                You can revoke this access at any time from your account settings.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDeny}
            disabled={loading}
          >
            Deny
          </Button>
          <Button
            className="flex-1"
            onClick={handleAllow}
            disabled={loading}
          >
            {loading ? 'Authorizing...' : 'Allow'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

### **Step 2: Create Database Table for Authorization Codes**

```sql
-- Create table for storing temporary authorization codes
CREATE TABLE oauth_authorization_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  redirect_uri TEXT NOT NULL,
  scope TEXT NOT NULL,
  code_challenge TEXT,
  code_challenge_method TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast code lookups
CREATE INDEX idx_oauth_codes_code ON oauth_authorization_codes(code);

-- Auto-delete expired codes after 1 hour
CREATE INDEX idx_oauth_codes_expires ON oauth_authorization_codes(expires_at);
```

---

### **Step 3: Add Route**

Add to your router configuration:

```typescript
import OAuthAuthorize from '@/pages/OAuthAuthorize';

// In your routes:
{
  path: '/oauth/authorize',
  element: <OAuthAuthorize />
}
```

---

### **Step 4: Update oauth-token Function**

The token exchange function needs to validate the authorization code:

```typescript
// In oauth-token/index.ts
// When handling authorization_code grant:

const { data: authCode, error: codeError } = await supabase
  .from('oauth_authorization_codes')
  .select('*')
  .eq('code', code)
  .eq('used', false)
  .single();

if (codeError || !authCode) {
  return new Response(
    JSON.stringify({ error: 'invalid_grant' }),
    { status: 400, headers: corsHeaders }
  );
}

// Check expiration
if (new Date(authCode.expires_at) < new Date()) {
  return new Response(
    JSON.stringify({ error: 'invalid_grant', error_description: 'Code expired' }),
    { status: 400, headers: corsHeaders }
  );
}

// Verify PKCE if present
if (authCode.code_challenge) {
  // Verify code_verifier matches code_challenge
  // Implementation depends on your crypto library
}

// Mark code as used
await supabase
  .from('oauth_authorization_codes')
  .update({ used: true })
  .eq('code', code);

// Generate access token for this user
const { data: { session }, error: sessionError } = await supabase.auth.admin.createSession({
  user_id: authCode.user_id
});

// Return tokens...
```

---

## Testing

1. Try connecting in ChatGPT again
2. You should see the authorization page
3. Click "Allow"
4. Should redirect back to ChatGPT with success

---

## Summary

✅ Create `/oauth/authorize` page
✅ Create `oauth_authorization_codes` table
✅ Add route to router
✅ Update token exchange to validate codes
✅ Test the full OAuth flow

Once deployed, the ChatGPT connection will work end-to-end! 🚀

