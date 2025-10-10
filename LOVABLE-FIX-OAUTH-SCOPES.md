# Fix OAuth Scopes for ChatGPT Integration

## Problem

ChatGPT can write data (start fast, log food) but **cannot read data** (show profile, current weight) because the OAuth token is missing critical scopes.

**Current scopes (incomplete):**
```
read:fasting, write:fasting, read:food, write:food, read:goals, write:goals, read:stats
```

**Required scopes (complete):**
```
read:fasting, write:fasting,
read:food, write:food,
read:profile, write:profile,     ← MISSING
read:goals, write:goals,
read:activity, write:activity,   ← MISSING
read:journey, write:journey,     ← MISSING
read:stats,
read:settings, write:settings    ← MISSING
```

---

## Solution

Update the OAuth authorization page to request **ALL** scopes when ChatGPT connects.

---

## Files to Update

### **File: `src/pages/OAuthAuthorize.tsx`**

**Find this section (where scopes are defined):**
```tsx
const requestedScopes = searchParams.get('scope')?.split(' ') || [];
```

**Update the default/requested scopes to include ALL 15 scopes:**

```tsx
// Parse requested scopes from URL, but ensure ALL required scopes are included
const urlScopes = searchParams.get('scope')?.split(' ') || [];
const requiredScopes = [
  'read:fasting', 'write:fasting',
  'read:food', 'write:food',
  'read:profile', 'write:profile',
  'read:goals', 'write:goals',
  'read:activity', 'write:activity',
  'read:journey', 'write:journey',
  'read:stats',
  'read:settings', 'write:settings'
];

// Merge URL scopes with required scopes (deduplicate)
const requestedScopes = [...new Set([...urlScopes, ...requiredScopes])];
```

**Also update the scopes display to show all 15:**
```tsx
<div className="space-y-2">
  <h3 className="font-semibold">This app will be able to:</h3>
  <ul className="space-y-1 text-sm text-muted-foreground">
    {requestedScopes.includes('read:fasting') && <li>• View your fasting sessions</li>}
    {requestedScopes.includes('write:fasting') && <li>• Start, pause, and end fasts</li>}
    {requestedScopes.includes('read:food') && <li>• View your food log</li>}
    {requestedScopes.includes('write:food') && <li>• Log food and nutrition</li>}
    {requestedScopes.includes('read:profile') && <li>• View your profile and weight</li>}
    {requestedScopes.includes('write:profile') && <li>• Update your profile and weight</li>}
    {requestedScopes.includes('read:goals') && <li>• View your goals</li>}
    {requestedScopes.includes('write:goals') && <li>• Create and update goals</li>}
    {requestedScopes.includes('read:activity') && <li>• View your activity and walks</li>}
    {requestedScopes.includes('write:activity') && <li>• Track activity and walks</li>}
    {requestedScopes.includes('read:journey') && <li>• View your 90-day journey</li>}
    {requestedScopes.includes('write:journey') && <li>• Update journey progress</li>}
    {requestedScopes.includes('read:stats') && <li>• View your statistics</li>}
    {requestedScopes.includes('read:settings') && <li>• View your settings</li>}
    {requestedScopes.includes('write:settings') && <li>• Update your settings</li>}
  </ul>
</div>
```

---

## Immediate Database Fix

While you're updating the code, also run this SQL query in Supabase SQL Editor to fix the current token:

```sql
UPDATE oauth_apps
SET scopes = ARRAY[
  'read:fasting', 'write:fasting',
  'read:food', 'write:food',
  'read:profile', 'write:profile',
  'read:goals', 'write:goals',
  'read:activity', 'write:activity',
  'read:journey', 'write:journey',
  'read:stats',
  'read:settings', 'write:settings'
]
WHERE id = (
  SELECT id FROM oauth_apps 
  ORDER BY created_at DESC 
  LIMIT 1
)
RETURNING app_name, scopes;
```

---

## Testing

After making changes:

1. **Disconnect ChatGPT:** Settings → Apps & Connectors → Disconnect FastNow
2. **Clear old token:** Run the SQL query above to update the existing token
3. **Reconnect ChatGPT:** Add FastNow again
4. **Verify all scopes are granted:** The authorization page should show all 15 permissions
5. **Test read operations:** "Show me my profile", "What's my current weight?"

---

## Why This Matters

- ✅ **Write operations work** (scopes granted)
- ❌ **Read operations fail** (scopes missing)
- 🎯 **Fix:** Grant ALL scopes during authorization

Without all scopes, ChatGPT can start fasts and log food but cannot show profile, weight, goals, activity, journey, or settings.

---

**Please update the OAuth authorization flow to request all 15 scopes by default.**

