"use client";

import ListingCardBase from "@/components/listings/ListingCardBase";
import type { HorseSale } from "@/hooks/useHorseSales";
import { formatLocationDisplay } from "@/utils/formatting";
import { MapPin, Tag } from "lucide-react";

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

  // removed unused formatSize helper

  const metaItems: { icon: React.ReactNode; label: string }[] = [
    { icon: <Tag size={16} className="text-gray-500" />, label: `${horseSale.age} år • ${formatGender(horseSale.gender)} • ${horseSale.breed.name}${horseSale.height ? ` • ${horseSale.height}cm` : ""}` },
    { icon: <MapPin size={16} className="text-gray-500" />, label: location },
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
    <ListingCardBase
      href={`/hest/${horseSale.id}`}
      title={horseSale.name}
      image={{ src: horseSale.images?.[0] || "", alt: horseSale.name, count: horseSale.images?.length || 0 }}
      isNew={isNew}
      meta={metaItems}
      price={{ value: new Intl.NumberFormat("nb-NO").format(horseSale.price) }}
      description={horseSale.description || undefined}
      badgesBottom={horseSale.discipline ? [horseSale.discipline.name] : []}
    />
  );
}
