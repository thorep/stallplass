import { NextResponse } from 'next/server';

// Note: tettsteder (urban settlements) are not implemented in the current schema
// This endpoint returns an empty array for now
export async function GET() {
  try {
    // tettsteder functionality not implemented - return empty array
    return NextResponse.json([]);
  } catch (_) {
    return NextResponse.json(
      { error: 'tettsteder not implemented' },
      { status: 501 }
    );
  }
}