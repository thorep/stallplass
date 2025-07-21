// TanStack Query hooks for stall-data (Norwegian terminology)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StableWithBoxStats, StableWithAmenities, CreateStableData, UpdateStableData } from '@/types';
import { QUERY_STALE_TIMES } from '@/utils';

// Query Keys - Norwegian terminology
export const stallNøkler = {
  alle: ['stables'] as const,
  medStallplassStatistikk: () => [...stallNøkler.alle, 'medStallplassStatistikk'] as const,
  etterEier: (eierId: string) => [...stallNøkler.alle, 'etterEier', eierId] as const,
  etterId: (id: string) => [...stallNøkler.alle, 'etterId', id] as const,
  søk: (filtre: Record<string, unknown>) => [...stallNøkler.alle, 'søk', filtre] as const,
};

// Norwegian terminology aliases for types
type StallMedStallplassStatistikk = StableWithBoxStats;
type StallMedFasiliteter = StableWithAmenities;
type OpprettStallData = CreateStableData;
type OppdaterStallData = UpdateStableData;

// Stall API functions - Norwegian terminology
async function hentStallerMedStallplassStatistikk(): Promise<StallMedStallplassStatistikk[]> {
  const response = await fetch('/api/stables?withBoxStats=true');
  if (!response.ok) throw new Error('Kunne ikke hente staller');
  return response.json();
}

async function hentStallerEtterEier(eierId: string): Promise<StallMedFasiliteter[]> {
  const response = await fetch(`/api/stables?ownerId=${eierId}`);
  if (!response.ok) throw new Error('Kunne ikke hente staller');
  return response.json();
}

async function hentStallEtterId(id: string): Promise<StallMedFasiliteter> {
  const response = await fetch(`/api/stables/${id}`);
  if (!response.ok) throw new Error('Kunne ikke hente stall');
  return response.json();
}

async function opprettStall(data: OpprettStallData): Promise<StallMedFasiliteter> {
  const response = await fetch('/api/stables', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Kunne ikke opprette stall');
  return response.json();
}

async function oppdaterStall(id: string, data: OppdaterStallData): Promise<StallMedFasiliteter> {
  const response = await fetch(`/api/stables/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Kunne ikke oppdatere stall');
  return response.json();
}

async function slettStall(id: string): Promise<void> {
  const response = await fetch(`/api/stables/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Kunne ikke slette stall');
}

// Hooks - Norwegian terminology
export function useStallerMedStallplassStatistikk(aktivert = true) {
  return useQuery({
    queryKey: stallNøkler.medStallplassStatistikk(),
    queryFn: hentStallerMedStallplassStatistikk,
    enabled: aktivert,
    staleTime: QUERY_STALE_TIMES.STABLE_DATA,
  });
}

export function useStallerEtterEier(eierId?: string, aktivert = true) {
  return useQuery({
    queryKey: stallNøkler.etterEier(eierId || ''),
    queryFn: () => hentStallerEtterEier(eierId!),
    enabled: aktivert && !!eierId,
    staleTime: QUERY_STALE_TIMES.STABLE_DATA,
  });
}

export function useStallEtterId(id?: string, aktivert = true) {
  return useQuery({
    queryKey: stallNøkler.etterId(id || ''),
    queryFn: () => hentStallEtterId(id!),
    enabled: aktivert && !!id,
    staleTime: QUERY_STALE_TIMES.STABLE_DATA,
  });
}

export function useOpprettStall() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: opprettStall,
    onSuccess: () => {
      // Invalidate and refetch staller
      queryClient.invalidateQueries({ queryKey: stallNøkler.alle });
    },
  });
}

export function useOppdaterStall() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OppdaterStallData }) => 
      oppdaterStall(id, data),
    onSuccess: (data, variables) => {
      // Update specific stall in cache
      queryClient.setQueryData(stallNøkler.etterId(variables.id), data);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: stallNøkler.alle });
    },
  });
}

export function useSlettStall() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: slettStall,
    onSuccess: () => {
      // Invalidate and refetch staller
      queryClient.invalidateQueries({ queryKey: stallNøkler.alle });
    },
  });
}

// Export types
export type {
  StallMedStallplassStatistikk,
  StallMedFasiliteter,
  OpprettStallData,
  OppdaterStallData
};