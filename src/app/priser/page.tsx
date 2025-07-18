import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import PricingClient from '@/components/organisms/PricingClient';
import { getBasePrice, getAllDiscounts } from '@/services/pricing-service';

export default async function PricingPage() {
  let basePrice = null;
  let discounts: Awaited<ReturnType<typeof getAllDiscounts>> = [];
  
  try {
    basePrice = await getBasePrice();
    discounts = await getAllDiscounts();
  } catch {
    console.log('Database not ready yet, using fallback pricing');
    // Fallback pricing will be handled in the client component
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8 sm:py-16">
        <PricingClient basePrice={basePrice} discounts={discounts} />
      </main>
      <Footer />
    </div>
  );
}

export const metadata = {
  title: 'Priser - Stallplass',
  description: 'Enkle og transparente priser for stallmarkedsføring. Betal kun for det du faktisk annonserer.',
};