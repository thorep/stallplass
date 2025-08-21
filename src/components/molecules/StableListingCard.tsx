"use client";

import { StableWithBoxStats } from "@/types/stable";
import { formatLocationDisplay, formatPriceRange } from "@/utils/formatting";
import { ListingCard } from "@/components/molecules/ListingCard";
import { MapPin, Star } from "lucide-react";
import React from "react";

interface StableListingCardProps {
  stable: StableWithBoxStats;
  highlightedAmenityIds?: string[];
}

function StableListingCard({ stable, highlightedAmenityIds = [] }: StableListingCardProps) {
  const statusBadge = stable.availableBoxes > 0
    ? { color: "green" as const, text: `✔ ${stable.availableBoxes} ledige` }
    : { color: "red" as const, text: "Fullt" };

  const metaItems: React.ReactNode[] = [];
  metaItems.push(
    <>
      <MapPin size={16} className="text-gray-500" />
      <span>{formatLocationDisplay(stable)}</span>
    </>
  );

  // Optional: rating info at the end if present
  if (stable.rating > 0) {
    metaItems.push(
      <>
        <Star size={16} className="text-yellow-500" />
        <span>{stable.rating.toFixed(1)} ({stable.reviewCount || 0})</span>
      </>
    );
  }

  const priceText = stable.priceRange
    ? formatPriceRange(stable.priceRange.min, stable.priceRange.max)
    : "Pris på forespørsel";

  const amenities = stable.amenities?.map((a) => a.amenity.name) || [];
  // Respect max 3 and +N via ListingCard
  const prioritized = highlightedAmenityIds.length
    ? [
        ...stable.amenities
          .filter((ar) => highlightedAmenityIds.includes(ar.amenity.id))
          .map((ar) => ar.amenity.name),
        ...stable.amenities
          .filter((ar) => !highlightedAmenityIds.includes(ar.amenity.id))
          .map((ar) => ar.amenity.name),
      ]
    : amenities;

  return (
    <ListingCard
      href={`/staller/${stable.id}`}
      title={stable.name}
      imageUrl={stable.images?.[0]}
      imageAlt={stable.imageDescriptions?.[0] || stable.name}
      imageCount={stable.images?.length || 0}
      statusBadge={statusBadge}
      meta={metaItems}
      priceText={priceText}
      priceSubText="pr måned"
      description={stable.description || null}
      chips={prioritized}
    />
  );
}

// Export with React.memo for performance optimization
export default React.memo(StableListingCard);
