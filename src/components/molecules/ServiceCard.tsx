"use client";

import { ListingCard } from "@/components/molecules/ListingCard";
import { ServiceWithDetails } from "@/types/service";
import { formatPrice } from "@/utils/formatting";
import { formatServiceAreas } from "@/utils/service-formatting";
import { getServiceTypeLabel, normalizeServiceType } from '@/lib/service-types';
import { MapPin, User } from "lucide-react";
import React from "react";

interface ServiceCardProps {
  service: ServiceWithDetails;
  className?: string;
}

function ServiceCard({ service, className = "" }: ServiceCardProps) {
  const fmtPrice = () => {
    if (!service.priceRangeMin && !service.priceRangeMax) return "Pris på forespørsel";
    if (service.priceRangeMin && service.priceRangeMax) return `${formatPrice(service.priceRangeMin)} - ${formatPrice(service.priceRangeMax)}`;
    if (service.priceRangeMin) return `Fra ${formatPrice(service.priceRangeMin)}`;
    if (service.priceRangeMax) return `Opp til ${formatPrice(service.priceRangeMax)}`;
    return "Pris på forespørsel";
  };

  const metaItems: React.ReactNode[] = [];
  metaItems.push(
    <>
      <User size={16} className="text-gray-500" />
      <span>{service.profile.nickname}</span>
    </>
  );
  const areas = formatServiceAreas(service.areas);
  if (areas) {
    metaItems.push(
      <>
        <MapPin size={16} className="text-gray-500" />
        <span>{areas}</span>
      </>
    );
  }

  return (
    <ListingCard
      href={`/tjenester/${service.id}`}
      title={service.title}
      imageUrl={service.images?.[0]}
      imageAlt={service.title}
      imageCount={service.images?.length || 0}
      statusBadge={{ color: "primary", text: getServiceTypeLabel(normalizeServiceType(service.serviceType)) }}
      meta={metaItems}
      priceText={fmtPrice()}
      description={service.description || null}
      className={className}
    />
  );
}

// Export with React.memo for performance optimization
export default React.memo(ServiceCard);
