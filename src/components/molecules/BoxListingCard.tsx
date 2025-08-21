"use client";

import ListingCardBase from "@/components/listings/ListingCardBase";
import { BoxWithStablePreview } from "@/types/stable";
import { formatLocationDisplay } from "@/utils/formatting";
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
  highlightedStableAmenityIds: _highlightedStableAmenityIds = [],
}: BoxListingCardProps) {
  const availableQuantity =
    ("availableQuantity" in box ? (box.availableQuantity as number) : 0) ?? 0;
  const isAvailable = availableQuantity > 0;

  const badgesTopRight = [
    isAvailable
      ? { label: `✔ ${availableQuantity} ledige`, tone: "success" as const }
      : { label: "Fullt", tone: "danger" as const },
  ];

  const metaItems: { icon: React.ReactNode; label: string }[] = [
    { icon: <MapPin size={16} className="text-gray-500" />, label: formatLocationDisplay(box) },
    { icon: <Tag size={16} className="text-gray-500" />, label: box.boxType === "BOKS" ? "Boks" : "Utegang" },
  ];
  const price = {
    value: new Intl.NumberFormat("nb-NO").format(box.price),
    cadence: "perMonth" as const,
  };

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
    <ListingCardBase
      href={`/bokser/${box.id}`}
      title={box.name}
      image={{ src: box.images?.[0] || "", alt: box.imageDescriptions?.[0] || box.name, count: box.images?.length || 0 }}
      badgesTopRight={badgesTopRight}
      meta={metaItems}
      price={price}
      description={box.description || undefined}
      amenities={prioritized}
      className={!isAvailable ? "opacity-90" : undefined}
    />
  );
}

export default React.memo(BoxListingCard);
