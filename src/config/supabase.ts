import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Admin client for server-side operations (use service role key to bypass RLS)
export const supabaseAdmin = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create client with user's JWT token
export function createUserClient(userToken: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    }
  });
}

// Validate OAuth token via database lookup (matches Lovable's oauth-middleware)
// Returns both user_id and the validated token for proxying
export async function validateOAuthToken(token: string): Promise<{ userId: string; token: string }> {
  console.log('🔍 Looking up token in oauth_apps table');
  
  // Look up the token in the oauth_apps table
  const { data, error } = await supabaseAdmin
    .from('oauth_apps')
    .select('user_id, expires_at, revoked_at, scopes, app_name')
    .eq('access_token', token)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (error || !data) {
    console.error('Token lookup error:', error);
    console.error('Token being searched:', token);
    throw new Error('Invalid or revoked access token');
  }
  
  console.log('✅ Token valid for user:', data.user_id, 'scopes:', data.scopes);
  
  // Return both user ID and the original OAuth token
  // The Edge Functions will validate this token themselves using oauth-middleware
  return {
    userId: data.user_id,
    token: token // Pass the OAuth UUID token as-is
  };
}

// Legacy function name for backwards compatibility
export async function validateTokenAndGetUserId(token: string): Promise<string> {
  const { userId } = await validateOAuthToken(token);
  return userId;
}


