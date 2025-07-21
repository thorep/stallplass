import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { supabaseServer } from '@/lib/supabase-server';

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { data: user, error } = await supabaseServer
      .from('brukere')
      .select('id, name, email, firebase_id, er_admin, opprettet_dato, oppdatert_dato')
      .eq('firebase_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Convert snake_case to camelCase for consistency with frontend
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      firebaseId: user.firebase_id,
      isAdmin: user.er_admin,
      createdAt: user.opprettet_dato,
      updatedAt: user.oppdatert_dato,
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
});