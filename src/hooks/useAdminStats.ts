import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Norwegian terminology interfaces
export interface AdminStatistikk {
  totaleBrukere: number;
  adminBrukere: number;
  stallEiere: number;
  totaleStaller: number;
  fremhevedeStaller: number;
  annonserendeStaller: number;
  totaleStallplasser: number;
  tilgjengeligeStallplasser: number;
  aktiveStallplasser: number;
  totaleBetalinger: number;
  fullførteBetalinger: number;
  ventendeBatalinger: number;
  feiledeBetalinger: number;
  totalInntekt: number;
  sistOppdatert: string;
}

// Legacy interface for backward compatibility
export interface AdminStats {
  totalUsers: number;
  adminUsers: number;
  stableOwners: number;
  totalStables: number;
  featuredStables: number;
  advertisingStables: number;
  totalBoxes: number;
  availableBoxes: number;
  activeBoxes: number;
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalRevenue: number;
  lastUpdated: string;
}

// Norwegian terminology detailed interface
export interface AdminStatistikkDetaljert {
  brukere: {
    totale: number;
    admins: number;
    stallEiere: number;
    nyeRegistreringer: number; // Siste 24t
  };
  staller: {
    totale: number;
    fremhevede: number;
    annonserende: number;
    nyligLagtTil: number; // Siste 24t
  };
  stallplasser: {
    totale: number;
    tilgjengelige: number;
    aktive: number;
    nyligLagtTil: number; // Siste 24t
  };
  betalinger: {
    totale: number;
    fullførte: number;
    ventende: number;
    feilede: number;
    totalInntekt: number;
    nyeBetalinger: number; // Siste 24t
    nyInntekt: number; // Siste 24t
  };
  aktivitet: {
    aktiveKonversasjoner: number;
    nyeMeldingerIDag: number;
    stallVisninger24t: number;
  };
}

// Legacy interface for backward compatibility
export interface AdminStatsDetailed {
  users: {
    total: number;
    admins: number;
    stableOwners: number;
    recentRegistrations: number; // Last 24h
  };
  stables: {
    total: number;
    featured: number;
    advertising: number;
    recentlyAdded: number; // Last 24h
  };
  boxes: {
    total: number;
    available: number;
    active: number;
    recentlyAdded: number; // Last 24h
  };
  payments: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
    totalRevenue: number;
    recentPayments: number; // Last 24h
    recentRevenue: number; // Last 24h
  };
  activity: {
    activeConversations: number;
    newMessagesToday: number;
    stableViews24h: number;
  };
}

interface BrukAdminStatistikkAlternativer {
  aktiverRealtime?: boolean;
  oppdateringsintervall?: number; // millisekunder
}

// Legacy interface
interface UseAdminStatsOptions {
  enableRealtime?: boolean;
  refreshInterval?: number; // milliseconds
}

