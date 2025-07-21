import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  subscribeToStableOwnerRentals,
  subscribeToRentalStatusChanges,
  subscribeToNewRentalRequests,
  unsubscribeFromRentalChannel,
  getStableOwnerRentals,
  getStableOwnerRentalStats,
  RentalWithRelations
} from '@/services/rental-service';
import { Tables, Database } from '@/types/supabase';

export type Utleie = Tables<'utleie'>;
export type UtleieStatus = Database['public']['Enums']['rental_status'];

interface UtleieLivssyklusHendelse {
  id: string;
  utleieId: string;
  status: UtleieStatus;
  forrigeStatus?: UtleieStatus;
  tidsstempel: Date;
  utlostAv: string;
  beskrivelse: string;
  metadata?: {
    arsak?: string;
    notater?: string;
    automatiskOvergang?: boolean;
  };
}

interface UtleieKonflikt {
  id: string;
  type: 'DOBBEL_BOOKING' | 'OVERLAPPENDE_DATOER' | 'STALLPLASS_UTILGJENGELIG' | 'BETALING_VENTER';
  utleieId: string;
  stallplassId: string;
  alvorlighetsgrad: 'LAV' | 'MEDIUM' | 'HOY' | 'KRITISK';
  beskrivelse: string;
  forslagLosning: string;
  autoLosbar: boolean;
  konfliktUtleie?: string[];
}

interface UtleieAnalyse {
  totaltUtleie: number;
  aktivUtleie: number;
  ventendUtleie: number;
  manedligInntekt: number;
  konverteringsrate: number; // venter til aktiv
  gjennomsnittligUtleieVarighet: number;
  kanselleringsrate: number;
  nyligeTrender: {
    nyeForesporsler: number;
    bekreftelser: number;
    kanselleringer: number;
    periode: 'idag' | 'uke' | 'maned';
  };
}

interface UseRealTimeUtleieOptions {
  eierId?: string;
  stallId?: string;
  enabled?: boolean;
  sporAnalyse?: boolean;
  oppdagKonflikter?: boolean;
}

/**
 * Comprehensive hook for real-time utleie lifecycle management (Norwegian version)
 * Uses 'utleie' table and Norwegian column names
 */
