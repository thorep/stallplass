'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { Box, BoxAmenity } from '@/types/stable';

interface BoxManagementModalProps {
  stableId: string;
  box?: Box | null;
  onClose: () => void;
  onSave: () => void;
}

export default function BoxManagementModal({ stableId, box, onClose, onSave }: BoxManagementModalProps) {
  const [amenities, setAmenities] = useState<BoxAmenity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    size: '',
    isAvailable: true,
    isActive: false,
    maxHorseSize: '',
    specialNotes: '',
    images: [''],
    selectedAmenityIds: [] as string[]
  });

  // Load box amenities
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const response = await fetch('/api/box-amenities');
        if (response.ok) {
          const amenitiesData = await response.json();
          setAmenities(amenitiesData);
        }
      } catch (error) {
        console.error('Error fetching amenities:', error);
      }
    };

    fetchAmenities();
  }, []);

  // Pre-fill form if editing existing box
  useEffect(() => {
    if (box) {
      setFormData({
        name: box.name,
        description: box.description || '',
        price: box.price.toString(),
        size: box.size?.toString() || '',
        isAvailable: box.isAvailable,
        isActive: box.isActive,
        maxHorseSize: box.maxHorseSize || '',
        specialNotes: box.specialNotes || '',
        images: box.images.length > 0 ? box.images : [''],
        selectedAmenityIds: box.amenities.map(a => a.amenity.id)
      });
    }
  }, [box]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
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

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const removeImageField = (index: number) => {
    if (formData.images.length > 1) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
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
    setLoading(true);
    setError(null);

    try {
      const boxData = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseInt(formData.price),
        size: formData.size ? parseFloat(formData.size) : undefined,
        isAvailable: formData.isAvailable,
        isActive: formData.isActive,
        // Provide default values for hardcoded fields (these should be moved to dynamic amenities)
        isIndoor: box?.isIndoor ?? true,
        hasWindow: box?.hasWindow ?? false,
        hasDoor: box?.hasDoor ?? true,
        hasElectricity: box?.hasElectricity ?? false,
        hasWater: box?.hasWater ?? false,
        maxHorseSize: formData.maxHorseSize || undefined,
        specialNotes: formData.specialNotes || undefined,
        images: formData.images.filter(img => img.trim() !== ''),
        stableId,
        amenityIds: formData.selectedAmenityIds,
        ...(box && { id: box.id })
      };

      const url = box ? `/api/boxes/${box.id}` : '/api/boxes';
      const method = box ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(boxData)
      });

      if (!response.ok) {
        throw new Error('Failed to save box');
      }

      onSave();
    } catch (err) {
      setError('Feil ved lagring av boks. Prøv igjen.');
      console.error('Error saving box:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                placeholder="5000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>

          {/* Box Amenities */}
          {amenities.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Boks-fasiliteter</h3>
              <p className="text-sm text-slate-600 mb-4">
                Velg hvilke fasiliteter som er tilgjengelige for denne boksen
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenities.map((amenity) => (
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
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Bilder (URL-er)
            </label>
            {formData.images.map((image, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="url"
                  value={image}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  placeholder="https://example.com/box-image.jpg"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {formData.images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImageField(index)}
                    className="ml-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Fjern
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addImageField}
              className="text-indigo-600 hover:text-indigo-700 text-sm"
            >
              + Legg til bilde
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              loading={loading}
              disabled={loading}
            >
              {box ? 'Oppdater boks' : 'Opprett boks'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}