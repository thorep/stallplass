"use client";

import ContactInfoCard from "@/components/molecules/ContactInfoCard";
import DetailSectionCard from "@/components/molecules/DetailSectionCard";
import FavoriteButton from "@/components/molecules/FavoriteButton";
import ImageGallery from "@/components/molecules/ImageGallery";
import ShareButton from "@/components/molecules/ShareButton";
import PartLoanHorseModal from "@/components/organisms/PartLoanHorseModal";
import { usePartLoanHorse } from "@/hooks/usePartLoanHorses";
import { useViewTracking } from "@/services/view-tracking-service";
import { formatDate } from "@/utils/formatting";
import { PencilIcon } from "@heroicons/react/24/outline";
import { Container, Flex, Button as RadixButton, Text } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PartLoanHorseDetailClientProps {
  horseId: string;
  user: User | null;
}

export default function PartLoanHorseDetailClient({
  horseId,
  user,
}: PartLoanHorseDetailClientProps) {
  const router = useRouter();
  const { trackPartLoanHorseView } = useViewTracking();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Use TanStack Query hook for fetching part-loan horse data
  const { data: horse, isLoading, error } = usePartLoanHorse(horseId);

  // Track horse view when horse is loaded
  useEffect(() => {
    if (horse && user?.id !== horse.userId) {
      trackPartLoanHorseView(horse.id);
    }
  }, [horse, user?.id, trackPartLoanHorseView]);

  // Location is shown in ContactInfoCard; omit separate location section

  if (isLoading) {
    return (
      <Container size="4" style={{ minHeight: "100vh", backgroundColor: "var(--gray-2)" }}>
        <Flex align="center" justify="center" style={{ height: "60vh" }}>
          <Flex direction="column" align="center" gap="3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <Text size="2" color="gray">
              Laster fôrhest...
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

  if (!horse) {
    return (
      <Container size="4" style={{ minHeight: "100vh", backgroundColor: "var(--gray-2)" }}>
        <Flex align="center" justify="center" style={{ height: "60vh" }}>
          <Flex direction="column" align="center" gap="4">
            <Text size="5" color="gray" weight="medium">
              Fôrhesten ble ikke funnet
            </Text>
            <RadixButton onClick={() => router.back()}>Tilbake</RadixButton>
          </Flex>
        </Flex>
      </Container>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            {horse.images && horse.images.length > 0 && (
              <ImageGallery
                images={horse.images}
                imageDescriptions={horse.imageDescriptions}
                alt={horse.name}
              />
            )}

            {/* Basic Info */}
            <DetailSectionCard
              header={
                <div className="flex justify-between items-start w-full">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                        Fôrhest
                      </span>
                    </div>
                    <h1 className="text-h4 font-bold text-gray-900 mb-0">{horse.name}</h1>
                  </div>
                   <div className="flex gap-2">
                     <FavoriteButton
                       entityType="PART_LOAN_HORSE"
                       entityId={horse.id}
                     />
                     <ShareButton
                       title={`${horse.name} - Fôrhest`}
                       description={
                         horse.description || `Fôrhest ${horse.name} tilgjengelig for deling`
                       }
                     />
                   </div>
                </div>
              }
            >
              {/* Updated at */}
              {horse.updatedAt && (
                <div className="text-sm text-gray-500 mb-4">
                  Sist oppdatert: {formatDate(horse.updatedAt)}
                </div>
              )}

              {/* Description */}
              {horse.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Beskrivelse</h2>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {horse.description}
                  </p>
                </div>
              )}

              {/* Location removed; displayed in ContactInfoCard */}
            </DetailSectionCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Edit button for owner */}
            {user && horse.userId === user.id && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PencilIcon className="h-4 w-4" />
                  Rediger fôrhest
                </button>
              </div>
            )}

            {/* Contact Information Card */}
            <ContactInfoCard
              entityType="partLoanHorse"
              entityId={horse.id}
              entityName={horse.name}
              entityOwnerId={horse.userId}
              contactName={horse.contactName}
              contactEmail={horse.contactEmail}
              contactPhone={horse.contactPhone}
              ownerNickname={
                horse.profiles?.nickname ||
                (horse.profiles?.firstname && horse.profiles?.lastname
                  ? `${horse.profiles.firstname} ${horse.profiles.lastname}`
                  : horse.profiles?.firstname || "Ukjent bruker")
              }
              address={horse.address}
              postalCode={horse.postalCode}
              postalPlace={horse.postalPlace}
              county={horse.counties?.name}
              latitude={horse.latitude}
              longitude={horse.longitude}
              showMap={true}
              showOwner={true}
              className="sticky top-4"
            />
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {horse && user && horse.userId === user.id && (
        <PartLoanHorseModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
          partLoanHorse={horse}
          mode="edit"
        />
      )}
    </>
  );
}
