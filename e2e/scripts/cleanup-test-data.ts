#!/usr/bin/env node

/**
 * Cleanup script to remove all test data from the database after E2E tests
 * This ensures the database is in a clean state for subsequent test runs
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function cleanupTestData() {
  console.log('🧹 Starting database cleanup...')

  try {
    // Clean up in reverse dependency order to avoid foreign key constraints
    
    // 1. Delete all messages and conversations
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (messagesError) {
      console.error('❌ Error deleting messages:', messagesError)
    } else {
      console.log('✅ Deleted all messages')
    }

    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (conversationsError) {
      console.error('❌ Error deleting conversations:', conversationsError)
    } else {
      console.log('✅ Deleted all conversations')
    }

    // 2. Delete all rentals and reviews
    const { error: rentalsError } = await supabase
      .from('rentals')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (rentalsError) {
      console.error('❌ Error deleting rentals:', rentalsError)
    } else {
      console.log('✅ Deleted all rentals')
    }

    const { error: reviewsError } = await supabase
      .from('reviews')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (reviewsError) {
      console.error('❌ Error deleting reviews:', reviewsError)
    } else {
      console.log('✅ Deleted all reviews')
    }

    // 3. Delete all payments
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (paymentsError) {
      console.error('❌ Error deleting payments:', paymentsError)
    } else {
      console.log('✅ Deleted all payments')
    }

    // 4. Delete all boxes (must be before stables due to foreign key)
    const { error: boxesError } = await supabase
      .from('boxes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (boxesError) {
      console.error('❌ Error deleting boxes:', boxesError)
    } else {
      console.log('✅ Deleted all boxes')
    }

    // 5. Delete all services
    const { error: servicesError } = await supabase
      .from('services')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (servicesError) {
      console.error('❌ Error deleting services:', servicesError)
    } else {
      console.log('✅ Deleted all services')
    }

    // 6. Delete all stables (must be after boxes)
    const { error: stablesError } = await supabase
      .from('stables')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (stablesError) {
      console.error('❌ Error deleting stables:', stablesError)
    } else {
      console.log('✅ Deleted all stables')
    }

    console.log('🎉 Database cleanup completed successfully!')

  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupTestData()
    .then(() => {
      console.log('✨ All test data has been cleaned up')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Cleanup script failed:', error)
      process.exit(1)
    })
}

export { cleanupTestData }