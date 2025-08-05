"use client";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/utils/formatting";
import { formatServiceAreas } from "@/utils/service-formatting";
import type { ServicePhoto } from "@/types/service";
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  PhotoIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import ServiceAdvertisingInfoBox from "@/components/molecules/ServiceAdvertisingInfoBox";
import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import { useAuth } from "@/lib/supabase-auth-context";
import { useViewTracking } from "@/services/view-tracking-service";
import { useService } from "@/hooks/useServices";

export default function ServiceDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { trackServiceView } = useViewTracking();
  
  // Use TanStack Query hook for fetching service data
  const { data: service, isLoading, error } = useService(params.id as string);

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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-body-sm text-gray-500 mt-2">Laster tjeneste...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 text-h4 mb-4">{error instanceof Error ? error.message : "En feil oppstod"}</p>
            <Button asChild>
              <Link href="/tjenester">Tilbake til tjenester</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!service) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-h4 mb-4">Tjenesten ble ikke funnet</p>
            <Button asChild>
              <Link href="/tjenester">Tilbake til tjenester</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Back Link */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link
              href="/tjenester"
              className="text-primary hover:text-primary-hover flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Tilbake til tjenester
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Info box for non-advertised services */}
          <ServiceAdvertisingInfoBox show={service?.requiresAdvertising || false} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Photos */}
              {service.photos && service.photos.length > 0 ? (
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.photos.slice(0, 4).map((photo: ServicePhoto, index: number) => (
                      <Image
                        key={photo.id}
                        src={photo.url}
                        alt={`${service.title} bilde ${index + 1}`}
                        width={400}
                        height={300}
                        className={`rounded-lg object-cover ${
                          index === 0 ? "md:col-span-2 h-64 md:h-80" : "h-48"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-6 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-body-sm text-gray-500">Ingen bilder tilgjengelig</p>
                  </div>
                </div>
              )}

              {/* Title and Type */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-body-sm font-medium bg-gray-100 text-gray-800`}
                  >
                    {service.serviceType}
                  </span>
                </div>
                <h1 className="text-h1 font-bold text-gray-900 mb-2">{service.title}</h1>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-h2 font-semibold text-gray-900 mb-3">Beskrivelse</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-body text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {service.description}
                  </p>
                </div>
              </div>

              {/* Service Areas */}
              {service.areas.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-h2 font-semibold text-gray-900 mb-3">Dekningsområde</h2>
                  <div className="flex items-start text-body text-gray-700">
                    <MapPinIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{formatServiceAreas(service.areas)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
                {/* Price */}
                <div className="mb-6">
                  <h3 className="text-h4 font-semibold text-gray-900 mb-2">Pris</h3>
                  <div className="text-h2 font-bold text-gray-900">{formatPriceRange()}</div>
                </div>

                {/* Service Provider */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-h4 font-semibold text-gray-900 mb-3">Tjenesteleverandør</h3>
                  <div className="flex items-center mb-3">
                    <UserCircleIcon className="h-8 w-8 text-gray-400 mr-3" />
                    <div>
                      <p className="text-body font-medium text-gray-900">{service.contactName}</p>
                      <p className="text-body-sm text-gray-500">{service.serviceType}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="space-y-3">
                  {service.contactEmail && (
                    <Button
                      className="w-full"
                      onClick={() =>
                        window.open(
                          `mailto:${service.contactEmail}?subject=Angående ${service.title}`,
                          "_blank"
                        )
                      }
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      Send e-post
                    </Button>
                  )}

                  {service.contactPhone && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(`tel:${service.contactPhone}`, "_blank")}
                    >
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      Ring {service.contactPhone}
                    </Button>
                  )}

                  {!service.contactEmail && !service.contactPhone && (
                    <div className="text-center py-4">
                      <p className="text-body-sm text-gray-500">
                        Ingen kontaktinformasjon tilgjengelig
                      </p>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                {(service.contactEmail || service.contactPhone) && (
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-2 text-body-sm text-gray-600">
                    {service.contactEmail && (
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-2" />
                        <span>{service.contactEmail}</span>
                      </div>
                    )}
                    {service.contactPhone && (
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-2" />
                        <span>{service.contactPhone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
