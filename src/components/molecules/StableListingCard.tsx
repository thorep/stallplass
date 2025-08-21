"use client";

import { StableWithBoxStats } from "@/types/stable";
import { formatLocationDisplay } from "@/utils/formatting";
import ListingCardBase from "@/components/listings/ListingCardBase";
import { MapPin, Star } from "lucide-react";
import React from "react";

interface StableListingCardProps {
  stable: StableWithBoxStats;
  highlightedAmenityIds?: string[];
}

function StableListingCard({ stable, highlightedAmenityIds = [] }: StableListingCardProps) {
  const badgesTopRight = [
    stable.availableBoxes > 0
      ? { label: `✔ ${stable.availableBoxes} ledige`, tone: "success" as const }
      : { label: "Fullt", tone: "danger" as const },
  ];

  const metaItems: { icon: React.ReactNode; label: string }[] = [];
  metaItems.push({ icon: <MapPin size={16} className="text-gray-500" />, label: formatLocationDisplay(stable) });
  if (stable.rating > 0) {
    metaItems.push({ icon: <Star size={16} className="text-yellow-500" />, label: `${stable.rating.toFixed(1)} (${stable.reviewCount || 0})` });
  }

  // Price range → strings (base adds "kr" and cadence)
  // Rules:
  // - Show price even if it's full (availableBoxes === 0)
  // - Hide price entirely if the stable has no boxes linked
  // - If boxes exist but price not set (>0), show "Pris på forespørsel"
  const hasBoxes = (stable.boxes?.length ?? 0) > 0;
  const hasValidPriceRange = !!stable.priceRange && stable.priceRange.min > 0;

  const price = hasBoxes
    ? (hasValidPriceRange
        ? {
            range: {
              min: new Intl.NumberFormat("nb-NO").format(stable.priceRange!.min),
              max: new Intl.NumberFormat("nb-NO").format(stable.priceRange!.max),
            },
            cadence: "perMonth" as const,
          }
        : { mode: "request" as const, cadence: "perMonth" as const })
    : undefined;

  const allAmenities = stable.amenities?.map((a) => a.amenity.name) || [];
  const prioritized = highlightedAmenityIds.length
    ? [
        ...((stable.amenities || [])
          .filter((ar) => highlightedAmenityIds.includes(ar.amenity.id))
          .map((ar) => ar.amenity.name)),
        ...((stable.amenities || [])
          .filter((ar) => !highlightedAmenityIds.includes(ar.amenity.id))
          .map((ar) => ar.amenity.name)),
      ]
    : allAmenities;

  return (
    <ListingCardBase
      href={`/staller/${stable.id}`}
      title={stable.name}
      image={{ src: stable.images?.[0] || "", alt: stable.imageDescriptions?.[0] || stable.name, count: stable.images?.length || 0 }}
      badgesTopRight={badgesTopRight}
      meta={metaItems}
      price={price}
      description={stable.description || undefined}
      amenities={prioritized}
    />
  );
}

// Export with React.memo for performance optimization
export default React.memo(StableListingCard);
