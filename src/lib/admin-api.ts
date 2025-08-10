import { createClient } from '@/utils/supabase/client';

/**
 * Helper function to make authenticated API requests from admin panel
 */
export async function makeAdminApiRequest(url: string, options: RequestInit = {}) {
  const supabase = createClient();
  
  // Get the current session token
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session?.access_token) {
    throw new Error('Authentication required');
  }

  // Add authentication header
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API request failed: ${response.status}`);
  }

  return response.json();
}