import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/supabase-auth-middleware';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const { data: payments, error } = await supabaseServer
      .from('payments')
      .select(`
        *,
        user:users!payments_user_id_fkey (
          id,
          email,
          name
        ),
        stable:stables!payments_stable_id_fkey (
          id,
          name,
          owner:users!stables_owner_id_fkey (
            email,
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(payments);
  } catch (_) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}