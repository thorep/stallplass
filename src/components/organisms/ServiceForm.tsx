"use client";

import Button from "@/components/atoms/Button";
import LocationSelector from "@/components/molecules/LocationSelector";
import AddressSearch from "@/components/molecules/AddressSearch";
import { UnifiedImageUpload, UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import { FeedbackLink } from "@/components/ui/feedback-link";
import type { Fylke, KommuneWithFylke } from "@/hooks/useLocationQueries";
import { useActiveServiceTypes } from "@/hooks/usePublicServiceTypes";
import { useCreateService, useUpdateService } from "@/hooks/useServiceMutations";
import { StorageService } from "@/services/storage-service";
import { ServiceWithDetails } from "@/types/service";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ServiceFormProps {
  service?: ServiceWithDetails;
  onSuccess?: (service: ServiceWithDetails) => void;
  onCancel?: () => void;
  user: User;
}

interface ServiceArea {
  county: string; // County ID
  municipality?: string; // Municipality ID (optional)
}

export default function ServiceForm({ service, onSuccess, onCancel, user }: ServiceFormProps) {
  const router = useRouter();
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();

  // Fetch service types from API
  const {
    data: serviceTypes,
    isLoading: serviceTypesLoading,
    error: serviceTypesError,
  } = useActiveServiceTypes();

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    service_type_id: string;
    price_range_min: string;
    price_range_max: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    areas: ServiceArea[];
    photos: string[];
    is_active: boolean;
    address: string;
    postalCode: string;
    postalPlace: string;
    latitude: number;
    longitude: number;
    countyId: string;
    municipalityId: string;
  }>({
    title: service?.title || "",
    description: service?.description || "",
    service_type_id: "", // Will be set when service types load
    price_range_min: service?.priceRangeMin?.toString() || "",
    price_range_max: service?.priceRangeMax?.toString() || "",
    contact_name: service?.contactName || "",
    contact_email: service?.contactEmail || user?.email || "",
    contact_phone: service?.contactPhone || "",
    areas: service?.areas.map((area) => ({
      county: area.county || "",
      municipality: area.municipality || "",
    })) || [{ county: "", municipality: "" }],
    photos: service?.images || ([] as string[]),
    is_active: service?.isActive !== false,
    address: service?.address || "",
    postalCode: service?.postalCode || "",
    postalPlace: service?.postalPlace || "",
    latitude: service?.latitude || 0,
    longitude: service?.longitude || 0,
    countyId: service?.countyId || "",
    municipalityId: service?.municipalityId || "",
  });

  // Update form data when service types are loaded and no existing service
  useEffect(() => {
    if (!service && serviceTypes && serviceTypes.length > 0 && !formData.service_type_id) {
      // Set to first available service type if no service type is selected
      const firstServiceType = serviceTypes[0];
      if (firstServiceType) {
        setFormData((prev) => ({
          ...prev,
          service_type_id: firstServiceType.id,
        }));
      }
    }
  }, [serviceTypes, service, formData.service_type_id]);

  const isLoading = createServiceMutation.isPending || updateServiceMutation.isPending;
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const hasUnsavedImages = useRef(false);
  const cleanupInProgress = useRef(false);
  const imageUploadRef = useRef<UnifiedImageUploadRef>(null);

  // Cleanup function to delete orphaned images
  const cleanupUploadedImages = useCallback(async () => {
    if (cleanupInProgress.current || formData.photos.length === 0) {
      return;
    }

    cleanupInProgress.current = true;

    try {
      for (const imageUrl of formData.photos) {
        try {
          await StorageService.deleteImageByUrl(imageUrl);
        } catch {
          // Silently ignore cleanup errors - best effort cleanup
        }
      }
    } finally {
      cleanupInProgress.current = false;
    }
  }, [formData.photos]);

  // Handle page unload - warn user and attempt cleanup
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedImages.current) {
        e.preventDefault();
        e.returnValue = "Du har ulagrede bilder. Er du sikker på at du vil forlate siden?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (hasUnsavedImages.current && !cleanupInProgress.current) {
      }
    };
  }, [cleanupUploadedImages]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
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
    setFormData((prev) => ({ ...prev, photos: images }));
    hasUnsavedImages.current = true;
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
      postalCode: addressData.postalCode,
      postalPlace: addressData.poststed,
      latitude: addressData.lat,
      longitude: addressData.lon,
      // Note: We would need to look up countyId and municipalityId from the database
      // based on the kommuneNumber, but for now we store the names
      countyId: "", // TODO: Look up actual ID
      municipalityId: "", // TODO: Look up actual ID
    }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push("Tittel er påkrevd");
    }

    if (!formData.description.trim()) {
      errors.push("Beskrivelse er påkrevd");
    }

    if (!formData.service_type_id) {
      errors.push("Tjenestetype er påkrevd");
    }

    if (!formData.contact_name.trim()) {
      errors.push("Kontaktnavn er påkrevd");
    }

    // Validate that at least one area has a county selected
    const validAreas = formData.areas.filter((area) => area.county && area.county.trim() !== "");
    if (validAreas.length === 0) {
      errors.push("Minst ett dekningsområde er påkrevd");
    }

    // Validate price ranges
    if (formData.price_range_min && formData.price_range_max) {
      const min = parseFloat(formData.price_range_min);
      const max = parseFloat(formData.price_range_max);
      if (min > max) {
        errors.push("Minimum pris kan ikke være høyere enn maksimum pris");
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return false;
    }

    return true;
  };

  // Real-time form validation (without setting errors)
  const isFormValid = useMemo(() => {
    // Check required fields
    const hasRequiredFields =
      formData.title.trim() &&
      formData.description.trim() &&
      formData.service_type_id &&
      formData.contact_name.trim();

    if (!hasRequiredFields) {
      return false;
    }

    // Check that at least one area has a county ID selected
    const validAreas = formData.areas.filter((area) => area.county && area.county.trim() !== "");

    if (validAreas.length === 0) {
      return false;
    }

    // Check price range validity
    if (formData.price_range_min && formData.price_range_max) {
      const min = parseFloat(formData.price_range_min);
      const max = parseFloat(formData.price_range_max);
      if (min > max) {
        return false;
      }
    }

    return true;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setValidationErrors([]);

    if (!validateForm()) {
      return;
    }

    if (!user) {
      setError("Du må være logget inn for å opprette en tjeneste");
      return;
    }

    try {
      // Upload any pending images first
      const photoUrls = (await imageUploadRef.current?.uploadPendingImages()) || formData.photos;

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
        areas: validAreas,
        photos: photoUrls,
        is_active: formData.is_active,
        address: formData.address.trim() || undefined,
        postalCode: formData.postalCode || undefined,
        postalPlace: formData.postalPlace || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        countyId: formData.countyId || undefined,
        municipalityId: formData.municipalityId || undefined,
      };
      const result = service
        ? await updateServiceMutation.mutateAsync({ id: service.id, data: serviceData })
        : await createServiceMutation.mutateAsync(serviceData);
      hasUnsavedImages.current = false; // Mark images as saved

      if (onSuccess) {
        onSuccess(result as unknown as ServiceWithDetails);
      } else {
        router.push("/dashboard?tab=services");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "En feil oppstod");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-md">
            <p className="text-error">{error}</p>
          </div>
        )}

        {/* Basic Information Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Grunnleggende informasjon</h3>
          
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Tittel *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="f.eks. Veterinærtjenester i Oslo"
              disabled={isLoading}
            />
          </div>

          <div className="mb-6">
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
                value={formData.service_type_id}
                onChange={(e) => handleInputChange("service_type_id", e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                disabled={isLoading || serviceTypesLoading}
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
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Kontaktinformasjon</h3>
          <p className="text-sm text-gray-600 mb-6">
            Denne informasjonen vises på tjenestesiden for potensielle kunder.
          </p>

          <div className="mb-6">
            <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-2">
              Kontaktnavn eller firma *
            </label>
            <input
              type="text"
              id="contact_name"
              value={formData.contact_name}
              onChange={(e) => handleInputChange("contact_name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="f.eks. Dr. Kari Nordmann eller Nordmann Veterinærklinikk"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-2">
                E-post (valgfritt)
              </label>
              <input
                type="email"
                id="contact_email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange("contact_email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="kontakt@eksempel.no"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefon (valgfritt)
              </label>
              <input
                type="tel"
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="+47 123 45 678"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏠 Adresseinformasjon</h3>
          <p className="text-sm text-gray-600 mb-6">
            Legg til en adresse hvor tjenesten utføres eller hvor kunder kan møte deg.
          </p>

          <div className="mb-6">
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
            <div className="p-3 bg-green-50 border border-green-200 rounded-md mb-6">
              <h4 className="text-sm font-medium text-green-800 mb-1">Valgt adresse:</h4>
              <p className="text-sm text-green-700">
                {formData.address}, {formData.postalCode} {formData.postalPlace}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Beskrivelse *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Beskriv dine tjenester, erfaring, og hva du tilbyr..."
            disabled={isLoading}
          />
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prisområde (valgfritt)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <input
                type="number"
                value={formData.price_range_min}
                onChange={(e) => handleInputChange("price_range_min", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Fra (NOK)"
                min="0"
                disabled={isLoading}
              />
            </div>
            <div>
              <input
                type="number"
                value={formData.price_range_max}
                onChange={(e) => handleInputChange("price_range_max", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Til (NOK)"
                min="0"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Service Areas */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📍 Dekningsområder</h3>
          <p className="text-sm text-gray-600 mb-6">
            Velg fylke og eventuelt spesifikk kommune du tilbyr tjenester i.
          </p>
          {formData.areas.map((area, index) => (
            <div
              key={`area-${index}-${area.county || "new"}`}
              className="border border-gray-200 rounded-lg p-4 mb-4"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-medium text-gray-900">Område {index + 1}</h4>
                {formData.areas.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArea(index)}
                    disabled={isLoading}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <LocationSelector
                selectedFylkeId={area.county ? area.county : undefined}
                selectedKommuneId={
                  area.municipality && area.municipality !== "" ? area.municipality : undefined
                }
                onFylkeChange={(fylke) => handleAreaFylkeChange(index, fylke)}
                onKommuneChange={(kommune) => handleAreaKommuneChange(index, kommune)}
                disabled={isLoading}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addArea}
            className="mt-2"
            disabled={isLoading}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Legg til område
          </Button>
          <p className="text-xs text-gray-500 mt-4">
            La kommune stå på &quot;Hele fylket&quot; hvis du dekker hele fylket.
          </p>
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bilder og beskrivelser</label>
          <UnifiedImageUpload
            ref={imageUploadRef}
            images={formData.photos}
            onChange={handleImagesChange}
            maxImages={6}
            entityType="service"
            title="Administrer tjenestebilder"
            mode="inline"
            hideUploadButton={true}
          />
          <p className="text-xs text-gray-500 mt-2">
            Last opp bilder som viser ditt arbeid, utstyr, eller deg i aksjon.
          </p>
        </div>

        {/* Active Status (only for editing) */}
        {service && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange("is_active", e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
              disabled={isLoading}
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Tjenesten er aktiv og synlig for kunder
            </label>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            {validationErrors.map((error) => (
              <p key={error} className="text-red-600 text-sm">
                • {error}
              </p>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Avbryt
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={isLoading || !isFormValid}>
            {isLoading ? "Lagrer..." : service ? "Oppdater" : "Opprett"}
          </Button>
        </div>

        <div className="mt-4 text-center">
          <FeedbackLink />
        </div>
      </form>
    </div>
  );
}
