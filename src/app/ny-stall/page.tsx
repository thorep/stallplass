import { getAllStableAmenities } from '@/services/amenity-service';
import { requireAuth } from '@/lib/server-auth';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import NewStableForm from '@/components/organisms/NewStableForm';

// Force dynamic rendering to avoid database calls during build
export const dynamic = 'force-dynamic';

export default async function NewStablePage() {
  // Server-side authentication - user is guaranteed to be authenticated
  const user = await requireAuth('/ny-stall');
  const amenities = await getAllStableAmenities();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-gray-0 shadow-sm rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Legg til ny stall</h1>
          <NewStableForm amenities={amenities} user={user} />
        </div>
      </main>

      <Footer />
    </div>
  );
}