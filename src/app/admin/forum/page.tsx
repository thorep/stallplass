import { requireAdminAuth } from '@/lib/server-auth';
import { ForumAdminClient } from '@/components/admin/ForumAdminClient';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forum Admin | Stallplass',
  description: 'Administrer forum-kategorier og innhold.',
};

export default async function ForumAdminPage() {
  const user = await requireAdminAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        <ForumAdminClient user={user} />
      </main>
      <Footer />
    </div>
  );
}