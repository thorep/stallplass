import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest} from '@/lib/supabase-auth-middleware'
import { getUserReviewableRentals } from '@/services/review-service'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decodedToken = await verifyFirebaseToken(token)
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const rentals = await getUserReviewableRentals(decodedToken.uid)
    return NextResponse.json(rentals)
  } catch (error) {
    console.error('Error fetching reviewable rentals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviewable rentals' },
      { status: 500 }
    )
  }
}