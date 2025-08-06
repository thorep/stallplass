"use client";

import Button from "@/components/atoms/Button";
import { Modal } from "@/components/ui/modal";
import type { ImageUploadData } from "@/components/ui/enhanced-image-upload";
import EnhancedImageUploadWrapper from "@/components/ui/enhanced-image-upload-wrapper";
import { useBoxAmenities } from "@/hooks/useAmenities";
import { useCreateBox, useUpdateBox } from "@/hooks/useBoxMutations";
import { Box, BoxWithAmenities } from "@/types/stable";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
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
        images: (currentBox.images || []).map((url) => ({
          file: new File([], ""),
          preview: url,
          description: "",
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
          images: formData.images.map((img) => img.preview),
          imageDescriptions: formData.images.map((img) => img.description || ""),
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
          images: formData.images.map((img) => img.preview),
          imageDescriptions: formData.images.map((img) => img.description || ""),
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
    <Modal 
      isOpen={open} 
      onClose={() => onOpenChange(false)}
      title={box ? "Rediger stallplass" : "Legg til ny stallplass"}
      maxWidth="xl"
    >
      <div className="text-body-sm text-slate-600 mb-6">
        {box
          ? "Oppdater informasjon om denne stallplassen"
          : "Legg til en ny stallplass i din stall"}
      </div>

      <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        <form onSubmit={handleSubmit} className="space-y-6">

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
                <FormControl 
                  fullWidth 
                  size="small"
                  data-cy="box-size-select"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '0.5rem',
                      backgroundColor: 'white',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#0f172a',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      '&.Mui-focused': {
                        color: '#6366f1',
                      },
                    },
                  }}
                >
                  <InputLabel>Størrelse</InputLabel>
                  <Select
                    name="size"
                    value={formData.size}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, size: e.target.value as string }));
                    }}
                    label="Størrelse"
                  >
                    <MenuItem value="">Ikke spesifisert</MenuItem>
                    <MenuItem value="SMALL">Liten</MenuItem>
                    <MenuItem value="MEDIUM">Middels (ca 3x3m)</MenuItem>
                    <MenuItem value="LARGE">Stor</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <div>
                <FormControl 
                  fullWidth 
                  size="small"
                  required
                  data-cy="box-type-select"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '0.5rem',
                      backgroundColor: 'white',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#0f172a',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      '&.Mui-focused': {
                        color: '#6366f1',
                      },
                    },
                  }}
                >
                  <InputLabel>Type boks *</InputLabel>
                  <Select
                    name="boxType"
                    value={formData.boxType}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, boxType: e.target.value as "BOKS" | "UTEGANG" }));
                    }}
                    label="Type boks *"
                  >
                    <MenuItem value="BOKS">Boks</MenuItem>
                    <MenuItem value="UTEGANG">Utegang</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <div>
                <FormControl 
                  fullWidth 
                  size="small"
                  data-cy="box-max-horse-size-select"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '0.5rem',
                      backgroundColor: 'white',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#0f172a',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      '&.Mui-focused': {
                        color: '#6366f1',
                      },
                    },
                  }}
                >
                  <InputLabel>Maks hestestørrelse</InputLabel>
                  <Select
                    name="maxHorseSize"
                    value={formData.maxHorseSize}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, maxHorseSize: e.target.value as string }));
                    }}
                    label="Maks hestestørrelse"
                  >
                    <MenuItem value="">Ikke spesifisert</MenuItem>
                    <MenuItem value="Pony">Ponni</MenuItem>
                    <MenuItem value="Small">Liten hest</MenuItem>
                    <MenuItem value="Medium">Middels hest</MenuItem>
                    <MenuItem value="Large">Stor hest</MenuItem>
                  </Select>
                </FormControl>
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
                {createBox.isPending || updateBox.isPending
                  ? "Lagrer..."
                  : box
                  ? "Oppdater boks"
                  : "Opprett boks"}
              </button>
            </div>
          </form>
        </div>
    </Modal>
  );
}
