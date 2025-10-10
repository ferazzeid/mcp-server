# Fix Edge Functions to Accept OAuth Tokens (Not JWTs)

## Problem

The GPT Edge Functions (`gpt-profile`, `gpt-fasting`, etc.) are rejecting OAuth tokens with error:

```json
{"code":401,"message":"Invalid JWT"}
```

This happens because Supabase's built-in JWT validation runs **before** our custom `oauth-middleware`, rejecting UUID-format OAuth tokens.

---

## Root Cause

When a request comes in with `Authorization: Bearer <uuid-token>`, Supabase Edge Functions try to validate it as a JWT first, failing before `oauth-middleware.ts` gets a chance to check it against the `oauth_apps` table.

---

## Solution

Update **ALL** GPT Edge Functions to:
1. **Disable** built-in Supabase JWT auth
2. **Only** use custom OAuth validation via `oauth-middleware.ts`

---

## Files to Update

All Edge Functions in `supabase/functions/` that start with `gpt-`:

- `gpt-fasting/index.ts`
- `gpt-food/index.ts`
- `gpt-profile/index.ts`
- `gpt-goals-motivators/index.ts`
- `gpt-activity/index.ts`
- `gpt-stats/index.ts`
- `gpt-journey/index.ts`
- `gpt-settings/index.ts`
- `gpt-templates/index.ts`
- `gpt-history-search/index.ts`

---

## Required Changes

### 1. Remove JWT Validation

**REMOVE** any code that tries to validate Supabase JWTs, such as:

```typescript
// ❌ REMOVE THIS
const authHeader = req.headers.get('authorization');
const token = authHeader?.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);
```

### 2. Use ONLY OAuth Middleware

**KEEP** only the OAuth middleware validation:

```typescript
// ✅ KEEP THIS
import { validateOAuthToken } from '../_shared/oauth-middleware.ts';

// Validate OAuth token (UUID format, not JWT)
const authHeader = req.headers.get('Authorization');
const { user_id, scopes } = await validateOAuthToken(authHeader, ['read:profile']);
```

### 3. Ensure Service Role Key is Used

In `oauth-middleware.ts`, make sure the Supabase client uses the **service role key**:

```typescript
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // ⚠️ MUST be service role, not anon key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

---

## Example: Fixed `gpt-profile/index.ts`

### Before (Broken):
```typescript
Deno.serve(async (req) => {
  // ❌ This tries to validate as JWT first
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  // This fails with "Invalid JWT" for OAuth tokens
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // ... rest of code
});
```

### After (Fixed):
```typescript
import { validateOAuthToken } from '../_shared/oauth-middleware.ts';

Deno.serve(async (req) => {
  try {
    // ✅ Validate OAuth token directly (no JWT validation)
    const authHeader = req.headers.get('Authorization');
    const { user_id, scopes } = await validateOAuthToken(authHeader, ['read:profile']);
    
    // Now user_id contains the validated user ID
    // Continue with the rest of the logic...
    
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();
    
    if (req.method === 'GET' && !action) {
      // Get user profile
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user_id)
        .single();
      
      if (error) throw error;
      
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // ... rest of endpoints
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

---

## Checklist

For **EACH** of the 10 GPT Edge Functions:

- [ ] Remove any `supabase.auth.getUser()` calls
- [ ] Remove any JWT validation logic
- [ ] Import `validateOAuthToken` from `_shared/oauth-middleware.ts`
- [ ] Call `validateOAuthToken()` at the start of each endpoint
- [ ] Use the returned `user_id` for database queries
- [ ] Ensure `supabaseAdmin` client uses service role key
- [ ] Test that OAuth tokens (UUID format) are accepted

---

## Testing

After making changes, test with:

```bash
curl -X GET https://texnkijwcygodtywgedm.supabase.co/functions/v1/gpt-profile \
  -H "Authorization: Bearer <oauth-uuid-token-from-oauth_apps-table>" \
  -H "Content-Type: application/json"
```

**Expected response:** `200 OK` with user profile data  
**NOT:** `401 {"code":401,"message":"Invalid JWT"}`

---

## Why This Matters

- ✅ OAuth tokens work (UUID format, stored in `oauth_apps` table)
- ❌ Supabase JWTs don't work (we're not using Supabase auth)
- 🎯 Edge Functions must use **OAuth validation only**

---

## Key Points

1. **DO NOT** use `supabase.auth.getUser()` - it expects JWTs
2. **DO** use `validateOAuthToken()` - it checks `oauth_apps` table
3. **ALWAYS** use service role key in oauth-middleware
4. **PASS** the OAuth token as-is from the MCP server

---

**Please update ALL 10 GPT Edge Functions to use ONLY OAuth validation, not JWT validation.**

