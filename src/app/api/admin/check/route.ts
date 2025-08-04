import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/supabase-auth-middleware';

export const GET = withAdminAuth(async (request: NextRequest, { profileId }) => {
  return NextResponse.json({ isAdmin: true });
});