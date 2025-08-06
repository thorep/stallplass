'use client';

import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  BuildingOfficeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface UserOnboardingProps {
  onComplete: (userType: 'rider' | 'owner') => void;
}

export default function UserOnboarding({ onComplete }: UserOnboardingProps) {
  const router = useRouter();

  const handleSelection = (type: 'rider' | 'owner') => {
    onComplete(type);
    
    // Redirect based on selection
    if (type === 'owner') {
      router.push('/dashboard?tab=stables');
    } else {
      router.push('/stables');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Velkommen til Stallplass!
          </h1>
          <p className="text-lg text-gray-600">
            Hva ønsker du å gjøre?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Browse Stables */}
          <div
            onClick={() => handleSelection('rider')}
            className="group cursor-pointer bg-white rounded-lg p-8 shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-300 transition-all duration-300"
          >
            <div className="text-center">
              <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <MagnifyingGlassIcon className="h-8 w-8 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Jeg leter etter stallplass
              </h3>
              
              <p className="text-gray-600 mb-6">
                Finn den perfekte stallplassen for hesten din. Bla gjennom tilgjengelige stables og bokser.
              </p>
              
              <div className="flex items-center justify-center text-indigo-600 font-medium group-hover:text-indigo-700">
                <span>Finn stallplass</span>
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Own Stables */}
          <div
            onClick={() => handleSelection('owner')}
            className="group cursor-pointer bg-white rounded-lg p-8 shadow-sm border border-gray-200 hover:shadow-lg hover:border-emerald-300 transition-all duration-300"
          >
            <div className="text-center">
              <div className="h-16 w-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <BuildingOfficeIcon className="h-8 w-8 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Jeg har stall å tilby
              </h3>
              
              <p className="text-gray-600 mb-6">
                Registrer din stall og start å tjene penger ved å tilby boxes til hesteeiere.
              </p>
              
              <div className="flex items-center justify-center text-emerald-600 font-medium group-hover:text-emerald-700">
                <span>Registrer stall</span>
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Du kan alltid endre dette senere i innstillingene dine.
          </p>
        </div>
      </div>
    </div>
  );
}