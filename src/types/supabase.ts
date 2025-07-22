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
          variables?: Json
          query?: string
          operationName?: string
          extensions?: Json
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
      base_prices: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      box_amenities: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      box_amenity_links: {
        Row: {
          amenity_id: string
          box_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          amenity_id: string
          box_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          amenity_id?: string
          box_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "box_amenity_links_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "box_amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "box_amenity_links_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      box_quantity_discounts: {
        Row: {
          created_at: string | null
          description: string | null
          discount_percentage: number
          id: string
          is_active: boolean | null
          max_boxes: number | null
          min_boxes: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_percentage: number
          id?: string
          is_active?: boolean | null
          max_boxes?: number | null
          min_boxes: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_percentage?: number
          id?: string
          is_active?: boolean | null
          max_boxes?: number | null
          min_boxes?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      boxes: {
        Row: {
          available_from_date: string | null
          box_type: Database["public"]["Enums"]["box_type"] | null
          created_at: string | null
          description: string | null
          has_electricity: boolean | null
          has_water: boolean | null
          has_window: boolean | null
          id: string
          image_descriptions: string[] | null
          images: string[] | null
          is_active: boolean | null
          is_available: boolean | null
          is_indoor: boolean | null
          is_sponsored: boolean | null
          max_horse_size: string | null
          name: string
          price: number
          size: number | null
          special_notes: string | null
          sponsored_start_date: string | null
          sponsored_until: string | null
          stable_id: string
          updated_at: string | null
        }
        Insert: {
          available_from_date?: string | null
          box_type?: Database["public"]["Enums"]["box_type"] | null
          created_at?: string | null
          description?: string | null
          has_electricity?: boolean | null
          has_water?: boolean | null
          has_window?: boolean | null
          id?: string
          image_descriptions?: string[] | null
          images?: string[] | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_indoor?: boolean | null
          is_sponsored?: boolean | null
          max_horse_size?: string | null
          name: string
          price: number
          size?: number | null
          special_notes?: string | null
          sponsored_start_date?: string | null
          sponsored_until?: string | null
          stable_id: string
          updated_at?: string | null
        }
        Update: {
          available_from_date?: string | null
          box_type?: Database["public"]["Enums"]["box_type"] | null
          created_at?: string | null
          description?: string | null
          has_electricity?: boolean | null
          has_water?: boolean | null
          has_window?: boolean | null
          id?: string
          image_descriptions?: string[] | null
          images?: string[] | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_indoor?: boolean | null
          is_sponsored?: boolean | null
          max_horse_size?: string | null
          name?: string
          price?: number
          size?: number | null
          special_notes?: string | null
          sponsored_start_date?: string | null
          sponsored_until?: string | null
          stable_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boxes_stable_id_fkey"
            columns: ["stable_id"]
            isOneToOne: false
            referencedRelation: "stables"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          box_id: string | null
          created_at: string | null
          id: string
          rider_id: string
          stable_id: string
          status: Database["public"]["Enums"]["conversation_status"] | null
          updated_at: string | null
        }
        Insert: {
          box_id?: string | null
          created_at?: string | null
          id?: string
          rider_id: string
          stable_id: string
          status?: Database["public"]["Enums"]["conversation_status"] | null
          updated_at?: string | null
        }
        Update: {
          box_id?: string | null
          created_at?: string | null
          id?: string
          rider_id?: string
          stable_id?: string
          status?: Database["public"]["Enums"]["conversation_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_stable_id_fkey"
            columns: ["stable_id"]
            isOneToOne: false
            referencedRelation: "stables"
            referencedColumns: ["id"]
          },
        ]
      }
      fylker: {
        Row: {
          created_at: string | null
          fylke_nummer: string
          id: string
          navn: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fylke_nummer: string
          id?: string
          navn: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fylke_nummer?: string
          id?: string
          navn?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      kommuner: {
        Row: {
          created_at: string | null
          fylke_id: string
          id: string
          kommune_nummer: string
          navn: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fylke_id: string
          id?: string
          kommune_nummer: string
          navn: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fylke_id?: string
          id?: string
          kommune_nummer?: string
          navn?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kommuner_fylke_id_fkey"
            columns: ["fylke_id"]
            isOneToOne: false
            referencedRelation: "fylker"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_type: Database["public"]["Enums"]["message_type"] | null
          metadata: Json | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          metadata?: Json | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          metadata?: Json | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          ip_address: unknown | null
          referrer: string | null
          user_agent: string | null
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          ip_address?: unknown | null
          referrer?: string | null
          user_agent?: string | null
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          ip_address?: unknown | null
          referrer?: string | null
          user_agent?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          discount: number | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          metadata: Json | null
          months: number
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          stable_id: string
          status: Database["public"]["Enums"]["payment_status"] | null
          total_amount: number
          updated_at: string | null
          user_id: string
          vipps_order_id: string
          vipps_reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          discount?: number | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          months: number
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          stable_id: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          total_amount: number
          updated_at?: string | null
          user_id: string
          vipps_order_id: string
          vipps_reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          discount?: number | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          months?: number
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          stable_id?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
          vipps_order_id?: string
          vipps_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_stable_id_fkey"
            columns: ["stable_id"]
            isOneToOne: false
            referencedRelation: "stables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_discounts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          months: number
          percentage: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          months: number
          percentage: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          months?: number
          percentage?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      rentals: {
        Row: {
          box_id: string
          conversation_id: string
          created_at: string | null
          end_date: string | null
          id: string
          monthly_price: number
          rider_id: string
          stable_id: string
          start_date: string
          status: Database["public"]["Enums"]["rental_status"] | null
          updated_at: string | null
        }
        Insert: {
          box_id: string
          conversation_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          monthly_price: number
          rider_id: string
          stable_id: string
          start_date: string
          status?: Database["public"]["Enums"]["rental_status"] | null
          updated_at?: string | null
        }
        Update: {
          box_id?: string
          conversation_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          monthly_price?: number
          rider_id?: string
          stable_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["rental_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rentals_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_stable_id_fkey"
            columns: ["stable_id"]
            isOneToOne: false
            referencedRelation: "stables"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          cleanliness_rating: number | null
          comment: string | null
          communication_rating: number | null
          created_at: string | null
          facilities_rating: number | null
          id: string
          is_moderated: boolean | null
          is_public: boolean | null
          moderator_notes: string | null
          rating: number
          reliability_rating: number | null
          rental_id: string
          reviewee_id: string
          reviewee_type: Database["public"]["Enums"]["reviewee_type"]
          reviewer_id: string
          stable_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          cleanliness_rating?: number | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string | null
          facilities_rating?: number | null
          id?: string
          is_moderated?: boolean | null
          is_public?: boolean | null
          moderator_notes?: string | null
          rating: number
          reliability_rating?: number | null
          rental_id: string
          reviewee_id: string
          reviewee_type: Database["public"]["Enums"]["reviewee_type"]
          reviewer_id: string
          stable_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          cleanliness_rating?: number | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string | null
          facilities_rating?: number | null
          id?: string
          is_moderated?: boolean | null
          is_public?: boolean | null
          moderator_notes?: string | null
          rating?: number
          reliability_rating?: number | null
          rental_id?: string
          reviewee_id?: string
          reviewee_type?: Database["public"]["Enums"]["reviewee_type"]
          reviewer_id?: string
          stable_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_stable_id_fkey"
            columns: ["stable_id"]
            isOneToOne: false
            referencedRelation: "stables"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_items: {
        Row: {
          category: string
          completed_date: string | null
          created_at: string | null
          description: string
          estimated_date: string | null
          id: string
          is_public: boolean | null
          priority: Database["public"]["Enums"]["roadmap_priority"] | null
          sort_order: number | null
          status: Database["public"]["Enums"]["roadmap_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          completed_date?: string | null
          created_at?: string | null
          description: string
          estimated_date?: string | null
          id?: string
          is_public?: boolean | null
          priority?: Database["public"]["Enums"]["roadmap_priority"] | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["roadmap_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          completed_date?: string | null
          created_at?: string | null
          description?: string
          estimated_date?: string | null
          id?: string
          is_public?: boolean | null
          priority?: Database["public"]["Enums"]["roadmap_priority"] | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["roadmap_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_areas: {
        Row: {
          county: string
          created_at: string | null
          id: string
          municipality: string | null
          service_id: string
        }
        Insert: {
          county: string
          created_at?: string | null
          id?: string
          municipality?: string | null
          service_id: string
        }
        Update: {
          county?: string
          created_at?: string | null
          id?: string
          municipality?: string | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_areas_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_discounts: {
        Row: {
          base_price: number
          created_at: string | null
          discount_percentage: number | null
          duration_months: number
          final_price: number
          id: string
          is_active: boolean | null
        }
        Insert: {
          base_price?: number
          created_at?: string | null
          discount_percentage?: number | null
          duration_months: number
          final_price: number
          id?: string
          is_active?: boolean | null
        }
        Update: {
          base_price?: number
          created_at?: string | null
          discount_percentage?: number | null
          duration_months?: number
          final_price?: number
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      service_payments: {
        Row: {
          amount: number
          created_at: string | null
          duration_months: number
          id: string
          payment_status:
            | Database["public"]["Enums"]["service_payment_status"]
            | null
          service_id: string
          updated_at: string | null
          user_id: string
          vipps_order_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          duration_months?: number
          id?: string
          payment_status?:
            | Database["public"]["Enums"]["service_payment_status"]
            | null
          service_id: string
          updated_at?: string | null
          user_id: string
          vipps_order_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          duration_months?: number
          id?: string
          payment_status?:
            | Database["public"]["Enums"]["service_payment_status"]
            | null
          service_id?: string
          updated_at?: string | null
          user_id?: string
          vipps_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_payments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      service_photos: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          photo_url: string
          service_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          photo_url: string
          service_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          photo_url?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_photos_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string | null
          description: string
          expires_at: string
          id: string
          is_active: boolean | null
          price_range_max: number | null
          price_range_min: number | null
          service_type: Database["public"]["Enums"]["service_type"]
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          expires_at: string
          id?: string
          is_active?: boolean | null
          price_range_max?: number | null
          price_range_min?: number | null
          service_type: Database["public"]["Enums"]["service_type"]
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          price_range_max?: number | null
          price_range_min?: number | null
          service_type?: Database["public"]["Enums"]["service_type"]
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stable_amenities: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stable_amenity_links: {
        Row: {
          amenity_id: string
          created_at: string | null
          id: string
          stable_id: string
        }
        Insert: {
          amenity_id: string
          created_at?: string | null
          id?: string
          stable_id: string
        }
        Update: {
          amenity_id?: string
          created_at?: string | null
          id?: string
          stable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stable_amenity_links_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "stable_amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stable_amenity_links_stable_id_fkey"
            columns: ["stable_id"]
            isOneToOne: false
            referencedRelation: "stables"
            referencedColumns: ["id"]
          },
        ]
      }
      stable_articles: {
        Row: {
          content: string
          cover_image: string | null
          created_at: string | null
          excerpt: string | null
          featured: boolean | null
          id: string
          is_published: boolean | null
          published_at: string | null
          slug: string
          sort_order: number | null
          stable_id: string
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          content: string
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured?: boolean | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          sort_order?: number | null
          stable_id: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          content?: string
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured?: boolean | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          sort_order?: number | null
          stable_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stable_articles_stable_id_fkey"
            columns: ["stable_id"]
            isOneToOne: false
            referencedRelation: "stables"
            referencedColumns: ["id"]
          },
        ]
      }
      stable_faqs: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          is_active: boolean | null
          question: string
          sort_order: number | null
          stable_id: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question: string
          sort_order?: number | null
          stable_id: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
          sort_order?: number | null
          stable_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stable_faqs_stable_id_fkey"
            columns: ["stable_id"]
            isOneToOne: false
            referencedRelation: "stables"
            referencedColumns: ["id"]
          },
        ]
      }
      stables: {
        Row: {
          address: string | null
          advertising_active: boolean | null
          advertising_end_date: string | null
          advertising_start_date: string | null
          city: string | null
          county: string | null
          created_at: string | null
          description: string
          featured: boolean | null
          fylke_id: string | null
          id: string
          image_descriptions: string[] | null
          images: string[] | null
          kommune_id: string | null
          latitude: number | null
          location: string
          longitude: number | null
          municipality: string | null
          name: string
          owner_email: string
          owner_id: string
          owner_name: string
          owner_phone: string
          postal_code: string | null
          rating: number | null
          review_count: number | null
          total_boxes: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          advertising_active?: boolean | null
          advertising_end_date?: string | null
          advertising_start_date?: string | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          description: string
          featured?: boolean | null
          fylke_id?: string | null
          id?: string
          image_descriptions?: string[] | null
          images?: string[] | null
          kommune_id?: string | null
          latitude?: number | null
          location: string
          longitude?: number | null
          municipality?: string | null
          name: string
          owner_email: string
          owner_id: string
          owner_name: string
          owner_phone: string
          postal_code?: string | null
          rating?: number | null
          review_count?: number | null
          total_boxes?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          advertising_active?: boolean | null
          advertising_end_date?: string | null
          advertising_start_date?: string | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          description?: string
          featured?: boolean | null
          fylke_id?: string | null
          id?: string
          image_descriptions?: string[] | null
          images?: string[] | null
          kommune_id?: string | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          municipality?: string | null
          name?: string
          owner_email?: string
          owner_id?: string
          owner_name?: string
          owner_phone?: string
          postal_code?: string | null
          rating?: number | null
          review_count?: number | null
          total_boxes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stables_fylke_id_fkey"
            columns: ["fylke_id"]
            isOneToOne: false
            referencedRelation: "fylker"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stables_kommune_id_fkey"
            columns: ["kommune_id"]
            isOneToOne: false
            referencedRelation: "kommuner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stables_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tettsteder: {
        Row: {
          created_at: string | null
          id: string
          kommune_id: string
          navn: string
          tettsted_nummer: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kommune_id: string
          navn: string
          tettsted_nummer?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kommune_id?: string
          navn?: string
          tettsted_nummer?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tettsteder_kommune_id_fkey"
            columns: ["kommune_id"]
            isOneToOne: false
            referencedRelation: "kommuner"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar: string | null
          bio: string | null
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_admin?: boolean | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_article_views: {
        Args: { article_id: string }
        Returns: undefined
      }
    }
    Enums: {
      box_type: "BOKS" | "UTEGANG"
      conversation_status: "ACTIVE" | "ARCHIVED" | "RENTAL_CONFIRMED"
      entity_type: "STABLE" | "BOX" | "SERVICE"
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
      service_payment_status: "pending" | "completed" | "failed" | "refunded"
      service_type:
        | "veterinarian"
        | "farrier"
        | "trainer"
        | "chiropractor"
        | "saddlefitter"
        | "equestrian_shop"
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
      entity_type: ["STABLE", "BOX", "SERVICE"],
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
      service_payment_status: ["pending", "completed", "failed", "refunded"],
      service_type: [
        "veterinarian",
        "farrier",
        "trainer",
        "chiropractor",
        "saddlefitter",
        "equestrian_shop",
      ],
    },
  },
} as const

