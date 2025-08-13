import { prisma } from './prisma';
import { createClient } from '@supabase/supabase-js';

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
            stables: true
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
            conversations: true
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return stables;
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
    // Invoice requests table has been removed - returning empty array
    return [];
    
    /* const invoiceRequests = await prisma.invoice_requests.findMany({
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
    })); */
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
    
    
    // Invoice requests table removed - return 0 for payment counts
    const paymentsToday = 0;
    const paymentsThisMonth = 0;
    
    // Count paid invoices this month to date
    /* const paymentsThisMonth = await prisma.invoice_requests.count({
      where: {
        status: 'PAID',
        paidAt: {
          gte: firstDayOfMonth,
          lt: tomorrow
        }
      }
    }); */
    
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

export async function getEmailConsents() {
  try {
    // Create admin supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get profiles that have consented to email marketing
    const profiles = await prisma.profiles.findMany({
      where: {
        email_consent: true
      },
      select: {
        id: true,
        nickname: true,
        firstname: true,
        lastname: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get corresponding user emails from Supabase auth
    const emailPromises = profiles.map(async (profile) => {
      try {
        const { data: user, error } = await supabase.auth.admin.getUserById(profile.id);
        if (error || !user.user) {
          console.warn(`Could not fetch email for profile ${profile.id}:`, error);
          return null;
        }
        
        return {
          id: profile.id,
          email: user.user.email || '',
          nickname: profile.nickname,
          firstname: profile.firstname,
          lastname: profile.lastname,
          createdAt: profile.createdAt.toISOString()
        };
      } catch (error) {
        console.warn(`Error fetching user ${profile.id}:`, error);
        return null;
      }
    });

    const emailResults = await Promise.all(emailPromises);
    const emails = emailResults.filter(Boolean) as Array<{
      id: string;
      email: string;
      nickname: string;
      firstname: string | null;
      lastname: string | null;
      createdAt: string;
    }>;

    return {
      emails,
      totalCount: emails.length
    };
  } catch (error) {
    throw new Error(`Error fetching email consents: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

