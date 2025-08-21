"use client";

import ListingCardBase from "@/components/listings/ListingCardBase";
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

  const metaItems: { icon: React.ReactNode; label: string }[] = [
    { icon: <MapPin size={16} className="text-gray-500" />, label: location },
  ];

  return (
    <ListingCardBase
      href={`/forhest/${partLoanHorse.id}`}
      title={partLoanHorse.name}
      image={{
        src: partLoanHorse.images?.[0] || "",
        alt: partLoanHorse.name,
        count: partLoanHorse.images?.length || 0,
      }}
      badgesTopRight={[{ label: "Ønsker forrytter", tone: "success" }]}
      meta={metaItems}
      showPrice={false}
      description={partLoanHorse.description || undefined}
    />
  );
}
