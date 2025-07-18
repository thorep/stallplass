'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import imageCompression from 'browser-image-compression';
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  folder?: string;
}

export default function ImageUpload({ 
  images, 
  onChange, 
  maxImages = 10, 
  folder = 'stables' 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1, // Compress to max 1MB
      maxWidthOrHeight: 1920, // Max dimension 1920px
      useWebWorker: true,
      fileType: 'image/jpeg', // Convert to JPEG for better compression
      quality: 0.8 // 80% quality
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.warn('Compression failed, using original file:', error);
      return file;
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${folder}/${timestamp}_${randomString}.${extension}`;
    
    // Compress image
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

    const uploadIds = files.map((_, index) => `upload_${Date.now()}_${index}`);
    
    // Mark files as uploading
    setUploading(prev => {
      const newSet = new Set(prev);
      uploadIds.forEach(id => newSet.add(id));
      return newSet;
    });

    try {
      const uploadPromises = files.map(async (file, index) => {
        const uploadId = uploadIds[index];
        
        try {
          const url = await uploadImage(file);
          
          // Remove from uploading set
          setUploading(prev => {
            const newSet = new Set(prev);
            newSet.delete(uploadId);
            return newSet;
          });
          
          return url;
        } catch (uploadError) {
          console.error('Upload failed for file:', file.name, uploadError);
          setUploading(prev => {
            const newSet = new Set(prev);
            newSet.delete(uploadId);
            return newSet;
          });
          throw uploadError;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...images, ...uploadedUrls]);
      
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Feil ved opplasting av bilder. Prøv igjen.');
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = async (indexToRemove: number) => {
    const imageUrl = images[indexToRemove];
    
    try {
      // Try to delete from Firebase Storage
      // Extract the path from the URL
      const path = extractPathFromFirebaseUrl(imageUrl);
      if (path) {
        const imageRef = ref(storage, path);
        await deleteObject(imageRef);
      }
    } catch (error) {
      console.warn('Could not delete image from storage:', error);
      // Continue with removal from array even if storage deletion fails
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

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(Array.from(e.target.files || []))}
          className="hidden"
        />
        
        <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          Klikk her eller dra bilder hit for å laste opp
        </p>
        <p className="text-xs text-gray-500">
          JPEG, PNG, WebP (maks {maxImages} bilder)
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Bilder komprimeres automatisk for raskere lasting
        </p>
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
                height={128}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                type="button"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {/* Uploading Placeholders */}
          {Array.from(uploading).map((uploadId) => (
            <div key={uploadId} className="relative">
              <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-xs text-gray-500">Laster opp...</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Count */}
      <div className="text-sm text-gray-500">
        {images.length} av {maxImages} bilder lastet opp
        {uploading.size > 0 && ` (${uploading.size} laster opp...)`}
      </div>
    </div>
  );
}