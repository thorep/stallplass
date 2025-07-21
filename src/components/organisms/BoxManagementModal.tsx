'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { Box } from '@/types/stable';
import { useBoxAmenities, useCreateBox, useUpdateBox } from '@/hooks/useQueries';
import ImageUpload from '@/components/molecules/ImageUpload';
import { useRealTimeBoxAvailability, useBoxConflictPrevention } from '@/hooks/useRealTimeBoxes';

interface BoxManagementModalProps {
  stableId: string;
  box?: Box | null;
  onClose: () => void;
  onSave: () => void;
}

export default function BoxManagementModal({ stableId, box, onClose, onSave }: BoxManagementModalProps) {
  const { data: amenities = [] } = useBoxAmenities();
  const createBox = useCreateBox();
  const updateBox = useUpdateBox();
  const [error, setError] = useState<string | null>(null);
  
  // Real-time availability updates for existing box
  const { box: realTimeBox } = useRealTimeBoxAvailability(box?.id || '', !!box);
  
  // Conflict prevention for existing box
  const { conflicts, checkForConflicts } = useBoxConflictPrevention(box?.id || '', !!box);
  
  // Use real-time data if available, otherwise fall back to initial data
  const currentBox = realTimeBox || box;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    grunnpris: '',
    size: '',
    boxType: 'BOKS' as 'BOKS' | 'UTEGANG',
    isAvailable: true,
    maxHorseSize: '',
    specialNotes: '',
    images: [] as string[],
    selectedAmenityIds: [] as string[]
  });

  // Amenities are now loaded via TanStack Query

  // Pre-fill form if editing existing box (use real-time data)
  useEffect(() => {
    if (currentBox) {
      setFormData({
        name: currentBox.name,
        description: currentBox.description || '',
        grunnpris: currentBox.grunnpris.toString(),
        size: currentBox.size?.toString() || '',
        boxType: currentBox.stallplass_type || 'BOKS',
        isAvailable: currentBox.er_tilgjengelig ?? true,
        maxHorseSize: currentBox.maks_hest_storrelse || '',
        specialNotes: currentBox.spesielle_notater || '',
        images: currentBox.images || [],
        selectedAmenityIds: [] // TODO: Fix amenities typing
      });
    }
  }, [currentBox]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      
      // Check for conflicts when toggling availability
      if (name === 'isAvailable' && !checkbox.checked && currentBox) {
        const conflictCheck = checkForConflicts('make_unavailable');
        if (conflictCheck.hasConflicts) {
          setError(conflictCheck.conflicts.join(', '));
          return; // Don't update the form data
        }
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({
      ...prev,
      images
    }));
  };

  const handleAmenityToggle = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedAmenityIds: prev.selectedAmenityIds.includes(amenityId)
        ? prev.selectedAmenityIds.filter(id => id !== amenityId)
        : [...prev.selectedAmenityIds, amenityId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const boxData = {
        name: formData.name,
        description: formData.description || undefined,
        grunnpris: parseInt(formData.grunnpris),
        size: formData.size ? parseFloat(formData.size) : undefined,
        boxType: formData.boxType,
        isAvailable: formData.isAvailable,
        // Provide default values for hardcoded fields (these should be moved to dynamic amenities)
        isIndoor: box?.er_innendors ?? true,
        hasWindow: box?.har_vindu ?? false,
        hasElectricity: box?.har_strom ?? false,
        hasWater: box?.har_vann ?? false,
        maxHorseSize: formData.maxHorseSize || undefined,
        specialNotes: formData.specialNotes || undefined,
        images: formData.images,
        imageDescriptions: formData.images.map(() => ''), // Empty descriptions for now
        stableId,
        amenityIds: formData.selectedAmenityIds,
        ...(box && { id: box.id })
      };

      if (box) {
        await updateBox.mutateAsync({ ...boxData, id: box.id });
      } else {
        const { id, ...createData } = boxData;
        void id; // Explicitly mark as intentionally unused
        await createBox.mutateAsync(createData);
      }

      onSave();
    } catch (err) {
      setError('Feil ved lagring av boks. Prøv igjen.');
      console.error('Error saving box:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {box ? 'Rediger boks' : 'Legg til ny boks'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Real-time conflict warnings */}
          {currentBox && conflicts.hasActiveRental && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Aktivt leieforhold</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Denne boksen har et aktivt leieforhold. Vær forsiktig med endringer som kan påvirke leietakeren.
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

          {/* Real-time status indicator for existing boxes */}
          {currentBox && realTimeBox && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                <p className="text-sm text-blue-700">
                  Sanntidsoppdateringer er aktive for denne boksen
                </p>
              </div>
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
                name="grunnpris"
                value={formData.grunnpris}
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
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Størrelse (m²)
              </label>
              <input
                type="number"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                step="0.1"
                placeholder="12.5"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Type boks *
              </label>
              <select
                name="boxType"
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

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Beskrivelse
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Spesielle egenskaper eller merknader om denne boksen..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Availability Status - Keep this as it's core business logic */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleInputChange}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm">Tilgjengelig for leie</span>
              </label>
            </div>
            <div className="mt-2 text-xs text-slate-600">
              <div><strong>Merk:</strong> For å annonsere bokser aktivt på plattformen trengs en annonsepakke. Kontakt support for mer informasjon.</div>
            </div>
          </div>

          {/* Box Amenities */}
          {amenities.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Boks-fasiliteter</h3>
              <p className="text-sm text-slate-600 mb-4">
                Velg hvilke fasiliteter som er tilgjengelige for denne boksen
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                    />
                    <span className="text-sm text-slate-700">{amenity.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Special Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Spesielle merknader
            </label>
            <textarea
              name="specialNotes"
              value={formData.specialNotes}
              onChange={handleInputChange}
              rows={2}
              placeholder="Spesielle krav eller informasjon om denne boksen..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bilder
            </label>
            <ImageUpload
              images={formData.images}
              onChange={handleImagesChange}
              maxImages={10}
              bucket="boximages"
              folder="boxes"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              loading={createBox.isPending || updateBox.isPending}
              disabled={createBox.isPending || updateBox.isPending}
            >
              {box ? 'Oppdater boks' : 'Opprett boks'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}