"use client";

import { ListingCard } from "@/components/molecules/ListingCard";
import type { HorseSale } from "@/hooks/useHorseSales";
import { formatLocationDisplay, formatPrice } from "@/utils/formatting";
import { MapPin, Tag } from "lucide-react";
import Link from "next/link";

interface HorseSaleCardProps {
  horseSale: HorseSale;
}

export default function HorseSaleCard({ horseSale }: HorseSaleCardProps) {
  const location = formatLocationDisplay({
    postalPlace: horseSale.postalPlace,
    municipalities: horseSale.municipalities || null,
    counties: horseSale.counties || null,
  });

  const formatGender = (gender: string) => {
    switch (gender) {
      case "HOPPE":
        return "Hoppe";
      case "HINGST":
        return "Hingst";
      case "VALLACH":
        return "Vallach";
      default:
        return gender;
    }
  };

  const formatSize = (size: string) => {
    switch (size) {
      case "KATEGORI_4":
        return "Kategori 4";
      case "KATEGORI_3":
        return "Kategori 3";
      case "KATEGORI_2":
        return "Kategori 2";
      case "KATEGORI_1":
        return "Kategori 1";
      case "UNDER_160":
        return "Under 160cm";
      case "SIZE_160_170":
        return "160-170cm";
      case "OVER_170":
        return "Over 170cm";
      default:
        return size;
    }
  };

  const metaItems: React.ReactNode[] = [
    <>
      <Tag size={16} className="text-gray-500" />
      <span>{horseSale.age} år • {formatGender(horseSale.gender)} • {horseSale.breed.name}{horseSale.height ? ` • ${horseSale.height}cm` : ""}</span>
    </>,
    <>
      <MapPin size={16} className="text-gray-500" />
      <span>{location}</span>
    </>,
  ];

  // "Ny" badge if created < 7 days
  const isNew = (() => {
    try {
      const created = new Date(horseSale.createdAt);
      const diff = Date.now() - created.getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  })();

  return (
    <ListingCard
      href={`/hest/${horseSale.id}`}
      title={horseSale.name}
      imageUrl={horseSale.images?.[0]}
      imageAlt={horseSale.name}
      imageCount={horseSale.images?.length || 0}
      statusBadge={isNew ? { color: "primary", text: "Ny" } : undefined}
      meta={metaItems}
      priceText={formatPrice(horseSale.price)}
      description={horseSale.description || null}
      chips={horseSale.discipline ? [horseSale.discipline.name] : []}
      titleClamp={2}
      descriptionClamp={2}
    />
  );
}