export function useRealTimeUtleie(options: UseRealTimeUtleieOptions = {}) {
  const { 
    eierId, 
    enabled = true, 
    sporAnalyse = true, 
    oppdagKonflikter = true 
  } = options;

  // State management
  const [utleier, setUtleier] = useState<RentalWithRelations[]>([]);
  const [analyse, setAnalyse] = useState<UtleieAnalyse | null>(null);
  const [konflikter, setKonflikter] = useState<UtleieKonflikt[]>([]);
  const [livssyklusHendelser, setLivssyklusHendelser] = useState<UtleieLivssyklusHendelse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Channel references
  const utleieChannelRef = useRef<RealtimeChannel | null>(null);
  const statusChannelRef = useRef<RealtimeChannel | null>(null);
  const foresporslerChannelRef = useRef<RealtimeChannel | null>(null);

  const oppdagUtleieKonflikter = useCallback(async (utleieForSjekk: RentalWithRelations[]): Promise<UtleieKonflikt[]> => {
    const konflikter: UtleieKonflikt[] = [];

    // Group utleie by stallplass
    const utleieByStallplass = utleieForSjekk.reduce((acc, utleie) => {
      if (!acc[utleie.stallplass_id]) acc[utleie.stallplass_id] = [];
      acc[utleie.stallplass_id].push(utleie);
      return acc;
    }, {} as Record<string, RentalWithRelations[]>);

    // Check for conflicts within each stallplass
    Object.entries(utleieByStallplass).forEach(([stallplassId, stallplassUtleie]) => {
      const aktivUtleie = stallplassUtleie.filter(u => u.status === 'ACTIVE');
      
      if (aktivUtleie.length > 1) {
        aktivUtleie.forEach(utleie => {
          konflikter.push({
            id: `konflikt-${utleie.id}`,
            type: 'DOBBEL_BOOKING',
            utleieId: utleie.id,
            stallplassId,
            alvorlighetsgrad: 'KRITISK',
            beskrivelse: `Flere aktive leieforhold for samme stallplass`,
            forslagLosning: 'Manuell gjennomgang av leieforhold påkrevd',
            autoLosbar: false,
            konfliktUtleie: aktivUtleie.filter(u => u.id !== utleie.id).map(u => u.id)
          });
        });
      }
    });

    return konflikter;
  }, []);

  // Helper functions
  const oppdaterAnalyse = useCallback((utleie: Utleie, hendelsesType: 'INSERT' | 'UPDATE' | 'DELETE') => {
    setAnalyse(prev => {
      if (!prev) return null;

      const oppdateringer: Partial<UtleieAnalyse> = {};

      if (hendelsesType === 'INSERT') {
        oppdateringer.totaltUtleie = prev.totaltUtleie + 1;
        // No pending status in current enum, only track active utleie
        if (utleie.status === 'ACTIVE') {
          oppdateringer.aktivUtleie = prev.aktivUtleie + 1;
        }
      } else if (hendelsesType === 'UPDATE') {
        if (utleie.status === 'ACTIVE') {
          oppdateringer.aktivUtleie = prev.aktivUtleie + 1;
          oppdateringer.nyligeTrender = {
            ...prev.nyligeTrender,
            bekreftelser: prev.nyligeTrender.bekreftelser + 1
          };
        } else if (utleie.status === 'CANCELLED') {
          oppdateringer.nyligeTrender = {
            ...prev.nyligeTrender,
            kanselleringer: prev.nyligeTrender.kanselleringer + 1
          };
        }
      }

      // Recalculate conversion rate
      const nyTotaltUtleie = oppdateringer.totaltUtleie || prev.totaltUtleie;
      const nyAktivUtleie = oppdateringer.aktivUtleie || prev.aktivUtleie;
      oppdateringer.konverteringsrate = nyTotaltUtleie > 0 ? (nyAktivUtleie / nyTotaltUtleie) * 100 : 0;

      return { ...prev, ...oppdateringer };
    });
  }, []);

  const sjekkForNyeKonflikter = useCallback(async (utleie: Utleie) => {
    // Check for overlapping dates with other utleie for the same stallplass
    const overlappendUtleie = utleier.filter(u => 
      u.stallplass_id === utleie.stallplass_id && 
      u.id !== utleie.id && 
      u.status === 'ACTIVE' && 
      utleie.status === 'ACTIVE'
    );

    if (overlappendUtleie.length > 0) {
      const konflikt: UtleieKonflikt = {
        id: `konflikt-${Date.now()}`,
        type: 'DOBBEL_BOOKING',
        utleieId: utleie.id,
        stallplassId: utleie.stallplass_id,
        alvorlighetsgrad: 'KRITISK',
        beskrivelse: `Dobbeltbooking oppdaget for stallplass ${utleie.stallplass_id}`,
        forslagLosning: 'Kontakt begge parter for å løse konflikten',
        autoLosbar: false,
        konfliktUtleie: overlappendUtleie.map(u => u.id)
      };

      setKonflikter(prev => [konflikt, ...prev]);
    }
  }, [utleier]);

  // Load initial data
  useEffect(() => {
    if (!enabled || !eierId) return;

    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);

        // Load utleie
        const initialUtleie = await getStableOwnerRentals(eierId!);
        setUtleier(initialUtleie);

        // Load analyser if enabled
        if (sporAnalyse) {
          const stats = await getStableOwnerRentalStats(eierId!);
          setAnalyse({
            totaltUtleie: stats.totalRentals,
            aktivUtleie: stats.activeRentals,
            ventendUtleie: stats.pendingRentals,
            manedligInntekt: stats.monthlyRevenue,
            konverteringsrate: stats.totalRentals > 0 ? (stats.activeRentals / stats.totalRentals) * 100 : 0,
            gjennomsnittligUtleieVarighet: 30, // Default, can be calculated from actual data
            kanselleringsrate: 0, // Calculate from utleie data
            nyligeTrender: {
              nyeForesporsler: stats.pendingRentals,
              bekreftelser: stats.activeRentals,
              kanselleringer: 0,
              periode: 'maned'
            }
          });
        }

        // Detect initial conflicts if enabled
        if (oppdagKonflikter) {
          const detectedKonflikter = await oppdagUtleieKonflikter(initialUtleie);
          setKonflikter(detectedKonflikter);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load utleie data');
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [eierId, enabled, sporAnalyse, oppdagKonflikter, oppdagUtleieKonflikter]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!enabled || !eierId) return;

    // Subscribe to utleie changes
    const handleUtleieChange = (utleie: Utleie, hendelsesType: 'INSERT' | 'UPDATE' | 'DELETE') => {
      setUtleier(prev => {
        if (hendelsesType === 'DELETE') {
          return prev.filter(u => u.id !== utleie.id);
        }
        
        const existingIndex = prev.findIndex(u => u.id === utleie.id);
        if (existingIndex >= 0) {
          // Update existing utleie
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...utleie };
          return updated;
        } else {
          // This is a new utleie, we need to fetch full data
          // For now, add placeholder that will be updated by next subscription
          return prev;
        }
      });

      // Track lifecycle event
      if (hendelsesType === 'UPDATE' || hendelsesType === 'INSERT') {
        const hendelse: UtleieLivssyklusHendelse = {
          id: `${Date.now()}-${Math.random()}`,
          utleieId: utleie.id,
          status: utleie.status as UtleieStatus,
          tidsstempel: new Date(),
          utlostAv: 'system',
          beskrivelse: `Leieforhold ${hendelsesType === 'INSERT' ? 'opprettet' : 'oppdatert'}`,
          metadata: {
            automatiskOvergang: hendelsesType === 'INSERT'
          }
        };
        
        setLivssyklusHendelser(prev => [hendelse, ...prev.slice(0, 99)]); // Keep last 100 events
      }

      // Update analyser
      if (sporAnalyse) {
        oppdaterAnalyse(utleie, hendelsesType);
      }

      // Check for konflikter
      if (oppdagKonflikter) {
        sjekkForNyeKonflikter(utleie);
      }
    };

    // Subscribe to status changes specifically
    const handleStatusChange = (utleie: Utleie) => {
      const hendelse: UtleieLivssyklusHendelse = {
        id: `${Date.now()}-${Math.random()}`,
        utleieId: utleie.id,
        status: utleie.status as UtleieStatus,
        tidsstempel: new Date(),
        utlostAv: 'status_oppdatering',
        beskrivelse: `Status endret til ${utleie.status}`
      };
      
      setLivssyklusHendelser(prev => [hendelse, ...prev.slice(0, 99)]);
    };

    // Subscribe to new utleie requests
    const handleNyForesporsler = (utleie: RentalWithRelations) => {
      setUtleier(prev => [utleie, ...prev]);
      
      const hendelse: UtleieLivssyklusHendelse = {
        id: `${Date.now()}-${Math.random()}`,
        utleieId: utleie.id,
        status: 'ACTIVE' as UtleieStatus,
        tidsstempel: new Date(),
        utlostAv: 'ny_forespørsel',
        beskrivelse: 'Ny leieforespørsel mottatt'
      };
      
      setLivssyklusHendelser(prev => [hendelse, ...prev.slice(0, 99)]);
    };

    // Set up subscriptions
    const utleieChannel = subscribeToStableOwnerRentals(eierId, handleUtleieChange);
    const statusChannel = subscribeToRentalStatusChanges(handleStatusChange);
    const foresporslerChannel = subscribeToNewRentalRequests(eierId, handleNyForesporsler);

    utleieChannelRef.current = utleieChannel;
    statusChannelRef.current = statusChannel;
    foresporslerChannelRef.current = foresporslerChannel;

    return () => {
      if (utleieChannelRef.current) {
        unsubscribeFromRentalChannel(utleieChannelRef.current);
        utleieChannelRef.current = null;
      }
      if (statusChannelRef.current) {
        unsubscribeFromRentalChannel(statusChannelRef.current);
        statusChannelRef.current = null;
      }
      if (foresporslerChannelRef.current) {
        unsubscribeFromRentalChannel(foresporslerChannelRef.current);
        foresporslerChannelRef.current = null;
      }
    };
  }, [eierId, enabled, sporAnalyse, oppdagKonflikter, oppdaterAnalyse, sjekkForNyeKonflikter]);

  // Public methods
  const refresh = useCallback(async () => {
    if (!eierId) return;

    try {
      setIsLoading(true);
      const refreshedUtleie = await getStableOwnerRentals(eierId);
      setUtleier(refreshedUtleie);

      if (sporAnalyse) {
        const stats = await getStableOwnerRentalStats(eierId);
        setAnalyse({
          totaltUtleie: stats.totalRentals,
          aktivUtleie: stats.activeRentals,
          ventendUtleie: stats.pendingRentals,
          manedligInntekt: stats.monthlyRevenue,
          konverteringsrate: stats.totalRentals > 0 ? (stats.activeRentals / stats.totalRentals) * 100 : 0,
          gjennomsnittligUtleieVarighet: 30,
          kanselleringsrate: 0,
          nyligeTrender: {
            nyeForesporsler: stats.pendingRentals,
            bekreftelser: stats.activeRentals,
            kanselleringer: 0,
            periode: 'maned'
          }
        });
      }

      if (oppdagKonflikter) {
        const detectedKonflikter = await oppdagUtleieKonflikter(refreshedUtleie);
        setKonflikter(detectedKonflikter);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh utleie data');
    } finally {
      setIsLoading(false);
    }
  }, [eierId, sporAnalyse, oppdagKonflikter, oppdagUtleieKonflikter]);

  const losKonflikt = useCallback((konfliktId: string, losning: string) => {
    setKonflikter(prev => prev.filter(k => k.id !== konfliktId));
    
    // Log losning
    const hendelse: UtleieLivssyklusHendelse = {
      id: `${Date.now()}-${Math.random()}`,
      utleieId: 'system',
      status: 'ACTIVE' as UtleieStatus, // Not applicable for system events
      tidsstempel: new Date(),
      utlostAv: 'konflikt_losning',
      beskrivelse: `Konflikt løst: ${losning}`,
      metadata: {
        arsak: losning,
        notater: `Resolved conflict: ${konfliktId}`
      }
    };
    
    setLivssyklusHendelser(prev => [hendelse, ...prev.slice(0, 99)]);
  }, []);

  const getAktivUtleieForStallplass = useCallback((stallplassId: string) => {
    return utleier.filter(u => u.stallplass_id === stallplassId && u.status === 'ACTIVE');
  }, [utleier]);

  const getUtleieByStatus = useCallback((status: UtleieStatus) => {
    return utleier.filter(u => u.status === status);
  }, [utleier]);

  return {
    // Data
    utleier,
    analyse,
    konflikter,
    livssyklusHendelser,
    
    // State
    isLoading,
    error,
    
    // Methods
    refresh,
    losKonflikt,
    getAktivUtleieForStallplass,
    getUtleieByStatus,
    
    // Utilities
    clearError: () => setError(null),
    clearKonflikter: () => setKonflikter([]),
    clearLivssyklusHendelser: () => setLivssyklusHendelser([])
  };
}

