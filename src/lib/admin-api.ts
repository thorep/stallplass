/**
 * Helper function to make authenticated API requests from admin panel
 * Uses cookie-based authentication (no bearer token required)
 */
export async function makeAdminApiRequest(url: string, options: RequestInit = {}) {
  // Add cookie-based authentication
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Enable cookie-based authentication
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API request failed: ${response.status}`);
  }

  return response.json();
}