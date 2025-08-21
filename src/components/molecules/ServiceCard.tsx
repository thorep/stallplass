"use client";

import ListingCardBase from "@/components/listings/ListingCardBase";
import { ServiceWithDetails } from "@/types/service";
import { formatServiceAreas } from "@/utils/service-formatting";
import { MapPin, User } from "lucide-react";
import React from "react";

interface ServiceCardProps {
  service: ServiceWithDetails;
  className?: string;
}

function ServiceCard({ service, className = "" }: ServiceCardProps) {
  const price = (() => {
    const fmt = (n?: number | null) =>
      typeof n === "number" ? new Intl.NumberFormat("nb-NO").format(n) : undefined;
    const min = fmt(service.priceRangeMin);
    const max = fmt(service.priceRangeMax);
    if (!min && !max) return { mode: "request" as const };
    if (min && max) return { range: { min, max } } as const;
    if (min) return { value: min } as const; // "Fra"/"Opp til" variations are simplified to a value
    if (max) return { value: max } as const;
    return { mode: "request" as const };
  })();

  const metaItems: { icon: React.ReactNode; label: string }[] = [];
  metaItems.push({
    icon: <User size={16} className="text-gray-500" />,
    label: service.profile.nickname,
  });
  const areas = formatServiceAreas(service.areas);
  if (areas) {
    metaItems.push({ icon: <MapPin size={16} className="text-gray-500" />, label: areas });
  }
  console.log(service);
  return (
    <ListingCardBase
      href={`/tjenester/${service.id}`}
      title={service.title}
      image={{
        src: service.images?.[0] || "",
        alt: service.title,
        count: service.images?.length || 0,
      }}
      badgesTopRight={[{ label: service.displayName || "", tone: "success" }]}
      meta={metaItems}
      price={price}
      description={service.description || undefined}
      className={className}
    />
  );
}

// Export with React.memo for performance optimization
export default React.memo(ServiceCard);
