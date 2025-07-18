import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

export interface AuthenticatedRequest extends NextRequest {
  userId: string;
  userEmail?: string;
}

/**
 * Middleware to verify Firebase authentication for API routes
 * Returns the authenticated user's Firebase ID or null if not authenticated
 */
export async function authenticateRequest(request: NextRequest): Promise<{ uid: string; email?: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await verifyFirebaseToken(token);
    
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
    const { verifyAdminAccess } = await import('@/lib/admin-auth');
    
    const adminId = await verifyAdminAccess(request);
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    return handler(request, { userId: adminId }, ...args);
  };
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