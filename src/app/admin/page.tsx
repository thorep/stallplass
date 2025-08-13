import { AdminPageClient } from '@/components/organisms/AdminPageClient';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import { requireAdminAuth } from '@/lib/server-auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Stallplass',
  description: 'Administrasjonspanel for Stallplass - administrer fasiliteter og priser.',
};

export default async function AdminPage() {
  const user = await requireAdminAuth(); // Auto-redirects if not admin

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        <AdminPageClient user={user} />
      </main>
      <Footer />
    </div>
  );
}