import { NextRequest } from 'next/server';
import { checkUserIsAdmin } from '@/services/admin-service';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

export async function verifyAdminAccess(request: NextRequest): Promise<string | null> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    // Extract the Firebase ID token
    const idToken = authHeader.replace('Bearer ', '');
    
    // Verify the Firebase ID token server-side
    const decodedToken = await verifyFirebaseToken(idToken);
    if (!decodedToken) {
      return null;
    }

    // Check if user is admin in our database
    const isAdmin = await checkUserIsAdmin(decodedToken.uid);
    if (!isAdmin) {
      return null;
    }

    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return null;
  }
}

export function createUnauthorizedResponse() {
  return new Response(
    JSON.stringify({ error: 'Unauthorized: Admin access required' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}