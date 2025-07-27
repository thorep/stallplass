import { AdminPageClient } from '@/components/organisms/AdminPageClient';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Stallplass',
  description: 'Administrasjonspanel for Stallplass - administrer fasiliteter og priser.',
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        <AdminPageClient />
      </main>
      <Footer />
    </div>
  );
}