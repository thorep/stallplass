'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Analytics() {
  const [user, setUser] = useState<User | null>(null)
  const [anonymousId, setAnonymousId] = useState<string>('')
  
  useEffect(() => {
    // Generate or retrieve anonymous ID for non-logged in users
    const getOrCreateAnonymousId = () => {
      const storageKey = 'umami_anonymous_id'
      let id = localStorage.getItem(storageKey)
      
      if (!id) {
        // Generate a unique anonymous ID
        id = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
        localStorage.setItem(storageKey, id)
      }
      
      return id
    }
    
    // Set anonymous ID
    setAnonymousId(getOrCreateAnonymousId())
    
    // Get user for distinct ID tracking
    const supabase = createClient()
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    
    getUser()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  useEffect(() => {
    // Only load scripts once - check if they already exist
    const existingCounterScript = document.querySelector('script[src="https://cdn.counter.dev/script.js"]')
    const existingUmamiScript = document.querySelector('script[src="https://cloud.umami.is/script.js"]')
    
    if (!existingCounterScript) {
      const counterScript = document.createElement('script')
      counterScript.src = 'https://cdn.counter.dev/script.js'
      counterScript.setAttribute('data-id', '2f6b6146-e438-4e7d-9fb7-58d892c4b546')
      counterScript.setAttribute('data-utcoffset', '2')
      counterScript.async = true
      document.head.appendChild(counterScript)
    }
    
    if (!existingUmamiScript) {
      const umamiScript = document.createElement('script')
      umamiScript.src = 'https://cloud.umami.is/script.js'
      umamiScript.setAttribute('data-website-id', '7a0029ef-809e-45da-82ca-cffbc5e0ef5c')
      
      // Add tag to identify user type
      if (user) {
        umamiScript.setAttribute('data-tag', 'logged-in')
      } else {
        umamiScript.setAttribute('data-tag', 'anonymous')
      }
      
      umamiScript.defer = true
      document.head.appendChild(umamiScript)
    }
  }, []) // Only run once on mount
  
  // Separate effect for user identification
  useEffect(() => {
    if (!user && !anonymousId) return // Wait for user state to be ready
    
    // Set up distinct ID tracking for all users
    if (typeof window !== 'undefined') {
      // Wait for Umami to load
      const setupDistinctId = () => {
        if (window.umami) {
          if (user) {
            // Identify logged-in user with their ID
            window.umami.identify({ 
              id: `user_${user.id}`, // Using user ID instead of email for privacy
              type: 'registered',
              email: user.email?.split('@')[0], // Only username part for privacy
              created: user.created_at
            })
          } else if (anonymousId) {
            // Identify anonymous user with generated ID
            window.umami.identify({ 
              id: anonymousId,
              type: 'anonymous',
              first_seen: new Date().toISOString()
            })
          }
        } else {
          // Retry if umami not loaded yet
          setTimeout(setupDistinctId, 100)
        }
      }
      
      setTimeout(setupDistinctId, 500)
    }
  }, [user, anonymousId]) // Run when user or anonymousId changes

  return null
}