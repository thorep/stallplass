import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import MessagingClient from '@/components/organisms/MessagingClient';

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <MessagingClient />
      </main>
      <Footer />
    </div>
  );
}

export const metadata = {
  title: 'Meldinger - Stallplass',
  description: 'Se og administrer dine meldinger om boxes',
};