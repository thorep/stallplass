import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the request body
    const userData = await req.json()
    
    // Log the received payload for debugging
    console.log('Received payload:', JSON.stringify(userData, null, 2))
    
    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Validate that we have the required user data
    if (!userData?.email) {
      throw new Error('Missing required user data')
    }

    // Get nickname from user data - check multiple possible locations
    const nickname = userData.data?.nickname || userData.nickname
    if (!nickname) {
      throw new Error('Missing required nickname in user data')
    }

    // Generate user ID if not provided (for before-signup hooks)
    const userId = userData.id || crypto.randomUUID()

    // Insert user into public.users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: userData.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

    if (userError) {
      throw userError
    }

    // Insert profile into public.profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        nickname: nickname,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

    if (profileError) {
      throw profileError
    }


    return new Response(
      JSON.stringify({ success: true, user: { id: userId, email: userData.email, nickname } }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})