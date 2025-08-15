"use client";

import Button from "@/components/atoms/Button";
import { StableWithBoxStats } from "@/types/stable";
import { ServiceMapView } from "@/types/service";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { Box, IconButton, InputBase, Paper } from "@mui/material";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

interface Address {
  adressetekst: string;
  postnummer: string;
  poststed: string;
  kommunenummer: string;
  kommunenavn: string;
  representasjonspunkt: {
    lat: number;
    lon: number;
  };
}

interface LeafletMapComponentProps {
  stables: StableWithBoxStats[];
  services: ServiceMapView[];
}

// Custom control component for back button
function BackButtonControl() {
  const router = useRouter();

  return (
    <Box
      sx={{
        position: "absolute",
        top: 80,
        left: 10,
        zIndex: 1000,
      }}
    >
      <IconButton
        onClick={() => router.back()}
        sx={{
          backgroundColor: "white",
          boxShadow: "0 1px 5px rgba(0,0,0,0.2)",
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
        }}
      >
        <ArrowBackIcon />
      </IconButton>
    </Box>
  );
}

// Create custom yellow icon for services
const yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function LeafletMapComponent({ stables, services }: LeafletMapComponentProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Address[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Apply custom popup styles after component mounts to ensure they override Leaflet's CSS
  useEffect(() => {
    const applyPopupStyles = () => {
      const style = document.createElement('style');
      style.textContent = `
        .custom-popup .leaflet-popup-close-button {
          width: 26px !important;
          height: 26px !important;
          font-size: 18px !important;
          line-height: 22px !important;
          padding: 0 !important;
          color: #666 !important;
          text-align: center !important;
          background: rgba(255, 255, 255, 0.9) !important;
          border-radius: 50% !important;
          border: 1px solid #ddd !important;
          top: 8px !important;
          right: 8px !important;
          font-weight: bold !important;
        }
        .custom-popup .leaflet-popup-close-button:hover {
          background: rgba(255, 255, 255, 1) !important;
          border-color: #bbb !important;
          color: #333 !important;
        }
      `;
      document.head.appendChild(style);
    };

    // Apply styles after a short delay to ensure Leaflet CSS is loaded
    const timer = setTimeout(applyPopupStyles, 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate center and bounds based on both stables and services
  const allLocations = [
    ...stables.map(s => [s.latitude!, s.longitude!] as [number, number]),
    ...services.map(s => [s.latitude, s.longitude] as [number, number])
  ];
  
  const center = allLocations.length > 0
    ? allLocations[0]
    : ([62.0, 10.0] as [number, number]);

  // Search addresses
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
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
        setSearchResults(validAddresses);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (value.length === 0) {
        setSearchResults([]);
        setShowResults(false);
      } else if (value.length >= 3) {
        const timeoutId = setTimeout(() => searchAddresses(value), 300);
        return () => clearTimeout(timeoutId);
      }
    },
    [searchAddresses]
  );

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Back Button */}
      <BackButtonControl />

      {/* Search Control */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 1000,
          width: 320,
        }}
      >
        <Paper
          sx={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            borderRadius: 2,
          }}
        >
          <SearchIcon sx={{ ml: 2, color: "text.secondary" }} />
          <InputBase
            sx={{ ml: 1, flex: 1, py: 1.5 }}
            placeholder="Søk etter adresse eller sted..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
          />
          {searchQuery && (
            <IconButton
              onClick={() => {
                setSearchQuery("");
                setShowResults(false);
              }}
              sx={{ mr: 1 }}
            >
              <ClearIcon />
            </IconButton>
          )}
        </Paper>

        {/* Search Results */}
        {showResults && (
          <Paper
            sx={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              mt: 0.5,
              maxHeight: 240,
              overflow: "auto",
              backgroundColor: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
              borderRadius: 2,
            }}
          >
            {isSearching ? (
              <Box sx={{ p: 2, textAlign: "center" }}>Søker...</Box>
            ) : searchResults.length === 0 ? (
              <Box sx={{ p: 2, textAlign: "center" }}>Ingen adresser funnet</Box>
            ) : (
              searchResults.map((address, index) => (
                <Box
                  key={index}
                  onClick={() => {
                    // Note: In React-Leaflet, map manipulation should be done through refs or map events
                    setSearchQuery(address.adressetekst);
                    setShowResults(false);
                  }}
                  sx={{
                    p: 1.5,
                    borderBottom: index < searchResults.length - 1 ? "1px solid #f5f5f5" : "none",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "rgba(76, 175, 80, 0.08)",
                    },
                  }}
                >
                  <Box sx={{ fontWeight: 500, fontSize: "14px" }}>{address.adressetekst}</Box>
                  <Box sx={{ color: "text.secondary", fontSize: "12px" }}>
                    {address.postnummer} {address.poststed}, {address.kommunenavn}
                  </Box>
                </Box>
              ))
            )}
          </Paper>
        )}
      </Box>

      {/* React-Leaflet Map */}
      <MapContainer
        center={center}
        zoom={allLocations.length === 1 ? 13 : 6}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
        bounds={allLocations.length > 1 ? allLocations : undefined}
        boundsOptions={{ padding: [50, 50] }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {stables.map((stable) => (
          <Marker key={stable.id} position={[stable.latitude!, stable.longitude!]}>
            <Popup 
              maxWidth={340} 
              minWidth={280}
              className="custom-popup"
            >
              <Box sx={{ p: 2, fontFamily: "system-ui" }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
                  {stable.images && stable.images.length > 0 ? (
                    <Box
                      component="img"
                      src={stable.images[0]}
                      alt={stable.name}
                      sx={{
                        width: 70,
                        height: 70,
                        objectFit: "cover",
                        borderRadius: 1,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 70,
                        height: 70,
                        backgroundColor: "#f5f5f5",
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      🏠
                    </Box>
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ fontSize: "18px", fontWeight: 500, color: "#212121", mb: 0.5 }}>
                      {stable.name}
                    </Box>
                    <Box sx={{ fontSize: "14px", color: "#757575", mb: 1 }}>{stable.location}</Box>
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 1.5,
                    fontSize: "13px",
                    color: "#757575",
                  }}
                >
                  <span>
                    {stable.boxes?.length || 0}{" "}
                    {(stable.boxes?.length || 0) === 1 ? "boks" : "bokser"}
                  </span>
                  {(stable.availableBoxes || 0) > 0 ? (
                    <Box sx={{ color: "#4caf50", fontWeight: 500 }}>
                      {stable.availableBoxes || 0} ledig
                      {(stable.availableBoxes || 0) === 1 ? "" : "e"}
                    </Box>
                  ) : (
                    <Box sx={{ color: "#9e9e9e" }}>Utleid</Box>
                  )}
                </Box>
                {stable.priceRange && stable.priceRange.min > 0 && (
                  <Box sx={{ fontSize: "16px", fontWeight: 500, color: "#212121", mb: 2 }}>
                    {stable.priceRange.min === stable.priceRange.max
                      ? `${stable.priceRange.min.toLocaleString()} kr/mnd`
                      : `${stable.priceRange.min.toLocaleString()}-${stable.priceRange.max.toLocaleString()} kr/mnd`}
                  </Box>
                )}
                <Button
                  variant="emerald"
                  size="md"
                  fullWidth
                  onClick={() => router.push(`/staller/${stable.id}`)}
                >
                  Se detaljer
                </Button>
              </Box>
            </Popup>
          </Marker>
        ))}

        {services.map((service) => (
          <Marker 
            key={service.id} 
            position={[service.latitude, service.longitude]}
            icon={yellowIcon}
          >
            <Popup 
              maxWidth={340} 
              minWidth={280}
              className="custom-popup"
            >
              <Box sx={{ p: 2, fontFamily: "system-ui" }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 70,
                      height: 70,
                      backgroundColor: "#fff3cd",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "24px",
                    }}
                  >
                    🔧
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ fontSize: "18px", fontWeight: 500, color: "#212121", mb: 0.5 }}>
                      {service.title}
                    </Box>
                    <Box sx={{ fontSize: "14px", color: "#757575", mb: 1 }}>{service.location}</Box>
                    <Box sx={{ fontSize: "13px", color: "#f57c00", fontWeight: 500 }}>{service.serviceType}</Box>
                  </Box>
                </Box>
                <Box sx={{ fontSize: "14px", color: "#666", mb: 1.5, lineHeight: 1.4 }}>
                  {service.description.length > 120 
                    ? `${service.description.substring(0, 120)}...` 
                    : service.description}
                </Box>
                {service.providerName && (
                  <Box sx={{ fontSize: "13px", color: "#757575", mb: 1 }}>
                    Tilbyder: {service.providerName}
                  </Box>
                )}
                {(service.priceRangeMin || service.priceRangeMax) && (
                  <Box sx={{ fontSize: "16px", fontWeight: 500, color: "#212121", mb: 2 }}>
                    {(() => {
                      if (service.priceRangeMin && service.priceRangeMax) {
                        return service.priceRangeMin === service.priceRangeMax
                          ? `${service.priceRangeMin.toLocaleString()} kr`
                          : `${service.priceRangeMin.toLocaleString()}-${service.priceRangeMax.toLocaleString()} kr`;
                      }
                      if (service.priceRangeMin) {
                        return `Fra ${service.priceRangeMin.toLocaleString()} kr`;
                      }
                      if (service.priceRangeMax) {
                        return `Opp til ${service.priceRangeMax.toLocaleString()} kr`;
                      }
                      return null;
                    })()}
                  </Box>
                )}
                <Button
                  variant="emerald"
                  size="md"
                  fullWidth
                  onClick={() => router.push(`/tjenester/${service.id}`)}
                >
                  Se detaljer
                </Button>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}
