import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for direct database access (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Dev sync request body:', body);
    
    const { userId, email, name } = body;
    
    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      );
    }

    // First check if user already exists
    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking existing user:', selectError);
      return NextResponse.json(
        { error: `Database error: ${selectError.message}` },
        { status: 500 }
      );
    }

    if (existingUser) {
      console.log('User already exists:', existingUser);
      return NextResponse.json({ 
        message: 'User already exists in database', 
        user: existingUser 
      });
    }

    // Create new user with minimal required fields
    const userData = {
      id: userId,
      email: email,
      name: name || email.split('@')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating user with data:', userData);

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating user:', insertError);
      return NextResponse.json(
        { error: `Failed to create user: ${insertError.message}` },
        { status: 500 }
      );
    }

    console.log('User created successfully:', newUser);

    return NextResponse.json({ 
      message: 'User created successfully', 
      user: newUser 
    });

  } catch (error) {
    console.error('Dev sync error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}