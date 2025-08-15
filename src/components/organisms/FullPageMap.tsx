"use client";

import { StableWithBoxStats } from "@/types/stable";
import { Box, CircularProgress, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

interface FullPageMapProps {
  stables: StableWithBoxStats[];
  isLoading: boolean;
}

// Dynamically import the map component to avoid SSR issues
const LeafletMap = dynamic(
  () => import('./LeafletMapComponent'),
  { 
    loading: () => (
      <Box 
        sx={{ 
          width: '100%', 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f5f5f5'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ color: '#10b981', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Laster kart...
          </Typography>
        </Box>
      </Box>
    ),
    ssr: false 
  }
);

export default function FullPageMap({ stables, isLoading }: FullPageMapProps) {
  // Memoize valid stables
  const validStables = useMemo(
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

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f5f5f5'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ color: '#10b981', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Laster kart...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', position: 'relative' }}>
      <LeafletMap stables={validStables} />
    </Box>
  );
}