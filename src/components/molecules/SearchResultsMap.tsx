'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import type { Map, Marker } from 'leaflet';
import { StableWithBoxStats } from '@/types/stable';
import 'leaflet/dist/leaflet.css';

interface SearchResultsMapProps {
  stables: StableWithBoxStats[];
  className?: string;
}

export default function SearchResultsMap({ 
  stables, 
  className = "w-full h-96" 
}: SearchResultsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter stables that have valid coordinates
  const validStables = stables.filter(stable => 
    stable.latitude && stable.longitude && 
    typeof stable.latitude === 'number' && 
    typeof stable.longitude === 'number'
  );

  useEffect(() => {
    if (!mapRef.current || validStables.length === 0) {
      setIsLoading(false);
      return;
    }
    
    const currentMapRef = mapRef.current;

    const loadMap = async () => {
      try {
        setIsLoading(true);

        // Clean up existing map and markers
        markersRef.current.forEach(marker => {
          marker.remove();
        });
        markersRef.current = [];

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Clear the container
        if (mapRef.current) {
          mapRef.current.innerHTML = '';
          delete (mapRef.current as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
        }

        // Dynamically import Leaflet
        const L = await import('leaflet');
        
        // Fix for default markers
        delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Calculate bounds for all stables
        const coordinates = validStables.map(stable => [
          stable.latitude!,
          stable.longitude!
        ]);

        // Initialize map
        const map = L.map(mapRef.current!, {
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          dragging: true,
          touchZoom: true
        });
        mapInstanceRef.current = map;

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add markers for each stable
        validStables.forEach(stable => {
          const marker = L.marker([stable.latitude!, stable.longitude!]).addTo(map);
          markersRef.current.push(marker);

          // Create popup content with stable info
          const popupContent = `
            <div class="p-3 max-w-xs">
              <div class="flex items-start gap-3">
                ${stable.images && stable.images.length > 0 
                  ? `<img src="${stable.images[0]}" alt="${stable.name}" class="w-16 h-16 object-cover rounded-lg flex-shrink-0" />`
                  : `<div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                       <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z"></path>
                       </svg>
                     </div>`
                }
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-gray-900 truncate">${stable.name}</h3>
                  <p class="text-sm text-gray-600 mb-2">${stable.location}</p>
                  
                  <div class="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span>${stable.totalBoxes} ${stable.totalBoxes === 1 ? 'boks' : 'bokser'}</span>
                    ${stable.availableBoxes > 0 
                      ? `<span class="text-green-600">${stable.availableBoxes} ledig${stable.availableBoxes === 1 ? '' : 'e'}</span>`
                      : `<span class="text-gray-400">Utleid</span>`
                    }
                  </div>
                  
                  ${stable.priceRange.min > 0 
                    ? `<p class="text-sm font-medium text-gray-900 mb-2">
                         ${stable.priceRange.min === stable.priceRange.max 
                           ? `${stable.priceRange.min.toLocaleString()} kr/mnd`
                           : `${stable.priceRange.min.toLocaleString()}-${stable.priceRange.max.toLocaleString()} kr/mnd`
                         }
                       </p>`
                    : ''
                  }
                  
                  <div class="popup-link-container">
                    <a href="/staller/${stable.id}" 
                       class="inline-block bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700 transition-colors"
                       target="_blank">
                      Se detaljer
                    </a>
                  </div>
                </div>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent, {
            maxWidth: 320,
            className: 'stable-popup'
          });
        });

        // Fit map to show all markers
        if (coordinates.length === 1) {
          // Single marker - center on it with reasonable zoom
          map.setView([coordinates[0][0], coordinates[0][1]], 13);
        } else if (coordinates.length > 1) {
          // Multiple markers - fit bounds
          const bounds = L.latLngBounds(coordinates as [number, number][]);
          map.fitBounds(bounds, { padding: [20, 20] });
        }

        setIsLoading(false);

      } catch (error) {
        console.error('Error loading search results map:', error);
        setIsLoading(false);
      }
    };

    loadMap();

    // Cleanup on unmount
    return () => {
      markersRef.current.forEach(marker => {
        marker.remove();
      });
      markersRef.current = [];
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      
      if (currentMapRef) {
        currentMapRef.innerHTML = '';
        delete (currentMapRef as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
      }
    };
  }, [validStables]);

  // No valid coordinates available
  if (validStables.length === 0) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200`}>
        <div className="text-center">
          <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">Ingen staller med kart tilgjengelig</p>
          <p className="text-sm text-gray-500">
            {stables.length > 0 
              ? 'Stallene i søkeresultatet mangler koordinatinformasjon'
              : 'Ingen staller funnet'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative rounded-lg overflow-hidden border border-gray-200`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <span className="text-sm text-gray-600">Laster kart...</span>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="w-full h-full leaflet-map-container"
        style={{ zIndex: 10 }}
      />
      
      {!isLoading && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-gray-700 shadow-md z-20">
          {validStables.length} {validStables.length === 1 ? 'stall' : 'staller'} på kartet
        </div>
      )}
    </div>
  );
}