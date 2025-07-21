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
      .from('betalinger')
      .select(`
        *,
        bruker:brukere!betalinger_bruker_id_fkey (
          id,
          firebase_id,
          email,
          name
        ),
        stall:staller!betalinger_stall_id_fkey (
          id,
          name,
          eier:brukere!staller_eier_id_fkey (
            email,
            name
          )
        )
      `)
      .order('opprettet_dato', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}