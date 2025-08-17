"use client";

import "@radix-ui/themes/styles.css";
import { formatPrice } from "@/utils/formatting";
import { formatServiceAreas } from "@/utils/service-formatting";
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import ImageGallery from "@/components/molecules/ImageGallery";
import ShareButton from "@/components/molecules/ShareButton";
import {
  Box,
  Container,
  Flex,
  Button as RadixButton,
  Text,
} from "@radix-ui/themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import UpdateServiceModal from "@/components/organisms/UpdateServiceModal";
import { useCreateConversation } from "@/hooks/useChat";
import { useService } from "@/hooks/useServices";
import { getServiceTypeLabel, normalizeServiceType } from "@/lib/service-types";
import { useViewTracking } from "@/services/view-tracking-service";

interface ServiceDetailClientProps {
  serviceId: string;
  user: User | null;
}

export default function ServiceDetailClient({ serviceId, user }: ServiceDetailClientProps) {
  const router = useRouter();
  const { trackServiceView } = useViewTracking();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const createConversation = useCreateConversation();

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

  if (isLoading) {
    return (
      <>
        <Header />
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
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
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
        <Footer />
      </>
    );
  }

  if (!service) {
    return (
      <>
        <Header />
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
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Back Link */}
        <Box style={{ backgroundColor: "white", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)" }}>
          <Container size="4" px="4" py="4">
            <Link href="/tjenester" style={{ textDecoration: "none" }}>
              <Flex align="center" gap="1" style={{ color: "var(--accent-9)", cursor: "pointer" }}>
                <ArrowLeftIcon className="h-4 w-4" />
                <Text size="2">Tilbake til tjenester</Text>
              </Flex>
            </Link>
          </Container>
        </Box>

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

              {/* Basic Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        {getServiceTypeLabel(normalizeServiceType(service.serviceType))}
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <h1 className="text-3xl font-bold text-gray-900 mb-3">{service.title}</h1>
                      <ShareButton 
                        title={`${service.title} - Stallplass`}
                        description={service.description || `${getServiceTypeLabel(normalizeServiceType(service.serviceType))} tilgjengelig`}
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                {service.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Beskrivelse</h2>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                )}

                {/* Service Areas */}
                {service.areas.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Dekningsområde</h2>
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-400" />
                      <span className="text-gray-700">
                        {formatServiceAreas(service.areas)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
                {/* Price */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Pris
                  </h3>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPriceRange()}
                  </div>
                </div>

                {/* Service Provider */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Tjenesteleverandør
                    </h3>
                    {user && service.userId === user.id && (
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Rediger
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {service.contactName?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {service.contactName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {service.serviceType}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="space-y-3">
                  {user && service.userId !== user.id && (
                    <button
                      onClick={() => {
                        if (!user) {
                          router.push("/logg-inn");
                          return;
                        }
                        createConversation.mutate(
                          {
                            serviceId: service.id,
                            initialMessage: `Hei! Jeg er interessert i tjenesten "${service.title}" og vil gjerne vite mer.`,
                          },
                          {
                            onSuccess: () => {
                              router.push("/meldinger");
                            },
                          }
                        );
                      }}
                      disabled={createConversation.isPending}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      {createConversation.isPending ? "Starter samtale..." : "Send melding"}
                    </button>
                  )}
                  {service.contactEmail && (
                    <button
                      onClick={() =>
                        window.open(
                          `mailto:${service.contactEmail}?subject=Angående ${service.title}`,
                          "_blank"
                        )
                      }
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                      Send e-post
                    </button>
                  )}

                  {service.contactPhone && (
                    <button
                      onClick={() => window.open(`tel:${service.contactPhone}`, "_blank")}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PhoneIcon className="h-4 w-4" />
                      Ring {service.contactPhone}
                    </button>
                  )}

                  {!service.contactEmail && !service.contactPhone && (
                    <div className="py-4 text-center">
                      <p className="text-sm text-gray-500">
                        Ingen kontaktinformasjon tilgjengelig
                      </p>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                {(service.contactEmail || service.contactPhone) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-2">
                      {service.contactEmail && (
                        <div className="flex items-center gap-2">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {service.contactEmail}
                          </span>
                        </div>
                      )}
                      {service.contactPhone && (
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {service.contactPhone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

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
    </>
  );
}