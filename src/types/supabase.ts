export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          variables?: Json
          extensions?: Json
          query?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      anmeldelser: {
        Row: {
          anmelder_id: string
          anmeldt_id: string
          anmeldt_type: Database["public"]["Enums"]["reviewee_type"]
          comment: string | null
          er_moderert: boolean | null
          er_offentlig: boolean | null
          fasiliteter_vurdering: number | null
          id: string
          kommunikasjon_vurdering: number | null
          moderator_notater: string | null
          oppdatert_dato: string | null
          opprettet_dato: string | null
          palitelighet_vurdering: number | null
          rating: number
          renslighet_vurdering: number | null
          stall_id: string
          title: string | null
          utleie_id: string
        }
        Insert: {
          anmelder_id: string
          anmeldt_id: string
          anmeldt_type: Database["public"]["Enums"]["reviewee_type"]
          comment?: string | null
          er_moderert?: boolean | null
          er_offentlig?: boolean | null
          fasiliteter_vurdering?: number | null
          id?: string
          kommunikasjon_vurdering?: number | null
          moderator_notater?: string | null
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          palitelighet_vurdering?: number | null
          rating: number
          renslighet_vurdering?: number | null
          stall_id: string
          title?: string | null
          utleie_id: string
        }
        Update: {
          anmelder_id?: string
          anmeldt_id?: string
          anmeldt_type?: Database["public"]["Enums"]["reviewee_type"]
          comment?: string | null
          er_moderert?: boolean | null
          er_offentlig?: boolean | null
          fasiliteter_vurdering?: number | null
          id?: string
          kommunikasjon_vurdering?: number | null
          moderator_notater?: string | null
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          palitelighet_vurdering?: number | null
          rating?: number
          renslighet_vurdering?: number | null
          stall_id?: string
          title?: string | null
          utleie_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_rental_id_fkey"
            columns: ["utleie_id"]
            isOneToOne: false
            referencedRelation: "utleie"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["anmeldt_id"]
            isOneToOne: false
            referencedRelation: "brukere"
            referencedColumns: ["firebase_id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["anmelder_id"]
            isOneToOne: false
            referencedRelation: "brukere"
            referencedColumns: ["firebase_id"]
          },
          {
            foreignKeyName: "reviews_stable_id_fkey"
            columns: ["stall_id"]
            isOneToOne: false
            referencedRelation: "staller"
            referencedColumns: ["id"]
          },
        ]
      }
      base_prices: {
        Row: {
          description: string | null
          er_aktiv: boolean | null
          grunnpris: number
          id: string
          name: string
          oppdatert_dato: string | null
          opprettet_dato: string | null
        }
        Insert: {
          description?: string | null
          er_aktiv?: boolean | null
          grunnpris: number
          id?: string
          name: string
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
        }
        Update: {
          description?: string | null
          er_aktiv?: boolean | null
          grunnpris?: number
          id?: string
          name?: string
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
        }
        Relationships: []
      }
      betalinger: {
        Row: {
          amount: number
          betalingsmetode: Database["public"]["Enums"]["payment_method"] | null
          betalt_dato: string | null
          bruker_id: string
          discount: number | null
          feil_arsak: string | null
          feilet_dato: string | null
          firebase_id: string
          id: string
          metadata: Json | null
          months: number
          oppdatert_dato: string | null
          opprettet_dato: string | null
          stall_id: string
          status: Database["public"]["Enums"]["payment_status"] | null
          total_belop: number
          vipps_ordre_id: string
          vipps_referanse: string | null
        }
        Insert: {
          amount: number
          betalingsmetode?: Database["public"]["Enums"]["payment_method"] | null
          betalt_dato?: string | null
          bruker_id: string
          discount?: number | null
          feil_arsak?: string | null
          feilet_dato?: string | null
          firebase_id: string
          id?: string
          metadata?: Json | null
          months: number
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          stall_id: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          total_belop: number
          vipps_ordre_id: string
          vipps_referanse?: string | null
        }
        Update: {
          amount?: number
          betalingsmetode?: Database["public"]["Enums"]["payment_method"] | null
          betalt_dato?: string | null
          bruker_id?: string
          discount?: number | null
          feil_arsak?: string | null
          feilet_dato?: string | null
          firebase_id?: string
          id?: string
          metadata?: Json | null
          months?: number
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          stall_id?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          total_belop?: number
          vipps_ordre_id?: string
          vipps_referanse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_stable_id_fkey"
            columns: ["stall_id"]
            isOneToOne: false
            referencedRelation: "staller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["bruker_id"]
            isOneToOne: false
            referencedRelation: "brukere"
            referencedColumns: ["firebase_id"]
          },
        ]
      }
      brukere: {
        Row: {
          avatar: string | null
          bio: string | null
          email: string
          er_admin: boolean | null
          firebase_id: string
          id: string
          name: string | null
          oppdatert_dato: string | null
          opprettet_dato: string | null
          phone: string | null
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          email: string
          er_admin?: boolean | null
          firebase_id: string
          id?: string
          name?: string | null
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          phone?: string | null
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          email?: string
          er_admin?: boolean | null
          firebase_id?: string
          id?: string
          name?: string | null
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      meldinger: {
        Row: {
          avsender_id: string
          content: string
          er_lest: boolean | null
          id: string
          melding_type: Database["public"]["Enums"]["message_type"] | null
          metadata: Json | null
          opprettet_dato: string | null
          samtale_id: string
        }
        Insert: {
          avsender_id: string
          content: string
          er_lest?: boolean | null
          id?: string
          melding_type?: Database["public"]["Enums"]["message_type"] | null
          metadata?: Json | null
          opprettet_dato?: string | null
          samtale_id: string
        }
        Update: {
          avsender_id?: string
          content?: string
          er_lest?: boolean | null
          id?: string
          melding_type?: Database["public"]["Enums"]["message_type"] | null
          metadata?: Json | null
          opprettet_dato?: string | null
          samtale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["samtale_id"]
            isOneToOne: false
            referencedRelation: "samtaler"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["avsender_id"]
            isOneToOne: false
            referencedRelation: "brukere"
            referencedColumns: ["firebase_id"]
          },
        ]
      }
      page_views: {
        Row: {
          bruker_agent: string | null
          entitet_id: string
          entitet_type: Database["public"]["Enums"]["entity_type"]
          id: string
          ip_adresse: string | null
          opprettet_dato: string | null
          referrer: string | null
          seer_id: string | null
        }
        Insert: {
          bruker_agent?: string | null
          entitet_id: string
          entitet_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          ip_adresse?: string | null
          opprettet_dato?: string | null
          referrer?: string | null
          seer_id?: string | null
        }
        Update: {
          bruker_agent?: string | null
          entitet_id?: string
          entitet_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          ip_adresse?: string | null
          opprettet_dato?: string | null
          referrer?: string | null
          seer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_viewer_id_fkey"
            columns: ["seer_id"]
            isOneToOne: false
            referencedRelation: "brukere"
            referencedColumns: ["firebase_id"]
          },
        ]
      }
      pricing_discounts: {
        Row: {
          er_aktiv: boolean | null
          id: string
          maaneder: number
          oppdatert_dato: string | null
          opprettet_dato: string | null
          rabatt_prosent: number
        }
        Insert: {
          er_aktiv?: boolean | null
          id?: string
          maaneder: number
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          rabatt_prosent: number
        }
        Update: {
          er_aktiv?: boolean | null
          id?: string
          maaneder?: number
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          rabatt_prosent?: number
        }
        Relationships: []
      }
      roadmap_items: {
        Row: {
          category: string
          completed_date: string | null
          description: string
          estimated_date: string | null
          id: string
          is_public: boolean | null
          oppdatert_dato: string | null
          opprettet_dato: string | null
          priority: Database["public"]["Enums"]["roadmap_priority"] | null
          sort_order: number | null
          status: Database["public"]["Enums"]["roadmap_status"] | null
          title: string
        }
        Insert: {
          category: string
          completed_date?: string | null
          description: string
          estimated_date?: string | null
          id?: string
          is_public?: boolean | null
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          priority?: Database["public"]["Enums"]["roadmap_priority"] | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["roadmap_status"] | null
          title: string
        }
        Update: {
          category?: string
          completed_date?: string | null
          description?: string
          estimated_date?: string | null
          id?: string
          is_public?: boolean | null
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          priority?: Database["public"]["Enums"]["roadmap_priority"] | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["roadmap_status"] | null
          title?: string
        }
        Relationships: []
      }
      samtaler: {
        Row: {
          id: string
          leietaker_id: string
          oppdatert_dato: string | null
          opprettet_dato: string | null
          stall_id: string
          stallplass_id: string | null
          status: Database["public"]["Enums"]["conversation_status"] | null
        }
        Insert: {
          id?: string
          leietaker_id: string
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          stall_id: string
          stallplass_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
        }
        Update: {
          id?: string
          leietaker_id?: string
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          stall_id?: string
          stallplass_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_box_id_fkey"
            columns: ["stallplass_id"]
            isOneToOne: false
            referencedRelation: "stallplasser"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_rider_id_fkey"
            columns: ["leietaker_id"]
            isOneToOne: false
            referencedRelation: "brukere"
            referencedColumns: ["firebase_id"]
          },
          {
            foreignKeyName: "conversations_stable_id_fkey"
            columns: ["stall_id"]
            isOneToOne: false
            referencedRelation: "staller"
            referencedColumns: ["id"]
          },
        ]
      }
      stall_fasilitet_lenker: {
        Row: {
          fasilitet_id: string
          id: string
          opprettet_dato: string | null
          stall_id: string
        }
        Insert: {
          fasilitet_id: string
          id?: string
          opprettet_dato?: string | null
          stall_id: string
        }
        Update: {
          fasilitet_id?: string
          id?: string
          opprettet_dato?: string | null
          stall_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stable_amenity_links_amenity_id_fkey"
            columns: ["fasilitet_id"]
            isOneToOne: false
            referencedRelation: "stall_fasiliteter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stable_amenity_links_stable_id_fkey"
            columns: ["stall_id"]
            isOneToOne: false
            referencedRelation: "staller"
            referencedColumns: ["id"]
          },
        ]
      }
      stall_fasiliteter: {
        Row: {
          id: string
          name: string
          oppdatert_dato: string | null
          opprettet_dato: string | null
        }
        Insert: {
          id?: string
          name: string
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
        }
        Update: {
          id?: string
          name?: string
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
        }
        Relationships: []
      }
      stall_ofte_spurte_sporsmal: {
        Row: {
          id: string
          is_active: boolean | null
          opprettet_dato: string | null
          sort_order: number | null
          sporsmal: string
          stall_id: string
          svar: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          opprettet_dato?: string | null
          sort_order?: number | null
          sporsmal: string
          stall_id: string
          svar: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          opprettet_dato?: string | null
          sort_order?: number | null
          sporsmal?: string
          stall_id?: string
          svar?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stable_faqs_stable_id_fkey"
            columns: ["stall_id"]
            isOneToOne: false
            referencedRelation: "staller"
            referencedColumns: ["id"]
          },
        ]
      }
      staller: {
        Row: {
          address: string | null
          antall_anmeldelser: number | null
          antall_stallplasser: number | null
          bilde_beskrivelser: string[] | null
          city: string | null
          county: string | null
          description: string
          eier_id: string
          eier_navn: string
          featured: boolean | null
          id: string
          images: string[] | null
          latitude: number | null
          location: string
          longitude: number | null
          name: string
          oppdatert_dato: string | null
          opprettet_dato: string | null
          owner_email: string
          owner_phone: string
          postal_code: string | null
          rating: number | null
          reklame_aktiv: boolean | null
          reklame_slutt_dato: string | null
          reklame_start_dato: string | null
        }
        Insert: {
          address?: string | null
          antall_anmeldelser?: number | null
          antall_stallplasser?: number | null
          bilde_beskrivelser?: string[] | null
          city?: string | null
          county?: string | null
          description: string
          eier_id: string
          eier_navn: string
          featured?: boolean | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          location: string
          longitude?: number | null
          name: string
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          owner_email: string
          owner_phone: string
          postal_code?: string | null
          rating?: number | null
          reklame_aktiv?: boolean | null
          reklame_slutt_dato?: string | null
          reklame_start_dato?: string | null
        }
        Update: {
          address?: string | null
          antall_anmeldelser?: number | null
          antall_stallplasser?: number | null
          bilde_beskrivelser?: string[] | null
          city?: string | null
          county?: string | null
          description?: string
          eier_id?: string
          eier_navn?: string
          featured?: boolean | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          name?: string
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          owner_email?: string
          owner_phone?: string
          postal_code?: string | null
          rating?: number | null
          reklame_aktiv?: boolean | null
          reklame_slutt_dato?: string | null
          reklame_start_dato?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stables_eier_id_fkey"
            columns: ["eier_id"]
            isOneToOne: false
            referencedRelation: "brukere"
            referencedColumns: ["firebase_id"]
          },
        ]
      }
      stallplass_fasilitet_lenker: {
        Row: {
          fasilitet_id: string
          id: string
          opprettet_dato: string | null
          stallplass_id: string
        }
        Insert: {
          fasilitet_id: string
          id?: string
          opprettet_dato?: string | null
          stallplass_id: string
        }
        Update: {
          fasilitet_id?: string
          id?: string
          opprettet_dato?: string | null
          stallplass_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "box_amenity_links_amenity_id_fkey"
            columns: ["fasilitet_id"]
            isOneToOne: false
            referencedRelation: "stallplass_fasiliteter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "box_amenity_links_box_id_fkey"
            columns: ["stallplass_id"]
            isOneToOne: false
            referencedRelation: "stallplasser"
            referencedColumns: ["id"]
          },
        ]
      }
      stallplass_fasiliteter: {
        Row: {
          id: string
          name: string
          oppdatert_dato: string | null
          opprettet_dato: string | null
        }
        Insert: {
          id?: string
          name: string
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
        }
        Update: {
          id?: string
          name?: string
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
        }
        Relationships: []
      }
      stallplasser: {
        Row: {
          bilde_beskrivelser: string[] | null
          description: string | null
          er_aktiv: boolean | null
          er_innendors: boolean | null
          er_sponset: boolean | null
          er_tilgjengelig: boolean | null
          har_strom: boolean | null
          har_vann: boolean | null
          har_vindu: boolean | null
          id: string
          images: string[] | null
          grunnpris: number
          maks_hest_storrelse: string | null
          name: string
          oppdatert_dato: string | null
          opprettet_dato: string | null
          size: number | null
          spesielle_notater: string | null
          sponset_start_dato: string | null
          sponset_til: string | null
          stall_id: string
          stallplass_type: Database["public"]["Enums"]["box_type"] | null
        }
        Insert: {
          bilde_beskrivelser?: string[] | null
          description?: string | null
          er_aktiv?: boolean | null
          er_innendors?: boolean | null
          er_sponset?: boolean | null
          er_tilgjengelig?: boolean | null
          har_strom?: boolean | null
          har_vann?: boolean | null
          har_vindu?: boolean | null
          id?: string
          images?: string[] | null
          grunnpris: number
          maks_hest_storrelse?: string | null
          name: string
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          size?: number | null
          spesielle_notater?: string | null
          sponset_start_dato?: string | null
          sponset_til?: string | null
          stall_id: string
          stallplass_type?: Database["public"]["Enums"]["box_type"] | null
        }
        Update: {
          bilde_beskrivelser?: string[] | null
          description?: string | null
          er_aktiv?: boolean | null
          er_innendors?: boolean | null
          er_sponset?: boolean | null
          er_tilgjengelig?: boolean | null
          har_strom?: boolean | null
          har_vann?: boolean | null
          har_vindu?: boolean | null
          id?: string
          images?: string[] | null
          grunnpris?: number
          maks_hest_storrelse?: string | null
          name?: string
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          size?: number | null
          spesielle_notater?: string | null
          sponset_start_dato?: string | null
          sponset_til?: string | null
          stall_id?: string
          stallplass_type?: Database["public"]["Enums"]["box_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "boxes_stable_id_fkey"
            columns: ["stall_id"]
            isOneToOne: false
            referencedRelation: "staller"
            referencedColumns: ["id"]
          },
        ]
      }
      utleie: {
        Row: {
          id: string
          leietaker_id: string
          grunnpris: number
          oppdatert_dato: string | null
          opprettet_dato: string | null
          samtale_id: string
          slutt_dato: string | null
          stall_id: string
          stallplass_id: string
          start_dato: string
          status: Database["public"]["Enums"]["rental_status"] | null
        }
        Insert: {
          id?: string
          leietaker_id: string
          grunnpris: number
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          samtale_id: string
          slutt_dato?: string | null
          stall_id: string
          stallplass_id: string
          start_dato: string
          status?: Database["public"]["Enums"]["rental_status"] | null
        }
        Update: {
          id?: string
          leietaker_id?: string
          grunnpris?: number
          oppdatert_dato?: string | null
          opprettet_dato?: string | null
          samtale_id?: string
          slutt_dato?: string | null
          stall_id?: string
          stallplass_id?: string
          start_dato?: string
          status?: Database["public"]["Enums"]["rental_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "rentals_box_id_fkey"
            columns: ["stallplass_id"]
            isOneToOne: false
            referencedRelation: "stallplasser"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_conversation_id_fkey"
            columns: ["samtale_id"]
            isOneToOne: true
            referencedRelation: "samtaler"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_rider_id_fkey"
            columns: ["leietaker_id"]
            isOneToOne: false
            referencedRelation: "brukere"
            referencedColumns: ["firebase_id"]
          },
          {
            foreignKeyName: "rentals_stable_id_fkey"
            columns: ["stall_id"]
            isOneToOne: false
            referencedRelation: "staller"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      box_type: "BOKS" | "UTEGANG"
      conversation_status: "ACTIVE" | "ARCHIVED" | "RENTAL_CONFIRMED"
      entity_type: "STABLE" | "BOX"
      message_type: "TEXT" | "RENTAL_REQUEST" | "RENTAL_CONFIRMATION" | "SYSTEM"
      payment_method: "VIPPS" | "CARD" | "BYPASS"
      payment_status:
        | "PENDING"
        | "PROCESSING"
        | "COMPLETED"
        | "FAILED"
        | "REFUNDED"
        | "CANCELLED"
      rental_status: "ACTIVE" | "ENDED" | "CANCELLED"
      reviewee_type: "RENTER" | "STABLE_OWNER"
      roadmap_priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
      roadmap_status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      box_type: ["BOKS", "UTEGANG"],
      conversation_status: ["ACTIVE", "ARCHIVED", "RENTAL_CONFIRMED"],
      entity_type: ["STABLE", "BOX"],
      message_type: ["TEXT", "RENTAL_REQUEST", "RENTAL_CONFIRMATION", "SYSTEM"],
      payment_method: ["VIPPS", "CARD", "BYPASS"],
      payment_status: [
        "PENDING",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
        "REFUNDED",
        "CANCELLED",
      ],
      rental_status: ["ACTIVE", "ENDED", "CANCELLED"],
      reviewee_type: ["RENTER", "STABLE_OWNER"],
      roadmap_priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      roadmap_status: ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
    },
  },
} as const

