"use client";

import type { HorseBuy } from "@/hooks/useHorseBuys";
import Link from "next/link";
import { Box, Container, Flex, Text } from "@radix-ui/themes";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { useViewTracking } from "@/services/view-tracking-service";
import ImageGallery from "@/components/molecules/ImageGallery";
import ContactInfoCard from "@/components/molecules/ContactInfoCard";
import DetailSectionCard from "@/components/molecules/DetailSectionCard";
import PropertiesList from "@/components/molecules/PropertiesList";
import ShareButton from "@/components/molecules/ShareButton";
import PriceInline from "@/components/atoms/PriceInline";
import { formatDate } from "@/utils/formatting";

import type { User } from "@supabase/supabase-js";

interface Props { horseBuy: HorseBuy; user: User | null }

export default function HorseBuyDetailClient({ horseBuy, user }: Props) {
  const fmt = (n?: number) => (typeof n === 'number' ? new Intl.NumberFormat('nb-NO').format(n) : undefined);
  const price = [fmt(horseBuy.priceMin), fmt(horseBuy.priceMax)].filter(Boolean).join(' - ');
  const age = [horseBuy.ageMin, horseBuy.ageMax].filter(v => v !== undefined).join(' - ');
  const height = [horseBuy.heightMin, horseBuy.heightMax].filter(v => v !== undefined).join(' - ');
  const gender = horseBuy.gender ? (horseBuy.gender === 'HOPPE' ? 'Hoppe' : horseBuy.gender === 'HINGST' ? 'Hingst' : 'Vallach') : 'Alle kjønn';
  const { trackHorseBuyView } = useViewTracking();
  useEffect(() => {
    if (horseBuy?.id && user?.id !== horseBuy.userId) trackHorseBuyView(horseBuy.id);
  }, [horseBuy?.id, user?.id, horseBuy?.userId, trackHorseBuyView]);

  return (
    <div className="bg-gray-50">
      {/* Back Link bar */}
      <Box style={{ backgroundColor: "white", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)" }}>
        <Container size="4" px="4" py="4">
          <Link href="/sok?mode=horse_sales&horseTrade=buy" style={{ textDecoration: "none" }}>
            <Flex align="center" gap="1" style={{ color: "var(--accent-9)", cursor: "pointer" }}>
              <ArrowLeftIcon className="h-4 w-4" />
              <Text size="2">Tilbake</Text>
            </Flex>
          </Link>
        </Container>
      </Box>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {horseBuy.images?.length ? (
              <ImageGallery images={horseBuy.images} imageDescriptions={horseBuy.imageDescriptions} alt={horseBuy.name} />
            ) : null}

            {/* Header + Details */}
            <DetailSectionCard
              header={
                <div className="flex items-start justify-between w-full">
                  <h1 className="text-h4 font-bold text-gray-900">{horseBuy.name}</h1>
                  <div className="flex flex-col items-end gap-3">
                    {(horseBuy.priceMin || horseBuy.priceMax) && (
                      <PriceInline range={{ min: horseBuy.priceMin ?? undefined, max: horseBuy.priceMax ?? undefined }} cadence="once" />
                    )}
                    <ShareButton 
                      title={`${horseBuy.name} - Ønskes kjøpt`}
                      description={horseBuy.description || `Ønskes kjøpt: ${gender}, ${age || 'alder'}, ${height ? height + ' cm' : 'høyde'}, ${horseBuy.breed?.name || 'rase'}`}
                    />
                  </div>
                </div>
              }
            >
              <PropertiesList
                items={[
                  { label: "Ønsket pris", value: price ? `${price} kr` : undefined },
                  { label: "Ønsket alder", value: age || undefined },
                  { label: "Ønsket kjønn", value: gender },
                  { label: "Mankehøyde", value: height ? `${height} cm` : undefined },
                  { label: "Rase", value: horseBuy.breed?.name || 'Alle' },
                  { label: "Gren", value: horseBuy.discipline?.name || 'Alle' },
                ]}
              />

              {/* Updated at */}
              {horseBuy.updatedAt && (
                <div className="text-sm text-gray-500 mt-2">
                  Sist oppdatert: {formatDate(horseBuy.updatedAt)}
                </div>
              )}

              {horseBuy.description && (
                <p className="text-gray-700 mt-4 leading-relaxed">{horseBuy.description}</p>
              )}
            </DetailSectionCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ContactInfoCard
              entityType="horseBuy"
              entityId={horseBuy.id}
              entityName={horseBuy.name}
              entityOwnerId={horseBuy.userId}
              contactName={horseBuy.contactName}
              contactEmail={horseBuy.contactEmail}
              contactPhone={horseBuy.contactPhone}
              ownerNickname={horseBuy.profiles?.nickname}
              showMap={false}
              showOwner={true}
              className="sticky top-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
 
