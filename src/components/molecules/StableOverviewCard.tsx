'use client';

import { 
  MapPinIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { StableWithBoxStats } from '@/types/stable';

interface StableOverviewCardProps {
  stable: StableWithBoxStats;
  onDelete: (stable_id: string) => void;
  deleteLoading: boolean;
}

export default function StableOverviewCard({ stable, onDelete, deleteLoading }: StableOverviewCardProps) {
  const router = useRouter();

  const getAdvertisingStatus = (): { status: 'active' | 'expiring' | 'expired'; daysLeft: number } | null => {
    // Advertising functionality removed - fields not in schema
    return null;
    // const daysLeft = differenceInDays(new Date(), new Date());
    
    // if (daysLeft <= 0) {
    //   return { status: 'expired', daysLeft: 0 };
    // } else if (daysLeft <= 7) {
    //   return { status: 'expiring', daysLeft };
    // } else {
    //   return { status: 'active', daysLeft };
    // }
  };

  const advertisingStatus = getAdvertisingStatus();

  return (
    <div className="p-6 border-b border-slate-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-2">{stable.name}</h3>
          <div className="flex items-center text-slate-600 mb-2">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">
              {stable.address && stable.postalPlace ? 
                `${stable.address}, ${stable.postalPlace.toUpperCase()}` : 
                stable.address || stable.postalPlace
              }
            </span>
          </div>
          <p className="text-slate-600 text-sm line-clamp-2">{stable.description}</p>
          
          {/* Stable Amenities */}
          {stable.amenities && stable.amenities.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Stall-fasiliteter:</h4>
              <div className="flex flex-wrap gap-1">
                {stable.amenities.slice(0, 6).map((amenityLink) => (
                  <span
                    key={amenityLink.amenity.id}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium"
                  >
                    {amenityLink.amenity.name}
                  </span>
                ))}
                {stable.amenities.length > 6 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs">
                    +{stable.amenities.length - 6} flere
                  </span>
                )}
              </div>
            </div>
          )}
          
          {advertisingStatus && (
            <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              advertisingStatus.status === 'active' 
                ? 'bg-emerald-100 text-emerald-700'
                : advertisingStatus.status === 'expiring'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}>
              <ClockIcon className="h-4 w-4" />
              {advertisingStatus.status === 'expired' 
                ? 'Annonsering utløpt'
                : `${advertisingStatus.daysLeft} dager igjen av annonseringsperioden`
              }
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 ml-4">
          <button 
            onClick={() => router.push(`/stables/${stable.id}`)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Forhåndsvis stall"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button 
            onClick={() => router.push(`/dashboard/stables/${stable.id}/edit`)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            title="Rediger stall"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button 
            onClick={() => onDelete(stable.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            disabled={deleteLoading}
            title="Slett stall"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}