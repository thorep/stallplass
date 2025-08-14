"use client";

import { StableWithBoxStats } from "@/types/stable";
import type { Control, Map, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";

interface Address {
  adressetekst: string;
  postnummer: string;
  poststed: string;
  kommunenummer: string;
  kommunenavn: string;
  fylkesnummer?: string;
  fylkesnavn?: string;
  representasjonspunkt: {
    lat: number;
    lon: number;
  };
}

interface FullPageMapProps {
  stables: StableWithBoxStats[];
  isLoading: boolean;
}

interface MarkerWithStableId extends Marker {
  stableId?: string;
}

export default function FullPageMap({ stables, isLoading: initialLoading }: FullPageMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markersRef = useRef<MarkerWithStableId[]>([]);
  const searchControlRef = useRef<Control | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  // Memoize all valid stables to prevent recalculation
  const allValidStables = useMemo(
    () =>
      stables.filter(
        (stable) =>
          stable.latitude &&
          stable.longitude &&
          typeof stable.latitude === "number" &&
          typeof stable.longitude === "number"
      ),
    [stables]
  );

  // Create custom search control
  const createSearchControl = async (L: typeof import('leaflet'), map: Map) => {
    const SearchControl = L.Control.extend({
      options: {
        position: "topright",
      },

      onAdd: function (map: Map) {
        const container = L.DomUtil.create("div", "leaflet-control-search");
        container.style.backgroundColor = "transparent";
        container.style.padding = "0";
        container.style.border = "none";
        container.style.boxShadow = "none";
        container.style.minWidth = "320px";
        container.style.fontFamily = "system-ui, -apple-system, sans-serif";

        const searchWrapper = L.DomUtil.create("div", "search-wrapper", container);
        searchWrapper.style.position = "relative";
        searchWrapper.style.display = "flex";
        searchWrapper.style.alignItems = "center";

        const input = L.DomUtil.create("input", "search-input", searchWrapper) as HTMLInputElement;
        input.type = "text";
        input.placeholder = "Søk etter adresse eller sted...";
        input.style.width = "100%";
        input.style.padding = "12px 40px 12px 40px";
        input.style.border = "1px solid rgba(0,0,0,0.1)";
        input.style.borderRadius = "10px";
        input.style.fontSize = "15px";
        input.style.fontWeight = "400";
        input.style.outline = "none";
        input.style.backgroundColor = "rgba(255,255,255,0.95)";
        input.style.backdropFilter = "blur(10px)";
        input.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
        input.style.transition = "all 0.2s ease";
        input.style.color = "#374151";

        // Focus styles
        input.addEventListener("focus", () => {
          input.style.borderColor = "#10b981";
          input.style.backgroundColor = "white";
          input.style.boxShadow = "0 4px 25px rgba(0,0,0,0.2), 0 0 0 3px rgba(16, 185, 129, 0.1)";
        });

        input.addEventListener("blur", () => {
          input.style.borderColor = "rgba(0,0,0,0.1)";
          input.style.backgroundColor = "rgba(255,255,255,0.95)";
          input.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
        });

        const searchIcon = L.DomUtil.create("div", "search-icon", searchWrapper);
        searchIcon.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="21 21l-4.35-4.35"></path>
          </svg>
        `;
        searchIcon.style.position = "absolute";
        searchIcon.style.left = "12px";
        searchIcon.style.top = "50%";
        searchIcon.style.transform = "translateY(-50%)";
        searchIcon.style.color = "#9ca3af";
        searchIcon.style.pointerEvents = "none";

        const clearButton = L.DomUtil.create(
          "button",
          "clear-button",
          searchWrapper
        ) as HTMLButtonElement;
        clearButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
        clearButton.style.position = "absolute";
        clearButton.style.right = "10px";
        clearButton.style.top = "50%";
        clearButton.style.transform = "translateY(-50%)";
        clearButton.style.background = "none";
        clearButton.style.border = "none";
        clearButton.style.cursor = "pointer";
        clearButton.style.color = "#9ca3af";
        clearButton.style.display = "none";
        clearButton.style.padding = "4px";
        clearButton.style.borderRadius = "4px";
        clearButton.style.transition = "all 0.2s ease";

        clearButton.addEventListener("mouseenter", () => {
          clearButton.style.backgroundColor = "#f3f4f6";
          clearButton.style.color = "#374151";
        });

        clearButton.addEventListener("mouseleave", () => {
          clearButton.style.backgroundColor = "transparent";
          clearButton.style.color = "#9ca3af";
        });

        const dropdown = L.DomUtil.create("div", "search-dropdown", container);
        dropdown.style.position = "absolute";
        dropdown.style.top = "100%";
        dropdown.style.left = "0";
        dropdown.style.right = "0";
        dropdown.style.backgroundColor = "rgba(255,255,255,0.95)";
        dropdown.style.backdropFilter = "blur(10px)";
        dropdown.style.border = "1px solid rgba(0,0,0,0.1)";
        dropdown.style.borderTop = "none";
        dropdown.style.borderRadius = "0 0 10px 10px";
        dropdown.style.maxHeight = "240px";
        dropdown.style.overflowY = "auto";
        dropdown.style.display = "none";
        dropdown.style.zIndex = "1000";
        dropdown.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
        dropdown.style.marginTop = "2px";

        let currentAddresses: Address[] = [];
        let searchTimeout: NodeJS.Timeout;
        let isLoading = false;

        const searchAddresses = async (query: string) => {
          if (query.length < 3) {
            dropdown.style.display = "none";
            return;
          }

          isLoading = true;
          dropdown.innerHTML = `
            <div style="
              padding: 16px; 
              text-align: center; 
              color: #6b7280; 
              font-size: 14px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Søker...
            </div>
          `;
          dropdown.style.display = "block";

          try {
            const response = await fetch(
              `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(
                query
              )}&treffPerSide=10&side=0&fuzzy=true`
            );

            if (response.ok) {
              const data = await response.json();
              const validAddresses = (data.adresser || []).filter(
                (address: Address) =>
                  address &&
                  address.adressetekst &&
                  address.postnummer &&
                  address.poststed &&
                  address.representasjonspunkt
              );

              currentAddresses = validAddresses;
              displayAddresses(validAddresses);
            }
          } catch (error) {
            dropdown.innerHTML = `
              <div style="
                padding: 16px; 
                text-align: center; 
                color: #ef4444; 
                font-size: 14px;
              ">
                Feil ved søk i adresser
              </div>
            `;
          } finally {
            isLoading = false;
          }
        };

        const displayAddresses = (addresses: Address[]) => {
          if (addresses.length === 0) {
            dropdown.innerHTML = `
              <div style="
                padding: 16px; 
                text-align: center; 
                color: #6b7280; 
                font-size: 14px;
              ">
                Ingen adresser funnet
              </div>
            `;
            dropdown.style.display = "block";
            return;
          }

          dropdown.innerHTML = addresses
            .map(
              (address, index) => `
            <div class="address-item" data-index="${index}" style="
              padding: 12px 16px;
              border-bottom: 1px solid #f3f4f6;
              cursor: pointer;
              display: flex;
              align-items: flex-start;
              gap: 12px;
              transition: background-color 0.2s ease;
            ">
              <div style="
                width: 20px; 
                height: 20px; 
                margin-top: 2px; 
                color: #10b981; 
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="
                  font-weight: 500; 
                  color: #111827; 
                  font-size: 15px;
                  margin-bottom: 2px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">${address.adressetekst}</div>
                <div style="
                  font-size: 13px; 
                  color: #6b7280;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">${address.postnummer} ${address.poststed}, ${address.kommunenavn}</div>
              </div>
            </div>
          `
            )
            .join("");
          dropdown.style.display = "block";

          // Add click listeners to address items
          dropdown.querySelectorAll(".address-item").forEach((item: Element, index: number) => {
            item.addEventListener("click", () => {
              const address = addresses[index];
              if (address && mapInstanceRef.current) {
                mapInstanceRef.current.setView(
                  [address.representasjonspunkt.lat, address.representasjonspunkt.lon],
                  15
                );
                input.value = address.adressetekst;
                dropdown.style.display = "none";
                clearButton.style.display = "block";
              }
            });

            item.addEventListener("mouseenter", () => {
              (item as HTMLElement).style.backgroundColor = "#f0fdf4";
            });

            item.addEventListener("mouseleave", () => {
              (item as HTMLElement).style.backgroundColor = "white";
            });
          });
        };

        // Input event listeners
        input.addEventListener("input", (e) => {
          const query = (e.target as HTMLInputElement).value;
          clearTimeout(searchTimeout);

          if (query.length === 0) {
            dropdown.style.display = "none";
            clearButton.style.display = "none";
          } else {
            clearButton.style.display = "block";
            if (query.length >= 3) {
              searchTimeout = setTimeout(() => searchAddresses(query), 300);
            }
          }
        });

        // Clear button
        clearButton.addEventListener("click", () => {
          input.value = "";
          dropdown.style.display = "none";
          clearButton.style.display = "none";
          input.focus();
        });

        // Prevent map events when interacting with search control
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        // Hide dropdown when clicking outside
        map.on("click", () => {
          dropdown.style.display = "none";
        });

        return container;
      },
    });

    return new SearchControl();
  };

  // Initialize map only once when stables data is loaded
  useEffect(() => {
    if (!mapRef.current || initialLoading || allValidStables.length === 0 || isMapInitialized) {
      return;
    }

    const currentMapRef = mapRef.current;

    const loadMap = async () => {
      try {
        setIsMapLoading(true);

        // Clean up existing map and markers
        markersRef.current.forEach((marker) => {
          marker.remove();
        });
        markersRef.current = [];

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Dynamically import Leaflet
        const L = await import("leaflet");

        // Clear the container and ensure no existing map
        if (mapRef.current) {
          // Remove any existing content
          mapRef.current.innerHTML = "";
          // Remove Leaflet's internal ID if it exists
          const mapDiv = mapRef.current as HTMLDivElement & { _leaflet_id?: number };
          if (mapDiv._leaflet_id) {
            delete mapDiv._leaflet_id;
          }
        }

        // Double-check the container is ready
        if (!mapRef.current || mapRef.current.children.length > 0) {
          console.warn("Map container not ready or already has content");
          setIsMapLoading(false);
          return;
        }

        // Fix for default markers
        delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })
          ._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        // Initialize map - centered on Norway
        const map = L.map(mapRef.current!, {
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          dragging: true,
          touchZoom: true,
        });
        mapInstanceRef.current = map;

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        // Add custom search control
        const searchControl = await createSearchControl(L, map);
        searchControl.addTo(map);
        searchControlRef.current = searchControl;

        if (allValidStables.length > 0) {
          // Calculate bounds for all stables
          const coordinates = allValidStables.map((stable) => [
            stable.latitude!,
            stable.longitude!,
          ]);

          // Add markers for each stable
          allValidStables.forEach((stable) => {
            const marker = L.marker([stable.latitude!, stable.longitude!]).addTo(
              map
            ) as MarkerWithStableId;
            marker.stableId = stable.id;
            markersRef.current.push(marker);

            // Create popup content with stable info
            const popupContent = `
              <div style="padding: 16px; min-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
                <div style="position: relative;">
                  <button onclick="this.closest('.leaflet-popup').style.display='none'" 
                          style="position: absolute; top: -8px; right: -8px; width: 32px; height: 32px; 
                                 background: white; border: 1px solid #e5e7eb; border-radius: 50%; 
                                 display: flex; align-items: center; justify-content: center; 
                                 cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                                 font-size: 16px; color: #6b7280;">
                    ✕
                  </button>
                  
                  <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
                    ${
                      stable.images && stable.images.length > 0
                        ? `<img src="${stable.images[0]}" alt="${stable.name}" 
                             style="width: 70px; height: 70px; object-fit: cover; border-radius: 10px; flex-shrink: 0;" />`
                        : `<div style="width: 70px; height: 70px; background: #f3f4f6; border-radius: 10px; 
                                     display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                           <svg width="24" height="24" fill="#9ca3af" viewBox="0 0 24 24">
                             <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z"/>
                           </svg>
                         </div>`
                    }
                    <div style="flex: 1; min-width: 0;">
                      <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 6px 0; line-height: 1.3;">
                        ${stable.name}
                      </h3>
                      <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0; line-height: 1.4;">
                        ${stable.location}
                      </p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; 
                              font-size: 13px; color: #6b7280;">
                    <span>${stable.boxes?.length || 0} ${
              (stable.boxes?.length || 0) === 1 ? "boks" : "bokser"
            }</span>
                    ${
                      (stable.availableBoxes || 0) > 0
                        ? `<span style="color: #10b981; font-weight: 500;">
                           ${stable.availableBoxes || 0} ledig${
                            (stable.availableBoxes || 0) === 1 ? "" : "e"
                          }
                         </span>`
                        : `<span style="color: #9ca3af;">Utleid</span>`
                    }
                  </div>
                  
                  ${
                    stable.priceRange && stable.priceRange.min > 0
                      ? `<p style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">
                         ${
                           stable.priceRange.min === stable.priceRange.max
                             ? `${stable.priceRange.min.toLocaleString()} kr/mnd`
                             : `${stable.priceRange.min.toLocaleString()}-${stable.priceRange.max.toLocaleString()} kr/mnd`
                         }
                       </p>`
                      : ""
                  }
                  
                  <a href="/staller/${stable.id}" 
                     style="display: block; width: 100%; background: #10b981; color: white; 
                            text-align: center; padding: 12px 16px; border-radius: 10px; 
                            text-decoration: none; font-size: 15px; font-weight: 500;
                            transition: background-color 0.2s ease;"
                     onmouseover="this.style.background='#059669'"
                     onmouseout="this.style.background='#10b981'">
                    Se detaljer
                  </a>
                </div>
              </div>
            `;

            marker.bindPopup(popupContent, {
              maxWidth: 350,
              minWidth: 280,
              className: "stable-popup",
              closeButton: false, // Vi bruker vår egen close-knapp
              autoPan: true,
              autoPanPadding: [20, 20],
            });
          });

          // Fit map to show all markers
          if (coordinates.length === 1) {
            // Single marker - center on it with reasonable zoom
            map.setView([coordinates[0][0], coordinates[0][1]], 13);
          } else if (coordinates.length > 1) {
            // Multiple markers - fit bounds
            const bounds = L.latLngBounds(coordinates as [number, number][]);
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        } else {
          // No stables - center on Norway
          map.setView([62.0, 10.0], 5);
        }

        setIsMapLoading(false);
        setIsMapInitialized(true);
      } catch (error) {
        console.error("Error loading map:", error);
        setIsMapLoading(false);
      }
    };

    loadMap();

    // Cleanup on unmount
    return () => {
      markersRef.current.forEach((marker) => {
        marker.remove();
      });
      markersRef.current = [];

      if (searchControlRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeControl(searchControlRef.current);
        searchControlRef.current = null;
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (currentMapRef) {
        currentMapRef.innerHTML = "";
        delete (currentMapRef as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
      }
    };
  }, [allValidStables, initialLoading]);

  const isLoading = initialLoading || isMapLoading;

  return (
    <div className="h-[calc(100vh-64px)] relative bg-gray-50">
      {/* Map container */}
      <div className="w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-4"></div>
              <span className="text-lg text-gray-600">Laster kart...</span>
            </div>
          </div>
        )}

        <div ref={mapRef} className="w-full h-full leaflet-map-container" style={{ zIndex: 10 }} />
      </div>
    </div>
  );
}
