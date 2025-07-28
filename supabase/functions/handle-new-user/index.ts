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
    // Verify webhook signature
    const signature = req.headers.get('x-webhook-signature')
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
    
    if (webhookSecret && signature) {
      const body = await req.text()
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      )
      
      const expectedSignature = signature.replace('v1,', '')
      const signatureBuffer = new Uint8Array(
        expectedSignature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
      )
      
      const isValid = await crypto.subtle.verify(
        'HMAC',
        key,
        signatureBuffer,
        encoder.encode(body)
      )
      
      if (!isValid) {
        return new Response('Unauthorized', { status: 401 })
      }
      
      // Parse the verified body
      const data = JSON.parse(body)
      const { record } = data
    } else {
      // No signature verification - parse directly
      const data = await req.json()
      const { record } = data
    }
    
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
    if (!record?.id || !record?.email) {
      throw new Error('Missing required user data')
    }

    // Insert user into public.users table
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: record.id,
        email: record.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

    if (error) {
      throw error
    }


    return new Response(
      JSON.stringify({ success: true, user: data }),
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