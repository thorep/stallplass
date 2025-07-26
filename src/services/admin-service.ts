import { prisma } from './prisma';

export async function checkUserIsAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.users.findUnique({
      where: { firebaseId: userId },
      select: { isAdmin: true }
    });
    
    return user?.isAdmin ?? false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function requireAdmin(firebaseId: string): Promise<void> {
  const isAdmin = await checkUserIsAdmin(firebaseId);
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
}

// Admin data fetching functions
export async function getAdminUsersWithCounts() {
  try {
    const users = await prisma.users.findMany({
      include: {
        _count: {
          select: {
            stables: true,
            payments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return users;
  } catch (error) {
    throw new Error(`Error fetching admin users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getAdminStablesWithCounts() {
  try {
    const stables = await prisma.stables.findMany({
      include: {
        users: true, // Include all user fields for the owner
        _count: {
          select: {
            boxes: true,
            conversations: true,
            payments: true
          }
        },
        payments: {
          where: {
            status: 'COMPLETED',
            paidAt: {
              not: null
            }
          },
          orderBy: {
            paidAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return stables.map(stable => {
      // Compute advertisingActive based on completed payments
      const latestPayment = stable.payments[0];
      const now = new Date();
      const advertisingActive = latestPayment ? 
        new Date(latestPayment.paidAt!) < now && 
        new Date(latestPayment.paidAt!.getTime() + (latestPayment.months * 30 * 24 * 60 * 60 * 1000)) > now 
        : false;

      return {
        ...stable,
        owner: stable.users,
        advertisingActive
      };
    });
  } catch (error) {
    throw new Error(`Error fetching admin stables: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getAdminBoxesWithCounts() {
  try {
    const boxes = await prisma.boxes.findMany({
      include: {
        stables: {
          include: {
            users: {
              select: {
                email: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            conversations: true,
            rentals: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return boxes.map(box => ({
      ...box,
      stable: {
        ...box.stables,
        owner: box.stables.users
      }
    }));
  } catch (error) {
    throw new Error(`Error fetching admin boxes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getAdminPaymentsWithDetails() {
  try {
    const payments = await prisma.payments.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        stables: {
          select: {
            id: true,
            name: true,
            users: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return payments.map(payment => ({
      ...payment,
      user: payment.users,
      stable: payment.stables ? {
        ...payment.stables,
        owner: payment.stables.users
      } : null
    }));
  } catch (error) {
    throw new Error(`Error fetching admin payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// TODO: Real-time subscription functions removed during Prisma migration
// These functions were Supabase-specific and need to be replaced with
// alternative real-time solutions if needed (e.g., WebSockets, Server-Sent Events)

// Admin activity tracking
export interface AdminActivity {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: 'user' | 'stable' | 'box' | 'payment' | 'system';
  target_id?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export async function logAdminActivity(
  adminFirebaseId: string,
  action: string,
  targetType: AdminActivity['target_type'],
  targetId?: string,
  details?: Record<string, unknown>
) {
  // TODO: Implement when admin_activities table is created
  console.log('Admin activity:', {
    adminFirebaseId,
    action,
    targetType,
    targetId,
    details,
    timestamp: new Date().toISOString()
  });
}

export async function getRecentAdminActivities(limit: number = 50) {
  // TODO: Implement when admin_activities table is created
  console.log('Requested recent admin activities with limit:', limit);
  return [];
}

// Cleanup and maintenance functions
export async function performSystemCleanup() {
  try {
    // This would typically call your cleanup API endpoint
    const response = await fetch('/api/admin/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Cleanup failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error performing system cleanup:', error);
    throw error;
  }
}

