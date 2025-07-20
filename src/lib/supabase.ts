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

// Type aliases for the main entities
export type User = Tables<'users'>
export type Stable = Tables<'stables'>
export type Box = Tables<'boxes'>
export type Conversation = Tables<'conversations'>
export type Message = Tables<'messages'>
export type Rental = Tables<'rentals'>
export type Review = Tables<'reviews'>
export type Payment = Tables<'payments'>
export type StableAmenity = Tables<'stable_amenities'>
export type BoxAmenity = Tables<'box_amenities'>
export type StableFAQ = Tables<'stable_faqs'>
export type RoadmapItem = Tables<'roadmap_items'>
export type PageView = Tables<'page_views'>

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