'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import imageCompression from 'browser-image-compression';
import { XMarkIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface SmartImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  folder?: string;
  title?: string;
}

export default function SmartImageUpload({ 
  images, 
  onChange, 
  maxImages = 10, 
  folder = 'stables',
  title = "Last opp bilder"
}: SmartImageUploadProps) {
  const [uploading, setUploading] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Process all selected files
    for (const file of files) {
      const uploadId = `upload_${Date.now()}_${Math.random()}`;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-900">{title}</h3>
      </div>

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
          multiple
          onChange={(e) => handleFileSelect(Array.from(e.target.files || []))}
          className="hidden"
        />
        
        <DevicePhoneMobileIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-slate-700 mb-2">
          Last opp bilder
        </p>
        <p className="text-sm text-slate-500 mb-4">
          Støtter JPEG, PNG og WebP - bildene optimaliseres automatisk
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
          <span>📱 Mobilbilder</span>
          <span>📸 Kamerabilder</span>
          <span>🖥️ Webbilder</span>
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
                height={150}
                className="w-full h-32 object-cover rounded-lg border border-slate-200"
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
              <div className="w-full h-32 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
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
  );
}