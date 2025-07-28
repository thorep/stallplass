import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const { data: discounts, error } = await supabaseServer
      .from('pricing_discounts')
      .select('*')
      .eq('is_active', true)
      .order('months', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(discounts);
  } catch (_) {
    return NextResponse.json(
      { error: 'Failed to fetch discounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { months, percentage, isActive } = body;
    
    const { data: discount, error } = await supabaseServer
      .from('pricing_discounts')
      .insert({
        months: months,
        percentage: percentage,
        is_active: isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    return NextResponse.json(discount);
  } catch (_) {
    return NextResponse.json(
      { error: 'Failed to create discount' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id, months, percentage, isActive } = body;
    
    const { data: discount, error } = await supabaseServer
      .from('pricing_discounts')
      .update({
        months: months,
        percentage: percentage,
        is_active: isActive,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    return NextResponse.json(discount);
  } catch (_) {
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const { error } = await supabaseServer
      .from('pricing_discounts')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (_) {
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    );
  }
}