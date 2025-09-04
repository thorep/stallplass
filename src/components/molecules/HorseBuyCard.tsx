"use client";

import ListingCardBase from "@/components/listings/ListingCardBase";
import type { HorseBuy } from "@/hooks/useHorseBuys";
import React from "react";
import { Tag } from "lucide-react";

interface HorseBuyCardProps {
  horseBuy: HorseBuy;
}

const formatNumber = (n?: number) => (typeof n === 'number' ? new Intl.NumberFormat('nb-NO').format(n) : undefined);

export default function HorseBuyCard({ horseBuy }: HorseBuyCardProps) {
  const priceRange = [formatNumber(horseBuy.priceMin), formatNumber(horseBuy.priceMax)].filter(Boolean).join("–");
  const age = [horseBuy.ageMin, horseBuy.ageMax].filter((v) => v !== undefined).join(" - ");
  const height = [horseBuy.heightMin, horseBuy.heightMax].filter((v) => v !== undefined).join(" - ");
  const gender = horseBuy.gender
    ? horseBuy.gender === "HOPPE"
      ? "Hoppe"
      : horseBuy.gender === "HINGST"
      ? "Hingst"
      : "Vallach"
    : "Alle kjønn";

  const metaItems: { icon: React.ReactNode; label: string }[] = [
    {
      icon: <Tag size={16} className="text-gray-500" />,
      label: `${age ? `${age} år • ` : ""}${gender}${horseBuy.breed?.name ? ` • ${horseBuy.breed.name}` : ""}${height ? ` • ${height} cm` : ""}`,
    },
  ];

  return (
    <ListingCardBase
      href={`/hest-onskes-kjopt/${horseBuy.id}`}
      title={horseBuy.name}
      image={{ src: horseBuy.images?.[0] || "", alt: horseBuy.name, count: horseBuy.images?.length || 0 }}
      meta={metaItems}
      price={priceRange ? { value: priceRange } : { mode: "request" }}
      description={horseBuy.description || undefined}
      badgesBottom={horseBuy.discipline ? [horseBuy.discipline.name] : []}
      updatedAt={horseBuy.updatedAt}
    />
  );
}
