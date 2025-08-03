"use client";

import Button from "@/components/atoms/Button";
import StableServicesSection from "@/components/molecules/StableServicesSection";
import FAQDisplay from "@/components/molecules/FAQDisplay";
import StableBoxCard from "@/components/molecules/StableBoxCard";
import StableMap from "@/components/molecules/StableMap";
import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import { useAuth } from "@/lib/supabase-auth-context";
import { useViewTracking } from "@/services/view-tracking-service";
import { StableWithAmenities, BoxWithAmenities } from "@/types/stable";
import { formatPrice } from "@/utils/formatting";
import { toast } from 'sonner';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  ShareIcon,
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
  const { user } = useAuth();
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

  const handleBoxClick = (boxId: string) => {
    // Track box view
    trackBoxView(boxId, user?.id);
    
    // Navigate to box detail page
    router.push(`/bokser/${boxId}`);
  };



  // Filter boxes with active advertising
  const boxesWithAdvertising = stable.boxes?.filter((box) => 
    box.advertisingActive && 
    box.advertisingEndDate && 
    new Date(box.advertisingEndDate) > new Date()
  ) || [];
  
  // Separate into available and rented boxes
  const availableBoxes = boxesWithAdvertising.filter((box) => box.isAvailable);
  const rentedBoxes = boxesWithAdvertising.filter((box) => !box.isAvailable);

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
        toast.error("Kunne ikke kopiere lenke");
      }
    }
  };
  // Stable data loaded successfully
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
                  className="aspect-[16/10] rounded-md overflow-hidden bg-gray-200 cursor-pointer"
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
                        className={`aspect-square rounded-md overflow-hidden ${
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h1 className="text-h1 sm:text-h1 text-gray-900 mb-3">{stable.name}</h1>
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPinIcon className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="font-medium">{stable.postalPlace}</span>
                  </div>

                </div>

                {priceRange && (
                  <div className="text-right bg-primary/5 rounded-xl p-4">
                    <div className="text-sm text-gray-600 font-medium">Fra</div>
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(priceRange.min)}
                    </div>
                    <div className="text-sm text-gray-600">per måned</div>
                  </div>
                )}
              </div>

              <p className="text-body-sm text-gray-700">{stable.description}</p>
            </div>

            {/* Amenities */}
            {stable.amenities && stable.amenities.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                <h2 className="text-h2 sm:text-h2 text-gray-900 mb-6">Fasiliteter</h2>
                <div className="flex flex-wrap gap-3">
                  {stable.amenities.map((item) => (
                    <span
                      key={item.amenity.id}
                      className="inline-flex items-center px-4 py-2.5 rounded-full bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      {item.amenity.name}
                    </span>
                  ))}
                </div>
              </div>
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
                      <Button
                        variant="primary"
                        className="bg-amber-600 hover:bg-amber-700 border-amber-600 hover:border-amber-700"
                        onClick={() => router.push("/dashboard")}
                      >
                        Aktiver annonsering i dashboard
                      </Button>
                      <Button
                        variant="outline"
                        className="border-amber-300 text-amber-800 hover:bg-amber-100"
                        onClick={() => router.push("/priser")}
                      >
                        Se priser
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Available Boxes */}
            {availableBoxes.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-h2 sm:text-h2 text-gray-900">
                    Tilgjengelige bokser
                  </h2>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-green-500 text-white">
                    {availableBoxes.length} ledig{availableBoxes.length !== 1 ? "e" : ""}
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
              </div>
            )}

            {/* Rented Boxes (with active advertising) */}
            {rentedBoxes.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-h2 sm:text-h2 text-gray-900">
                    Utleide bokser
                  </h2>
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
              </div>
            )}

            {/* No Boxes Available Message */}
            {(!stable.boxes || stable.boxes.length === 0) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                <h2 className="text-h2 sm:text-h2 text-gray-900 mb-6">Bokser</h2>
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
              </div>
            )}

            {/* No Boxes with Active Advertising Message */}
            {stable.boxes &&
              stable.boxes.length > 0 &&
              boxesWithAdvertising.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                  <h2 className="text-h2 sm:text-h2 text-gray-900 mb-6">Bokser</h2>
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
                </div>
              )}

            {/* FAQ Section */}
            {stable.faqs && stable.faqs.length > 0 && <FAQDisplay faqs={stable.faqs} />}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Contact Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-h4 text-gray-900 mb-6">
                  {isOwner ? "Din stall" : "Kontakt eier"}
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                      <span className="text-primary font-bold text-lg">
                        {(stable.owner?.nickname || stable.owner?.firstname || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-h3 text-gray-900">
                      {stable.owner?.nickname || 
                       (stable.owner?.firstname && stable.owner?.lastname 
                         ? `${stable.owner.firstname} ${stable.owner.lastname}` 
                         : stable.owner?.firstname || "Ikke oppgitt")}
                    </span>
                  </div>
                </div>

                {isOwner ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-blue-800 text-sm text-center font-medium">
                        Dette er din stall. Gå til dashboard for å administrere den.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      onClick={() => router.push("/dashboard")}
                    >
                      Gå til dashboard
                    </Button>
                  </div>
                ) : availableBoxes.length > 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-blue-800 text-sm text-center font-medium">
                      Klikk på &quot;Se detaljer&quot; på boksene nedenfor for å se mer informasjon og starte dialog
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-gray-600 text-sm text-center font-medium">
                      Ingen bokser er tilgjengelige for kontakt for øyeblikket.
                    </p>
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-4">
                  {stable.address && (
                    <div className="text-gray-900 font-medium text-base mb-1">{stable.address}</div>
                  )}
                  <div className="text-gray-600 text-sm">
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
                    className="w-full h-48 rounded-xl overflow-hidden"
                  />
                )}
              </div>

              {/* Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-h4 text-gray-900 mb-6">Oversikt</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Totalt bokser:</span>
                    <span className="font-bold text-sm text-gray-900">{stable.boxes?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Tilgjengelige:</span>
                    <span className="font-bold text-sm text-green-600">{availableBoxes.length}</span>
                  </div>
                  {stable.amenities && stable.amenities.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Fasiliteter:</span>
                      <span className="font-bold text-sm text-gray-900">{stable.amenities.length}</span>
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
