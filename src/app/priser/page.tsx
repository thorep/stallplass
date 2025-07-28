import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import PricingClient from '@/components/organisms/PricingClient';
import { getBasePriceObject, getAllDiscounts, getSponsoredPlacementPriceObject, getAllBoxQuantityDiscounts } from '@/services/pricing-service';

// Force dynamic rendering to avoid database calls during build
export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  let basePrice = null;
  let sponsoredPrice = null;
  let discounts: Awaited<ReturnType<typeof getAllDiscounts>> = [];
  let boxQuantityDiscounts: Awaited<ReturnType<typeof getAllBoxQuantityDiscounts>> = [];
  
  try {
    basePrice = await getBasePriceObject();
    sponsoredPrice = await getSponsoredPlacementPriceObject();
    discounts = await getAllDiscounts();
    boxQuantityDiscounts = await getAllBoxQuantityDiscounts();
  } catch {
    // Fallback pricing will be handled in the client component
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8 sm:py-16">
        <PricingClient 
          basePrice={basePrice} 
          sponsoredPrice={sponsoredPrice} 
          discounts={discounts} 
          boxQuantityDiscounts={boxQuantityDiscounts} 
        />
      </main>
      <Footer />
    </div>
  );
}

export const metadata = {
  title: 'Priser - Stallplass',
  description: 'Enkle og transparente priser for stallmarkedsføring. Betal kun for det du faktisk annonserer.',
};