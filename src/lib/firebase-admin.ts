import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    // Initialize without service account - will use default credentials or environment
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
};

export async function verifyFirebaseToken(token: string): Promise<{ uid: string; email?: string } | null> {
  try {
    // For development, we'll use Firebase Admin SDK if available, otherwise fall back to basic JWT parsing
    if (process.env.NODE_ENV === 'development') {
      // Basic JWT token validation for development
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      // Decode the payload (this is NOT secure verification, just for development)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Check if token looks like a Firebase token
      if (payload.aud !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        throw new Error('Invalid audience');
      }
      
      // Check if token is expired (basic check)
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }
      
      return {
        uid: payload.sub || payload.user_id,
        email: payload.email,
      };
    } else {
      // Production: use proper Firebase Admin SDK verification
      initializeFirebaseAdmin();
      const auth = getAuth();
      
      // Verify the Firebase ID token
      const decodedToken = await auth.verifyIdToken(token);
      
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
    }
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
}

export async function getFirebaseUser(uid: string) {
  try {
    initializeFirebaseAdmin();
    const auth = getAuth();
    
    const user = await auth.getUser(uid);
    return user;
  } catch (error) {
    console.error('Error getting Firebase user:', error);
    return null;
  }
}