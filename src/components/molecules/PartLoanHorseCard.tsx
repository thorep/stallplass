"use client";

import { ListingCard } from "@/components/molecules/ListingCard";
import type { PartLoanHorse } from "@/hooks/usePartLoanHorses";
import { formatLocationDisplay } from "@/utils/formatting";
import { MapPin } from "lucide-react";
import React from "react";

interface PartLoanHorseCardProps {
  partLoanHorse: PartLoanHorse;
}

export default function PartLoanHorseCard({ partLoanHorse }: PartLoanHorseCardProps) {
  const location = formatLocationDisplay({
    postalPlace: partLoanHorse.postalPlace || undefined,
    municipalities: partLoanHorse.municipalities,
    counties: partLoanHorse.counties,
  });

  const metaItems: React.ReactNode[] = [
    <>
      <MapPin size={16} className="text-gray-500" />
      <span>{location}</span>
    </>,
  ];

  return (
    <ListingCard
      href={`/forhest/${partLoanHorse.id}`}
      title={partLoanHorse.name}
      imageUrl={partLoanHorse.images?.[0]}
      imageAlt={partLoanHorse.name}
      imageCount={partLoanHorse.images?.length || 0}
      statusBadge={{ color: "primary", text: "Ønsker forrytter" }}
      meta={metaItems}
      priceText={undefined}
      description={partLoanHorse.description || null}
      titleClamp={2}
      descriptionClamp={2}
    />
  );
}
