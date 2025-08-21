"use client";

import { ListingCard } from "@/components/molecules/ListingCard";
import type { HorseBuy } from "@/hooks/useHorseBuys";
import React from "react";
import { Tag } from "lucide-react";

interface HorseBuyCardProps {
  horseBuy: HorseBuy;
}

const formatNumber = (n?: number) => (typeof n === 'number' ? new Intl.NumberFormat('nb-NO').format(n) : undefined);

export default function HorseBuyCard({ horseBuy }: HorseBuyCardProps) {
  const priceRange = [formatNumber(horseBuy.priceMin), formatNumber(horseBuy.priceMax)].filter(Boolean).join(" - ");
  const age = [horseBuy.ageMin, horseBuy.ageMax].filter((v) => v !== undefined).join(" - ");
  const height = [horseBuy.heightMin, horseBuy.heightMax].filter((v) => v !== undefined).join(" - ");
  const gender = horseBuy.gender
    ? horseBuy.gender === "HOPPE"
      ? "Hoppe"
      : horseBuy.gender === "HINGST"
      ? "Hingst"
      : "Vallach"
    : "Alle kjønn";

  const metaItems: React.ReactNode[] = [
    <>
      <Tag size={16} className="text-gray-500" />
      <span>
        {age && `${age} år`} {age && "•"} {gender}
        {horseBuy.breed?.name ? ` • ${horseBuy.breed.name}` : ""}
        {height ? ` • ${height} cm` : ""}
      </span>
    </>,
  ];

  return (
    <ListingCard
      href={`/hest-onskes-kjopt/${horseBuy.id}`}
      title={horseBuy.name}
      imageUrl={horseBuy.images?.[0]}
      imageAlt={horseBuy.name}
      imageCount={horseBuy.images?.length || 0}
      statusBadge={undefined}
      meta={metaItems}
      priceText={priceRange ? `${priceRange} kr` : "Pris på forespørsel"}
      description={horseBuy.description || null}
      chips={horseBuy.discipline ? [horseBuy.discipline.name] : []}
      titleClamp={2}
      descriptionClamp={2}
    />
  );
}
