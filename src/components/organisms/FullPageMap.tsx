"use client";

import { StableWithBoxStats } from "@/types/stable";
import { ServiceMapView } from "@/types/service";
import { PartLoanHorse } from "@/hooks/usePartLoanHorses";
import { Box, CircularProgress, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

interface FullPageMapProps {
  readonly stables: StableWithBoxStats[];
  readonly services: ServiceMapView[];
  readonly partLoanHorses: PartLoanHorse[];
  readonly isLoading: boolean;
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

export default function FullPageMap({ stables, services, partLoanHorses, isLoading }: Readonly<FullPageMapProps>) {
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

  // Memoize valid services
  const validServices = useMemo(
    () =>
      services.filter(
        (service) =>
          service.latitude &&
          service.longitude &&
          typeof service.latitude === "number" &&
          typeof service.longitude === "number"
      ),
    [services]
  );

  // Memoize valid part-loan horses
  const validPartLoanHorses = useMemo(
    () =>
      partLoanHorses.filter(
        (horse) =>
          horse.latitude &&
          horse.longitude &&
          typeof horse.latitude === "number" &&
          typeof horse.longitude === "number"
      ),
    [partLoanHorses]
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
      <LeafletMap stables={validStables} services={validServices} partLoanHorses={validPartLoanHorses} />
    </Box>
  );
}