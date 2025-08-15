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
  PhotoIcon,
} from "@heroicons/react/24/outline";
import {
  Avatar,
  Badge,
  Box,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Button as RadixButton,
  Text,
} from "@radix-ui/themes";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import UpdateServiceModal from "@/components/organisms/UpdateServiceModal";
import { useCreateConversation } from "@/hooks/useChat";
import { useService } from "@/hooks/useServices";
import { getServiceTypeLabel, normalizeServiceType } from "@/lib/service-types";
import { useAuth } from "@/lib/supabase-auth-context";
import { useViewTracking } from "@/services/view-tracking-service";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { trackServiceView } = useViewTracking();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const createConversation = useCreateConversation();

  // Use TanStack Query hook for fetching service data
  const { data: service, isLoading, error, refetch } = useService(params.id as string);

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
  console.log(service);
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

        <Container size="4" px="4" py="8">
          <Grid columns={{ initial: "1", lg: "3" }} gap="8">
            {/* Main Content */}
            <Box gridColumn={{ lg: "span 2" }}>
              {/* Photos */}
              {service.images && service.images.length > 0 ? (
                <Box mb="6">
                  <Grid columns={{ initial: "1", md: "2" }} gap="4">
                    {service.images.slice(0, 4).map((imageUrl: string, index: number) => (
                      <Box
                        key={`image-${service.id}-${index}`}
                        gridColumn={{ md: index === 0 ? "span 2" : "span 1" }}
                      >
                        <Image
                          src={imageUrl}
                          alt={`${service.title} bilde ${index + 1}`}
                          width={400}
                          height={300}
                          style={{
                            borderRadius: "var(--radius-3)",
                            objectFit: "cover",
                            width: "100%",
                            height: index === 0 ? "320px" : "192px",
                          }}
                        />
                      </Box>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Box
                  mb="6"
                  style={{
                    height: "256px",
                    backgroundColor: "var(--gray-3)",
                    borderRadius: "var(--radius-3)",
                  }}
                >
                  <Flex align="center" justify="center" style={{ height: "100%" }}>
                    <Flex direction="column" align="center" gap="2">
                      <PhotoIcon className="h-16 w-16 text-gray-400" />
                      <Text size="2" color="gray">
                        Ingen bilder tilgjengelig
                      </Text>
                    </Flex>
                  </Flex>
                </Box>
              )}

              {/* Title and Type */}
              <Box mb="6">
                <Flex align="center" gap="3" mb="3">
                  <Badge variant="soft" color="gray">
                    {getServiceTypeLabel(normalizeServiceType(service.serviceType))}
                  </Badge>
                </Flex>
                <Heading as="h1" size="4" weight="bold" mb="2">
                  {service.title}
                </Heading>
              </Box>

              {/* Description */}
              <Box mb="8">
                <Heading as="h2" size="4" weight="medium" mb="3">
                  Beskrivelse
                </Heading>
                <Text
                  as="p"
                  size="2"
                  color="gray"
                  style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}
                >
                  {service.description}
                </Text>
              </Box>

              {/* Service Areas */}
              {service.areas.length > 0 && (
                <Box mb="8">
                  <Heading as="h2" size="4" weight="medium" mb="3">
                    Dekningsområde
                  </Heading>
                  <Flex align="start" gap="2">
                    <MapPinIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <Text as="span" size="2" color="gray">
                      {formatServiceAreas(service.areas)}
                    </Text>
                  </Flex>
                </Box>
              )}
            </Box>

            {/* Sidebar */}
            <Box>
              <Card size="3" style={{ position: "sticky", top: "2rem" }}>
                {/* Price */}
                <Box mb="6">
                  <Heading as="h3" size="3" weight="medium" mb="2">
                    Pris
                  </Heading>
                  <Text as="div" size="4" weight="bold">
                    {formatPriceRange()}
                  </Text>
                </Box>

                {/* Service Provider */}
                <Box mb="6" pb="6" style={{ borderBottom: "1px solid var(--gray-6)" }}>
                  <Flex align="center" justify="between" mb="3">
                    <Heading as="h3" size="3" weight="medium">
                      Tjenesteleverandør
                    </Heading>
                    {user && service.userId === user.id && (
                      <RadixButton
                        variant="outline"
                        size="2"
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        <PencilIcon className="h-4 w-4" />
                        Rediger
                      </RadixButton>
                    )}
                  </Flex>
                  <Flex align="center" gap="3" mb="3">
                    <Avatar fallback={service.contactName?.charAt(0) || "U"} size="2" />
                    <Box>
                      <Text as="p" size="2" weight="medium">
                        {service.contactName}
                      </Text>
                      <Text as="p" size="1" color="gray">
                        {service.serviceType}
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                {/* Contact Actions */}
                <Flex direction="column" gap="3">
                  {user && service.userId !== user.id && (
                    <RadixButton
                      size="2"
                      style={{ width: "100%" }}
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
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      {createConversation.isPending ? "Starter samtale..." : "Send melding"}
                    </RadixButton>
                  )}
                  {service.contactEmail && (
                    <RadixButton
                      size="2"
                      style={{ width: "100%" }}
                      onClick={() =>
                        window.open(
                          `mailto:${service.contactEmail}?subject=Angående ${service.title}`,
                          "_blank"
                        )
                      }
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                      Send e-post
                    </RadixButton>
                  )}

                  {service.contactPhone && (
                    <RadixButton
                      variant="outline"
                      size="2"
                      style={{ width: "100%" }}
                      onClick={() => window.open(`tel:${service.contactPhone}`, "_blank")}
                    >
                      <PhoneIcon className="h-4 w-4" />
                      Ring {service.contactPhone}
                    </RadixButton>
                  )}

                  {!service.contactEmail && !service.contactPhone && (
                    <Box py="4" style={{ textAlign: "center" }}>
                      <Text size="2" color="gray">
                        Ingen kontaktinformasjon tilgjengelig
                      </Text>
                    </Box>
                  )}
                </Flex>

                {/* Contact Info */}
                {(service.contactEmail || service.contactPhone) && (
                  <Box mt="6" pt="6" style={{ borderTop: "1px solid var(--gray-6)" }}>
                    <Flex direction="column" gap="2">
                      {service.contactEmail && (
                        <Flex align="center" gap="2">
                          <EnvelopeIcon className="h-4 w-4" />
                          <Text size="2" color="gray">
                            {service.contactEmail}
                          </Text>
                        </Flex>
                      )}
                      {service.contactPhone && (
                        <Flex align="center" gap="2">
                          <PhoneIcon className="h-4 w-4" />
                          <Text size="2" color="gray">
                            {service.contactPhone}
                          </Text>
                        </Flex>
                      )}
                    </Flex>
                  </Box>
                )}
              </Card>
            </Box>
          </Grid>
        </Container>
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
