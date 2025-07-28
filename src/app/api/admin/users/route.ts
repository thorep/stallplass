import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/supabase-auth-middleware';
import { performAdminOperation, serverOperations } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    // Use server-side operations with admin permissions
    const users = await performAdminOperation(
      () => serverOperations.getAllUsersWithCounts(),
      adminId,
      'fetchAllUsers'
    );

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, isAdmin } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Use server-side operations with admin permissions
    const user = await performAdminOperation(
      () => serverOperations.updateUserAdminStatus(id, isAdmin),
      adminId,
      'updateUserAdminStatus'
    );

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}