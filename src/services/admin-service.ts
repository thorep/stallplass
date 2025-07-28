import { prisma } from './prisma';

export async function checkUserIsAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    });
    
    return user?.isAdmin ?? false;
  } catch (error) {
    return false;
  }
}

export async function requireAdmin(userId: string): Promise<void> {
  const isAdmin = await checkUserIsAdmin(userId);
  
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
            invoice_requests: true
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
            invoice_requests: true
          }
        },
        invoice_requests: {
          where: {
            status: 'PAID',
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
      const latestInvoice = stable.invoice_requests[0];
      const now = new Date();
      const advertisingActive = latestInvoice ? 
        new Date(latestInvoice.paidAt!) < now && 
        new Date(latestInvoice.paidAt!.getTime() + ((latestInvoice.months || 1) * 30 * 24 * 60 * 60 * 1000)) > now 
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
            conversations: true
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
    const invoiceRequests = await prisma.invoice_requests.findMany({
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
    
    return invoiceRequests.map(request => ({
      ...request,
      user: request.users,
      stable: request.stables ? {
        ...request.stables,
        owner: request.stables.users
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
  adminUserId: string,
  action: string,
  targetType: AdminActivity['target_type'],
  targetId?: string,
  details?: Record<string, unknown>
) {
  // TODO: Implement when admin_activities table is created
  return;
}

export async function getRecentAdminActivities(limit: number = 50) {
  // TODO: Implement when admin_activities table is created
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
    throw error;
  }
}

