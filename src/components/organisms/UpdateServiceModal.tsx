"use client";

import AddressSearch from "@/components/molecules/AddressSearch";
import LocationSelector from "@/components/molecules/LocationSelector";
import { Modal } from "@/components/ui/modal";
import { UnifiedImageUpload, UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import type { Fylke, KommuneWithFylke } from "@/hooks/useLocationQueries";
import { useActiveServiceTypes } from "@/hooks/usePublicServiceTypes";
import { useUpdateService } from "@/hooks/useServiceMutations";
import { ServiceWithDetails } from "@/types/service";
import { CheckCircleIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

interface ServiceArea {
  county: string;
  municipality?: string;
}

interface UpdateServiceModalProps {
  readonly service: ServiceWithDetails;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: () => void;
}

export default function UpdateServiceModal({
  service,
  open,
  onOpenChange,
  onSave,
}: UpdateServiceModalProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  const updateService = useUpdateService();
  const [error, setError] = useState<string | null>(null);
  const imageUploadRef = useRef<UnifiedImageUploadRef>(null);

  // Fetch service types from API
  const {
    data: serviceTypes,
    isLoading: serviceTypesLoading,
    error: serviceTypesError,
  } = useActiveServiceTypes();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    service_type_id: "",
    price_range_min: "",
    price_range_max: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    postalCode: "",
    postalPlace: "",
    latitude: null as number | null,
    longitude: null as number | null,
    countyId: "",
    municipalityId: "",
    areas: [] as ServiceArea[],
    images: [] as string[],
    is_active: true,
  });

  // Pre-fill form with service data
  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title || "",
        description: service.description || "",
        service_type_id: service.serviceTypeId || "",
        price_range_min: service.priceRangeMin?.toString() || "",
        price_range_max: service.priceRangeMax?.toString() || "",
        contact_name: service.contactName || "",
        contact_email: service.contactEmail || "",
        contact_phone: service.contactPhone || "",
        address: service.address || "",
        postalCode: service.postalCode || "",
        postalPlace: service.postalPlace || "",
        latitude: service.latitude || null,
        longitude: service.longitude || null,
        countyId: service.countyId || "",
        municipalityId: service.municipalityId || "",
        areas: service.areas.map((area) => ({
          county: area.county,
          municipality: area.municipality || "",
        })) || [{ county: "", municipality: "" }],
        images: service.images || [],
        is_active: service.isActive !== false,
      });
    }
  }, [service]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleAddressSelect = (addressData: {
    address: string;
    poststed: string;
    postalCode: string;
    fylke: string;
    municipality: string;
    kommuneNumber: string;
    lat: number;
    lon: number;
  }) => {
    setFormData((prev) => ({
      ...prev,
      address: addressData.address,
      postalPlace: addressData.poststed,
      postalCode: addressData.postalCode,
      latitude: addressData.lat,
      longitude: addressData.lon,
      // Store raw data for potential location mapping
      countyId: addressData.fylke,
      municipalityId: addressData.municipality,
    }));
    setError(null);
  };

  const handleAreaFylkeChange = (index: number, fylke: Fylke | null) => {
    setFormData((prev) => {
      const newAreas = [...prev.areas];
      newAreas[index] = {
        county: fylke?.id || "",
        municipality: "", // Reset municipality when county changes
      };
      return { ...prev, areas: newAreas };
    });
  };

  const handleAreaKommuneChange = (index: number, kommune: KommuneWithFylke | null) => {
    setFormData((prev) => {
      const newAreas = [...prev.areas];
      newAreas[index] = {
        ...newAreas[index],
        municipality: kommune?.id || "",
      };
      return { ...prev, areas: newAreas };
    });
  };

  const addArea = () => {
    setFormData((prev) => ({
      ...prev,
      areas: [...prev.areas, { county: "", municipality: "" }],
    }));
  };

  const removeArea = (index: number) => {
    if (formData.areas.length > 1) {
      const newAreas = formData.areas.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, areas: newAreas }));
    }
  };

  const handleImagesChange = (images: string[]) => {
    setFormData((prev) => ({ ...prev, images }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError("Tittel er påkrevd");
      return false;
    }

    if (!formData.description.trim()) {
      setError("Beskrivelse er påkrevd");
      return false;
    }

    if (!formData.service_type_id) {
      setError("Tjenestetype er påkrevd");
      return false;
    }

    if (!formData.contact_name.trim()) {
      setError("Kontaktnavn er påkrevd");
      return false;
    }

    // Validate that at least one area has a county selected
    const validAreas = formData.areas.filter((area) => area.county && area.county.trim() !== "");
    if (validAreas.length === 0) {
      setError("Minst ett dekningsområde er påkrevd");
      return false;
    }

    // Validate price ranges
    if (formData.price_range_min && formData.price_range_max) {
      const min = parseFloat(formData.price_range_min);
      const max = parseFloat(formData.price_range_max);
      if (min > max) {
        setError("Minimum pris kan ikke være høyere enn maksimum pris");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setError(null);

    try {
      // Upload any pending images first
      const imageUrls = (await imageUploadRef.current?.uploadPendingImages()) || formData.images;

      // Prepare the data - filter areas with valid county IDs
      const validAreas = formData.areas.filter((area) => area.county && area.county.trim() !== "");

      const serviceData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        service_type_id: formData.service_type_id,
        price_range_min: formData.price_range_min
          ? parseFloat(formData.price_range_min)
          : undefined,
        price_range_max: formData.price_range_max
          ? parseFloat(formData.price_range_max)
          : undefined,
        contact_name: formData.contact_name.trim(),
        contact_email: formData.contact_email.trim() || undefined,
        contact_phone: formData.contact_phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        postal_code: formData.postalCode.trim() || undefined,
        postal_place: formData.postalPlace.trim() || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        county_id: formData.countyId || undefined,
        municipality_id: formData.municipalityId || undefined,
        areas: validAreas,
        photos: imageUrls,
        is_active: formData.is_active,
      };

      await updateService.mutateAsync({ id: service.id, data: serviceData });

      onSave();
      handleClose();
    } catch (error) {
      console.error("Error updating service:", error);
      setError(
        `Feil ved oppdatering av tjeneste: ${
          error instanceof Error ? error.message : "Ukjent feil"
        }`
      );
    }
  };

  return (
    <Modal isOpen={open} onClose={() => onOpenChange(false)} title="Rediger tjeneste" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Grunnleggende informasjon</h3>

          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Tittel *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="f.eks. Veterinærtjenester i Oslo"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="service_type" className="block text-sm font-medium text-gray-700 mb-2">
              Tjenestetype *
            </label>
            {serviceTypesError ? (
              <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                Kunne ikke hente tjenestetyper. Prøv å laste siden på nytt.
              </div>
            ) : (
              <select
                id="service_type"
                name="service_type_id"
                value={formData.service_type_id}
                onChange={(e) => handleInputChange("service_type_id", e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                disabled={updateService.isPending || serviceTypesLoading}
              >
                {(() => {
                  if (serviceTypesLoading) {
                    return <option>Laster...</option>;
                  }
                  if (serviceTypes && serviceTypes.length > 0) {
                    return serviceTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.displayName}
                      </option>
                    ));
                  }
                  return <option>Ingen tjenestetyper tilgjengelig</option>;
                })()}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-2">
              Kontaktnavn eller firma *
            </label>
            <input
              type="text"
              id="contact_name"
              name="contact_name"
              value={formData.contact_name}
              onChange={(e) => handleInputChange("contact_name", e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="f.eks. Dr. Kari Nordmann"
            />
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Adresseinformasjon</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Søk etter adresse
            </label>
            <AddressSearch
              onAddressSelect={handleAddressSelect}
              placeholder="Begynn å skrive adressen..."
              initialValue={formData.address}
            />
          </div>

          {/* Show selected address if available */}
          {formData.address && (
            <div className="p-3 border border-green-200 rounded-md">
              <h4 className="text-sm font-medium text-green-800 mb-1">Valgt adresse:</h4>
              <p className="text-sm text-green-700">
                {formData.address}, {formData.postalCode} {formData.postalPlace}
              </p>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Kontaktinformasjon</h3>

          <div className="mb-4">
            <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-2">
              E-post (valgfritt)
            </label>
            <input
              type="email"
              id="contact_email"
              name="contact_email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange("contact_email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="kontakt@eksempel.no"
            />
          </div>

          <div>
            <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-2">
              Telefon (valgfritt)
            </label>
            <input
              type="tel"
              id="contact_phone"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={(e) => handleInputChange("contact_phone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="+47 123 45 678"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Beskrivelse *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            required
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Beskriv dine tjenester, erfaring, og hva du tilbyr..."
          />
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Prisområde (valgfritt)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="price_range_min"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Fra (NOK)
              </label>
              <input
                type="number"
                id="price_range_min"
                name="price_range_min"
                value={formData.price_range_min}
                onChange={(e) => handleInputChange("price_range_min", e.target.value)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="0"
              />
            </div>

            <div>
              <label
                htmlFor="price_range_max"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Til (NOK)
              </label>
              <input
                type="number"
                id="price_range_max"
                name="price_range_max"
                value={formData.price_range_max}
                onChange={(e) => handleInputChange("price_range_max", e.target.value)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Service Areas */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dekningsområder</h3>
          <p className="text-sm text-gray-600 mb-4">Velg områder hvor du tilbyr tjenester</p>

          <div className="space-y-4">
            {formData.areas.map((area, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Område {index + 1}</h4>
                  {formData.areas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArea(index)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <LocationSelector
                  selectedFylkeId={area.county || undefined}
                  selectedKommuneId={area.municipality || undefined}
                  onFylkeChange={(fylke) => handleAreaFylkeChange(index, fylke)}
                  onKommuneChange={(kommune) => handleAreaKommuneChange(index, kommune)}
                  disabled={updateService.isPending}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={addArea}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-700"
              disabled={updateService.isPending}
            >
              <PlusIcon className="h-4 w-4" />
              Legg til område
            </button>
          </div>
        </div>

        {/* Active Status */}
        <div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange("is_active", e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Tjenesten er aktiv</span>
                <div className="text-xs text-gray-500 mt-0.5">Synlig for kunder når aktivert</div>
              </div>
            </label>
            {formData.is_active && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
          </div>
        </div>

        {/* Images */}
        <div>
          <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
            Bilder
          </label>
          <div id="images">
            <UnifiedImageUpload
              ref={imageUploadRef}
              images={formData.images}
              onChange={handleImagesChange}
              maxImages={6}
              entityType="service"
              title="Administrer tjenestebilder"
              mode="inline"
              hideUploadButton={true}
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={updateService.isPending}
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={updateService.isPending}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {updateService.isPending ? "Lagrer..." : "Lagre endringer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
