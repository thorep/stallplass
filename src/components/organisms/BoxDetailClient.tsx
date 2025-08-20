"use client";

import ContactInfoCard from "@/components/molecules/ContactInfoCard";
import ShareButton from "@/components/molecules/ShareButton";
import StableServicesSection from "@/components/molecules/StableServicesSection";
import { BoxWithStablePreview } from "@/types/stable";
import { formatBoxSize, formatHorseSize, formatPrice } from "@/utils/formatting";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, HomeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Box } from "@mui/material";
import { Tag, Ruler, Home } from "lucide-react";
import { HorseIcon } from "@/components/icons/HorseIcon";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface BoxDetailClientProps {
  readonly box: BoxWithStablePreview;
  readonly user: { id: string; email?: string } | null; // Add user prop
}

export default function BoxDetailClient({ box, user }: BoxDetailClientProps) {
  const router = useRouter();
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

  return (
    <div className="bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href="/sok" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Tilbake til søk</span>
                <span className="sm:hidden">Tilbake</span>
              </Link>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <HomeIcon className="h-4 w-4" />
                <span>/</span>
                <Link href="/sok" className="hover:text-gray-700">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery - Same as stable page */}
            {box.stable.images && box.stable.images.length > 0 && (
              <div className="relative">
                <div
                  className="aspect-[16/10] rounded-lg overflow-hidden bg-gray-200 cursor-pointer w-full"
                  onClick={() => openLightbox(currentImageIndex)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openLightbox(currentImageIndex);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Åpne bilde ${currentImageIndex + 1} i fullskjerm`}
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
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                    quality={75}
                  />

                  {box.stable.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                        aria-label="Forrige bilde"
                        type="button"
                      >
                        <ChevronLeftIcon className="h-6 w-6" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                        aria-label="Neste bilde"
                        type="button"
                      >
                        <ChevronRightIcon className="h-6 w-6" />
                      </button>

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        {box.stable.images.map((_, index) => (
                          <button
                            key={`dot-${index}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(index);
                            }}
                            className={`w-3 h-3 rounded-full ${
                              index === currentImageIndex
                                ? "bg-white"
                                : "bg-white/50 hover:bg-white/75"
                            }`}
                            aria-label={`Gå til bilde ${index + 1}`}
                            type="button"
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
                        key={`thumb-${index}`}
                        onClick={() => setCurrentImageIndex(index)}
                        onDoubleClick={() => openLightbox(index)}
                        className={`aspect-square rounded-lg overflow-hidden ${
                          index === currentImageIndex ? "ring-2 ring-primary" : "hover:opacity-80"
                        }`}
                        title="Klikk for å velge, dobbeltklikk for fullskjerm"
                        aria-label={`Velg bilde ${index + 1}`}
                        type="button"
                      >
                        <Image
                          src={image}
                          alt={box.stable.imageDescriptions?.[index] || `Miniature ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                          sizes="200px"
                          quality={60}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Box Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
              <div className="mb-6 flex items-start justify-between">
                <h1 className="text-h4 text-gray-900 mb-3 font-bold">{box.name}</h1>
                <ShareButton 
                  title={`${box.name} - ${box.stable?.name || "Stallboks"}`}
                  description={box.description || `Stallboks til leie hos ${box.stable?.name || "ukjent stall"}`}
                />
              </div>
              {/* Box Details Spec List - mobile-friendly */}
              <section className="mt-6 mb-6 pl-4 border-l-2 border-primary/20">
                <dl className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-border gap-y-4 md:gap-0">
                  {/* Pris */}
                  <div className="md:p-4">
                    <dt className="flex items-center gap-2 text-sm text-muted-foreground leading-none">
                      <Tag className="h-4 w-4 shrink-0" /> Pris
                    </dt>
                    <dd className="mt-1 text-base md:text-lg font-semibold leading-tight">{formatPrice(box.price)}</dd>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">per måned</p>
                  </div>

                  {/* Størrelse */}
                  {box.size && (
                    <div className="md:p-4">
                      <dt className="flex items-center gap-2 text-sm text-muted-foreground leading-none">
                        <Ruler className="h-4 w-4 shrink-0" /> Størrelse
                      </dt>
                      <dd className="mt-1 text-base md:text-lg font-semibold leading-tight">{formatBoxSize(box.size)}</dd>
                      {box.sizeText && (
                        <p className="mt-0.5 text-[13px] italic text-muted-foreground">{box.sizeText}</p>
                      )}
                    </div>
                  )}

                  {/* Type */}
                  <div className="md:p-4">
                    <dt className="flex items-center gap-2 text-sm text-muted-foreground leading-none">
                      <Home className="h-4 w-4 shrink-0" /> Type
                    </dt>
                    <dd className="mt-1 text-base md:text-lg font-semibold leading-tight">
                      {box.boxType === "BOKS" ? "Boks" : "Utegang"}
                    </dd>
                  </div>

                  {/* Hestestørrelse */}
                  {box.maxHorseSize && (
                    <div className="md:p-4">
                      <dt className="flex items-center gap-2 text-sm text-muted-foreground leading-none">
                        <HorseIcon className="h-4 w-4 shrink-0" /> Hestestørrelse
                      </dt>
                      <dd className="mt-1 text-base md:text-lg font-semibold leading-tight">{formatHorseSize(box.maxHorseSize)}</dd>
                    </div>
                  )}
                </dl>
              </section>
              {/* Description */}
              {box.description && (
                <div className="mt-6">
                  <h3 className="text-h4 text-gray-900 mt-6 mb-2 font-bold">Beskrivelse</h3>
                  <p className="text-body-sm text-gray-700 break-words">{box.description}</p>
                </div>
              )}

              {/* Box Amenities */}
              {box.amenities && box.amenities.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-h4 text-gray-900 mb-6 font-bold">Boks fasiliteter</h3>
                  <div className="flex flex-wrap gap-2">
                    {box.amenities.map((amenityRelation) => (
                      <span
                        key={amenityRelation.amenity.id}
                        className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm md:text-[13px]"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        {amenityRelation.amenity.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stable Amenities */}
              {box.stable.amenities && box.stable.amenities.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-h4 text-gray-900 mb-6 font-bold">Stall fasiliteter</h3>
                  <div className="flex flex-wrap gap-2">
                    {box.stable.amenities.map((amenityRelation) => (
                      <span
                        key={amenityRelation.amenity.id}
                        className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm md:text-[13px]"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
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
                  <p className="text-blue-800 text-sm font-medium break-words">
                    {box.specialNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className=" space-y-8">
              {/* Contact Info */}
              <ContactInfoCard
                entityType="box"
                entityId={box.id}
                entityName={box.name}
                entityOwnerId={box.stable.owner?.id}
                ownerNickname={box.stable.owner?.nickname}
                address={box.stable.location}
                postalCode={box.stable.postalCode}
                postalPlace={box.stable.postalPlace}
                county={box.stable.county}
                latitude={box.stable.latitude}
                longitude={box.stable.longitude}
                user={user}
                showMap={true}
              />
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
              sizes="100vw"
              quality={85}
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
          <button
            className="absolute inset-0 -z-10 bg-transparent border-0 cursor-pointer"
            onClick={() => setShowImageLightbox(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowImageLightbox(false);
              }
            }}
            aria-label="Lukk fullskjerm"
            type="button"
          />
        </div>
      )}
    </div>
  );
}
