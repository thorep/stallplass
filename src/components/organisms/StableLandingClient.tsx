"use client";

import Button from "@/components/atoms/Button";
import AreaServicesSection from "@/components/molecules/AreaServicesSection";
import FAQDisplay from "@/components/molecules/FAQDisplay";
import StableBoxCard from "@/components/molecules/StableBoxCard";
import StableMap from "@/components/molecules/StableMap";
import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import { useAuth } from "@/lib/supabase-auth-context";
import { useViewTracking } from "@/services/view-tracking-service";
import { Box } from "@/types";
import { StableWithAmenities, BoxWithAmenities } from "@/types/stable";
import { formatPrice } from "@/utils/formatting";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  ShareIcon,
  StarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface StableLandingClientProps {
  stable: StableWithAmenities;
}

export default function StableLandingClient({ stable }: StableLandingClientProps) {
  const { user, getIdToken } = useAuth();
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  // View tracking
  const { trackStableView, trackBoxView } = useViewTracking();

  // Track stable view on component mount
  useEffect(() => {
    trackStableView(stable.id, user?.id);
  }, [stable.id, user?.id, trackStableView]);

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

  // Fetch reviews for this stable

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev === (stable.images?.length || 1) - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? (stable.images?.length || 1) - 1 : prev - 1));
  };

  // Lightbox navigation
  const nextLightboxImage = () => {
    setLightboxImageIndex((prev) => (prev === (stable.images?.length || 1) - 1 ? 0 : prev + 1));
  };

  const prevLightboxImage = () => {
    setLightboxImageIndex((prev) => (prev === 0 ? (stable.images?.length || 1) - 1 : prev - 1));
  };

  const openLightbox = (index: number) => {
    setLightboxImageIndex(index);
    setShowImageLightbox(true);
  };

  const handleContactClick = async (boxId: string) => {
    // Track box view
    trackBoxView(boxId, user?.id);

    if (!user) {
      router.push("/logg-inn");
      return;
    }

    try {
      // Get Firebase token for authentication
      const token = await getIdToken();

      // Create or find existing conversation
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stableId: stable.id,
          boxId: boxId,
          initialMessage: `Hei! Jeg er interessert i boksen "${
            availableBoxes.find((b: Box) => b.id === boxId)?.name
          }" og vil gjerne vite mer.`,
        }),
      });

      if (response.ok) {
        // Redirect to messages page
        router.push("/meldinger");
      } else {
        const error = await response.json();
        alert(error.error || "Kunne ikke opprette samtale. Prøv igjen.");
      }
    } catch {
      alert("Feil ved opprettelse av samtale. Prøv igjen.");
    }
  };



  const availableBoxes = stable.boxes?.filter((box) => box.isAvailable) || [];
  const allBoxes = stable.boxes || [];
  const rentedBoxesWithDates = allBoxes.filter(
    (box) => !box.isAvailable && box.specialNotes?.includes("ledig")
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

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/stables/${stable.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${stable.name} - Stallplass`,
          text: `Sjekk ut ${stable.name} på Stallplass`,
          url: shareUrl,
        });
      } catch {
        // User cancelled sharing or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      } catch {
        alert("Kunne ikke kopiere lenke");
      }
    }
  };
  console.log(stable);
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Back Link */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link
              href="/stables"
              className="text-primary hover:text-primary-hover flex items-center"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Tilbake
            </Link>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
              title="Del denne stallen"
            >
              <ShareIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Del stall</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            {stable.images && stable.images.length > 0 && (
              <div className="relative">
                <div
                  className="aspect-[16/10] rounded-lg overflow-hidden bg-gray-200 cursor-pointer"
                  onClick={() => openLightbox(currentImageIndex)}
                >
                  <Image
                    src={stable.images[currentImageIndex]}
                    alt={
                      stable.imageDescriptions?.[currentImageIndex] ||
                      `${stable.name} - Bilde ${currentImageIndex + 1}`
                    }
                    width={800}
                    height={500}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />

                  {stable.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <ChevronLeftIcon className="h-6 w-6" />
                      </button>

                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <ChevronRightIcon className="h-6 w-6" />
                      </button>

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        {stable.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
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
                {stable.imageDescriptions?.[currentImageIndex] && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 italic">
                      {stable.imageDescriptions[currentImageIndex]}
                    </p>
                  </div>
                )}

                {stable.images.length > 1 && (
                  <div className="mt-4 grid grid-cols-6 gap-2">
                    {stable.images.slice(0, 6).map((image, index) => (
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
                          alt={stable.imageDescriptions?.[index] || `Miniature ${index + 1}`}
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

            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{stable.name}</h1>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span>{stable.postalPlace}</span>
                  </div>

                  {stable.rating && stable.rating > 0 && (
                    <div className="flex items-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={`h-5 w-5 ${
                              star <= (stable.rating || 0)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        ({stable.reviewCount} anmeldelser)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                    title="Del denne stallen"
                  >
                    <ShareIcon className="h-4 w-4" />
                    <span className="text-sm">Del</span>
                  </button>

                  {priceRange && (
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Fra</div>
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(priceRange.min)}
                      </div>
                      <div className="text-sm text-gray-600">per måned</div>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed">{stable.description}</p>
            </div>

            {/* Amenities */}
            {stable.amenities && stable.amenities.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Fasiliteter</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {stable.amenities.map((item) => (
                    <div key={item.amenity.id} className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      <span>{item.amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Boxes */}
            {availableBoxes.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Tilgjengelige bokser ({availableBoxes.length})
                </h2>
                <div className="space-y-4">
                  {availableBoxes.map((box) => (
                    <StableBoxCard
                      key={box.id}
                      box={box as BoxWithAmenities}
                      stableImages={stable.images}
                      stableImageDescriptions={stable.imageDescriptions}
                      onContactClick={handleContactClick}
                      isOwner={isOwner}
                      variant="available"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rented Boxes with Future Availability Dates */}
            {rentedBoxesWithDates.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Utleide bokser med kjent ledighetsdato ({rentedBoxesWithDates.length})
                </h2>
                <div className="space-y-4">
                  {rentedBoxesWithDates.map((box) => (
                    <StableBoxCard
                      key={box.id}
                      box={box as BoxWithAmenities}
                      stableImages={stable.images}
                      stableImageDescriptions={stable.imageDescriptions}
                      onContactClick={handleContactClick}
                      isOwner={isOwner}
                      variant="rented"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Boxes Available Message */}
            {(!stable.boxes || stable.boxes.length === 0) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Bokser</h2>
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-2">
                    Ingen bokser er registrert for denne stallen ennå.
                  </div>
                  {isOwner && (
                    <div className="text-sm text-gray-400">
                      Gå til din dashboard for å legge til bokser.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No Available Boxes Message */}
            {stable.boxes &&
              stable.boxes.length > 0 &&
              availableBoxes.length === 0 &&
              rentedBoxesWithDates.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Bokser</h2>
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-2">
                      Ingen bokser er tilgjengelige for øyeblikket.
                    </div>
                    <div className="text-sm text-gray-400">
                      Alle bokser er utleid uten kjent ledighetsdato.
                    </div>
                  </div>
                </div>
              )}

            {/* FAQ Section */}
            {stable.faqs && stable.faqs.length > 0 && <FAQDisplay faqs={stable.faqs} />}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Contact Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {isOwner ? "Din stall" : "Kontakt eier"}
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-primary font-medium text-sm">
                        {(stable.owner?.name || stable.owner?.email || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {stable.owner?.name || stable.owner?.email || "Ikke oppgitt"}
                    </span>
                  </div>
                </div>

                {isOwner ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 text-sm text-center">
                        Dette er din stall. Gå til dashboard for å administrere den.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => router.push("/dashboard")}
                    >
                      Gå til dashboard
                    </Button>
                  </div>
                ) : availableBoxes.length > 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm text-center">
                      Se tilgjengelige bokser nedenfor for å starte dialog
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600 text-sm text-center">
                      Ingen bokser er tilgjengelige for kontakt for øyeblikket.
                    </p>
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lokasjon</h3>
                <div className="space-y-2 text-gray-600 mb-4">
                  {stable.address && <div>{stable.address}</div>}
                  <div>
                    {stable.postalCode} {stable.postalPlace}
                  </div>
                </div>

                {/* Map */}
                {stable.latitude && stable.longitude && (
                  <StableMap
                    latitude={stable.latitude}
                    longitude={stable.longitude}
                    stallName={stable.name}
                    address={stable.address || `${stable.postalCode} ${stable.postalPlace}`}
                    className="w-full h-48"
                  />
                )}
              </div>

              {/* Stats */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Oversikt</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Totalt bokser:</span>
                    <span className="font-medium">{stable.boxes?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tilgjengelige:</span>
                    <span className="font-medium text-green-600">{availableBoxes.length}</span>
                  </div>
                  {stable.amenities && stable.amenities.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fasiliteter:</span>
                      <span className="font-medium">{stable.amenities.length}</span>
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
        <AreaServicesSection
          county={stable.countyId || ""}
          municipality={stable.municipalityId || undefined}
        />
      </div>

      <Footer />

      {/* Image Lightbox Modal */}
      {showImageLightbox && stable.images && stable.images.length > 0 && (
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
          {stable.images.length > 1 && (
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
              src={stable.images[lightboxImageIndex]}
              alt={
                stable.imageDescriptions?.[lightboxImageIndex] ||
                `${stable.name} - Bilde ${lightboxImageIndex + 1}`
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
              {lightboxImageIndex + 1} av {stable.images.length}
            </div>
            {stable.imageDescriptions?.[lightboxImageIndex] && (
              <div className="text-xs mt-1 opacity-80">
                {stable.imageDescriptions[lightboxImageIndex]}
              </div>
            )}
          </div>

          {/* Background click to close */}
          <div className="absolute inset-0 -z-10" onClick={() => setShowImageLightbox(false)} />
        </div>
      )}

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Lenke kopiert til utklippstavlen!
        </div>
      )}
    </div>
  );
}
