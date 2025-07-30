import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import PricingClient from '@/components/organisms/PricingClient';
import { 
  getBoxAdvertisingPriceObject, 
  getAllDiscounts, 
  getAllBoostDiscounts,
  getSponsoredPlacementPriceObject, 
  getServiceBasePriceObject,
  getAllBoxQuantityDiscounts
} from '@/services/pricing-service';

// Force dynamic rendering to avoid database calls during build
export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  let boxAdvertisingPrice = null;
  let sponsoredPrice = null;
  let serviceBasePrice = null;
  let discounts: Awaited<ReturnType<typeof getAllDiscounts>> = [];
  let boostDiscounts: Awaited<ReturnType<typeof getAllBoostDiscounts>> = [];
  let boxQuantityDiscounts: Awaited<ReturnType<typeof getAllBoxQuantityDiscounts>> = [];
  
  try {
    boxAdvertisingPrice = await getBoxAdvertisingPriceObject();
    sponsoredPrice = await getSponsoredPlacementPriceObject();
    serviceBasePrice = await getServiceBasePriceObject();
    discounts = await getAllDiscounts();
    boostDiscounts = await getAllBoostDiscounts();
    boxQuantityDiscounts = await getAllBoxQuantityDiscounts();
  } catch {
    // Fallback pricing will be handled in the client component
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8 sm:py-16">
        <PricingClient 
          boxAdvertisingPrice={boxAdvertisingPrice} 
          sponsoredPrice={sponsoredPrice} 
          serviceBasePrice={serviceBasePrice}
          discounts={discounts} 
          boostDiscounts={boostDiscounts}
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