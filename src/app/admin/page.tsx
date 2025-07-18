import { AdminPageClient } from '@/components/organisms/AdminPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Stallplass',
  description: 'Administrasjonspanel for Stallplass - administrer roadmap, fasiliteter og priser.',
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminPageClient />
    </div>
  );
}