import { requireAuth } from '@/lib/server-auth';
import ServiceForm from '@/components/organisms/ServiceForm';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import Button from '@/components/atoms/Button';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default async function CreateServicePage() {
  // Require authentication - will redirect to /logg-inn if not authenticated
  await requireAuth('/tjenester/ny');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <Link href="/tjenester">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Tilbake til tjenester
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Opprett ny tjeneste</h1>
            <p className="mt-2 text-gray-600">
              Opprett en annonse for dine veterinær-, hovslagare- eller trenertjenester
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ServiceForm />
        </div>
      </div>

      <Footer />
    </div>
  );
}