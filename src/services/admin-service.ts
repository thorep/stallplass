import { prisma } from '@/lib/prisma';

export async function checkUserIsAdmin(firebaseId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId },
      select: { isAdmin: true },
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