"use client";

import { useState } from "react";
import { StableWithBoxStats } from "@/types/stable";
import { ClockIcon, EyeIcon, MapPinIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import StableEditModal from "@/components/organisms/StableEditModal";

interface StableOverviewCardProps {
  stable: StableWithBoxStats;
  onDelete: () => void;
  deleteLoading: boolean;
  userId: string;
}

export default function StableOverviewCard({
  stable,
  onDelete,
  deleteLoading,
  userId,
}: StableOverviewCardProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const getAdvertisingStatus = (): {
    status: "active" | "expiring" | "expired";
    daysLeft: number;
  } | null => {
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
    <div className="px-4 py-6 sm:px-6 border-b border-slate-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{stable.name}</h3>
          <div className="flex items-center text-slate-600 mb-1.5">
            <MapPinIcon className="hidden sm:block h-4 w-4 mr-1" />
            <span className="text-sm">
              {stable.address && stable.postalPlace
                ? `${stable.address}, ${stable.postalPlace.toUpperCase()}`
                : stable.address || stable.postalPlace}
            </span>
          </div>

          {/* Debug info - only show when location data is missing */}
          {(!stable.counties?.name || !stable.municipalities?.name) && (
            <div
              className="text-sm text-slate-600 mb-2 bg-yellow-50 p-2 rounded border border-yellow-200"
              data-cy="missing-location-warning"
            >
              <span className="font-medium">⚠️ Manglende stedsdata:</span>
              <div className="mt-1">
                <span className="font-medium">Fylke:</span> {stable.counties?.name || "Ikke satt"} |
                <span className="font-medium ml-2">Kommune:</span>{" "}
                {stable.municipalities?.name || "Ikke satt"}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                ID: {stable.countyId || "null"} / {stable.municipalityId || "null"}
              </div>
            </div>
          )}
          <p className="text-slate-600 text-sm line-clamp-2 mb-1">{stable.description}</p>

          {/* Stable Amenities */}
          {stable.amenities && stable.amenities.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Stall-fasiliteter:</h4>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {stable.amenities.slice(0, 6).map((amenityLink) => (
                  <span
                    key={amenityLink.amenity.id}
                    className="inline-block px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium whitespace-nowrap"
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
            <div
              className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                advertisingStatus.status === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : advertisingStatus.status === "expiring"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <ClockIcon className="h-4 w-4" />
              {advertisingStatus.status === "expired"
                ? "Annonsering utløpt"
                : `${advertisingStatus.daysLeft} dager igjen av annonseringsperioden`}
            </div>
          )}
        </div>

        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => router.push(`/sok/${stable.id}`)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Forhåndsvis stall"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            title="Rediger stall"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            disabled={deleteLoading}
            title="Slett stall"
            data-cy={`delete-stable-${stable.id}`}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <StableEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        stableId={stable.id}
        userId={userId}
      />
    </div>
  );
}
