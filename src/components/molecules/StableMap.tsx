'use client';

import { useEffect, useRef } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import type { Map } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface StableMapProps {
  latitude: number;
  longitude: number;
  stallName: string;
  address: string;
  className?: string;
}

export default function StableMap({ 
  latitude, 
  longitude, 
  stallName, 
  address, 
  className = "w-full h-64" 
}: StableMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  useEffect(() => {
    // Only load if we have valid coordinates
    if (!latitude || !longitude || !mapRef.current) return;

    const loadMap = async () => {
      try {
        // Clean up existing map instance
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Dynamically import Leaflet to avoid SSR issues
        const L = await import('leaflet');
        
        // Fix for default markers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Initialize map
        const map = L.map(mapRef.current!).setView([latitude, longitude], 13);
        mapInstanceRef.current = map;

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add marker for the stable
        const marker = L.marker([latitude, longitude]).addTo(map);
        marker.bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">${stallName}</h3>
            <p class="text-sm text-gray-600">${address}</p>
          </div>
        `);

      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    loadMap();

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, stallName, address]);

  // Fallback for when coordinates are not available
  if (!latitude || !longitude) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <MapPinIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Kart ikke tilgjengelig</p>
          <p className="text-xs text-gray-400">Ingen koordinater funnet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-lg overflow-hidden border border-gray-200`}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}