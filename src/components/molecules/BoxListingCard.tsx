"use client";

import { ListingCard } from "@/components/molecules/ListingCard";
import { BoxWithStablePreview } from "@/types/stable";
import { formatLocationDisplay, formatPrice } from "@/utils/formatting";
import { MapPin, Tag } from "lucide-react";
import React from "react";

interface BoxListingCardProps {
  box: BoxWithStablePreview;
  highlightedBoxAmenityIds?: string[];
  highlightedStableAmenityIds?: string[];
}

function BoxListingCard({
  box,
  highlightedBoxAmenityIds = [],
  highlightedStableAmenityIds = [],
}: BoxListingCardProps) {
  const availableQuantity =
    ("availableQuantity" in box ? (box.availableQuantity as number) : 0) ?? 0;
  const isAvailable = availableQuantity > 0;

  const statusBadge = isAvailable
    ? { color: "green" as const, text: `✔ ${availableQuantity} ledige` }
    : { color: "red" as const, text: "Fullt" };

  const metaItems: React.ReactNode[] = [
    <>
      <MapPin size={16} className="text-gray-500" />
      <span>{formatLocationDisplay(box)}</span>
    </>,
    <>
      <Tag size={16} className="text-gray-500" />
      <span>{box.boxType === "BOKS" ? "Boks" : "Utegang"}</span>
    </>,
  ];

  const priceText = formatPrice(box.price);

  const allAmenityNames = box.amenities?.map((a) => a.amenity.name) || [];
  const prioritized = highlightedBoxAmenityIds.length
    ? [
        ...box.amenities
          .filter((ar) => highlightedBoxAmenityIds.includes(ar.amenity.id))
          .map((ar) => ar.amenity.name),
        ...box.amenities
          .filter((ar) => !highlightedBoxAmenityIds.includes(ar.amenity.id))
          .map((ar) => ar.amenity.name),
      ]
    : allAmenityNames;

  return (
    <ListingCard
      href={`/bokser/${box.id}`}
      title={box.name}
      imageUrl={box.images?.[0]}
      imageAlt={box.imageDescriptions?.[0] || box.name}
      imageCount={box.images?.length || 0}
      statusBadge={statusBadge}
      meta={metaItems}
      priceText={priceText}
      priceSubText="pr måned"
      description={box.description || null}
      chips={prioritized}
      className={!isAvailable ? "opacity-90" : undefined}
    />
  );
}

export default React.memo(BoxListingCard);

