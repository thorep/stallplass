"use client";

import ImageGallery from "@/components/molecules/ImageGallery";
import ShareButton from "@/components/molecules/ShareButton";
import { formatPrice } from "@/utils/formatting";
import { formatServiceAreas } from "@/utils/service-formatting";
import { ArrowLeftIcon, MapPinIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Box, Container, Flex, Button as RadixButton, Text } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PriceInline from "@/components/atoms/PriceInline";
import ContactInfoCard from "@/components/molecules/ContactInfoCard";
import DetailSectionCard from "@/components/molecules/DetailSectionCard";
import PropertiesList from "@/components/molecules/PropertiesList";
import UpdateServiceModal from "@/components/organisms/UpdateServiceModal";
import { useService } from "@/hooks/useServices";
import { useViewTracking } from "@/services/view-tracking-service";

interface ServiceDetailClientProps {
  serviceId: string;
  user: User | null;
}

export default function ServiceDetailClient({ serviceId, user }: ServiceDetailClientProps) {
  const router = useRouter();
  const { trackServiceView } = useViewTracking();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Use TanStack Query hook for fetching service data
  const { data: service, isLoading, error, refetch } = useService(serviceId);

  // Track service view when service is loaded
  useEffect(() => {
    if (service) {
      trackServiceView(service.id, user?.id);
    }
  }, [service, user?.id, trackServiceView]);

  const formatPriceRange = () => {
    if (!service) return "";

    if (service.price) {
      return formatPrice(service.price);
    }
    return "Kontakt for pris";
  };
  const formatDetailsPrice = () => {
    if (!service) return undefined;
    if (service.price) return `${formatPrice(service.price)}`;
    const fmt = (n?: number | null) =>
      typeof n === "number" ? new Intl.NumberFormat("nb-NO").format(n) : undefined;
    const min = fmt(service.priceRangeMin);
    const max = fmt(service.priceRangeMax);
    if (min && max) return `${min} – ${max} kr`;
    if (min) return `Fra ${min} kr`;
    if (max) return `Opp til ${max} kr`;
    return "Kontakt for pris";
  };

  if (isLoading) {
    return (
      <Container size="4" style={{ minHeight: "100vh", backgroundColor: "var(--gray-2)" }}>
        <Flex align="center" justify="center" style={{ height: "60vh" }}>
          <Flex direction="column" align="center" gap="3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <Text size="2" color="gray">
              Laster tjeneste...
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
            <RadixButton asChild>
              <Link href="/tjenester">Tilbake til tjenester</Link>
            </RadixButton>
          </Flex>
        </Flex>
      </Container>
    );
  }

  if (!service) {
    return (
      <Container size="4" style={{ minHeight: "100vh", backgroundColor: "var(--gray-2)" }}>
        <Flex align="center" justify="center" style={{ height: "60vh" }}>
          <Flex direction="column" align="center" gap="4">
            <Text size="5" color="gray" weight="medium">
              Tjenesten ble ikke funnet
            </Text>
            <RadixButton asChild>
              <Link href="/tjenester">Tilbake til tjenester</Link>
            </RadixButton>
          </Flex>
        </Flex>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Link */}
      {/* <Box style={{ backgroundColor: "white", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)" }}>
          <Container size="4" px="4" py="4">
            <Link href="/tjenester" style={{ textDecoration: "none" }}>
              <Flex align="center" gap="1" style={{ color: "var(--accent-9)", cursor: "pointer" }}>
                <ArrowLeftIcon className="h-4 w-4" />
                <Text size="2">Tilbake til tjenester</Text>
              </Flex>
            </Link>
          </Container>
        </Box> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            {service.images && service.images.length > 0 && (
              <ImageGallery
                images={service.images}
                imageDescriptions={service.imageDescriptions}
                alt={service.title}
              />
            )}

            <DetailSectionCard
              header={
                <div className="flex justify-between items-start w-full">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        {service.displayName || ""}
                      </span>
                    </div>
                    <h1 className="text-h4 font-bold text-gray-900 mb-0">{service.title}</h1>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <PriceInline
                      value={service.price ?? undefined}
                      range={{
                        min: service.priceRangeMin ?? undefined,
                        max: service.priceRangeMax ?? undefined,
                      }}
                      cadence="once"
                      mode={
                        !service.price && !service.priceRangeMin && !service.priceRangeMax
                          ? "request"
                          : undefined
                      }
                    />
                    <ShareButton
                      title={`${service.title} - Stallplass`}
                      description={
                        service.description || `${service.displayName || ""} tilgjengelig`
                      }
                    />
                  </div>
                </div>
              }
            >
              {/* Description */}
              {service.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Beskrivelse</h2>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {service.description}
                  </p>
                </div>
              )}

              {/* Service Areas */}
              {service.areas.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Dekningsområde</h2>
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span className="text-gray-700">{formatServiceAreas(service.areas)}</span>
                  </div>
                </div>
              )}

              {/* Details grid */}
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Detaljer</h2>
                <PropertiesList
                  items={[
                    { label: "Type", value: service.displayName || service.serviceType },
                    { label: "Pris", value: formatDetailsPrice() },
                  ]}
                  columns={2}
                />
              </div>
            </DetailSectionCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Edit button for owner */}
            {user && service.userId === user.id && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                >
                  <PencilIcon className="h-4 w-4" />
                  Rediger tjeneste
                </button>
              </div>
            )}

            {/* Contact Information Card */}
            <ContactInfoCard
              entityType="service"
              entityId={service.id}
              entityName={service.title}
              entityOwnerId={service.userId}
              contactName={service.contactName}
              contactEmail={service.contactEmail}
              contactPhone={service.contactPhone}
              ownerNickname={service.profile?.nickname}
              address={service.address}
              postalCode={service.postalCode}
              postalPlace={service.postalPlace}
              county={undefined}
              latitude={service.latitude}
              longitude={service.longitude}
              showMap={true}
              showOwner={true}
              className="sticky top-4"
            />
          </div>
        </div>
      </div>
      {/* Edit Modal */}
      {service && user && service.userId === user.id && (
        <UpdateServiceModal
          service={service}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSave={() => {
            refetch(); // Refresh service data after save
          }}
        />
      )}
    </div>
  );
}
