'use client';

import { useState } from 'react';
import { PhotoIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { usePostAdminImageCleanup } from '@/hooks/useAdminCleanup';
import { toast } from 'sonner';

interface ImageCleanupResult {
  unusedImagesCount: number;
  archivedStableImages: number;
  archivedBoxImages: number;
  unusedImages: string[];
  timestamp: string;
}

export function AdminImageCleanupControls() {
  const [cleanupResult, setCleanupResult] = useState<ImageCleanupResult | null>(null);
  const imageCleanup = usePostAdminImageCleanup();

  const handleImageCleanup = async () => {
    try {
      const data = await imageCleanup.mutateAsync();
      setCleanupResult(data.results);
      toast.success(`Fant ${data.results.unusedImagesCount} ubrukte bilder`);
    } catch (error) {
      toast.error('Feil ved skanning av bilder. Prøv igjen.');
      console.error('Image cleanup error:', error);
    }
  };

  const copyImageList = () => {
    if (cleanupResult?.unusedImages) {
      const imageList = cleanupResult.unusedImages.join('\n');
      navigator.clipboard.writeText(imageList);
      toast.success('Bildeliste kopiert til utklippstavle');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-slate-900">Bildeflåteopprydding</h3>
          <p className="text-sm text-slate-600">
            Finn ubrukte bilder fra arkiverte staller og bokser
          </p>
        </div>
        <button
          onClick={handleImageCleanup}
          disabled={imageCleanup.isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PhotoIcon className="h-4 w-4" />
          <span>{imageCleanup.isPending ? 'Skanner...' : 'Skann for ubrukte bilder'}</span>
        </button>
      </div>
      
      {cleanupResult && (
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Skanning fullført</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <div>• {cleanupResult.unusedImagesCount} totalt ubrukte bilder funnet</div>
              <div>• {cleanupResult.archivedStableImages} bilder fra arkiverte staller</div>
              <div>• {cleanupResult.archivedBoxImages} bilder fra arkiverte bokser</div>
              <div className="text-xs text-blue-600 mt-2">
                Skannet: {new Date(cleanupResult.timestamp).toLocaleString('nb-NO')}
              </div>
            </div>
          </div>

          {cleanupResult.unusedImages.length > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Ubrukte bilder</h4>
                <button
                  onClick={copyImageList}
                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  <DocumentTextIcon className="h-3 w-3" />
                  <span>Kopier liste</span>
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <div className="space-y-1 text-xs text-gray-700 font-mono">
                  {cleanupResult.unusedImages.map((image, index) => (
                    <div key={index} className="break-all">
                      {image}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="text-sm text-amber-800">
          <strong>Hva gjør bildeskanningen:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Finner alle arkiverte staller og deres bilder</li>
            <li>Finner alle bokser som tilhører arkiverte staller</li>
            <li>Lister opp alle bildeURLer som kan slettes manuelt</li>
            <li>Sletter IKKE bilder automatisk - du må gjøre det manuelt</li>
          </ul>
        </div>
      </div>
    </div>
  );
}