"use client";

import Button from "@/components/atoms/Button";
import EnhancedImageUploadWrapper from '@/components/ui/enhanced-image-upload-wrapper';
import type { ImageUploadData } from '@/components/ui/enhanced-image-upload';
import { useBoxAmenities } from "@/hooks/useAmenities";
import { useCreateBox, useUpdateBox } from "@/hooks/useBoxMutations";
import { Box, BoxWithAmenities } from "@/types/stable";
import { ExclamationTriangleIcon, SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Real-time functionality only exists for chat, not for boxes

interface BoxManagementModalProps {
  readonly stableId: string;
  readonly box?: Box | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: () => void;
}

export default function BoxManagementModal({
  stableId,
  box,
  open,
  onOpenChange,
  onSave,
}: BoxManagementModalProps) {
  const handleClose = () => {
    onOpenChange(false);
  };
  const { data: amenities = [] } = useBoxAmenities();
  const createBox = useCreateBox();
  const updateBox = useUpdateBox();
  const [error, setError] = useState<string | null>(null);
  const [showFreeNotice, setShowFreeNotice] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('boxCreationNoticeDismissed');
    }
    return true;
  });

  // Use the box data directly (no real-time updates for boxes)
  const currentBox = box;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    size: "",
    sizeText: "",
    boxType: "BOKS" as "BOKS" | "UTEGANG",
    isAvailable: true,
    maxHorseSize: "",
    specialNotes: "",
    images: [] as ImageUploadData[],
    selectedAmenityIds: [] as string[],
  });

  // Amenities are now loaded via TanStack Query

  // Pre-fill form if editing existing box (use real-time data)
  useEffect(() => {
    if (currentBox) {
      // Extract amenity IDs from the box's amenities
      const boxWithAmenities = currentBox as BoxWithAmenities;
      const amenityIds = boxWithAmenities.amenities
        ? boxWithAmenities.amenities.map((amenityLink) => amenityLink.amenity.id)
        : [];

      setFormData({
        name: currentBox.name,
        description: currentBox.description || "",
        price: currentBox.price.toString(),
        size: currentBox.size || "",
        sizeText: currentBox.sizeText || "",
        boxType: currentBox.boxType || "BOKS",
        isAvailable: currentBox.isAvailable ?? true,
        maxHorseSize: currentBox.maxHorseSize || "",
        specialNotes: currentBox.specialNotes || "",
        images: (currentBox.images || []).map(url => ({ 
          file: new File([], ''), 
          preview: url, 
          description: ''
        })),
        selectedAmenityIds: amenityIds,
      });
    }
  }, [currentBox]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;

      // Check for conflicts when toggling availability
      if (name === "isAvailable" && !checkbox.checked && currentBox) {
        // TODO: Implement conflict checking logic
        // For now, just allow the change
      }

      setFormData((prev) => ({
        ...prev,
        [name]: checkbox.checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImagesChange = (images: ImageUploadData[]) => {
    setFormData((prev) => ({
      ...prev,
      images,
    }));
  };

  const handleAmenityToggle = (amenityId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedAmenityIds: prev.selectedAmenityIds.includes(amenityId)
        ? prev.selectedAmenityIds.filter((id) => id !== amenityId)
        : [...prev.selectedAmenityIds, amenityId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (box) {
        // Update existing box
        const updateData = {
          id: box.id,
          name: formData.name,
          description: formData.description || undefined,
          price: parseInt(formData.price),
          size: formData.size ? (formData.size as "SMALL" | "MEDIUM" | "LARGE") : undefined,
          sizeText: formData.sizeText || undefined,
          boxType: formData.boxType,
          isAvailable: formData.isAvailable,
          maxHorseSize: formData.maxHorseSize || undefined,
          specialNotes: formData.specialNotes || undefined,
          images: formData.images.map(img => img.preview),
          imageDescriptions: formData.images.map(img => img.description || ""),
          amenityIds: formData.selectedAmenityIds,
        };
        await updateBox.mutateAsync(updateData);
      } else {
        // Create new box
        const createData = {
          stableId,
          name: formData.name,
          description: formData.description || undefined,
          price: parseInt(formData.price),
          size: formData.size ? (formData.size as "SMALL" | "MEDIUM" | "LARGE") : undefined,
          sizeText: formData.sizeText || undefined,
          boxType: formData.boxType,
          isAvailable: formData.isAvailable,
          maxHorseSize: formData.maxHorseSize || undefined,
          specialNotes: formData.specialNotes || undefined,
          images: formData.images.map(img => img.preview),
          imageDescriptions: formData.images.map(img => img.description || ""),
          amenityIds: formData.selectedAmenityIds,
        };
        await createBox.mutateAsync(createData);
      }

      onSave();
      handleClose();
    } catch {
      setError("Feil ved lagring av boks. Prøv igjen.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw] max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-h3">
            {box ? "Rediger stallplass" : "Legg til ny stallplass"}
          </DialogTitle>
          <DialogDescription className="text-body-sm">
            {box ? "Oppdater informasjon om denne stallplassen" : "Legg til en ny stallplass i din stall"}
          </DialogDescription>
          {!box && showFreeNotice && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-4 relative">
              <button
                onClick={() => {
                  setShowFreeNotice(false);
                  localStorage.setItem('boxCreationNoticeDismissed', 'true');
                }}
                className="absolute top-2 right-2 text-emerald-600 hover:text-emerald-800 transition-colors"
                aria-label="Lukk melding"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <div className="flex items-start pr-8">
                <svg className="h-5 w-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-emerald-800 mb-1">Helt gratis å opprette stallplasser!</h4>
                  <p className="text-sm text-emerald-700">
                    Du kan opprette så mange stallplasser du vil uten kostnad. Du betaler først når du velger å annonsere dem aktivt på plattformen.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto mt-6 pr-2">
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Real-time conflict warnings */}
          {currentBox && false && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Aktivt leieforhold</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Denne boksen har et aktivt leieforhold. Vær forsiktig med endringer som kan
                    påvirke leietakeren.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Navn på boks *
              </label>
              <input
                type="text"
                name="name"
                data-cy="box-name-input"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="F.eks. Boks 1, Premium Stall A"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Pris per måned (NOK) *
              </label>
              <input
                type="number"
                name="price"
                data-cy="box-price-input"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                placeholder="5000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Størrelse</label>
              <select
                name="size"
                data-cy="box-size-select"
                value={formData.size}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Ikke spesifisert</option>
                <option value="SMALL">Liten</option>
                <option value="MEDIUM">Middels (ca 3x3m)</option>
                <option value="LARGE">Stor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Type boks *</label>
              <select
                name="boxType"
                data-cy="box-type-select"
                value={formData.boxType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="BOKS">Boks</option>
                <option value="UTEGANG">Utegang</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Maks hestestørrelse
              </label>
              <select
                name="maxHorseSize"
                data-cy="box-max-horse-size-select"
                value={formData.maxHorseSize}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Ikke spesifisert</option>
                <option value="Pony">Ponni</option>
                <option value="Small">Liten hest</option>
                <option value="Medium">Middels hest</option>
                <option value="Large">Stor hest</option>
              </select>
            </div>
          </div>

          {/* Size Text Field */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Størrelse beskrivelse (valgfritt)
            </label>
            <input
              type="text"
              name="sizeText"
              data-cy="box-size-text-input"
              value={formData.sizeText}
              onChange={handleInputChange}
              placeholder="F.eks. 3.5x3.5m, innvendige mål 12m², med høyt tak"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Beskriv størrelsen mer detaljert for å gi potensielle leietakere bedre informasjon
            </p>
          </div>

          {/* Description and Special Notes side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Beskrivelse</label>
              <textarea
                name="description"
                data-cy="box-description-textarea"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Spesielle egenskaper eller merknader om denne boksen..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Spesielle merknader
              </label>
              <textarea
                name="specialNotes"
                value={formData.specialNotes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Spesielle krav eller informasjon om denne boksen..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Availability Status - Keep this as it's core business logic */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-slate-900 mb-3">Status</h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isAvailable"
                  data-cy="box-available-checkbox"
                  checked={formData.isAvailable}
                  onChange={handleInputChange}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium">Tilgjengelig for leie</span>
              </label>
              <div className="text-xs text-slate-600 max-w-md text-right">
                <strong>Merk:</strong> For å annonsere bokser aktivt på plattformen trengs en
                annonsepakke. Kontakt support for mer informasjon.
              </div>
            </div>
          </div>

          {/* Box Amenities */}
          {amenities.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Boks-fasiliteter</h3>
              <p className="text-sm text-slate-600 mb-4">
                Velg hvilke fasiliteter som er tilgjengelige for denne boksen
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {amenities.map((amenity: { id: string; name: string }) => (
                  <label
                    key={amenity.id}
                    className="flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedAmenityIds.includes(amenity.id)}
                      onChange={() => handleAmenityToggle(amenity.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      data-cy={`box-amenity-${amenity.id}`}
                    />
                    <span className="text-sm text-slate-700">{amenity.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}


          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bilder</label>
            <EnhancedImageUploadWrapper
              images={formData.images}
              onChange={handleImagesChange}
              maxImages={10}
              entityType="box"
              entityId={box?.id}
            />
          </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
              <Button variant="outline" onClick={handleClose} className="min-w-[100px]">
                Avbryt
              </Button>
              <button
                type="submit"
                disabled={createBox.isPending || updateBox.isPending}
                data-cy="save-box-button"
                className="min-w-[150px] px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="w-4 h-4" />
                {createBox.isPending || updateBox.isPending ? "Lagrer..." : box ? "Oppdater boks" : "Opprett boks"}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
