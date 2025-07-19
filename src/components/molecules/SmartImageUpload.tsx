'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import imageCompression from 'browser-image-compression';
import { XMarkIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import ImageCropper from './ImageCropper';
import Button from '@/components/atoms/Button';

interface SmartImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  folder?: string;
  preferredAspectRatio?: number; // Primary aspect ratio for display
  title?: string;
  showPresets?: boolean; // Show aspect ratio presets
}

interface ImageAnalysis {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'portrait' | 'landscape' | 'square';
  phoneType: 'modern' | 'traditional' | 'square' | 'unknown';
}

export default function SmartImageUpload({ 
  images, 
  onChange, 
  maxImages = 10, 
  folder = 'stables',
  preferredAspectRatio = 16/9,
  title = "Last opp bilder",
  showPresets = true
}: SmartImageUploadProps) {
  const [uploading, setUploading] = useState<Set<string>>(new Set());
  const [cropData, setCropData] = useState<{
    src: string;
    originalFile: File;
    analysis: ImageAnalysis;
    index?: number;
  } | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(preferredAspectRatio);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common aspect ratios for phone photos and web display
  const aspectRatioPresets = [
    { ratio: 16/9, name: 'Bredformat (16:9)', description: 'Optimal for web og skjermer', icon: ComputerDesktopIcon },
    { ratio: 4/3, name: 'Klassisk (4:3)', description: 'Tradisjonell foto-format', icon: ComputerDesktopIcon },
    { ratio: 3/2, name: 'Foto (3:2)', description: 'DSLR standard format', icon: ComputerDesktopIcon },
    { ratio: 1, name: 'Kvadrat (1:1)', description: 'Instagram stil', icon: DevicePhoneMobileIcon },
    { ratio: 9/16, name: 'Mobil portrett (9:16)', description: 'Vertikal telefon', icon: DevicePhoneMobileIcon },
    { ratio: 3/4, name: 'Portrett (3:4)', description: 'Klassisk portrett', icon: DevicePhoneMobileIcon },
  ];

  const analyzeImage = (img: HTMLImageElement): ImageAnalysis => {
    const { width, height } = img;
    const aspectRatio = width / height;
    
    let orientation: 'portrait' | 'landscape' | 'square';
    let phoneType: 'modern' | 'traditional' | 'square' | 'unknown';

    if (aspectRatio > 1.1) {
      orientation = 'landscape';
    } else if (aspectRatio < 0.9) {
      orientation = 'portrait';
    } else {
      orientation = 'square';
    }

    // Detect common phone aspect ratios
    if (Math.abs(aspectRatio - 9/16) < 0.05 || Math.abs(aspectRatio - 16/9) < 0.05) {
      phoneType = 'modern'; // Modern phone (iPhone 13+, Samsung Galaxy, etc.)
    } else if (Math.abs(aspectRatio - 4/3) < 0.05 || Math.abs(aspectRatio - 3/4) < 0.05) {
      phoneType = 'traditional'; // Traditional camera/older phone
    } else if (Math.abs(aspectRatio - 1) < 0.05) {
      phoneType = 'square'; // Square/Instagram
    } else {
      phoneType = 'unknown';
    }

    return { width, height, aspectRatio, orientation, phoneType };
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
      fileType: 'image/jpeg',
      quality: 0.85
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.warn('Compression failed, using original file:', error);
      return file;
    }
  };

  const dataUrlToFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const uploadImage = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const filename = `${folder}/${timestamp}_${randomString}.jpg`;
    
    const compressedFile = await compressImage(file);
    const storageRef = ref(storage, filename);
    const snapshot = await uploadBytes(storageRef, compressedFile);
    
    return await getDownloadURL(snapshot.ref);
  };

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;

    if (images.length + files.length > maxImages) {
      alert(`Du kan maksimalt laste opp ${maxImages} bilder`);
      return;
    }

    const file = files[0];

    // Create image element to analyze dimensions
    const img = new window.Image();
    img.onload = () => {
      const analysis = analyzeImage(img);
      
      // Create data URL for cropper
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropData({
          src: e.target?.result as string,
          originalFile: file,
          analysis
        });
      };
      reader.readAsDataURL(file);
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCrop = async (croppedImageDataUrl: string) => {
    if (!cropData) return;

    const uploadId = `upload_${Date.now()}`;
    setUploading(prev => new Set(prev).add(uploadId));

    try {
      const croppedFile = dataUrlToFile(
        croppedImageDataUrl, 
        `cropped_${cropData.originalFile.name}`
      );

      const url = await uploadImage(croppedFile);
      
      if (cropData.index !== undefined) {
        const newImages = [...images];
        newImages[cropData.index] = url;
        onChange(newImages);
      } else {
        onChange([...images, url]);
      }
      
      setCropData(null);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Feil ved opplasting av bilde. Prøv igjen.');
    } finally {
      setUploading(prev => {
        const newSet = new Set(prev);
        newSet.delete(uploadId);
        return newSet;
      });
    }
  };

  const handleSkipCrop = async () => {
    if (!cropData) return;

    const uploadId = `upload_${Date.now()}`;
    setUploading(prev => new Set(prev).add(uploadId));

    try {
      const url = await uploadImage(cropData.originalFile);
      onChange([...images, url]);
      setCropData(null);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Feil ved opplasting av bilde. Prøv igjen.');
    } finally {
      setUploading(prev => {
        const newSet = new Set(prev);
        newSet.delete(uploadId);
        return newSet;
      });
    }
  };

  const removeImage = async (indexToRemove: number) => {
    const imageUrl = images[indexToRemove];
    
    try {
      const path = extractPathFromFirebaseUrl(imageUrl);
      if (path) {
        const imageRef = ref(storage, path);
        await deleteObject(imageRef);
      }
    } catch (error) {
      console.warn('Could not delete image from storage:', error);
    }

    const newImages = images.filter((_, index) => index !== indexToRemove);
    onChange(newImages);
  };

  const extractPathFromFirebaseUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('firebasestorage.googleapis.com')) {
        const pathMatch = url.match(/\/o\/(.+?)\?/);
        return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
      }
    } catch {
      console.warn('Invalid URL:', url);
    }
    return null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const getOrientationAdvice = (analysis: ImageAnalysis) => {
    if (analysis.orientation === 'portrait' && analysis.phoneType === 'modern') {
      return "📱 Mobilbilde oppdaget! Foreslår å beskjære til bredformat (16:9) for bedre visning på web.";
    } else if (analysis.orientation === 'landscape' && analysis.phoneType === 'modern') {
      return "📱 Perfekt! Dette bildet passer godt for web-visning.";
    } else if (analysis.phoneType === 'square') {
      return "⬜ Kvadratisk bilde oppdaget! Perfekt for Instagram-stil visning.";
    }
    return "🖼️ Bilde lastet opp. Du kan velge ønsket format for best visning.";
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-900">{title}</h3>
        </div>

        {/* Aspect Ratio Presets */}
        {showPresets && (
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-900 mb-3">Velg bildestørrelse for beste visning:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {aspectRatioPresets.map((preset) => (
                <button
                  key={preset.ratio}
                  onClick={() => setSelectedAspectRatio(preset.ratio)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedAspectRatio === preset.ratio
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <preset.icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{preset.name}</span>
                  </div>
                  <p className="text-xs opacity-75">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(Array.from(e.target.files || []))}
            className="hidden"
          />
          
          <DevicePhoneMobileIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700 mb-2">
            Last opp bilder fra telefon eller kamera
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Støtter alle mobilformater - vi hjelper deg tilpasse bildene for best visning
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
            <span>📱 9:16 Mobil</span>
            <span>📸 4:3 Kamera</span>
            <span>⬜ 1:1 Kvadrat</span>
            <span>🖥️ 16:9 Web</span>
          </div>
        </div>

        {/* Uploaded Images Grid */}
        {(images.length > 0 || uploading.size > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <Image
                  src={imageUrl}
                  alt={`Bilde ${index + 1}`}
                  width={200}
                  height={Math.round(200 / selectedAspectRatio)}
                  className="w-full object-cover rounded-lg border border-slate-200"
                  style={{ height: `${200 / selectedAspectRatio}px` }}
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  type="button"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            {Array.from(uploading).map((uploadId) => (
              <div key={uploadId} className="relative">
                <div 
                  className="w-full bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center"
                  style={{ height: `${200 / selectedAspectRatio}px` }}
                >
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p className="text-xs text-slate-500">Laster opp...</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image Count */}
        <div className="text-sm text-slate-500">
          {images.length} av {maxImages} bilder lastet opp
          {uploading.size > 0 && ` (${uploading.size} laster opp...)`}
        </div>
      </div>

      {/* Smart Image Cropper Modal */}
      {cropData && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-hidden">
            {/* Header with Smart Analysis */}
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Tilpass bildet ditt</h3>
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  {getOrientationAdvice(cropData.analysis)}
                </p>
                <div className="mt-2 text-xs text-blue-600">
                  Opprinnelig størrelse: {cropData.analysis.width}×{cropData.analysis.height} 
                  ({cropData.analysis.aspectRatio.toFixed(2)}:1 - {cropData.analysis.orientation})
                </div>
              </div>
              
              {/* Quick Aspect Ratio Selection */}
              <div className="flex flex-wrap gap-2">
                {aspectRatioPresets.slice(0, 4).map((preset) => (
                  <button
                    key={preset.ratio}
                    onClick={() => setSelectedAspectRatio(preset.ratio)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      selectedAspectRatio === preset.ratio
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Cropper */}
            <div className="p-6 max-h-[60vh] overflow-hidden">
              <ImageCropper
                src={cropData.src}
                aspectRatio={selectedAspectRatio}
                onCrop={handleCrop}
                onCancel={() => setCropData(null)}
                title=""
              />
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleSkipCrop}
                className="text-slate-600"
              >
                Bruk original størrelse
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCropData(null)}>
                  Avbryt
                </Button>
                <Button variant="primary" onClick={() => handleCrop}>
                  Bruk beskåret versjon
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}