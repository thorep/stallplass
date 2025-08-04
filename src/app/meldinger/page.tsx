import { requireVerifiedEmail } from '@/lib/server-auth';
import Header from '@/components/organisms/Header';
import MessagingClient from '@/components/organisms/MessagingClient';

export default async function MessagesPage() {
  await requireVerifiedEmail('/meldinger');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <MessagingClient />
      </main>
    </div>
  );
}

export const metadata = {
  title: 'Meldinger - Stallplass',
  description: 'Se og administrer dine meldinger om boxes',
};