"use client";

import Button from "@/components/atoms/Button";
import StableMap from "@/components/molecules/StableMap";
import StableServicesSection from "@/components/molecules/StableServicesSection";
import BoxAdvertisingInfoBox from "@/components/molecules/BoxAdvertisingInfoBox";
import { useCreateConversation } from "@/hooks/useChat";
import { useAuth } from "@/lib/supabase-auth-context";
import { BoxWithStablePreview } from "@/types/stable";
import { formatPrice, formatBoxSize } from "@/utils/formatting";
import { toast } from 'sonner';
import {
  ArrowLeftIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  HomeIcon,
  MapPinIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface BoxDetailClientProps {
  box: BoxWithStablePreview;
}

export default function BoxDetailClient({ box }: BoxDetailClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const createConversation = useCreateConversation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  // Handle escape key for lightbox
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showImageLightbox) {
        setShowImageLightbox(false);
      }
    };

    if (showImageLightbox) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [showImageLightbox]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev === (box.stable.images?.length || 1) - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? (box.stable.images?.length || 1) - 1 : prev - 1));
  };

  // Lightbox navigation
  const nextLightboxImage = () => {
    setLightboxImageIndex((prev) => (prev === (box.stable.images?.length || 1) - 1 ? 0 : prev + 1));
  };

  const prevLightboxImage = () => {
    setLightboxImageIndex((prev) => (prev === 0 ? (box.stable.images?.length || 1) - 1 : prev - 1));
  };

  const openLightbox = (index: number) => {
    setLightboxImageIndex(index);
    setShowImageLightbox(true);
  };

  const handleContactClick = () => {
    if (!user) {
      router.push("/logg-inn");
      return;
    }

    createConversation.mutate(
      {
        stableId: box.stable.id,
        boxId: box.id,
        initialMessage: `Hei! Jeg er interessert i boksen "${box.name}" og vil gjerne vite mer.`,
      },
      {
        onSuccess: () => {
          router.push("/meldinger");
        },
        onError: (err) => {
          toast.error("Feil ved opprettelse av samtale. Prøv igjen.");
        },
      }
    );
  };

  return (
    <div className="bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href="/stables" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Tilbake til søk</span>
                <span className="sm:hidden">Tilbake</span>
              </Link>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <HomeIcon className="h-4 w-4" />
                <span>/</span>
                <Link href="/staller" className="hover:text-gray-700">
                  Staller
                </Link>
                <span>/</span>
                <Link href={`/staller/${box.stable.id}`} className="hover:text-gray-700">
                  {box.stable.name}
                </Link>
                <span>/</span>
                <span className="text-gray-900">{box.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info box for non-advertised boxes */}
        <BoxAdvertisingInfoBox 
          show={box?.requiresAdvertising || false}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery - Same as stable page */}
            {box.stable.images && box.stable.images.length > 0 && (
              <div className="relative">
                <div
                  className="aspect-[16/10] rounded-lg overflow-hidden bg-gray-200 cursor-pointer"
                  onClick={() => openLightbox(currentImageIndex)}
                >
                  <Image
                    src={box.stable.images[currentImageIndex]}
                    alt={
                      box.stable.imageDescriptions?.[currentImageIndex] ||
                      `${box.stable.name} - Bilde ${currentImageIndex + 1}`
                    }
                    width={800}
                    height={500}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />

                  {box.stable.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <ChevronLeftIcon className="h-6 w-6" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <ChevronRightIcon className="h-6 w-6" />
                      </button>

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        {box.stable.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(index);
                            }}
                            className={`w-3 h-3 rounded-full ${
                              index === currentImageIndex
                                ? "bg-white"
                                : "bg-white/50 hover:bg-white/75"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Image Description */}
                {box.stable.imageDescriptions?.[currentImageIndex] && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 italic">
                      {box.stable.imageDescriptions[currentImageIndex]}
                    </p>
                  </div>
                )}

                {box.stable.images.length > 1 && (
                  <div className="mt-4 grid grid-cols-6 gap-2">
                    {box.stable.images.slice(0, 6).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        onDoubleClick={() => openLightbox(index)}
                        className={`aspect-square rounded-lg overflow-hidden ${
                          index === currentImageIndex ? "ring-2 ring-primary" : "hover:opacity-80"
                        }`}
                        title="Klikk for å velge, dobbeltklikk for fullskjerm"
                      >
                        <Image
                          src={image}
                          alt={box.stable.imageDescriptions?.[index] || `Miniature ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Box Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-h1 sm:text-h1 text-gray-900 mb-3">{box.name}</h1>

                  <div className="flex items-center text-gray-600 text-sm mb-4">
                    <MapPinIcon className="h-4 w-4 mr-1 text-gray-500" />
                    <Link
                      href={`/staller/${box.stable.id}`}
                      className="hover:text-primary font-medium"
                    >
                      {box.stable.name}
                    </Link>
                    <span className="mx-2">•</span>
                    <span className="font-medium">{box.stable.location}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right sm:ml-6 mt-4 sm:mt-0 bg-primary/5 rounded-lg p-6">
                  <div className="text-2xl md:text-3xl font-bold text-primary">
                    {formatPrice(box.price)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">per måned</div>
                </div>
              </div>

              {/* Description */}
              {box.description && (
                <div className="mb-8">
                  <h3 className="text-h2 sm:text-h2 text-gray-900 mb-4">Beskrivelse</h3>
                  <p className="text-body-sm text-gray-700">{box.description}</p>
                </div>
              )}

              {/* Box Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {box.size && (
                  <div className="bg-blue-50 rounded-lg p-4 flex items-center">
                    <BuildingOffice2Icon className="h-6 w-6 text-blue-600 mr-4" />
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">Størrelse</div>
                      <div className="text-sm text-gray-600 font-medium">
                        {formatBoxSize(box.size)}
                        {box.size === 'MEDIUM' && (
                          <span className="text-xs text-gray-500 font-normal"> (vanligvis ca. 3x3 meter)</span>
                        )}
                      </div>
                      {box.sizeText && (
                        <div className="text-sm text-gray-600 mt-1 italic">
                          <span className="text-xs text-gray-500 not-italic">Fra eier: </span>
                          "{box.sizeText}"
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-green-50 rounded-lg p-4 flex items-center">
                  <HomeIcon className="h-6 w-6 text-green-600 mr-4" />
                  <div>
                    <div className="font-bold text-gray-900">Type</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {box.boxType === "BOKS" ? "Boks" : "Utegang"}
                    </div>
                  </div>
                </div>

                {box.maxHorseSize && (
                  <div className="bg-purple-50 rounded-lg p-4 flex items-center">
                    <ClockIcon className="h-6 w-6 text-purple-600 mr-4" />
                    <div>
                      <div className="font-bold text-gray-900">Hestestørrelse</div>
                      <div className="text-sm text-gray-600 font-medium">{box.maxHorseSize}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Box Amenities */}
              {box.amenities && box.amenities.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-h2 sm:text-h2 text-gray-900 mb-6">Boks fasiliteter</h3>
                  <div className="flex flex-wrap gap-3">
                    {box.amenities.map((amenityRelation) => (
                      <span
                        key={amenityRelation.amenity.id}
                        className="inline-flex items-center px-4 py-2.5 rounded-full bg-blue-100 text-sm font-medium text-blue-700 hover:bg-blue-200 transition-colors"
                      >
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                        {amenityRelation.amenity.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stable Amenities */}
              {box.stable.amenities && box.stable.amenities.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-h2 sm:text-h2 text-gray-900 mb-6">Stall fasiliteter</h3>
                  <div className="flex flex-wrap gap-3">
                    {box.stable.amenities.map((amenityRelation) => (
                      <span
                        key={amenityRelation.amenity.id}
                        className="inline-flex items-center px-4 py-2.5 rounded-full bg-green-100 text-sm font-medium text-green-700 hover:bg-green-200 transition-colors"
                      >
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                        {amenityRelation.amenity.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Notes */}
              {box.specialNotes && (
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-h4 text-blue-900 mb-3">Viktig informasjon</h3>
                  <p className="text-blue-800 text-sm font-medium">{box.specialNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Booking Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <div className="text-center mb-8">
                  <div className="text-2xl md:text-3xl font-bold text-primary mb-2">
                    {formatPrice(box.price)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">per måned</div>
                </div>

                <div className="space-y-4">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleContactClick}
                    className="w-full rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={createConversation.isPending}
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                    {createConversation.isPending ? "Starter samtale..." : "Start samtale"}
                  </Button>

                  <Link href={`/staller/${box.stable.id}`}>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Se hele stallen
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-h4 text-gray-900 mb-6">Kontaktinformasjon</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-bold text-gray-900">Eier</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {box.stable.owner?.nickname || "Ikke oppgitt"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Stall</div>
                    <div className="text-sm text-gray-600 font-medium">{box.stable.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Lokasjon</div>
                    <div className="text-sm text-gray-600 font-medium">{box.stable.location}</div>
                  </div>
                </div>

                {/* Small Map */}
                {box.stable.latitude && box.stable.longitude && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <StableMap
                      latitude={box.stable.latitude}
                      longitude={box.stable.longitude}
                      stallName={box.stable.name}
                      address={box.stable.location}
                      className="w-full h-32 rounded-xl overflow-hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services in the Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StableServicesSection
          countyId={box.stable.countyId || ""}
          municipalityId={box.stable.municipalityId || undefined}
          countyName={box.stable.counties?.name}
          municipalityName={box.stable.municipalities?.name}
        />
      </div>
      {/* Image Lightbox Modal - Same as stable page */}
      {showImageLightbox && box.stable.images && box.stable.images.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4">
          {/* Close button */}
          <button
            onClick={() => setShowImageLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
            title="Lukk fullskjerm (ESC)"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Navigation arrows */}
          {box.stable.images.length > 1 && (
            <>
              <button
                onClick={prevLightboxImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-3"
                title="Forrige bilde"
              >
                <ChevronLeftIcon className="h-8 w-8" />
              </button>

              <button
                onClick={nextLightboxImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-3"
                title="Neste bilde"
              >
                <ChevronRightIcon className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Main image */}
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <Image
              src={box.stable.images[lightboxImageIndex]}
              alt={
                box.stable.imageDescriptions?.[lightboxImageIndex] ||
                `${box.stable.name} - Bilde ${lightboxImageIndex + 1}`
              }
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain"
              quality={95}
              priority
            />
          </div>

          {/* Image info */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-center bg-black bg-opacity-50 rounded-lg px-4 py-2">
            <div className="text-sm">
              {lightboxImageIndex + 1} av {box.stable.images.length}
            </div>
            {box.stable.imageDescriptions?.[lightboxImageIndex] && (
              <div className="text-xs mt-1 opacity-80">
                {box.stable.imageDescriptions[lightboxImageIndex]}
              </div>
            )}
          </div>

          {/* Background click to close */}
          <div className="absolute inset-0 -z-10" onClick={() => setShowImageLightbox(false)} />
        </div>
      )}
    </div>
  );
}
