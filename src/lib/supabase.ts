import { createClient } from '@supabase/supabase-js'
import type { 
  users, 
  stables, 
  boxes, 
  conversations, 
  messages, 
  rentals, 
  reviews, 
  payments, 
  stable_amenities, 
  box_amenities, 
  stable_faqs, 
  roadmap_items, 
  page_views 
} from '@/generated/prisma'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Type aliases using Prisma-generated types
export type User = users
export type Stable = stables
export type Box = boxes
export type Conversation = conversations
export type Message = messages
export type Rental = rentals
export type Review = reviews
export type Payment = payments
export type StableAmenity = stable_amenities
export type BoxAmenity = box_amenities
export type StableFAQ = stable_faqs
export type RoadmapItem = roadmap_items
export type PageView = page_views