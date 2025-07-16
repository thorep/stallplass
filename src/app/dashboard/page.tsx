import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import Header from '@/components/organisms/Header';
import DashboardClient from '@/components/organisms/DashboardClient';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/logg-inn');
  }

  // Fetch user's stables from the database
  const stablesRaw = await prisma.stable.findMany({
    where: {
      ownerId: session.user.id
    },
    include: {
      owner: {
        select: {
          name: true,
          phone: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const stables = stablesRaw.map(stable => ({
    ...stable,
    owner: {
      name: stable.owner.name,
      phone: stable.owner.phone || stable.ownerPhone || '',
      email: stable.owner.email || stable.ownerEmail || ''
    }
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <DashboardClient stables={stables} />
    </div>
  );
}