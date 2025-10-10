# 🔧 CRITICAL FIX: Update OAuth Token Reading Logic in ALL Edge Functions

## ❌ CURRENT CODE (WRONG):
```typescript
const token = await validateOAuthToken(req.headers.get('Authorization'), ['read:profile']);
```

## ✅ REQUIRED CODE (CORRECT):
```typescript
const oauthToken = req.headers.get('X-OAuth-Token') || req.headers.get('Authorization');
const token = await validateOAuthToken(oauthToken, ['read:profile']);
```

---

## 📋 EXACT CHANGES NEEDED:

### **ALL 10 Edge Functions Must Be Updated:**

1. `supabase/functions/gpt-profile/index.ts`
2. `supabase/functions/gpt-fasting/index.ts`
3. `supabase/functions/gpt-food/index.ts`
4. `supabase/functions/gpt-goals/index.ts`
5. `supabase/functions/gpt-activity/index.ts`
6. `supabase/functions/gpt-journey/index.ts`
7. `supabase/functions/gpt-stats/index.ts`
8. `supabase/functions/gpt-settings/index.ts`
9. `supabase/functions/gpt-search/index.ts`
10. `supabase/functions/gpt-ai/index.ts`

---

## 🔍 FIND & REPLACE INSTRUCTIONS:

### **Step 1: In EACH of the 10 files above:**

**FIND THIS PATTERN** (appears ~5-50 times per file):
```typescript
const token = await validateOAuthToken(req.headers.get('Authorization'),
```

**REPLACE WITH:**
```typescript
const oauthToken = req.headers.get('X-OAuth-Token') || req.headers.get('Authorization');
const token = await validateOAuthToken(oauthToken,
```

### **Example: gpt-profile/index.ts Line 34**

**BEFORE:**
```typescript
// GET / - Get full profile
if (req.method === 'GET' && (action === 'gpt-profile' || path.length <= 1)) {
  const token = await validateOAuthToken(req.headers.get('Authorization'), ['read:profile']);
  const { data: profile, error } = await supabase.from('profiles')
```

**AFTER:**
```typescript
// GET / - Get full profile
if (req.method === 'GET' && (action === 'gpt-profile' || path.length <= 1)) {
  const oauthToken = req.headers.get('X-OAuth-Token') || req.headers.get('Authorization');
  const token = await validateOAuthToken(oauthToken, ['read:profile']);
  const { data: profile, error } = await supabase.from('profiles')
```

---

## ✅ VERIFICATION:

After making changes, search ALL 10 files for:
```
req.headers.get('Authorization')
```

**Expected result:** 
- ZERO direct uses of `req.headers.get('Authorization')` in `validateOAuthToken` calls
- All uses should be replaced with the two-line pattern above

---

## 🎯 WHY THIS IS CRITICAL:

Supabase's platform-level JWT validation **blocks requests** with OAuth tokens in the `Authorization` header BEFORE the Edge Function code can run. Using a custom `X-OAuth-Token` header bypasses this platform check and allows our OAuth middleware to handle validation.

---

## 🚨 IMPORTANT:

- Do NOT change CORS headers (already correct)
- Do NOT change `oauth-middleware.ts` (already correct)
- ONLY change the token reading logic in the 10 GPT Edge Functions
- Make EVERY SINGLE change - missing even one will cause that endpoint to fail
- The `|| req.headers.get('Authorization')` fallback ensures backward compatibility

---

## 📌 COMMIT MESSAGE:
```
fix: Read OAuth token from X-OAuth-Token header in all GPT Edge Functions

- Replace all direct Authorization header reads with X-OAuth-Token priority
- Fallback to Authorization for backward compatibility
- Fixes "Missing authorization header" error with ChatGPT integration
```

