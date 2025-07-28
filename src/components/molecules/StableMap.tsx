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
    
    // Capture the current ref value for cleanup
    const currentMapRef = mapRef.current;

    const loadMap = async () => {
      try {
        // Clean up existing map instance
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Clear the container's innerHTML to ensure it's completely clean
        if (mapRef.current) {
          mapRef.current.innerHTML = '';
          // Clear Leaflet internal ID to allow re-initialization
          delete (mapRef.current as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
        }

        // Dynamically import Leaflet to avoid SSR issues
        const L = await import('leaflet');
        
        // Fix for default markers - remove Leaflet's internal icon URL getter
        delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Initialize map
        const map = L.map(mapRef.current!, {
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          dragging: true,
          touchZoom: true
        }).setView([latitude, longitude], 13);
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

      } catch (_) {
      }
    };

    loadMap();

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      // Also clear the container
      if (currentMapRef) {
        currentMapRef.innerHTML = '';
        // Clear Leaflet internal ID for cleanup
        delete (currentMapRef as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
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
    <div className={`${className} rounded-lg overflow-hidden border border-gray-200 relative`} style={{ zIndex: 10 }}>
      <div 
        ref={mapRef} 
        className="w-full h-full leaflet-map-container"
      />
    </div>
  );
}