import { prisma } from './prisma';

export async function checkProfileIsAdmin(profileId: string): Promise<boolean> {
  try {
    const profile = await prisma.profiles.findUnique({
      where: { id: profileId },
      select: { isAdmin: true }
    });
    
    return profile?.isAdmin ?? false;
  } catch {
    return false;
  }
}

export async function requireAdmin(profileId: string): Promise<void> {
  const isAdmin = await checkProfileIsAdmin(profileId);
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
}

// Admin data fetching functions
export async function getAdminProfilesWithCounts() {
  try {
    const profiles = await prisma.profiles.findMany({
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
    
    return profiles;
  } catch (error) {
    throw new Error(`Error fetching admin profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getAdminStablesWithCounts() {
  try {
    const stables = await prisma.stables.findMany({
      include: {
        profiles: true, // Include all profile fields for the owner
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
        owner: stable.profiles,
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
            profiles: {
              select: {
                nickname: true,
                firstname: true,
                lastname: true
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
        owner: box.stables.profiles
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
        profiles: {
          select: {
            id: true,
            nickname: true,
            firstname: true,
            lastname: true
          }
        },
        stables: {
          select: {
            id: true,
            name: true,
            profiles: {
              select: {
                nickname: true,
                firstname: true,
                lastname: true
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
      user: request.profiles,
      stable: request.stables ? {
        ...request.stables,
        owner: request.stables.profiles
      } : null
    }));
  } catch (error) {
    throw new Error(`Error fetching admin payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// TODO: Real-time subscription functions removed during Prisma migration
// These functions were Supabase-specific and need to be replaced with
// alternative real-time solutions if needed (e.g., WebSockets, Server-Sent Events)


// Cleanup and maintenance functions
export async function getProfileStats() {
  try {
    // Get total profile count
    const total = await prisma.profiles.count();
    
    // Get profiles created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const newToday = await prisma.profiles.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    return {
      total,
      newToday
    };
  } catch (error) {
    throw new Error(`Error fetching profile stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getStableStats() {
  try {
    // Get total stable count
    const total = await prisma.stables.count();
    
    // Get stables created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const newToday = await prisma.stables.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    return {
      total,
      newToday
    };
  } catch (error) {
    throw new Error(`Error fetching stable stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getBoxStats() {
  try {
    // Get total box count
    const total = await prisma.boxes.count();
    
    // Get boxes created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const newToday = await prisma.boxes.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    return {
      total,
      newToday
    };
  } catch (error) {
    throw new Error(`Error fetching box stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getPaymentStats() {
  try {
    // Get current date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get first day of current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Count paid invoices today
    const paymentsToday = await prisma.invoice_requests.count({
      where: {
        status: 'PAID',
        paidAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    // Count paid invoices this month to date
    const paymentsThisMonth = await prisma.invoice_requests.count({
      where: {
        status: 'PAID',
        paidAt: {
          gte: firstDayOfMonth,
          lt: tomorrow
        }
      }
    });
    
    return {
      paymentsToday,
      paymentsThisMonth
    };
  } catch (error) {
    throw new Error(`Error fetching payment stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

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

