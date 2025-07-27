import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/supabase-auth-middleware';

export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  
  if (!adminId) {
    return NextResponse.json({ isAdmin: false });
  }

  return NextResponse.json({ isAdmin: true });
}