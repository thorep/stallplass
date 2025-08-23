"use client";
import PriceInline from "@/components/atoms/PriceInline";
import ChipsList from "@/components/molecules/ChipsList";
import ContactInfoCard from "@/components/molecules/ContactInfoCard";
import DetailSectionCard from "@/components/molecules/DetailSectionCard";
import ImageGallery from "@/components/molecules/ImageGallery";
import PropertiesList from "@/components/molecules/PropertiesList";
import ShareButton from "@/components/molecules/ShareButton";
import StableServicesSection from "@/components/molecules/StableServicesSection";
import { BoxWithStablePreview } from "@/types/stable";
import { formatBoxSize, formatHorseSize, formatPrice } from "@/utils/formatting";
// import { useRouter } from "next/navigation";

interface BoxDetailClientProps {
  readonly box: BoxWithStablePreview;
  readonly user: { id: string; email?: string } | null; // Add user prop
}

export default function BoxDetailClient({ box, user }: BoxDetailClientProps) {
  // const router = useRouter();

  return (
    <div className="bg-gray-50">
      {/* Breadcrumb Navigation */}
      {/* <div className="bg-white border-b border-gray-200">
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
      </div> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery - Same as stable page */}
            {box.stable.images && box.stable.images.length > 0 && (
              <ImageGallery
                images={box.stable.images}
                imageDescriptions={box.stable.imageDescriptions}
                alt={box.stable.name}
              />
            )}
            {/* Box Header */}
            <DetailSectionCard
              header={
                <div className="flex items-start justify-between w-full">
                  <h1 className="text-h4 text-gray-900 font-bold">{box.name}</h1>
                  <div className="flex flex-col items-end gap-3">
                    <PriceInline value={box.price} cadence="perMonth" />
                    <ShareButton
                      title={`${box.name} - ${box.stable?.name || "Stallboks"}`}
                      description={
                        box.description ||
                        `Stallboks til leie hos ${box.stable?.name || "ukjent stall"}`
                      }
                    />
                  </div>
                </div>
              }
            >
              {/* Box Details grid */}
              <div className="mt-4 mb-6">
                <PropertiesList
                  columns={3}
                  items={[
                    { label: "Pris", value: `${formatPrice(box.price)}/mnd` },
                    box.size
                      ? {
                          label: "Størrelse",
                          value: box.sizeText
                            ? `${formatBoxSize(box.size)} (${box.sizeText})`
                            : formatBoxSize(box.size),
                        }
                      : null,
                    { label: "Type", value: box.boxType === "BOKS" ? "Boks" : "Utegang" },
                    box.maxHorseSize
                      ? { label: "Hestestørrelse", value: formatHorseSize(box.maxHorseSize) }
                      : null,
                    { label: "Ledige", value: `${box.availableQuantity ?? 0}` },
                  ]}
                />
              </div>
              {/* Description */}
              {box.description && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Beskrivelse</h3>
                  <p className="text-gray-700 break-words leading-relaxed">{box.description}</p>
                </div>
              )}

              {/* Box Amenities */}
              {box.amenities && box.amenities.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Boks fasiliteter</h3>
                  <ChipsList items={box.amenities.map((a) => a.amenity.name)} maxVisible={3} />
                </div>
              )}

              {/* Stable Amenities */}
              {box.stable.amenities && box.stable.amenities.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Stall fasiliteter</h3>
                  <ChipsList
                    items={box.stable.amenities.map((a) => a.amenity.name)}
                    maxVisible={3}
                  />
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
            </DetailSectionCard>
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
      {/* Lightbox removed; handled by shared ImageGallery */}
    </div>
  );
}
