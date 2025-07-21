import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Helper types for easier use
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Norwegian type aliases for the main entities
export type Bruker = Tables<'users'>
export type Stall = Tables<'stables'>
export type Stallplass = Tables<'boxes'>
export type Samtale = Tables<'conversations'>
export type Melding = Tables<'messages'>
export type Utleie = Tables<"rentals">
export type Anmeldelse = Tables<'anmeldelser'>
export type Betaling = Tables<'payments'>
export type StallFasilitet = Tables<'stall_fasiliteter'>
export type StallplassFasilitet = Tables<'stallplass_fasiliteter'>
export type StallOfteSparteSporrsmal = Tables<'stall_ofte_spurte_sporsmal'>
export type Veikart = Tables<'roadmap_items'>
export type Sidevisning = Tables<'page_views'>

// English type aliases for backward compatibility
export type User = Bruker
export type Stable = Stall
export type Box = Stallplass
export type Conversation = Samtale
export type Message = Melding
export type Rental = Utleie
export type Review = Anmeldelse
export type Payment = Betaling
export type StableAmenity = StallFasilitet
export type BoxAmenity = StallplassFasilitet
export type StableFAQ = StallOfteSparteSporrsmal
export type RoadmapItem = Veikart
export type PageView = Sidevisning

// Enum types
export type ConversationStatus = Enums<'conversation_status'>
export type MessageType = Enums<'message_type'>
export type RentalStatus = Enums<'rental_status'>
export type BoxType = Enums<'box_type'>
export type PaymentStatus = Enums<'payment_status'>
export type PaymentMethod = Enums<'payment_method'>
export type RevieweeType = Enums<'reviewee_type'>
export type EntityType = Enums<'entity_type'>
export type RoadmapStatus = Enums<'roadmap_status'>
export type RoadmapPriority = Enums<'roadmap_priority'>