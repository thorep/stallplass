"use client";

import PriceInline from "@/components/atoms/PriceInline";
import ContactInfoCard from "@/components/molecules/ContactInfoCard";
import DetailSectionCard from "@/components/molecules/DetailSectionCard";
import ImageGallery from "@/components/molecules/ImageGallery";
import PropertiesList from "@/components/molecules/PropertiesList";
import ShareButton from "@/components/molecules/ShareButton";
import { useHorseSale } from "@/hooks/useHorseSales";
import { formatDate } from "@/utils/formatting";
import { useViewTracking } from "@/services/view-tracking-service";
import { PencilIcon } from "@heroicons/react/24/outline";
import { Container, Flex, Button as RadixButton, Text } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface HorseSaleDetailClientProps {
  horseSaleId: string;
  user: User | null;
}

export default function HorseSaleDetailClient({ horseSaleId, user }: HorseSaleDetailClientProps) {
  const router = useRouter();
  const { trackHorseSaleView } = useViewTracking();

  // Use TanStack Query hook for fetching horse sale data
  const { data: horseSale, isLoading, error } = useHorseSale(horseSaleId);

  // Track horse sale view when horse sale is loaded
  useEffect(() => {
    if (horseSale && user?.id !== horseSale.userId) {
      trackHorseSaleView(horseSale.id);
    }
  }, [horseSale, user?.id, trackHorseSaleView]);

  // Location is shown in ContactInfoCard; omit separate location section

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nb-NO").format(price);
  };

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

  if (isLoading) {
    return (
      <Container size="4" style={{ minHeight: "100vh", backgroundColor: "var(--gray-2)" }}>
        <Flex align="center" justify="center" style={{ height: "60vh" }}>
          <Flex direction="column" align="center" gap="3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <Text size="2" color="gray">
              Laster hest til salgs...
            </Text>
          </Flex>
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="4" style={{ minHeight: "100vh", backgroundColor: "var(--gray-2)" }}>
        <Flex align="center" justify="center" style={{ height: "60vh" }}>
          <Flex direction="column" align="center" gap="4">
            <Text size="5" color="red" weight="medium">
              {error instanceof Error ? error.message : "En feil oppstod"}
            </Text>
            <RadixButton onClick={() => router.back()}>Tilbake</RadixButton>
          </Flex>
        </Flex>
      </Container>
    );
  }

  if (!horseSale) {
    return (
      <Container size="4" style={{ minHeight: "100vh", backgroundColor: "var(--gray-2)" }}>
        <Flex align="center" justify="center" style={{ height: "60vh" }}>
          <Flex direction="column" align="center" gap="4">
            <Text size="5" color="gray" weight="medium">
              Hesten til salgs ble ikke funnet
            </Text>
            <RadixButton onClick={() => router.back()}>Tilbake</RadixButton>
          </Flex>
        </Flex>
      </Container>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          {horseSale.images && horseSale.images.length > 0 && (
            <ImageGallery
              images={horseSale.images}
              imageDescriptions={horseSale.imageDescriptions}
              alt={horseSale.name}
            />
          )}

          {/* Basic Info */}
          <DetailSectionCard
            header={
              <div className="flex justify-between items-start w-full">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                      Til salgs
                    </span>
                  </div>
                  <h1 className="text-h4 font-bold text-gray-900 mb-0">{horseSale.name}</h1>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <PriceInline value={horseSale.price} cadence="once" />
                  <ShareButton
                    title={`${horseSale.name} - Hest til salgs`}
                    description={
                      horseSale.description ||
                      `${horseSale.name}, ${horseSale.age} år gammel ${
                        horseSale.breed.name
                      }. Pris: ${formatPrice(horseSale.price)} kr`
                    }
                  />
                </div>
              </div>
            }
          >
            {/* Horse Details */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Hestens detaljer</h2>
              <PropertiesList
                items={[
                  { label: "Alder", value: `${horseSale.age} år` },
                  { label: "Kjønn", value: formatGender(horseSale.gender) },
                  { label: "Rase", value: horseSale.breed?.name },
                  { label: "Disiplin", value: horseSale.discipline?.name },
                  { label: "Størrelse", value: formatSize(horseSale.size) },
                  horseSale.height ? { label: "Høyde", value: `${horseSale.height} cm` } : null,
                ]}
              />
            </div>

            {/* Updated at */}
            {horseSale.updatedAt && (
              <div className="text-sm text-gray-500 mb-4">
                Sist oppdatert: {formatDate(horseSale.updatedAt)}
              </div>
            )}

            {/* Description */}
            {horseSale.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Beskrivelse</h2>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {horseSale.description}
                </p>
              </div>
            )}

            {/* Location removed; displayed in ContactInfoCard */}
          </DetailSectionCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Edit button for owner */}
          {user && horseSale.userId === user.id && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <button
                onClick={() => {
                  // TODO: Implement edit modal for horse sales
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilIcon className="h-4 w-4" />
                Rediger hest
              </button>
            </div>
          )}

          {/* Contact Information Card */}
          <ContactInfoCard
            entityType="horseSale"
            entityId={horseSale.id}
            entityName={horseSale.name}
            entityOwnerId={horseSale.userId}
            contactName={horseSale.contactName}
            contactEmail={horseSale.contactEmail}
            contactPhone={horseSale.contactPhone}
            ownerNickname={horseSale.profiles?.nickname || "Ukjent bruker"}
            address={horseSale.address}
            postalCode={horseSale.postalCode}
            postalPlace={horseSale.postalPlace}
            county={horseSale.counties?.name}
            latitude={horseSale.latitude}
            longitude={horseSale.longitude}
            showMap={true}
            showOwner={true}
            className="sticky top-4"
          />
        </div>
      </div>
    </div>
  );
}