/**
 * Hook for tracking utleie status of a specific utleie (Norwegian version)
 */
export function useRealTimeUtleieStatus(utleieId: string, enabled = true) {
  const [utleie, setUtleie] = useState<Utleie | null>(null);
  const [statusHistorikk, setStatusHistorikk] = useState<UtleieLivssyklusHendelse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !utleieId) return;

    const handleStatusChange = (updatedUtleie: Utleie) => {
      if (updatedUtleie.id === utleieId) {
        const previousStatus = utleie?.status;
        setUtleie(updatedUtleie);

        // Add to status historikk
        const hendelse: UtleieLivssyklusHendelse = {
          id: `${Date.now()}-${Math.random()}`,
          utleieId,
          status: updatedUtleie.status as UtleieStatus,
          forrigeStatus: previousStatus as UtleieStatus,
          tidsstempel: new Date(),
          utlostAv: 'status_oppdatering',
          beskrivelse: `Status endret fra ${previousStatus} til ${updatedUtleie.status}`
        };

        setStatusHistorikk(prev => [hendelse, ...prev.slice(0, 19)]); // Keep last 20 events
      }
    };

    const channel = subscribeToRentalStatusChanges(handleStatusChange);
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribeFromRentalChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [utleieId, enabled, utleie?.status]);

  return {
    utleie,
    statusHistorikk,
    error,
    clearError: () => setError(null)
  };
}

