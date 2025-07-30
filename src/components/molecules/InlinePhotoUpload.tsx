'use client';

import { useState } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/supabase-auth-context';
import ImageUpload from './ImageUpload';

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
  const { getIdToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newImages, setNewImages] = useState<string[]>([]);

  const handleImageUpload = (images: string[]) => {
    setNewImages(images);
  };

  const handleSave = async () => {
    if (newImages.length === 0) {
      onClose();
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const token = await getIdToken();
      const updatedImages = [...currentImages, ...newImages];

      // First get the current stable data
      const stableResponse = await fetch(`/api/stables/${stableId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!stableResponse.ok) {
        throw new Error('Failed to fetch current stable data');
      }

      const stableData = await stableResponse.json();

      // Update the stable with the new images
      const response = await fetch(`/api/stables/${stableId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...stableData,
          images: updatedImages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stable images');
      }

      onPhotosAdded(newImages);
      onClose();
    } catch {
      setError('Feil ved lagring av bilder. Prøv igjen.');
    } finally {
      setUploading(false);
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
              disabled={uploading}
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
              disabled={uploading}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={handleSave}
              disabled={uploading || newImages.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              data-cy="save-images-button"
            >
              {uploading ? (
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