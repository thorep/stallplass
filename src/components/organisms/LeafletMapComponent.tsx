"use client";

import { StableWithBoxStats } from "@/types/stable";
import { Box, IconButton, InputBase, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet/dist/leaflet.css';

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
}

// Custom control component for back button
function BackButtonControl() {
  const router = useRouter();
  
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
      }}
    >
      <IconButton
        onClick={() => router.back()}
        sx={{
          backgroundColor: 'white',
          boxShadow: '0 1px 5px rgba(0,0,0,0.2)',
          '&:hover': {
            backgroundColor: '#f5f5f5',
          },
        }}
      >
        <ArrowBackIcon />
      </IconButton>
    </Box>
  );
}

export default function LeafletMapComponent({ stables }: LeafletMapComponentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Address[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Calculate center and bounds
  const center = stables.length > 0 
    ? [stables[0].latitude!, stables[0].longitude!] as [number, number]
    : [62.0, 10.0] as [number, number];

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
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.length === 0) {
      setSearchResults([]);
      setShowResults(false);
    } else if (value.length >= 3) {
      const timeoutId = setTimeout(() => searchAddresses(value), 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchAddresses]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Back Button */}
      <BackButtonControl />

      {/* Search Control */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
          width: 320,
        }}
      >
        <Paper
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: 2,
          }}
        >
          <SearchIcon sx={{ ml: 2, color: 'text.secondary' }} />
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
                setSearchQuery('');
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
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 0.5,
              maxHeight: 240,
              overflow: 'auto',
              backgroundColor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              borderRadius: 2,
            }}
          >
            {isSearching ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                Søker...
              </Box>
            ) : searchResults.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                Ingen adresser funnet
              </Box>
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
                    borderBottom: index < searchResults.length - 1 ? '1px solid #f5f5f5' : 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                    },
                  }}
                >
                  <Box sx={{ fontWeight: 500, fontSize: '14px' }}>
                    {address.adressetekst}
                  </Box>
                  <Box sx={{ color: 'text.secondary', fontSize: '12px' }}>
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
        zoom={stables.length === 1 ? 13 : 6}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        bounds={stables.length > 1 ? stables.map(s => [s.latitude!, s.longitude!] as [number, number]) : undefined}
        boundsOptions={{ padding: [50, 50] }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {stables.map((stable) => (
          <Marker
            key={stable.id}
            position={[stable.latitude!, stable.longitude!]}
          >
            <Popup maxWidth={350} minWidth={280}>
              <Box sx={{ p: 2, fontFamily: 'system-ui' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                  {stable.images && stable.images.length > 0 ? (
                    <Box
                      component="img"
                      src={stable.images[0]}
                      alt={stable.name}
                      sx={{
                        width: 70,
                        height: 70,
                        objectFit: 'cover',
                        borderRadius: 1,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 70,
                        height: 70,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      🏠
                    </Box>
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ fontSize: '18px', fontWeight: 500, color: '#212121', mb: 0.5 }}>
                      {stable.name}
                    </Box>
                    <Box sx={{ fontSize: '14px', color: '#757575', mb: 1 }}>
                      {stable.location}
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, fontSize: '13px', color: '#757575' }}>
                  <span>{stable.boxes?.length || 0} {(stable.boxes?.length || 0) === 1 ? "boks" : "bokser"}</span>
                  {(stable.availableBoxes || 0) > 0 ? (
                    <Box sx={{ color: '#4caf50', fontWeight: 500 }}>
                      {stable.availableBoxes || 0} ledig{(stable.availableBoxes || 0) === 1 ? "" : "e"}
                    </Box>
                  ) : (
                    <Box sx={{ color: '#9e9e9e' }}>Utleid</Box>
                  )}
                </Box>
                
                {stable.priceRange && stable.priceRange.min > 0 && (
                  <Box sx={{ fontSize: '16px', fontWeight: 500, color: '#212121', mb: 2 }}>
                    {stable.priceRange.min === stable.priceRange.max
                      ? `${stable.priceRange.min.toLocaleString()} kr/mnd`
                      : `${stable.priceRange.min.toLocaleString()}-${stable.priceRange.max.toLocaleString()} kr/mnd`
                    }
                  </Box>
                )}
                
                <Box
                  component="a"
                  href={`/staller/${stable.id}`}
                  sx={{
                    display: 'block',
                    width: '100%',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    textAlign: 'center',
                    py: 1.5,
                    borderRadius: 1,
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: '#45a049',
                    },
                  }}
                >
                  Se detaljer
                </Box>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}