// Main Norwegian function
export function useBrukAdminStatistikk(alternativer: BrukAdminStatistikkAlternativer = {}) {
  const { aktiverRealtime = true, oppdateringsintervall = 30000 } = alternativer;
  const [statistikk, setStatistikk] = useState<AdminStatistikkDetaljert | null>(null);
  const [laster, setLaster] = useState(true);
  const [feil, setFeil] = useState<string | null>(null);
  const [sistOppdatert, setSistOppdatert] = useState<Date | null>(null);
  
  const kanalRef = useRef<RealtimeChannel[]>([]);
  const intervallRef = useRef<NodeJS.Timeout | null>(null);

  // Hent omfattende admin-statistikk
  const hentStatistikk = useCallback(async () => {
    try {
      setFeil(null);
      
      // Få gjeldende tidsstempel for "nylige" beregninger (24t siden)
      const igår = new Date();
      igår.setHours(igår.getHours() - 24);
      const igårISO = igår.toISOString();

      // Hent alle data parallelt
      const [
        brukereResultat,
        stallerResultat,
        stallplasserResultat,
        betalingerResultat,
        konversasjonerResultat,
        meldingerResultat,
        visningerResultat
      ] = await Promise.allSettled([
        // Brukerdata
        supabase
          .from('users')
          .select('is_admin, created_at')
          .order('created_at', { ascending: false }),
        
        // Stalldata
        supabase
          .from('stables')
          .select('featured, advertising_active, created_at, owner_id')
          .order('created_at', { ascending: false }),
        
        // Stallplassdata
        supabase
          .from('boxes')
          .select('is_available, is_active, created_at')
          .order('created_at', { ascending: false }),
        
        // Betalingsdata
        supabase
          .from('payments')
          .select('status, total_amount, created_at')
          .order('created_at', { ascending: false }),
        
        // Aktive konversasjoner
        supabase
          .from('conversations')
          .select('id, updated_at')
          .gte('updated_at', igårISO),
        
        // Nylige meldinger
        supabase
          .from('messages')
          .select('id, created_at')
          .gte('created_at', igårISO),
        
        // Nylige visninger - placeholder siden tabellen ikke eksisterer enda
        Promise.resolve({ data: [], error: null })
      ]);

      // Behandle resultater med feilhåndtering
      const brukere = brukereResultat.status === 'fulfilled' ? brukereResultat.value.data || [] : [];
      const staller = stallerResultat.status === 'fulfilled' ? stallerResultat.value.data || [] : [];
      const stallplasser = stallplasserResultat.status === 'fulfilled' ? stallplasserResultat.value.data || [] : [];
      const betalinger = betalingerResultat.status === 'fulfilled' ? betalingerResultat.value.data || [] : [];
      const konversasjoner = konversasjonerResultat.status === 'fulfilled' ? konversasjonerResultat.value.data || [] : [];
      const meldinger = meldingerResultat.status === 'fulfilled' ? meldingerResultat.value.data || [] : [];
      const visninger = visningerResultat.status === 'fulfilled' ? visningerResultat.value.data || [] : [];

      // Kalkuler statistikk
      const stallEierIds = new Set(staller.map(stall => stall.owner_id));
      
      const adminStatistikkDetaljert: AdminStatistikkDetaljert = {
        brukere: {
          totale: brukere.length,
          admins: brukere.filter(bruker => bruker.is_admin).length,
          stallEiere: stallEierIds.size,
          nyeRegistreringer: brukere.filter(bruker => 
            new Date(bruker.created_at || '') >= igår
          ).length
        },
        staller: {
          totale: staller.length,
          fremhevede: staller.filter(stall => stall.featured).length,
          annonserende: staller.filter(stall => stall.advertising_active).length,
          nyligLagtTil: staller.filter(stall => 
            new Date(stall.created_at || '') >= igår
          ).length
        },
        stallplasser: {
          totale: stallplasser.length,
          tilgjengelige: stallplasser.filter(stallplass => stallplass.is_available).length,
          aktive: stallplasser.filter(stallplass => stallplass.is_active).length,
          nyligLagtTil: stallplasser.filter(stallplass => 
            new Date(stallplass.created_at || '') >= igår
          ).length
        },
        betalinger: {
          totale: betalinger.length,
          fullførte: betalinger.filter(betaling => betaling.status === 'COMPLETED').length,
          ventende: betalinger.filter(betaling => 
            betaling.status === 'PENDING' || betaling.status === 'PROCESSING'
          ).length,
          feilede: betalinger.filter(betaling => betaling.status === 'FAILED').length,
          totalInntekt: betalinger
            .filter(betaling => betaling.status === 'COMPLETED')
            .reduce((sum, betaling) => sum + (betaling.total_amount || 0), 0),
          nyeBetalinger: betalinger.filter(betaling => 
            new Date(betaling.created_at || '') >= igår
          ).length,
          nyInntekt: betalinger
            .filter(betaling => 
              betaling.status === 'COMPLETED' && 
              new Date(betaling.created_at || '') >= igår
            )
            .reduce((sum, betaling) => sum + (betaling.total_amount || 0), 0)
        },
        aktivitet: {
          aktiveKonversasjoner: konversasjoner.length,
          nyeMeldingerIDag: meldinger.length,
          stallVisninger24t: visninger.length
        }
      };

      setStatistikk(adminStatistikkDetaljert);
      setSistOppdatert(new Date());
      
    } catch (err) {
      console.error('Feil ved henting av admin-statistikk:', err);
      setFeil(err instanceof Error ? err.message : 'Kunne ikke hente admin-statistikk');
    } finally {
      setLaster(false);
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!aktiverRealtime) return;

    const settOppRealtimeAbonnementer = () => {
      // Abonner på alle relevante tabeller for live oppdateringer
      const tabeller = ['users', 'stables', 'boxes', 'payments', 'conversations', 'messages'];
      
      tabeller.forEach(tabellNavn => {
        const kanal = supabase
          .channel(`admin-stats-${tabellNavn}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: tabellNavn
            },
            () => {
              // Debounce oppdateringer for å unngå for mange API-kall
              if (intervallRef.current) {
                clearTimeout(intervallRef.current);
              }
              intervallRef.current = setTimeout(hentStatistikk, 1000);
            }
          )
          .subscribe();

        kanalRef.current.push(kanal);
      });
    };

    settOppRealtimeAbonnementer();

    return () => {
      // Rydd opp abonnementer
      kanalRef.current.forEach(kanal => {
        supabase.removeChannel(kanal);
      });
      kanalRef.current = [];
      
      if (intervallRef.current) {
        clearTimeout(intervallRef.current);
      }
    };
  }, [aktiverRealtime, hentStatistikk]);

  // Innledende lasting og periodisk oppdatering
  useEffect(() => {
    hentStatistikk();

    // Sett opp periodisk oppdatering som fallback
    if (oppdateringsintervall > 0) {
      const intervall = setInterval(hentStatistikk, oppdateringsintervall);
      return () => clearInterval(intervall);
    }
  }, [hentStatistikk, oppdateringsintervall]);

  // Manuell oppdateringsfunksjon
  const oppdater = useCallback(() => {
    setLaster(true);
    hentStatistikk();
  }, [hentStatistikk]);

  // Konverter til forenklet AdminStatistikk-format for bakoverkompatibilitet
  const forenkletStatistikk = statistikk ? {
    totaleBrukere: statistikk.brukere.totale,
    adminBrukere: statistikk.brukere.admins,
    stallEiere: statistikk.brukere.stallEiere,
    totaleStaller: statistikk.staller.totale,
    fremhevedeStaller: statistikk.staller.fremhevede,
    annonserendeStaller: statistikk.staller.annonserende,
    totaleStallplasser: statistikk.stallplasser.totale,
    tilgjengeligeStallplasser: statistikk.stallplasser.tilgjengelige,
    aktiveStallplasser: statistikk.stallplasser.aktive,
    totaleBetalinger: statistikk.betalinger.totale,
    fullførteBetalinger: statistikk.betalinger.fullførte,
    ventendeBatalinger: statistikk.betalinger.ventende,
    feiledeBetalinger: statistikk.betalinger.feilede,
    totalInntekt: statistikk.betalinger.totalInntekt,
    sistOppdatert: sistOppdatert?.toISOString() || new Date().toISOString()
  } as AdminStatistikk : null;

  return {
    statistikk,
    forenkletStatistikk,
    laster,
    feil,
    sistOppdatert,
    oppdater,
    nullstillFeil: () => setFeil(null)
  };
}

// Legacy wrapper function for backward compatibility
export function useAdminStats(options: UseAdminStatsOptions = {}) {
  const { enableRealtime = true, refreshInterval = 30000 } = options;
  const [stats, setStats] = useState<AdminStatsDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use the Norwegian function internally
  const norwegianResult = useBrukAdminStatistikk({
    aktiverRealtime: enableRealtime,
    oppdateringsintervall: refreshInterval
  });

  // Convert Norwegian results to English interface for legacy compatibility
  useEffect(() => {
    if (norwegianResult.statistikk) {
      const legacyStats: AdminStatsDetailed = {
        users: {
          total: norwegianResult.statistikk.brukere.totale,
          admins: norwegianResult.statistikk.brukere.admins,
          stableOwners: norwegianResult.statistikk.brukere.stallEiere,
          recentRegistrations: norwegianResult.statistikk.brukere.nyeRegistreringer
        },
        stables: {
          total: norwegianResult.statistikk.staller.totale,
          featured: norwegianResult.statistikk.staller.fremhevede,
          advertising: norwegianResult.statistikk.staller.annonserende,
          recentlyAdded: norwegianResult.statistikk.staller.nyligLagtTil
        },
        boxes: {
          total: norwegianResult.statistikk.stallplasser.totale,
          available: norwegianResult.statistikk.stallplasser.tilgjengelige,
          active: norwegianResult.statistikk.stallplasser.aktive,
          recentlyAdded: norwegianResult.statistikk.stallplasser.nyligLagtTil
        },
        payments: {
          total: norwegianResult.statistikk.betalinger.totale,
          completed: norwegianResult.statistikk.betalinger.fullførte,
          pending: norwegianResult.statistikk.betalinger.ventende,
          failed: norwegianResult.statistikk.betalinger.feilede,
          totalRevenue: norwegianResult.statistikk.betalinger.totalInntekt,
          recentPayments: norwegianResult.statistikk.betalinger.nyeBetalinger,
          recentRevenue: norwegianResult.statistikk.betalinger.nyInntekt
        },
        activity: {
          activeConversations: norwegianResult.statistikk.aktivitet.aktiveKonversasjoner,
          newMessagesToday: norwegianResult.statistikk.aktivitet.nyeMeldingerIDag,
          stableViews24h: norwegianResult.statistikk.aktivitet.stallVisninger24t
        }
      };
      setStats(legacyStats);
    }
    
    setIsLoading(norwegianResult.laster);
    setError(norwegianResult.feil);
    setLastUpdated(norwegianResult.sistOppdatert);
  }, [norwegianResult.statistikk, norwegianResult.laster, norwegianResult.feil, norwegianResult.sistOppdatert]);

  // Convert simplified stats for legacy compatibility
  const simplifiedStats = stats ? {
    totalUsers: stats.users.total,
    adminUsers: stats.users.admins,
    stableOwners: stats.users.stableOwners,
    totalStables: stats.stables.total,
    featuredStables: stats.stables.featured,
    advertisingStables: stats.stables.advertising,
    totalBoxes: stats.boxes.total,
    availableBoxes: stats.boxes.available,
    activeBoxes: stats.boxes.active,
    totalPayments: stats.payments.total,
    completedPayments: stats.payments.completed,
    pendingPayments: stats.payments.pending,
    failedPayments: stats.payments.failed,
    totalRevenue: stats.payments.totalRevenue,
    lastUpdated: lastUpdated?.toISOString() || new Date().toISOString()
  } as AdminStats : null;

  return {
    stats,
    simplifiedStats,
    isLoading,
    error,
    lastUpdated,
    refresh: norwegianResult.oppdater,
    clearError: norwegianResult.nullstillFeil
  };
}
