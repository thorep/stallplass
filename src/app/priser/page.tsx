import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import PricingClient from '@/components/organisms/PricingClient';
import { 
  getBoostDailyPriceObject,
  getAllBoostDiscounts
} from '@/services/pricing-service';

// Force dynamic rendering to avoid database calls during build
export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  let sponsoredPrice = null;
  let boostDiscounts: Awaited<ReturnType<typeof getAllBoostDiscounts>> = [];
  
  try {
    sponsoredPrice = await getBoostDailyPriceObject();
    boostDiscounts = await getAllBoostDiscounts();
  } catch {
    // Fallback pricing will be handled in the client component
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8 sm:py-16">
        <PricingClient />
      </main>
      <Footer />
    </div>
  );
}

export const metadata = {
  title: 'Priser - Stallplass',
  description: 'Stallplass er gratis å bruke! Boost stallplassene dine for økt synlighet med våre rimelige boost-priser.',
};