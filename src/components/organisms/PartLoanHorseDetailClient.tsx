"use client";

import "@radix-ui/themes/styles.css";
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  PencilIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import ImageGallery from "@/components/molecules/ImageGallery";
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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { useCreateConversation } from "@/hooks/useChat";
import { usePartLoanHorse } from "@/hooks/usePartLoanHorses";
import { useViewTracking } from "@/services/view-tracking-service";
import PartLoanHorseModal from "@/components/organisms/PartLoanHorseModal";

interface PartLoanHorseDetailClientProps {
  horseId: string;
  user: User | null;
}

export default function PartLoanHorseDetailClient({ horseId, user }: PartLoanHorseDetailClientProps) {
  const router = useRouter();
  const { trackPartLoanHorseView } = useViewTracking();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const createConversation = useCreateConversation();

  // Use TanStack Query hook for fetching part-loan horse data
  const { data: horse, isLoading, error } = usePartLoanHorse(horseId);

  // Track horse view when horse is loaded
  useEffect(() => {
    if (horse) {
      trackPartLoanHorseView(horse.id, user?.id);
    }
  }, [horse, user?.id, trackPartLoanHorseView]);

  const formatLocation = () => {
    if (!horse) return "";

    const parts = [];
    if (horse.address) parts.push(horse.address);
    if (horse.postalCode && horse.postalPlace) {
      parts.push(`${horse.postalCode} ${horse.postalPlace}`);
    }
    if (horse.municipalities?.name) {
      parts.push(horse.municipalities.name);
    }
    if (horse.counties?.name) {
      parts.push(horse.counties.name);
    }
    return parts.join(", ") || "Ingen adresse oppgitt";
  };

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
            <RadixButton asChild>
              <Link href="/forhest">Tilbake til fôrhester</Link>
            </RadixButton>
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
            <RadixButton asChild>
              <Link href="/forhest">Tilbake til fôrhester</Link>
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
          <Link href="/forhest" style={{ textDecoration: "none" }}>
            <Flex align="center" gap="1" style={{ color: "var(--accent-9)", cursor: "pointer" }}>
              <ArrowLeftIcon className="h-4 w-4" />
              <Text size="2">Tilbake til fôrhester</Text>
            </Flex>
          </Link>
        </Container>
      </Box>

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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      Fôrhest
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{horse.name}</h1>
                </div>
              </div>

              {/* Description */}
              {horse.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Beskrivelse</h2>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {horse.description}
                  </p>
                </div>
              )}

              {/* Location */}
              {(horse.address || horse.municipalities?.name || horse.counties?.name) && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Lokasjon</h2>
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span className="text-gray-700">
                      {formatLocation()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              {/* Horse Owner */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Hesteeier
                  </h3>
                  {user && horse.userId === user.id && (
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
                      {horse.profiles?.nickname?.charAt(0) || horse.profiles?.firstname?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {horse.profiles?.nickname || 
                       (horse.profiles?.firstname && horse.profiles?.lastname 
                         ? `${horse.profiles.firstname} ${horse.profiles.lastname}` 
                         : horse.profiles?.firstname || "Ukjent bruker")}
                    </p>
                    <p className="text-xs text-gray-500">
                      Hesteeier
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="space-y-3">
                {user && horse.userId !== user.id ? (
                  <button
                    onClick={() => {
                      if (!user) {
                        router.push("/logg-inn");
                        return;
                      }
                      createConversation.mutate(
                        {
                          partLoanHorseId: horse.id,
                          initialMessage: `Hei! Jeg er interessert i fôrhesten "${horse.name}" og vil gjerne vite mer.`,
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
                ) : user && horse.userId === user.id ? (
                  <div className="py-4 text-center">
                    <p className="text-sm text-gray-500">
                      Dette er din fôrhest
                    </p>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-gray-500">
                      <Link href="/logg-inn" className="text-blue-600 hover:text-blue-800">
                        Logg inn
                      </Link>{" "}
                      for å kontakte eieren
                    </p>
                  </div>
                )}
              </div>

              {/* Location Info */}
              {(horse.address || horse.municipalities?.name) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Lokasjon
                  </h3>
                  <div className="space-y-2">
                    {horse.address && (
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {horse.address}
                        </span>
                      </div>
                    )}
                    {horse.postalCode && horse.postalPlace && (
                      <p className="text-sm text-gray-600 ml-6">
                        {horse.postalCode} {horse.postalPlace}
                      </p>
                    )}
                    {horse.municipalities?.name && (
                      <p className="text-sm text-gray-600 ml-6">
                        {horse.municipalities.name}
                        {horse.counties?.name && `, ${horse.counties.name}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

            </div>
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