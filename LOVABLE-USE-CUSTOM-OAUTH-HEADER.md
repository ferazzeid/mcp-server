# Use Custom Header for OAuth Tokens

## Problem

Supabase's Edge Functions platform validates `Authorization: Bearer <token>` headers as JWTs **before** our function code runs. Since we're using UUID-format OAuth tokens (not JWTs), these requests are rejected with `{"code":401,"message":"Invalid JWT"}` at the platform level.

**Evidence:** No logs appear in Edge Function logs = function never executed.

---

## Solution

Use a **custom header** `X-OAuth-Token` instead of `Authorization` header to bypass Supabase's platform-level JWT validation.

---

## Changes Required

### **1. Update `oauth-middleware.ts`**

Modify `validateOAuthToken` to read from `X-OAuth-Token` header:

**Current code:**
```typescript
export async function validateOAuthToken(
  authHeader: string | null,
  requiredScopes: string[] = []
): Promise<ValidatedOAuthToken> {
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const token = authHeader.replace('Bearer ', '').trim();
  // ...
}
```

**Update to:**
```typescript
export async function validateOAuthToken(
  authHeaderOrToken: string | null,
  requiredScopes: string[] = []
): Promise<ValidatedOAuthToken> {
  if (!authHeaderOrToken) {
    throw new Error('Missing authentication token');
  }

  // Handle both "Bearer <token>" format and plain token
  const token = authHeaderOrToken.startsWith('Bearer ') 
    ? authHeaderOrToken.replace('Bearer ', '').trim()
    : authHeaderOrToken.trim();
  
  if (!token) {
    throw new Error('Invalid authentication token format');
  }

  // ... rest of the function stays the same
}
```

---

### **2. Update ALL 10 GPT Edge Functions**

For each function, change the header it reads from:

**Files to update:**
- `supabase/functions/gpt-profile/index.ts`
- `supabase/functions/gpt-fasting/index.ts`
- `supabase/functions/gpt-food/index.ts`
- `supabase/functions/gpt-goals-motivators/index.ts`
- `supabase/functions/gpt-activity/index.ts`
- `supabase/functions/gpt-stats/index.ts`
- `supabase/functions/gpt-journey/index.ts`
- `supabase/functions/gpt-settings/index.ts`
- `supabase/functions/gpt-templates/index.ts`
- `supabase/functions/gpt-history-search/index.ts`

**Change from:**
```typescript
const token = await validateOAuthToken(req.headers.get('Authorization'), ['read:profile']);
```

**Change to:**
```typescript
// Try custom header first, fall back to Authorization for backwards compatibility
const oauthToken = req.headers.get('X-OAuth-Token') || req.headers.get('Authorization');
const token = await validateOAuthToken(oauthToken, ['read:profile']);
```

This allows both:
- New requests with `X-OAuth-Token` header ✅
- Legacy requests with `Authorization` header (if they somehow work)

---

### **3. Update CORS Headers**

In **ALL 10 Edge Functions**, update the `corsHeaders` to include the custom header:

**Current:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
};
```

**Update to:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-oauth-token, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
};
```

---

## Example: Updated `gpt-profile/index.ts`

**Top of the file:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { validateOAuthToken, oauthErrorResponse } from '../_shared/oauth-middleware.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-oauth-token, x-client-info, apikey, content-type',  // Added x-oauth-token
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
};
```

**First endpoint (around line 28):**
```typescript
// GET / - Get full profile
if (req.method === 'GET' && (action === 'gpt-profile' || path.length <= 1)) {
  // Try custom header first, fall back to Authorization
  const oauthToken = req.headers.get('X-OAuth-Token') || req.headers.get('Authorization');
  const token = await validateOAuthToken(oauthToken, ['read:profile']);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('display_name, weight, height, age, gender, daily_calorie_goal, daily_carb_goal, preferred_units, show_protein_fat')
    .eq('user_id', token.user_id)
    .single();
  
  // ... rest of the code
}
```

**Repeat this change for EVERY endpoint in EVERY GPT Edge Function.**

---

## Why This Works

1. **Supabase platform** only validates `Authorization` headers, not custom headers
2. **`X-OAuth-Token`** passes through untouched to our function code
3. **Our `oauth-middleware`** validates it against the `oauth_apps` table
4. **Edge Functions** can now execute with OAuth tokens ✅

---

## Testing

After deployment:

1. **MCP Server** now sends: `X-OAuth-Token: <uuid-token>`
2. **Edge Functions** receive request and run successfully
3. **Logs appear** in Supabase Edge Function logs
4. **ChatGPT** gets data back

---

## Checklist

- [ ] Update `oauth-middleware.ts` to handle both header formats
- [ ] Update CORS headers in all 10 Edge Functions
- [ ] Update token reading logic in all 10 Edge Functions
- [ ] Deploy all 10 Edge Functions to Supabase
- [ ] Test `get_profile` in ChatGPT
- [ ] Verify logs appear in Supabase

---

**Please make these changes to ALL 10 GPT Edge Functions and deploy them.**

