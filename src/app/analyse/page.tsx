import { Metadata } from 'next';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import AnalyticsClient from '@/components/organisms/AnalyticsClient';

export const metadata: Metadata = {
  title: 'Analyse - Stallplass',
  description: 'Se statistikk og analyse for dine staller og tjenester på Stallplass.no',
};

export default function AnalysePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8 sm:py-16">
        <AnalyticsClient />
      </main>
      <Footer />
    </div>
  );
}