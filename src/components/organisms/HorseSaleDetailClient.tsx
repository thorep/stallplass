"use client";

import ContactInfoCard from "@/components/molecules/ContactInfoCard";
import ImageGallery from "@/components/molecules/ImageGallery";
import ShareButton from "@/components/molecules/ShareButton";
import { useHorseSale } from "@/hooks/useHorseSales";
import { useViewTracking } from "@/services/view-tracking-service";
import { ArrowLeftIcon, MapPinIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Box, Container, Flex, Button as RadixButton, Text } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface HorseSaleDetailClientProps {
  horseSaleId: string;
  user: User | null;
}

export default function HorseSaleDetailClient({
  horseSaleId,
  user,
}: HorseSaleDetailClientProps) {
  const router = useRouter();
  const { trackHorseSaleView } = useViewTracking();

  // Use TanStack Query hook for fetching horse sale data
  const { data: horseSale, isLoading, error } = useHorseSale(horseSaleId);

  // Track horse sale view when horse sale is loaded
  useEffect(() => {
    if (horseSale) {
      trackHorseSaleView(horseSale.id, user?.id);
    }
  }, [horseSale, user?.id, trackHorseSaleView]);

  const formatLocation = () => {
    if (!horseSale) return "";

    const parts = [];
    if (horseSale.address) parts.push(horseSale.address);
    if (horseSale.postalCode && horseSale.postalPlace) {
      parts.push(`${horseSale.postalCode} ${horseSale.postalPlace}`);
    }
    if (horseSale.municipalities?.name) {
      parts.push(horseSale.municipalities.name);
    }
    if (horseSale.counties?.name) {
      parts.push(horseSale.counties.name);
    }
    return parts.join(", ") || "Ingen adresse oppgitt";
  };

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
            <RadixButton onClick={() => router.back()}>
              Tilbake
            </RadixButton>
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
            <RadixButton onClick={() => router.back()}>
              Tilbake
            </RadixButton>
          </Flex>
        </Flex>
      </Container>
    );
  }

  return (
    <>
      {/* Back Link */}
      <Box style={{ backgroundColor: "white", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)" }}>
        <Container size="4" px="4" py="4">
          <button 
            onClick={() => router.back()} 
            style={{ textDecoration: "none", background: "none", border: "none", padding: 0 }}
          >
            <Flex align="center" gap="1" style={{ color: "var(--accent-9)", cursor: "pointer" }}>
              <ArrowLeftIcon className="h-4 w-4" />
              <Text size="2">Tilbake</Text>
            </Flex>
          </button>
        </Container>
      </Box>

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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                      Til salgs
                    </span>
                    <span className="text-2xl font-bold text-red-600">
                      {formatPrice(horseSale.price)} kr
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">{horseSale.name}</h1>
                    <ShareButton 
                      title={`${horseSale.name} - Hest til salgs`}
                      description={horseSale.description || `${horseSale.name}, ${horseSale.age} år gammel ${horseSale.breed.name}. Pris: ${formatPrice(horseSale.price)} kr`}
                    />
                  </div>
                </div>
              </div>

              {/* Horse Details */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Hestens detaljer</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Alder:</span>
                    <p className="text-gray-900">{horseSale.age} år</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Kjønn:</span>
                    <p className="text-gray-900">{formatGender(horseSale.gender)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Rase:</span>
                    <p className="text-gray-900">{horseSale.breed.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Disiplin:</span>
                    <p className="text-gray-900">{horseSale.discipline.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Størrelse:</span>
                    <p className="text-gray-900">{formatSize(horseSale.size)}</p>
                  </div>
                  {horseSale.height && (
                    <div>
                      <span className="font-medium text-gray-500">Høyde:</span>
                      <p className="text-gray-900">{horseSale.height} cm</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {horseSale.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Beskrivelse</h2>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {horseSale.description}
                  </p>
                </div>
              )}

              {/* Location */}
              {(horseSale.address || horseSale.municipalities?.name || horseSale.counties?.name) && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Lokasjon</h2>
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span className="text-gray-700">{formatLocation()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Edit button for owner */}
            {user && horseSale.userId === user.id && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <button
                  onClick={() => {
                    // TODO: Implement edit modal for horse sales
                    console.log("Edit horse sale");
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
              ownerNickname={
                horseSale.user?.nickname || "Ukjent bruker"
              }
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
    </>
  );
}