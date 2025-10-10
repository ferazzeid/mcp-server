import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

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
export async function validateTokenAndGetUserId(token: string): Promise<string> {
  // Look up the token in the oauth_access_tokens table
  const { data, error } = await supabaseAdmin
    .from('oauth_access_tokens')
    .select('user_id, expires_at')
    .eq('access_token', token)
    .eq('revoked', false)
    .single();
  
  if (error || !data) {
    console.error('Token lookup error:', error);
    throw new Error('Invalid or expired access token');
  }
  
  // Check if token is expired
  if (new Date(data.expires_at) < new Date()) {
    throw new Error('Access token expired');
  }
  
  return data.user_id;
}


