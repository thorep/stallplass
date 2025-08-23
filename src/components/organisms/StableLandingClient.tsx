"use client";

import PriceInline from "@/components/atoms/PriceInline";
import ChipsList from "@/components/molecules/ChipsList";
import ContactInfoCard from "@/components/molecules/ContactInfoCard";
import DetailSectionCard from "@/components/molecules/DetailSectionCard";
import FAQDisplay from "@/components/molecules/FAQDisplay";
import ImageGallery from "@/components/molecules/ImageGallery";
import PropertiesList from "@/components/molecules/PropertiesList";
import ShareButton from "@/components/molecules/ShareButton";
import StableBoxCard from "@/components/molecules/StableBoxCard";
import StableServicesSection from "@/components/molecules/StableServicesSection";
import { Button as AtomButton } from "@/components/ui/button";
import { useCreateConversation } from "@/hooks/useChat";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useViewTracking } from "@/services/view-tracking-service";
import { BoxWithAmenities, StableWithAmenities } from "@/types/stable";
import { formatPrice } from "@/utils/formatting";
import {
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  ShareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface StableLandingClientProps {
  stable: StableWithAmenities;
}

export default function StableLandingClient({ stable }: StableLandingClientProps) {
  const { user } = useSupabaseUser();
  const router = useRouter();

  // View tracking
  const { trackStableView, trackBoxView } = useViewTracking();
  const createConversation = useCreateConversation();

  // Track stable view on component mount
  useEffect(() => {
    trackStableView(stable.id, user?.id);
  }, [stable.id, user?.id, trackStableView]);

  // Fetch reviews for this stable (none here)

  const handleBoxClick = (boxId: string) => {
    // Track box view
    trackBoxView(boxId, user?.id);

    // Navigate to box detail page
    router.push(`/bokser/${boxId}`);
  };

  // All boxes are now publicly available
  const boxesWithAdvertising = stable.boxes || [];

  // Separate into available and rented boxes
  const availableBoxes = boxesWithAdvertising.filter((box) =>
    "availableQuantity" in box ? (box.availableQuantity as number) > 0 : false
  );
  const rentedBoxes = boxesWithAdvertising.filter((box) =>
    "availableQuantity" in box ? (box.availableQuantity as number) === 0 : true
  );

  // Calculate total available spots
  const totalAvailableSpots = availableBoxes.reduce(
    (total, box) =>
      total + (("availableQuantity" in box ? (box.availableQuantity as number) : 0) || 0),
    0
  );

  const priceRange =
    availableBoxes.length > 0
      ? {
          min: Math.min(...availableBoxes.map((box) => box.price)),
          max: Math.max(...availableBoxes.map((box) => box.price)),
        }
      : null;

  // Check if current user is the owner of this stable
  const isOwner = !!(user && stable.ownerId === user.id);

  const handleSendMessage = async () => {
    try {
      // Create conversation and navigate to messages
      const conversation = await createConversation.mutateAsync({
        stableId: stable.id,
        boxId: null, // No specific box - general stable inquiry
      });

      // Navigate to messages page
      router.push(`/meldinger?conversation=${conversation.id}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      toast.error("Kunne ikke starte samtale. Prøv igjen.");
    }
  };

  // Stable data loaded successfully
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Link */}
      {/* <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/sok" className="text-gray-700 hover:text-gray-900 flex items-center">
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Tilbake
            </Link>
          </div>
        </div>
      </div> */}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            {stable.images && stable.images.length > 0 && (
              <ImageGallery
                images={stable.images}
                imageDescriptions={stable.imageDescriptions}
                alt={stable.name}
              />
            )}

            {/* Basic Info */}
            <DetailSectionCard
              header={
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h1 className="text-h4 text-gray-900 font-bold">{stable.name}</h1>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    {priceRange && (
                      <PriceInline
                        range={{ min: priceRange.min, max: priceRange.max }}
                        cadence="perMonth"
                      />
                    )}
                    <ShareButton
                      title={`${stable.name} - Stallplass`}
                      description={
                        stable.description ||
                        `Stall i ${stable.postalPlace || stable.address || ""}`
                      }
                    />
                  </div>
                </div>
              }
            >
              <p className="text-body-sm text-gray-700 leading-relaxed">{stable.description}</p>

              {/* Stable Details grid */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Detaljer</h2>
                <PropertiesList
                  items={[
                    priceRange
                      ? {
                          label: "Pris",
                          value: `${formatPrice(priceRange.min)} – ${formatPrice(
                            priceRange.max
                          )} kr/mnd`,
                        }
                      : null,
                    { label: "Ledig kapasitet", value: `${totalAvailableSpots}` },
                    {
                      label: "Lokasjon",
                      value:
                        [stable.postalPlace, stable.counties?.name].filter(Boolean).join(", ") ||
                        stable.address,
                    },
                  ]}
                  columns={3}
                />
              </div>
            </DetailSectionCard>

            {/* Amenities */}
            {stable.amenities && stable.amenities.length > 0 && (
              <DetailSectionCard>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Fasiliteter</h2>
                <ChipsList items={stable.amenities.map((a) => a.amenity.name)} maxVisible={3} />
              </DetailSectionCard>
            )}

            {/* Owner Warning - Boxes Not Visible */}
            {isOwner &&
              stable.boxes &&
              stable.boxes.length > 0 &&
              boxesWithAdvertising.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 md:p-8">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-h4 text-amber-800 mb-2">
                        Dine bokser er ikke synlige for andre brukere
                      </h3>
                      <p className="text-amber-700 text-body-sm mb-4">
                        Boksene dine vises ikke i søkeresultater fordi annonsering ikke er aktiv.
                        Andre brukere kan ikke se eller kontakte deg om ledige bokser.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <AtomButton
                          variant="default"
                          className="bg-amber-600 hover:bg-amber-700 border-amber-600 hover:border-amber-700"
                          onClick={() => router.push("/dashboard")}
                        >
                          Aktiver annonsering i dashboard
                        </AtomButton>
                        <AtomButton
                          variant="outline"
                          className="border-amber-300 text-amber-800 hover:bg-amber-100"
                          onClick={() => router.push("/priser")}
                        >
                          Se priser
                        </AtomButton>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Available Boxes */}
            {availableBoxes.length > 0 && (
              <DetailSectionCard>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-h4 text-gray-900 font-bold">Tilgjengelige stallplasser</h2>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-green-500 text-white">
                    {totalAvailableSpots} ledig{totalAvailableSpots !== 1 ? "e" : ""}
                  </span>
                </div>
                <div className="space-y-6">
                  {availableBoxes.map((box) => (
                    <StableBoxCard
                      key={box.id}
                      box={box as BoxWithAmenities}
                      stableImages={stable.images}
                      stableImageDescriptions={stable.imageDescriptions}
                      onBoxClick={handleBoxClick}
                      isOwner={isOwner}
                      variant="available"
                    />
                  ))}
                </div>
              </DetailSectionCard>
            )}

            {/* Rented Boxes (with active advertising) */}
            {rentedBoxes.length > 0 && (
              <DetailSectionCard>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-h4 text-gray-900 font-bold">Utleide stallplasser</h2>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-orange-500 text-white">
                    {rentedBoxes.length} utleid
                  </span>
                </div>
                <div className="space-y-6">
                  {rentedBoxes.map((box) => (
                    <StableBoxCard
                      key={box.id}
                      box={box as BoxWithAmenities}
                      stableImages={stable.images}
                      stableImageDescriptions={stable.imageDescriptions}
                      onBoxClick={handleBoxClick}
                      isOwner={isOwner}
                      variant="rented"
                    />
                  ))}
                </div>
              </DetailSectionCard>
            )}

            {/* No Boxes Available Message */}
            {(!stable.boxes || stable.boxes.length === 0) && (
              <DetailSectionCard>
                <h2 className="text-h4 text-gray-900 mb-6 font-bold">Stallplasser</h2>
                <div className="text-center py-12">
                  <div className="text-gray-500 text-sm mb-2">
                    Ingen bokser er registrert for denne stallen ennå.
                  </div>
                  {isOwner && (
                    <div className="text-sm text-gray-400">
                      Gå til din dashboard for å legge til bokser.
                    </div>
                  )}
                </div>
              </DetailSectionCard>
            )}

            {/* No Boxes with Active Advertising Message */}
            {stable.boxes && stable.boxes.length > 0 && boxesWithAdvertising.length === 0 && (
              <DetailSectionCard>
                <h2 className="text-h4 text-gray-900 mb-6 font-bold">Stallplasser</h2>
                <div className="text-center py-12">
                  <div className="text-gray-500 text-sm mb-2">
                    Ingen bokser har aktiv annonsering for øyeblikket.
                  </div>
                  {isOwner && (
                    <div className="text-sm text-gray-400">
                      Aktiver annonsering for dine bokser i dashboard.
                    </div>
                  )}
                </div>
              </DetailSectionCard>
            )}

            {/* FAQ Section */}
            {stable.faqs && stable.faqs.length > 0 && <FAQDisplay faqs={stable.faqs} />}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Location */}
              <ContactInfoCard
                entityType="stable"
                entityId={stable.id}
                entityName={stable.name}
                entityOwnerId={stable.ownerId}
                contactName={stable.contactName}
                contactEmail={stable.contactEmail}
                contactPhone={stable.contactPhone}
                ownerNickname={stable.owner?.nickname || stable.owner?.firstname || "Ikke oppgitt"}
                address={stable.address}
                postalCode={stable.postalCode}
                postalPlace={stable.postalPlace}
                county={stable.counties?.name}
                latitude={stable.latitude}
                longitude={stable.longitude}
                showMap={true}
                showOwner={true}
              />

              {/* Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-h4 text-gray-900 mb-6">Oversikt</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Totalt bokser:</span>
                    <span className="font-bold text-sm text-gray-900">
                      {stable.boxes?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Tilgjengelige:</span>
                    <span className="font-bold text-sm text-green-600">
                      {availableBoxes.length}
                    </span>
                  </div>
                  {stable.amenities && stable.amenities.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Fasiliteter:</span>
                      <span className="font-bold text-sm text-gray-900">
                        {stable.amenities.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services in the Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StableServicesSection
          countyId={stable.countyId || ""}
          municipalityId={stable.municipalityId || undefined}
          countyName={stable.counties?.name}
          municipalityName={stable.municipalities?.name}
        />
      </div>

      {/* Image Lightbox handled by ImageGallery */}
    </div>
  );
}
