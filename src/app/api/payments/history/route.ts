import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest} from '@/lib/supabase-auth-middleware';
import { getUserPayments } from '@/services/vipps-service';

export async function GET(request: NextRequest) {
  try {
    // Verify Firebase authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // Get user's payment history
    const payments = await getUserPayments(userId);

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}