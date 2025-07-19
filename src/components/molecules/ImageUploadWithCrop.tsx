'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import imageCompression from 'browser-image-compression';
import { XMarkIcon, ArrowUpTrayIcon, ScissorsIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import ImageCropper from './ImageCropper';
import Button from '@/components/atoms/Button';

interface ImageUploadWithCropProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  folder?: string;
  aspectRatio?: number; // e.g., 16/9 for landscape, 1 for square
  requireCrop?: boolean; // Force cropping for all images
  title?: string;
}

export default function ImageUploadWithCrop({ 
  images, 
  onChange, 
  maxImages = 10, 
  folder = 'stables',
  aspectRatio = 16/9,
  requireCrop = false,
  title = "Last opp bilder"
}: ImageUploadWithCropProps) {
  const [uploading, setUploading] = useState<Set<string>>(new Set());
  const [cropData, setCropData] = useState<{
    src: string;
    originalFile: File;
    index?: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 2, // Increased for better quality before cropping
      maxWidthOrHeight: 2048, // Higher resolution for cropping
      useWebWorker: true,
      fileType: 'image/jpeg',
      quality: 0.9 // Higher quality for cropping
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
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = 'jpg'; // Always use jpg for consistency
    const filename = `${folder}/${timestamp}_${randomString}.${extension}`;
    
    // Compress image (final compression after cropping)
    const compressedFile = await compressImage(file);
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, filename);
    const snapshot = await uploadBytes(storageRef, compressedFile);
    
    // Get download URL
    return await getDownloadURL(snapshot.ref);
  };

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;

    // Check if adding these files would exceed maxImages
    if (images.length + files.length > maxImages) {
      alert(`Du kan maksimalt laste opp ${maxImages} bilder`);
      return;
    }

    const file = files[0]; // Handle one file at a time for cropping

    if (requireCrop || (aspectRatio && aspectRatio !== 0)) {
      // Show cropper
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropData({
          src: e.target?.result as string,
          originalFile: file
        });
      };
      reader.readAsDataURL(file);
    } else {
      // Upload directly without cropping
      await uploadImageDirectly(file);
    }
  };

  const uploadImageDirectly = async (file: File) => {
    const uploadId = `upload_${Date.now()}`;
    
    setUploading(prev => new Set(prev).add(uploadId));

    try {
      const url = await uploadImage(file);
      onChange([...images, url]);
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

  const handleCrop = async (croppedImageDataUrl: string) => {
    if (!cropData) return;

    const uploadId = `upload_${Date.now()}`;
    setUploading(prev => new Set(prev).add(uploadId));

    try {
      // Convert cropped image to file
      const croppedFile = dataUrlToFile(
        croppedImageDataUrl, 
        `cropped_${cropData.originalFile.name}`
      );

      const url = await uploadImage(croppedFile);
      
      if (cropData.index !== undefined) {
        // Replace existing image
        const newImages = [...images];
        newImages[cropData.index] = url;
        onChange(newImages);
      } else {
        // Add new image
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

  const handleRecrop = (index: number) => {
    const imageUrl = images[index];
    setCropData({
      src: imageUrl,
      originalFile: new File([], 'existing-image.jpg'),
      index
    });
  };

  const removeImage = async (indexToRemove: number) => {
    const imageUrl = images[indexToRemove];
    
    try {
      // Try to delete from Firebase Storage
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

  const getAspectRatioName = (ratio: number) => {
    if (ratio === 1) return 'kvadrat (1:1)';
    if (ratio === 16/9) return 'bredformat (16:9)';
    if (ratio === 4/3) return 'standard (4:3)';
    if (ratio === 3/2) return 'foto (3:2)';
    return `tilpasset (${ratio.toFixed(2)}:1)`;
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-900">{title}</h3>
          {aspectRatio && (
            <span className="text-sm text-slate-500">
              Format: {getAspectRatioName(aspectRatio)}
            </span>
          )}
        </div>

        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors cursor-pointer"
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
          
          <ArrowUpTrayIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-sm text-slate-600 mb-2">
            Klikk her eller dra bilder hit for å laste opp
          </p>
          <p className="text-xs text-slate-500">
            JPEG, PNG, WebP (maks {maxImages} bilder)
          </p>
          {aspectRatio && (
            <p className="text-xs text-slate-500 mt-1">
              Bilder vil bli tilpasset {getAspectRatioName(aspectRatio)} format
            </p>
          )}
        </div>

        {/* Uploaded Images Grid */}
        {(images.length > 0 || uploading.size > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Existing Images */}
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <Image
                  src={imageUrl}
                  alt={`Bilde ${index + 1}`}
                  width={200}
                  height={Math.round(200 / (aspectRatio || 16/9))}
                  className={`w-full rounded-lg border border-slate-200 ${
                    aspectRatio ? 'object-cover' : 'object-contain'
                  }`}
                  style={{ 
                    height: aspectRatio ? `${200 / aspectRatio}px` : 'auto' 
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    {aspectRatio && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRecrop(index)}
                        className="bg-white bg-opacity-90 hover:bg-opacity-100"
                      >
                        <ScissorsIcon className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeImage(index)}
                      className="bg-red-500 text-white hover:bg-red-600 border-red-500"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Uploading Placeholders */}
            {Array.from(uploading).map((uploadId) => (
              <div key={uploadId} className="relative">
                <div 
                  className="w-full bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center"
                  style={{ 
                    height: aspectRatio ? `${200 / aspectRatio}px` : '128px' 
                  }}
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

      {/* Image Cropper Modal */}
      {cropData && (
        <ImageCropper
          src={cropData.src}
          aspectRatio={aspectRatio || 16/9}
          onCrop={handleCrop}
          onCancel={() => setCropData(null)}
          title={cropData.index !== undefined ? "Beskjær bilde på nytt" : "Beskjær bilde"}
        />
      )}
    </>
  );
}