import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends NextRequest {
  userId: string;
  userEmail?: string;
}

/**
 * Create Supabase client for server-side authentication
 */
function createSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

/**
 * Verify Supabase JWT token
 */
async function verifySupabaseToken(token: string): Promise<{ uid: string; email?: string } | null> {
  try {
    const supabase = createSupabaseServer();
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return {
      uid: user.id,
      email: user.email
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Middleware to verify Supabase authentication for API routes
 * Returns the authenticated user's Supabase ID or null if not authenticated
 */
export async function authenticateRequest(request: NextRequest): Promise<{ uid: string; email?: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await verifySupabaseToken(token);
    
    return decodedToken;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}


/**
 * Higher-order function to protect API routes with authentication
 * Usage: export const POST = withAuth(async (request, { userId }) => { ... });
 */
export function withAuth<T extends unknown[]>(
  handler: (request: NextRequest, context: { userId: string; userEmail?: string }, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const authResult = await authenticateRequest(request);
    
    if (!authResult) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(request, { userId: authResult.uid, userEmail: authResult.email }, ...args);
  };
}

/**
 * Higher-order function to protect API routes with admin authentication
 * Usage: export const POST = withAdminAuth(async (request, { userId }) => { ... });
 */
export function withAdminAuth<T extends unknown[]>(
  handler: (request: NextRequest, context: { userId: string; userEmail?: string }, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const authResult = await authenticateRequest(request);
    
    if (!authResult) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin - you can implement role-based access control here
    // For now, we'll assume all authenticated users can be admins
    // You may want to check user roles in your database
    const isAdmin = true; // TODO: Implement proper admin role checking
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return handler(request, { userId: authResult.uid, userEmail: authResult.email }, ...args);
  };
}

/**
 * Check if a user has admin permissions
 * TODO: Implement proper role-based access control
 */
export async function checkAdminPermissions(userId: string): Promise<boolean> {
  // For now, all authenticated users are considered admins
  // You can implement role checking here by querying your database
  return true;
}

/**
 * Direct admin access verification function (for backward compatibility)
 * Returns the admin user ID if valid, null otherwise
 */
export async function verifyAdminAccess(request: NextRequest): Promise<string | null> {
  const authResult = await authenticateRequest(request);
  
  if (!authResult) {
    return null;
  }

  const isAdmin = await checkAdminPermissions(authResult.uid);
  if (!isAdmin) {
    return null;
  }

  return authResult.uid;
}

/**
 * Utility function to create unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Utility function to create forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

// Aliases for backward compatibility
export const createUnauthorizedResponse = unauthorizedResponse;
export const createForbiddenResponse = forbiddenResponse;