/**
 * Hook for leietaker-side utleie tracking (Norwegian version)
 */
export function useRealTimeLeietakerUtleie(leietakerId: string, enabled = true) {
  const [mineUtleie, setMineUtleie] = useState<RentalWithRelations[]>([]);
  const [varslinger, setVarslinger] = useState<UtleieLivssyklusHendelse[]>([]);
  const [isLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !leietakerId) return;

    // TODO: Implement leietaker-specific utleie fetching
    // This would need to be added to the utleie service

    const handleUtleieUpdate = (utleie: Utleie, hendelsesType: 'INSERT' | 'UPDATE' | 'DELETE') => {
      if (utleie.leietaker_id === leietakerId) {
        setMineUtleie(prev => {
          if (hendelsesType === 'DELETE') {
            return prev.filter(u => u.id !== utleie.id);
          }
          
          const existingIndex = prev.findIndex(u => u.id === utleie.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...utleie };
            return updated;
          }
          
          return prev; // New utleie would need full data fetch
        });

        // Add notification for leietaker
        const hendelse: UtleieLivssyklusHendelse = {
          id: `${Date.now()}-${Math.random()}`,
          utleieId: utleie.id,
          status: utleie.status as UtleieStatus,
          tidsstempel: new Date(),
          utlostAv: 'utleie_oppdatering',
          beskrivelse: `Leieforhold oppdatert til status: ${utleie.status}`,
          metadata: {
            arsak: `Din leie har blitt oppdatert til status: ${utleie.status}`
          }
        };

        setVarslinger(prev => [hendelse, ...prev.slice(0, 49)]); // Keep last 50
      }
    };

    const channel = subscribeToRentalStatusChanges((utleie) => handleUtleieUpdate(utleie, 'UPDATE'));
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribeFromRentalChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [leietakerId, enabled]);

  return {
    mineUtleie,
    varslinger,
    isLoading,
    error,
    clearVarslinger: () => setVarslinger([]),
    clearError: () => setError(null)
  };
}