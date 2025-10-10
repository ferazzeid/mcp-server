import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

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

// Validate token and get user ID
export async function validateTokenAndGetUserId(token: string): Promise<string> {
  const userClient = createUserClient(token);
  const { data: { user }, error } = await userClient.auth.getUser();
  
  if (error || !user) {
    throw new Error('Invalid authentication token');
  }
  
  return user.id;
}

