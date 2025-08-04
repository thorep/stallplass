'use client';

import { useState } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useStable } from '@/hooks/useStables';
import { useUpdateStable } from '@/hooks/useStableMutations';
import ImageUpload from './ImageUpload';
import Image from 'next/image';

interface ImageWithDescription {
  url: string;
  description: string;
}

interface InlinePhotoUploadProps {
  stableId: string;
  currentImages: string[];
  onPhotosAdded: (newImages: string[]) => void;
  onClose: () => void;
  maxImages?: number;
}

export default function InlinePhotoUpload({
  stableId,
  currentImages,
  onPhotosAdded,
  onClose,
  maxImages = 10
}: InlinePhotoUploadProps) {
  const { data: stable } = useStable(stableId);
  const updateStableMutation = useUpdateStable();
  const [error, setError] = useState<string | null>(null);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [imageDescriptions, setImageDescriptions] = useState<ImageWithDescription[]>([]);

  const handleImageUpload = (images: string[]) => {
    setNewImages(images);
    // Create description objects for new images
    const descriptionsArray = images.map(url => ({
      url,
      description: ''
    }));
    setImageDescriptions(descriptionsArray);
  };

  const handleDescriptionChange = (url: string, description: string) => {
    setImageDescriptions(prev => 
      prev.map(item => 
        item.url === url ? { ...item, description } : item
      )
    );
  };

  const handleSave = async () => {
    if (newImages.length === 0) {
      onClose();
      return;
    }

    if (!stable) {
      setError('Stable data not loaded');
      return;
    }

    setError(null);
    const updatedImages = [...currentImages, ...newImages];
    
    // Combine existing descriptions with new ones
    const existingDescriptions = stable.imageDescriptions || [];
    const newDescriptionsArray = newImages.map(url => {
      const descObj = imageDescriptions.find(item => item.url === url);
      return descObj?.description || '';
    });
    const updatedDescriptions = [...existingDescriptions, ...newDescriptionsArray];

    try {
      await updateStableMutation.mutateAsync({
        id: stableId,
        data: {
          ...stable,
          images: updatedImages,
          imageDescriptions: updatedDescriptions,
        }
      });

      onPhotosAdded(updatedImages);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save photos');
    }
  };

  const remainingSlots = maxImages - currentImages.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-auto shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Legg til bilder</h3>
              <p className="text-sm text-slate-600 mt-1">
                Du kan laste opp {remainingSlots} bilder til ({currentImages.length}/{maxImages} brukt)
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={updateStableMutation.isPending}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Upload Area */}
          <div className="mb-6">
            <ImageUpload
              images={newImages}
              onChange={handleImageUpload}
              maxImages={remainingSlots}
              bucket="stableimages"
              folder="stables"
            />
          </div>

          {/* Show uploaded images with description fields */}
          {newImages.length > 0 && (
            <div className="mb-6 space-y-4">
              <h4 className="text-lg font-medium text-slate-900">Legg til bildetekst (valgfritt)</h4>
              {imageDescriptions.map((image, index) => (
                <div key={image.url} className="flex gap-4 p-4 border border-slate-200 rounded-lg">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={image.url}
                      alt={`Bilde ${index + 1}`}
                      fill
                      className="object-cover rounded"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Beskrivelse for bilde {index + 1}
                    </label>
                    <input
                      type="text"
                      value={image.description}
                      onChange={(e) => handleDescriptionChange(image.url, e.target.value)}
                      placeholder="Beskriv bildet..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for bilder</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Første bilde vises som hovedbilde i oversikten</li>
              <li>• Bruk høy oppløsning for best kvalitet</li>
              <li>• Vis forskjellige områder av stallen (bokser, uteareal, fasiliteter)</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <button
              onClick={onClose}
              disabled={updateStableMutation.isPending}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={handleSave}
              disabled={updateStableMutation.isPending || newImages.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              data-cy="save-images-button"
            >
              {updateStableMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Lagrer...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  Legg til {newImages.length} {newImages.length === 1 ? 'bilde' : 'bilder'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}